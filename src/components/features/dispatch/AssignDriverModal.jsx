/**
 * AssignDriverModal — Phase 5: enforcement + override + approve & assign.
 *
 * Phase 4 behavior preserved when enforce_block === false (advisory mode).
 *
 * Phase 5 (enforce_block === true):
 *   - Allowed         → Assign button works as today; passes evaluation_id.
 *   - Review Required → Assign hidden. If user has DISPATCH_REVIEW_APPROVE,
 *                       "Approve & Assign" creates a child eval, then assigns
 *                       with that child evaluation_id. Otherwise "Request
 *                       Review" closes the modal — the original eval is
 *                       already pending in the queue.
 *   - Blocked         → Assign hidden. If user has DISPATCH_OVERRIDE AND no
 *                       unoverridable codes hit, "Override" opens
 *                       OverrideReasonModal which creates a child eval; we
 *                       then assign with that child evaluation_id.
 *
 * Backend assign endpoint accepts data.evaluation_id; we pass the latest
 * allowed evaluation (parent or child). Console.warn telemetry fires when
 * the dispatcher Assigns an evaluation that wasn't originally `allowed`.
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Truck, User, Container, CheckCircle, ArrowRight } from 'lucide-react';
import {
  useDriversList,
  useTrucksList,
  useTrailersList,
  useLoadMutations
} from '../../../hooks';
import {
  useDriverReadinessSummary,
  useEvaluationActions,
  useReadinessFeatureFlag,
  useScoringConfig
} from '../../../hooks/api/useReadinessApi';
import { useOrg } from '../../../contexts/OrgContext';
import { Button } from '../../ui/Button';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { Spinner } from '../../ui/Spinner';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { EvaluationPanel } from './EvaluationPanel';
import { OverrideReasonModal } from './OverrideReasonModal';

const tierOrder = { D4: 4, D3: 3, D2: 2, D1: 1, D0: 0 };

export function AssignDriverModal({ isOpen, onClose, load, onAssigned }) {
  const { hasPermission } = useOrg();
  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucksList();
  const { trailers, loading: trailersLoading, fetchTrailers } = useTrailersList();
  const { updateLoad, loading: saving } = useLoadMutations();
  const { summary: readinessSummary, fetchSummary } = useDriverReadinessSummary();
  const { flag, fetchFlag } = useReadinessFeatureFlag();
  const { config: scoringConfig, fetchConfig } = useScoringConfig();
  const { approve, override, loading: actingOnEval, error: evalActionError } = useEvaluationActions();

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [evaluation, setEvaluation] = useState(null);
  const [overrideOpen, setOverrideOpen] = useState(false);

  const [formData, setFormData] = useState({
    driver_id: '',
    truck_id: '',
    trailer_id: '',
  });

  const loading = driversLoading || trucksLoading || trailersLoading;

  // Fetch reference data + readiness summary + feature flag + scoring config when modal opens.
  useEffect(() => {
    if (isOpen) {
      fetchDrivers();
      fetchTrucks({ is_active: true });
      fetchTrailers({ is_active: true });
      fetchSummary();
      fetchFlag();
      fetchConfig();
    }
  }, [isOpen]);

  // Reset state when modal opens.
  useEffect(() => {
    if (isOpen) {
      setFormData({ driver_id: '', truck_id: '', trailer_id: '' });
      setSuccess(false);
      setError(null);
      setEvaluation(null);
      setOverrideOpen(false);
    }
  }, [isOpen]);

  const tierByDriver = useMemo(() => {
    const map = new Map();
    for (const r of readinessSummary) map.set(r.driver_id, r.readiness_tier);
    return map;
  }, [readinessSummary]);

  const driverOptions = useMemo(() => {
    const opts = drivers.map(d => {
      const tier = tierByDriver.get(d.id);
      return { id: d.id, label: `${d.first_name} ${d.last_name}`, sublabel: d.phone, tier };
    });
    return opts.sort((a, b) => (tierOrder[b.tier] ?? -1) - (tierOrder[a.tier] ?? -1));
  }, [drivers, tierByDriver]);

  const handleDriverSelect = (option) => {
    const driver = option ? drivers.find((d) => d.id === option.id) : null;
    setFormData((prev) => ({
      ...prev,
      driver_id: driver?.id || '',
      truck_id: driver?.truck_id || prev.truck_id,
      trailer_id: driver?.trailer_id || prev.trailer_id,
    }));
    setEvaluation(null);
  };

  const handleTruckSelect = (option) => setFormData((prev) => ({ ...prev, truck_id: option?.id || '' }));
  const handleTrailerSelect = (option) => setFormData((prev) => ({ ...prev, trailer_id: option?.id || '' }));

  // ---- Permission + decision derived state ----
  const enforce = flag?.enforce_block === true;
  const overridePolicy = scoringConfig?.overridePolicy || {};
  const unoverridable = overridePolicy.unoverridable_codes || [];
  const minReasonLength = Number(overridePolicy.require_reason_min_length) || 20;
  const allowedRoles = overridePolicy.allowed_roles || [];
  void allowedRoles; // role-based gating handled via permission keys below

  const canOverride = hasPermission('dispatch:override');
  const canApproveReview = hasPermission('dispatch:review_approve');

  const decision = evaluation?.decision || null;
  const blockingReasons = (evaluation?.reason_codes || []).filter(r => r.severity === 'block');
  const hitsUnoverridable = blockingReasons.some(r => {
    const suffix = (r.code || '').replace(/^HARD_GATE\./, '');
    return unoverridable.includes(r.code) || unoverridable.includes(suffix);
  });

  // Visibility rules per UX/UI plan §5 — buttons users cannot use are HIDDEN.
  const showAssign = !enforce
    || decision === 'allowed'
    || decision === null
    || (decision === 'review_required' && canApproveReview); // approve & assign path
  const showApproveAndAssign = enforce && decision === 'review_required' && canApproveReview;
  const showRequestReview = enforce && decision === 'review_required' && !canApproveReview;
  const showOverride = enforce && decision === 'blocked' && canOverride && !hitsUnoverridable;

  // ---- Assign action ----
  const performAssign = async (evaluationId = null) => {
    if (!formData.driver_id) {
      setError('Please select a driver');
      return;
    }
    if (evaluation && evaluation.decision !== 'allowed' && !evaluationId) {
      console.warn('[dispatch] Assigning despite non-allowed evaluation', {
        load_id: load?.id,
        driver_id: formData.driver_id,
        decision: evaluation.decision,
        reason_codes: (evaluation.reason_codes || []).map(r => r.code)
      });
    }
    try {
      setError(null);
      await updateLoad(load.id, {
        driver_id: formData.driver_id,
        truck_id: formData.truck_id || null,
        trailer_id: formData.trailer_id || null,
        status: 'booked',
        evaluation_id: evaluationId
      });
      setSuccess(true);
      setTimeout(() => {
        onAssigned?.({
          driver: drivers.find((d) => d.id === formData.driver_id),
          truck: trucks.find((t) => t.id === formData.truck_id),
          trailer: trailers.find((t) => t.id === formData.trailer_id),
        });
      }, 1500);
    } catch (err) {
      console.error('Failed to assign driver:', err);
      const data = err.response?.data;
      if (data?.error?.code === 'DISPATCH_GATE_BLOCKED') {
        setError(`Dispatch blocked: ${data.error.message}`);
        if (data.error.evaluation) setEvaluation(data.error.evaluation);
      } else {
        setError(data?.error?.message || data?.message || 'Failed to assign driver');
      }
    }
  };

  const handleAssign = () => performAssign();

  const handleApproveAndAssign = async () => {
    if (!evaluation?.id) return;
    try {
      setError(null);
      const child = await approve(evaluation.id, 'Approved & assigned from dispatcher modal');
      await performAssign(child.id);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error?.message || data?.message || 'Failed to approve & assign');
    }
  };

  const handleOverrideSubmit = async (reason) => {
    if (!evaluation?.id) return;
    try {
      setError(null);
      const child = await override(evaluation.id, reason);
      setOverrideOpen(false);
      await performAssign(child.id);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error?.message || data?.message || 'Override failed');
    }
  };

  if (!isOpen) return null;
  const selectedDriver = drivers.find((d) => d.id === formData.driver_id);

  // Success state
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Driver Assigned!</h2>
          <p className="text-body text-text-secondary">
            {selectedDriver?.first_name} {selectedDriver?.last_name} will pick up load {load?.reference_number}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />

        <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b border-surface-tertiary">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">Assign Driver</h2>
              <p className="text-body-sm text-text-secondary">
                Load {load?.reference_number}
                {enforce && <span className="ml-2 text-[11px] text-warning">• Enforcement on</span>}
              </p>
            </div>
            <button type="button" onClick={onClose}
              className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="lg" />
              </div>
            ) : (
              <>
                {load && (
                  <div className="p-3 bg-surface-secondary rounded-lg">
                    <div className="flex items-center gap-2 text-body-sm">
                      <span className="text-text-secondary">{load.shipper?.city || 'Origin'}</span>
                      <ArrowRight className="w-3 h-3 text-text-tertiary" />
                      <span className="text-text-secondary">{load.consignee?.city || 'Destination'}</span>
                    </div>
                  </div>
                )}

                {/* Driver Select */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                    <User className="w-4 h-4 text-accent" />
                    Driver
                    {selectedDriver && tierByDriver.get(selectedDriver.id) && (
                      <ReadinessTierBadge tier={tierByDriver.get(selectedDriver.id)} size="sm" className="ml-1" />
                    )}
                  </label>
                  <SearchableSelect
                    value={formData.driver_id}
                    onChange={handleDriverSelect}
                    options={driverOptions.map(o => ({
                      id: o.id,
                      label: o.tier ? `[${o.tier}] ${o.label}` : o.label,
                      sublabel: o.sublabel,
                    }))}
                    placeholder="Select driver..."
                  />
                </div>

                {/* Evaluation panel */}
                {load?.id && formData.driver_id && (
                  <EvaluationPanel
                    loadId={load.id}
                    driverId={formData.driver_id}
                    onEvaluated={setEvaluation}
                  />
                )}

                {/* Truck */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                    <Truck className="w-4 h-4 text-text-tertiary" /> Truck
                    <span className="text-small text-text-tertiary font-normal">(Optional)</span>
                  </label>
                  <SearchableSelect
                    value={formData.truck_id}
                    onChange={handleTruckSelect}
                    options={trucks.map((t) => ({
                      id: t.id, label: t.unit_number || t.vin,
                      sublabel: `${t.year || ''} ${t.make || ''} ${t.model || ''}`.trim(),
                    }))}
                    placeholder="Select truck..."
                  />
                </div>

                {/* Trailer */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                    <Container className="w-4 h-4 text-text-tertiary" /> Trailer
                    <span className="text-small text-text-tertiary font-normal">(Optional)</span>
                  </label>
                  <SearchableSelect
                    value={formData.trailer_id}
                    onChange={handleTrailerSelect}
                    options={trailers.map((t) => ({
                      id: t.id, label: t.unit_number || t.vin, sublabel: t.trailer_type,
                    }))}
                    placeholder="Select trailer..."
                  />
                </div>

                {(error || evalActionError) && (
                  <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                    <p className="text-body-sm text-error">{error || evalActionError}</p>
                  </div>
                )}

                {/* Enforcement-mode footnote when locked out of Assign */}
                {enforce && decision && decision !== 'allowed' && !showApproveAndAssign && !showOverride && (
                  <div className="text-[11px] text-text-secondary border border-surface-tertiary rounded-lg p-3">
                    {decision === 'review_required'
                      ? 'A reviewer must approve this evaluation before this load can be assigned. The pending review is in the queue.'
                      : 'This driver is blocked for this load and you do not have override permission.'
                    }
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-tertiary bg-surface-secondary/50">
            <Button variant="ghost" onClick={onClose}>Cancel</Button>

            {showRequestReview && (
              <Button
                variant="outline"
                onClick={() => { setSuccess(false); onClose(); }}
                title="The evaluation is already pending in the review queue."
              >
                Request Review
              </Button>
            )}

            {showOverride && (
              <Button variant="danger" onClick={() => setOverrideOpen(true)}>
                Override
              </Button>
            )}

            {showApproveAndAssign && (
              <Button onClick={handleApproveAndAssign} disabled={saving || actingOnEval}>
                {(saving || actingOnEval) ? <><Spinner size="sm" className="mr-2" /> Approving…</> : 'Approve & Assign'}
              </Button>
            )}

            {showAssign && (
              <Button onClick={handleAssign} disabled={saving || !formData.driver_id}>
                {saving ? <><Spinner size="sm" className="mr-2" /> Assigning…</> : 'Assign Driver'}
              </Button>
            )}
          </div>
        </div>
      </div>

      <OverrideReasonModal
        isOpen={overrideOpen}
        evaluation={evaluation}
        minReasonLength={minReasonLength}
        unoverridableCodes={unoverridable}
        saving={actingOnEval}
        error={evalActionError}
        onClose={() => setOverrideOpen(false)}
        onSubmit={handleOverrideSubmit}
      />
    </>
  );
}

export default AssignDriverModal;
