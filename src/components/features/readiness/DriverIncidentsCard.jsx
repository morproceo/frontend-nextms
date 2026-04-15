/**
 * DriverIncidentsCard (Phase 7)
 *
 * Compliance-admin entry surface for driver_incidents. Replaces the V1
 * "manual flag" baseline used by safety_performance + execution_quality.
 *
 * Each create/update/delete invalidates the driver's readiness snapshot
 * server-side (markStale), so the readiness card re-renders with the new
 * score on next read.
 */

import { useEffect, useState } from 'react';
import { AlertTriangle, Plus, Trash2, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Badge } from '../../ui/Badge';
import {
  useDriverIncidents,
  useDriverIncidentMutations
} from '../../../hooks/api/useReadinessApi';
import { useOrg } from '../../../contexts/OrgContext';

const TYPE_OPTIONS = [
  { value: 'accident',              label: 'Accident' },
  { value: 'damage',                label: 'Damage / Cargo' },
  { value: 'late_delivery',         label: 'Late Delivery' },
  { value: 'service_failure',       label: 'Service Failure' },
  { value: 'safety_violation',      label: 'Safety Violation' },
  { value: 'communication_failure', label: 'Communication Failure' },
  { value: 'other',                 label: 'Other' }
];

const SEVERITY_OPTIONS = [
  { value: 'minor',    label: 'Minor',    variant: 'gray' },
  { value: 'moderate', label: 'Moderate', variant: 'yellow' },
  { value: 'major',    label: 'Major',    variant: 'orange' },
  { value: 'severe',   label: 'Severe',   variant: 'red' }
];

const STATUS_OPTIONS = [
  { value: 'open',          label: 'Open',          variant: 'red' },
  { value: 'investigating', label: 'Investigating', variant: 'yellow' },
  { value: 'resolved',      label: 'Resolved',      variant: 'green' },
  { value: 'disputed',      label: 'Disputed',      variant: 'gray' }
];

