import { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Settings as SettingsIcon,
  Loader2,
  Check,
  AlertCircle,
  Save,
  ChevronDown,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { GENIE_TEAM } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import agentPoliciesApi from '../../api/agentPolicies.api';
import { getControlConfig, GROUP_ORDER } from '../../config/agentPolicyControls';
import { cn } from '../../lib/utils';

/**
 * Genie Suite settings — generic policy editor for every agent.
 *
 * For each agent in the team config we:
 *   1. Fetch the task manifest (each task lists its `policyKeys`)
 *   2. Fetch the merged policies (defaults + per-org overrides)
 *   3. Aggregate the unique keys across all tasks
 *   4. Render a control per key from the agentPolicyControls config
 *   5. Save with PUT /v1/agents/:slug/policies (only changed keys)
 *
 * Agents with no task manifest or no `policyKeys` show "No configurable
 * settings yet." Agents not yet registered in the backend AgentRegistry
 * show the same.
 *
 * URL fragment (#alex / #ava / ...) auto-expands that agent's panel
 * — used by deep links from each agent's page.
 */
export default function GenieSettingsPage() {
  const location = useLocation();
  const focusedSlug = (location.hash || '').replace('#', '') || null;

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <SettingsIcon className="w-6 h-6" />
          Suite settings
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Tune how each agent behaves on your behalf. Each setting is per-organization —
          changes here apply across every member of this org.
        </p>
      </div>

      <div className="space-y-3">
        {GENIE_TEAM.map((agent) => (
          <AgentPolicySection
            key={agent.slug}
            agent={agent}
            defaultOpen={agent.slug === focusedSlug}
          />
        ))}
      </div>
    </div>
  );
}

