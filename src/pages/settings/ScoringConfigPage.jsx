/**
 * ScoringConfigPage (Phase 5)
 *
 * Read-only viewer + raw JSON editor for the active scoring config.
 * Per UX/UI plan §11.3, V1 deliberately uses raw JSON with validation —
 * a sectioned form editor is V2 work.
 *
 * Owners and admins also get the three-stage rollout flag toggle here
 * (enabled / show_ui / enforce_block) — same page, separate card so the
 * config payload and the rollout state live where one person manages them.
 */

import { useEffect, useMemo, useState } from 'react';
import { Settings, History, Save, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  useScoringConfig,
  useScoringConfigHistory,
  useScoringConfigPublish,
  useReadinessFeatureFlag
} from '../../hooks/api/useReadinessApi';
import { useOrg } from '../../contexts/OrgContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

function bumpPatch(version) {
  // Naive bump: v1.0.0 → v1.0.1; if no parseable suffix, append .1
  const m = String(version || '').match(/^(.*?)(\d+)$/);
  if (!m) return `${version}.1`;
  return `${m[1]}${parseInt(m[2], 10) + 1}`;
}

export function ScoringConfigPage() {
  const { hasPermission } = useOrg();
  const canManage = hasPermission('scoring_config:manage');

  const { config, loading: configLoading, fetchConfig } = useScoringConfig();
  const { history, loading: historyLoading, fetchHistory } = useScoringConfigHistory();
  const { publish, loading: publishing } = useScoringConfigPublish();
  const { flag, fetchFlag, update: updateFlag, saving: savingFlag } = useReadinessFeatureFlag();

  const [editMode, setEditMode] = useState(false);
  const [draftJson, setDraftJson] = useState('');
  const [draftError, setDraftError] = useState(null);
  const [publishMessage, setPublishMessage] = useState(null);

  useEffect(() => {
    fetchConfig();
    fetchHistory();
    fetchFlag();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Build a publishable payload from the active wrapped config.
  const buildPayloadFromActive = () => {
    if (!config) return {};
    return {
      version: bumpPatch(config.version),
      readiness_weights: config.readinessWeights,
      readiness_tier_thresholds: config.readinessTierThresholds,
      load_impact_weights: config.loadImpactWeights,
      load_impact_tier_thresholds: config.loadImpactTierThresholds,
      tier_unlock_rules: { ...config.unlockRules, load_tier_to_min_driver_tier: config.loadTierMap },
      hard_gate_rules: config.hardGateRules,
      override_policy: config.overridePolicy,
      manual_review_triggers: { ...config.manualReviewTriggers, _recalc: config.recalcPolicy }
    };
  };

  const enterEditMode = () => {
    setDraftJson(JSON.stringify(buildPayloadFromActive(), null, 2));
    setDraftError(null);
    setPublishMessage(null);
    setEditMode(true);
  };

  const validateAndPublish = async () => {
    setDraftError(null);
    let parsed;
    try {
      parsed = JSON.parse(draftJson);
    } catch (e) {
      setDraftError('Invalid JSON: ' + e.message);
      return;
    }
    // Weight sum sanity (sum must be ~1.0 for both readiness and impact)
    const sum = (obj) => Object.values(obj || {}).reduce((a, b) => a + Number(b || 0), 0);
    const rs = sum(parsed.readiness_weights);
    const ls = sum(parsed.load_impact_weights);
    if (Math.abs(rs - 1.0) > 0.001) {
      setDraftError(`readiness_weights must sum to 1.0 (got ${rs.toFixed(3)})`);
      return;
    }
    if (Math.abs(ls - 1.0) > 0.001) {
      setDraftError(`load_impact_weights must sum to 1.0 (got ${ls.toFixed(3)})`);
      return;
    }
    if (!parsed.version) {
      setDraftError('version is required');
      return;
    }
    try {
      const created = await publish(parsed);
      setPublishMessage(`Published ${created.version}.`);
      setEditMode(false);
      await fetchConfig();
      await fetchHistory();
    } catch (err) {
      const data = err.response?.data;
      setDraftError(data?.error?.message || data?.message || err.message);
    }
  };

  const handleFlagToggle = async (key, value) => {
    if (!flag) return;
    await updateFlag({ ...flag, [key]: value });
  };

  if (configLoading && !config) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="flex items-center justify-center min-h-[300px]">
          <Spinner size="lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-3 sm:p-6 space-y-5 pb-12">
      <div className="flex items-center gap-2">
        <Settings className="w-6 h-6 text-accent" />
        <h1 className="text-xl font-semibold text-text-primary">Scoring Config</h1>
      </div>

      {/* Rollout flag card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> Rollout Mode
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-secondary mb-4">
            Three-stage rollout: <strong>shadow</strong> → <strong>warning</strong> → <strong>enforcement</strong>.
            Each stage is independent so you can preview before blocking dispatchers.
          </p>
          {!flag ? (
            <Spinner size="sm" />
          ) : (
            <div className="space-y-2">
              <FlagToggle
                label="Enabled (compute snapshots)"
                description="Required for the readiness engine to run at all."
                value={flag.enabled}
                onChange={v => handleFlagToggle('enabled', v)}
                disabled={!canManage || savingFlag}
              />
              <FlagToggle
                label="Show UI (cards + tier badges)"
                description="When off, snapshots compute but stay hidden — pure shadow mode."
                value={flag.show_ui}
                onChange={v => handleFlagToggle('show_ui', v)}
                disabled={!canManage || savingFlag || !flag.enabled}
              />
              <FlagToggle
                label="Enforce Block (gate dispatch)"
                description="When on, blocked / review_required evaluations stop the Assign action. Override and approval flows replace it."
                value={flag.enforce_block}
                onChange={v => handleFlagToggle('enforce_block', v)}
                disabled={!canManage || savingFlag || !flag.enabled}
                danger
              />
            </div>
          )}
          {!canManage && (
            <p className="text-[11px] text-text-secondary mt-3">Read-only — Owner or Admin role required to change rollout mode.</p>
          )}
        </CardContent>
      </Card>

      {/* Active Config */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle>Active Config</CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="green">v{config?.version || '—'}</Badge>
              <Badge variant="gray">{config?.status || '—'}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] text-text-secondary mb-3">
            V1 launch defaults: <code className="font-mono">service_reliability</code> weight is 0
            because <code className="font-mono">load_stops</code> is empty in production. See
            <code className="font-mono"> _unlock_notes</code> in <code className="font-mono">tier_unlock_rules</code> for the restoration plan.
          </p>

          {!editMode ? (
            <>
              <pre className="bg-surface-secondary rounded-lg p-3 text-[11px] overflow-x-auto max-h-[400px] overflow-y-auto">
{JSON.stringify(buildPayloadFromActive(), null, 2)}
              </pre>
              {canManage && (
                <Button onClick={enterEditMode} className="mt-3">
                  Edit / Publish New Version
                </Button>
              )}
              {publishMessage && (
                <div className="mt-3 inline-flex items-center gap-2 text-success text-body-sm">
                  <CheckCircle className="w-4 h-4" /> {publishMessage}
                </div>
              )}
            </>
          ) : (
            <>
              <textarea
                value={draftJson}
                onChange={e => setDraftJson(e.target.value)}
                className="w-full font-mono text-[11px] bg-white border border-surface-tertiary rounded-lg p-3 min-h-[400px]"
              />
              {draftError && (
                <div className="mt-3 bg-error/10 border border-error/20 rounded-lg p-3 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-error mt-0.5" />
                  <span className="text-body-sm text-error">{draftError}</span>
                </div>
              )}
              <div className="flex items-center gap-2 mt-3">
                <Button onClick={validateAndPublish} disabled={publishing}>
                  {publishing ? <><Spinner size="sm" className="mr-2" /> Publishing…</> : <><Save className="w-4 h-4 mr-1" /> Validate & Publish</>}
                </Button>
                <Button variant="ghost" onClick={() => setEditMode(false)} disabled={publishing}>Cancel</Button>
              </div>
              <p className="text-[11px] text-text-secondary mt-3">
                Validation on publish: weights must sum to 1.0; <code className="font-mono">version</code> required.
                The current active version will be archived atomically.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      {/* Version History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-accent" /> Version History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading && <Spinner size="sm" />}
          {!historyLoading && history.length === 0 && (
            <p className="text-body-sm text-text-secondary">
              Only the global default is active. Publish a new version to track org-specific history.
            </p>
          )}
          {!historyLoading && history.length > 0 && (
            <table className="w-full text-body-sm">
              <thead className="text-[11px] text-text-secondary">
                <tr>
                  <th className="text-left py-1">Version</th>
                  <th className="text-left py-1">Status</th>
                  <th className="text-left py-1">Published At</th>
                </tr>
              </thead>
              <tbody>
                {history.map(h => (
                  <tr key={h.id} className="border-t border-surface-tertiary">
                    <td className="py-2 font-mono text-[12px]">{h.version}</td>
                    <td className="py-2"><Badge variant={h.status === 'active' ? 'green' : 'gray'}>{h.status}</Badge></td>
                    <td className="py-2 text-text-secondary">{formatDateTime(h.published_at || h.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function FlagToggle({ label, description, value, onChange, disabled, danger }) {
  return (
    <label className={`flex items-start gap-3 py-2 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        checked={!!value}
        disabled={disabled}
        onChange={e => onChange(e.target.checked)}
        className="w-4 h-4 mt-1 cursor-pointer"
      />
      <span className="flex-1">
        <span className={`block text-body-sm font-medium ${danger && value ? 'text-error' : 'text-text-primary'}`}>
          {label} {danger && value && <Badge variant="red" className="ml-1">enforced</Badge>}
        </span>
        <span className="block text-[11px] text-text-secondary">{description}</span>
      </span>
    </label>
  );
}

export default ScoringConfigPage;