function todayIso() { return new Date().toISOString().slice(0, 10); }

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function DriverIncidentsCard({ driverId }) {
  const { hasPermission } = useOrg();
  const canEdit = hasPermission('drivers:update');
  const { incidents, loading, error, fetchIncidents } = useDriverIncidents(driverId);
  const { create, update, remove, loading: mutating, error: mutationError } = useDriverIncidentMutations(driverId);

  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState(null);

  useEffect(() => { fetchIncidents(); }, [fetchIncidents]);

  const startNew = () => {
    setCreating(true);
    setDraft({
      incident_date: todayIso(),
      type: 'late_delivery',
      severity: 'minor',
      description: '',
      cost_amount: '',
      claim_number: '',
      resolution_status: 'open'
    });
  };

  const cancel = () => { setCreating(false); setDraft(null); };

  const submit = async () => {
    if (!draft.incident_date || !draft.type || !draft.description) return;
    const payload = {
      ...draft,
      cost_amount: draft.cost_amount === '' ? null : Number(draft.cost_amount)
    };
    await create(payload);
    setCreating(false);
    setDraft(null);
    await fetchIncidents();
  };

  const handleStatusChange = async (incident, nextStatus) => {
    await update(incident.id, { resolution_status: nextStatus });
    await fetchIncidents();
  };

  const handleDelete = async (incident) => {
    if (!confirm('Delete this incident? This is recorded in the audit log but removes it from readiness scoring.')) return;
    await remove(incident.id);
    await fetchIncidents();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" /> Incidents
            {incidents.length > 0 && (
              <span className="text-[11px] font-normal text-text-secondary">({incidents.length})</span>
            )}
          </CardTitle>
          {canEdit && !creating && (
            <Button onClick={startNew} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-1" /> Log Incident
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading && incidents.length === 0 && (
          <div className="flex justify-center py-6"><Spinner size="md" /></div>
        )}

        {error && (
          <div className="bg-error/10 border border-error/20 rounded p-2 text-body-sm text-error mb-3">{error}</div>
        )}

        {creating && draft && (
          <div className="border border-accent/30 bg-accent/5 rounded-lg p-3 mb-4 space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <FieldDate label="Date" value={draft.incident_date} onChange={v => setDraft({...draft, incident_date: v})} />
              <FieldSelect label="Type" value={draft.type} options={TYPE_OPTIONS} onChange={v => setDraft({...draft, type: v})} />
              <FieldSelect label="Severity" value={draft.severity} options={SEVERITY_OPTIONS} onChange={v => setDraft({...draft, severity: v})} />
              <FieldText label="Cost ($)" type="number" value={draft.cost_amount} onChange={v => setDraft({...draft, cost_amount: v})} />
              <FieldText label="Claim #" value={draft.claim_number} onChange={v => setDraft({...draft, claim_number: v})} />
              <FieldSelect label="Status" value={draft.resolution_status} options={STATUS_OPTIONS} onChange={v => setDraft({...draft, resolution_status: v})} />
            </div>
            <div>
              <label className="block text-[11px] text-text-secondary mb-1">Description</label>
              <textarea
                value={draft.description}
                onChange={e => setDraft({...draft, description: e.target.value})}
                rows={2}
                placeholder="What happened?"
                className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent"
              />
            </div>
            {mutationError && (
              <div className="bg-error/10 border border-error/20 rounded p-2 text-body-sm text-error">{mutationError}</div>
            )}
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={cancel} disabled={mutating}>Cancel</Button>
              <Button size="sm" onClick={submit} disabled={mutating || !draft.description}>
                {mutating ? <><Spinner size="sm" className="mr-2" /> Saving…</> : 'Save Incident'}
              </Button>
            </div>
          </div>
        )}

        {!loading && !creating && incidents.length === 0 && (
          <div className="text-center py-6 text-body-sm text-text-secondary">
            No incidents on file. Driver scores at full credit on safety/execution baselines.
          </div>
        )}

        {incidents.length > 0 && (
          <ul className="divide-y divide-surface-tertiary">
            {incidents.map(inc => {
              const sevCfg = SEVERITY_OPTIONS.find(o => o.value === inc.severity);
              const statusCfg = STATUS_OPTIONS.find(o => o.value === inc.resolution_status);
              const typeLabel = TYPE_OPTIONS.find(o => o.value === inc.type)?.label || inc.type;
              return (
                <li key={inc.id} className="py-3">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant={sevCfg?.variant || 'gray'}>{sevCfg?.label || inc.severity}</Badge>
                      <Badge variant="gray">{typeLabel}</Badge>
                      <span className="text-body-sm text-text-secondary">{formatDate(inc.incident_date)}</span>
                      {inc.cost_amount != null && (
                        <span className="text-body-sm text-text-secondary">• ${Number(inc.cost_amount).toLocaleString()}</span>
                      )}
                      {inc.claim_number && (
                        <span className="text-[11px] font-mono text-text-secondary">#{inc.claim_number}</span>
                      )}
                    </div>
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleDelete(inc)}
                        className="text-text-tertiary hover:text-error p-1"
                        title="Delete incident"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <p className="text-body-sm text-text-primary">{inc.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    {canEdit ? (
                      <select
                        value={inc.resolution_status}
                        onChange={e => handleStatusChange(inc, e.target.value)}
                        className="text-[11px] bg-white border border-surface-tertiary rounded px-1.5 py-0.5"
                        disabled={mutating}
                      >
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    ) : (
                      <Badge variant={statusCfg?.variant || 'gray'}>{statusCfg?.label || inc.resolution_status}</Badge>
                    )}
                    {inc.resolved_at && (
                      <span className="text-[11px] text-text-secondary">Resolved {formatDate(inc.resolved_at)}</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <p className="text-[11px] text-text-secondary mt-3 pt-3 border-t border-surface-tertiary">
          Incident counts feed safety & execution scores over the last 12 months (full weight) and last 90 days (recency bias).
          Major and severe incidents reduce dedicated-tier eligibility.
        </p>
      </CardContent>
    </Card>
  );
}

function FieldDate({ label, value, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-text-secondary mb-1">{label}</span>
      <input type="date" value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent" />
    </label>
  );
}

function FieldText({ label, value, onChange, type = 'text' }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-text-secondary mb-1">{label}</span>
      <input type={type} value={value ?? ''} onChange={e => onChange(e.target.value)}
        className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent" />
    </label>
  );
}

function FieldSelect({ label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-text-secondary mb-1">{label}</span>
      <select value={value || ''} onChange={e => onChange(e.target.value)}
        className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

export default DriverIncidentsCard;