function AgentPolicySection({ agent, defaultOpen }) {
  const [open, setOpen] = useState(!!defaultOpen);
  const [tasks, setTasks] = useState(null);
  const [policies, setPolicies] = useState(null);
  const [draft, setDraft] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [savedAt, setSavedAt] = useState(null);
  const ref = useRef(null);

  // Auto-scroll into view when this section is the focused one.
  useEffect(() => {
    if (defaultOpen && ref.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [defaultOpen]);

  // Lazy-load when the user expands.
  useEffect(() => {
    if (!open || tasks !== null) return;
    let cancelled = false;
    setLoading(true);
    Promise.all([
      agentPoliciesApi.getTasks(agent.slug),
      agentPoliciesApi.getPolicies(agent.slug)
    ])
      .then(([taskRes, polRes]) => {
        if (cancelled) return;
        setTasks(taskRes?.tasks || []);
        setPolicies(polRes || {});
        setDraft({});
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err?.response?.data?.error?.message || err.message);
        setTasks([]);
        setPolicies({});
      })
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [open, agent.slug, tasks]);

  // Collect every unique policy key declared by any of this agent's tasks.
  const policyKeys = (tasks || [])
    .flatMap((t) => t.policyKeys || [])
    .filter((k, i, arr) => arr.indexOf(k) === i);

  // Group keys by the control config's `group` field.
  const groups = {};
  for (const key of policyKeys) {
    const cfg = getControlConfig(agent.slug, key);
    (groups[cfg.group || 'Other'] ||= []).push({ key, cfg });
  }
  const orderedGroups = [...GROUP_ORDER, ...Object.keys(groups)]
    .filter((g, i, arr) => arr.indexOf(g) === i && groups[g]?.length);

  const currentValue = (key) =>
    draft[key] !== undefined ? draft[key] : policies?.[key];

  const onChange = (key, value) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setSavedAt(null);
  };

  const hasChanges = Object.keys(draft).length > 0;

  const onSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const updated = await agentPoliciesApi.updatePolicies(agent.slug, draft);
      setPolicies(updated || {});
      setDraft({});
      setSavedAt(Date.now());
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={ref}
      id={agent.slug}
      className={cn(
        'bg-surface-primary border rounded-card overflow-hidden transition-colors',
        defaultOpen
          ? 'border-fuchsia-500/40 shadow-[0_0_30px_-10px_rgba(236,72,153,0.3)]'
          : 'border-surface-tertiary'
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-4 p-4 text-left hover:bg-surface-secondary/40 transition-colors"
      >
        <AgentAvatar agent={agent} size="sm" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-text-primary truncate">{agent.name}</span>
            {agent.isCeo && (
              <span className="text-[10px] uppercase tracking-wider text-fuchsia-500 font-semibold">CEO</span>
            )}
          </div>
          <div className="text-body-sm text-text-secondary truncate">{agent.role}</div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        ) : (
          <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        )}
      </button>

      {open && (
        <div className="border-t border-surface-tertiary p-5 space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-body-sm text-text-tertiary">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading policies…
            </div>
          )}

          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-button flex items-center gap-2 text-body-sm text-error">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          {!loading && !error && policyKeys.length === 0 && (
            <div className="bg-surface-secondary border border-surface-tertiary rounded-button p-5 text-center">
              <Sparkles className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
              <p className="text-body-sm text-text-secondary">
                {agent.name} doesn't have any configurable policies yet.
              </p>
            </div>
          )}

          {!loading && !error && orderedGroups.map((groupName) => (
            <div key={groupName}>
              <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">
                {groupName}
              </div>
              <div className="space-y-2">
                {groups[groupName].map(({ key, cfg }) => (
                  <PolicyControl
                    key={key}
                    policyKey={key}
                    cfg={cfg}
                    value={currentValue(key)}
                    onChange={(v) => onChange(key, v)}
                  />
                ))}
              </div>
            </div>
          ))}

          {!loading && !error && policyKeys.length > 0 && (
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-surface-tertiary">
              {savedAt && !hasChanges && (
                <span className="text-body-sm text-success flex items-center gap-1">
                  <Check className="w-4 h-4" />
                  Saved
                </span>
              )}
              <button
                type="button"
                onClick={onSave}
                disabled={!hasChanges || saving}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-button text-body-sm font-medium transition-colors',
                  hasChanges
                    ? 'bg-accent hover:bg-accent-hover text-white'
                    : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                )}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save changes
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PolicyControl({ policyKey, cfg, value, onChange }) {
  if (cfg.type === 'boolean') {
    const on = isTrue(value);
    return (
      <div className="flex items-center justify-between gap-4 p-3 bg-surface-secondary rounded-button">
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium text-text-primary">{cfg.label}</div>
          {cfg.help && (
            <div className="text-small text-text-secondary mt-0.5 leading-snug">{cfg.help}</div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onChange(on ? 'false' : 'true')}
          aria-pressed={on}
          className={cn(
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0',
            on ? 'bg-accent' : 'bg-surface-tertiary'
          )}
        >
          <span
            className={cn(
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
              on ? 'translate-x-6' : 'translate-x-1'
            )}
          />
        </button>
      </div>
    );
  }

  if (cfg.type === 'select') {
    return (
      <div className="p-3 bg-surface-secondary rounded-button">
        <div className="flex items-baseline justify-between gap-4 mb-2">
          <div className="text-body-sm font-medium text-text-primary">{cfg.label}</div>
        </div>
        {cfg.help && (
          <div className="text-small text-text-secondary mb-2 leading-snug">{cfg.help}</div>
        )}
        <select
          value={value ?? cfg.options?.[0]?.value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-surface-primary border border-surface-tertiary rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          {(cfg.options || []).map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  // text / fallback
  return (
    <div className="p-3 bg-surface-secondary rounded-button">
      <div className="text-body-sm font-medium text-text-primary mb-1">{cfg.label}</div>
      {cfg.help && (
        <div className="text-small text-text-secondary mb-2 leading-snug">{cfg.help}</div>
      )}
      <input
        type={cfg.type === 'number' ? 'number' : 'text'}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-surface-primary border border-surface-tertiary rounded-input text-body-sm text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
      />
    </div>
  );
}

/**
 * Policy values come from the DB as JSON, so booleans may arrive as
 * `true`/`false` strings, real booleans, or even the literal `"true"`.
 * Normalize for the toggle.
 */
function isTrue(v) {
  if (v === true) return true;
  if (v === 'true') return true;
  if (v === 1 || v === '1') return true;
  return false;
}
