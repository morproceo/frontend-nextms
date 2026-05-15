import { useEffect, useState, useMemo, useRef } from 'react';
import {
  Sparkles,
  Check,
  X,
  AlertTriangle,
  Lock,
  Loader2,
  RefreshCw,
  CheckCircle2,
  Info
} from 'lucide-react';
import alexApi from '../../api/alex.api';
import { cn } from '../../lib/utils';

/**
 * AlexReviewPanel — surfaces Alex's load review on the NextMS load
 * detail page. Three sections:
 *
 *   1. Ready to apply  — fillable blanks. Pre-checked for HIGH-confidence
 *      items so the user can hit Apply with one click.
 *
 *   2. Conflicts       — load value disagrees with rate-con. Per-row
 *      "Use rate-con" / "Keep current" radio. Default = use_rate_con.
 *
 *   3. Still missing   — fields with no rate-con evidence. Read-only;
 *      the user fills these by hand.
 *
 * Behavior:
 *   - On mount, fetches the latest completed check via
 *     GET /v1/agents/alex/latest-check/:loadId.
 *   - If a fresh check is in-flight, shows "Alex is reviewing…" and
 *     polls every 3s until the latest_check shifts.
 *   - "Re-check now" runs a sync check, refreshes the panel.
 *   - Apply Selected sends the picks to POST /apply-fix; on success,
 *     refreshes the check (most items should now show as verified).
 *
 * Props:
 *   loadId (required)
 *   onApplied (optional)  — called after a successful apply with the
 *                            result object so the parent can refresh
 *                            the load form.
 */
export function AlexReviewPanel({ loadId, onApplied }) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [applying, setApplying] = useState(false);
  const [latest, setLatest] = useState(null);
  const [hasPending, setHasPending] = useState(false);
  const [error, setError] = useState(null);
  const [completedAt, setCompletedAt] = useState(null);
  const [triggeredBy, setTriggeredBy] = useState(null);
  const [appliedFlash, setAppliedFlash] = useState(null);

  // user selections
  const [readyChecks, setReadyChecks] = useState({});      // field → boolean
  const [conflictPicks, setConflictPicks] = useState({});  // field → 'use_rate_con' | 'keep_current'

  const pollRef = useRef(null);

  const refreshLatest = async () => {
    try {
      setError(null);
      const res = await alexApi.getLatestCheck(loadId);
      setLatest(res.result || null);
      setCompletedAt(res.completed_at || null);
      setTriggeredBy(res.triggered_by || null);
      setHasPending(!!res.has_pending);
      // Seed user selections from confidence + recommendation
      if (res.result) {
        const r = {};
        for (const item of res.result.ready_to_apply || []) {
          r[item.field] = item.confidence === 'high';
        }
        setReadyChecks(r);
        const c = {};
        for (const item of res.result.conflicts || []) {
          c[item.field] = item.recommendation || 'use_rate_con';
        }
        setConflictPicks(c);
      }
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch + poll while a job is in flight
  useEffect(() => {
    setLoading(true);
    refreshLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId]);

  useEffect(() => {
    if (hasPending) {
      pollRef.current = setInterval(refreshLatest, 3000);
      return () => clearInterval(pollRef.current);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPending, loadId]);

  const recheck = async () => {
    setRefreshing(true);
    setError(null);
    try {
      await alexApi.checkLoad(loadId, { sync: true, forceRescan: false });
      await refreshLatest();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setRefreshing(false);
    }
  };

  const selectedCount = useMemo(() => {
    if (!latest) return 0;
    const readyCount = (latest.ready_to_apply || []).filter((i) => readyChecks[i.field]).length;
    const conflictCount = (latest.conflicts || []).filter(
      (i) => conflictPicks[i.field] === 'use_rate_con'
    ).length;
    return readyCount + conflictCount;
  }, [latest, readyChecks, conflictPicks]);

  const applySelected = async () => {
    if (!latest || selectedCount === 0) return;
    setApplying(true);
    setError(null);
    try {
      const fixes = [];
      for (const item of latest.ready_to_apply || []) {
        if (readyChecks[item.field]) {
          fixes.push({ field: item.field, suggested_value: item.suggested_value });
        }
      }
      for (const item of latest.conflicts || []) {
        if (conflictPicks[item.field] === 'use_rate_con') {
          fixes.push({
            field: item.field,
            suggested_value: item.suggested_value,
            overwrite: true
          });
        }
      }
      const result = await alexApi.applyFix(loadId, fixes);
      setAppliedFlash(result);
      // Re-check to show updated state (most items should be verified now)
      await alexApi.checkLoad(loadId, { sync: true });
      await refreshLatest();
      if (onApplied) onApplied(result);
      setTimeout(() => setAppliedFlash(null), 4000);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setApplying(false);
    }
  };

  // ── Render ────────────────────────────────────────────────────────

  if (loading) {
    return <ReviewShell><LoadingState /></ReviewShell>;
  }

  if (!latest && !hasPending) {
    return (
      <ReviewShell>
        <div className="px-5 py-5 flex items-center gap-4">
          <AlexAvatar />
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-text-primary">
              Alex hasn't reviewed this load yet
            </div>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Trigger a check to surface missing fields and rate-con conflicts.
            </p>
          </div>
          <button
            type="button"
            onClick={recheck}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 rounded-button bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white text-body-sm font-medium hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run Alex
          </button>
        </div>
      </ReviewShell>
    );
  }

  const ready = latest?.ready_to_apply || [];
  const conflicts = latest?.conflicts || [];
  const missing = latest?.missing_fields || [];
  const counts = latest?.counts || {};
  const complete = !!latest?.complete;

  return (
    <ReviewShell>
      {/* Header */}
      <div className="px-5 py-4 border-b border-surface-tertiary flex items-start gap-4">
        <AlexAvatar />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-text-primary">Alex's review</span>
            {complete && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-success/10 text-success border border-success/20">
                <Check className="w-2.5 h-2.5" />
                Complete
              </span>
            )}
            {hasPending && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-cyan-500/10 text-cyan-600">
                <Loader2 className="w-2.5 h-2.5 animate-spin" />
                Re-checking…
              </span>
            )}
          </div>
          <p className="text-body-sm text-text-secondary mt-1 leading-relaxed">
            {latest?.summary || 'No summary'}
          </p>
          {(completedAt || triggeredBy) && (
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mt-1.5">
              {completedAt && new Date(completedAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
              {triggeredBy && <> · triggered by {triggeredBy}</>}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={recheck}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          aria-label="Re-check"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin')} />
          Re-check
        </button>
      </div>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {appliedFlash && (
        <div className="px-5 py-2 bg-success/10 border-b border-success/20 text-small text-success flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5" />
          Applied {appliedFlash.applied} change{appliedFlash.applied === 1 ? '' : 's'}.
          {appliedFlash.skipped > 0 && <> ({appliedFlash.skipped} skipped.)</>}
        </div>
      )}

      {/* Body sections */}
      <div className="divide-y divide-surface-tertiary">

        {ready.length > 0 && (
          <Section
            title={`Ready to apply (${ready.length})`}
            badgeTone="emerald"
            hint="Blank fields Alex can fill from the rate-con."
          >
            {ready.map((item) => (
              <ReadyRow
                key={item.field}
                item={item}
                checked={!!readyChecks[item.field]}
                onToggle={(v) => setReadyChecks((r) => ({ ...r, [item.field]: v }))}
              />
            ))}
          </Section>
        )}

        {conflicts.length > 0 && (
          <Section
            title={`Conflicts (${conflicts.length})`}
            badgeTone="amber"
            hint="Load and rate-con disagree. Rate-con is the source of truth — confirm which value to keep."
          >
            {conflicts.map((item) => (
              <ConflictRow
                key={item.field}
                item={item}
                pick={conflictPicks[item.field] || 'use_rate_con'}
                onPick={(v) => setConflictPicks((c) => ({ ...c, [item.field]: v }))}
              />
            ))}
          </Section>
        )}

        {missing.length > 0 && (
          <Section
            title={`Still missing (${missing.length})`}
            badgeTone="slate"
            hint={
              latest?.has_rate_con
                ? "Rate-con doesn't mention these. Fill by hand."
                : 'No rate-con attached. Upload one or fill manually.'
            }
          >
            <div className="px-5 py-2 flex flex-wrap gap-1.5">
              {missing.map((m) => (
                <span
                  key={m.field}
                  className={cn(
                    'inline-flex items-center gap-1 px-2 py-0.5 text-[11px] rounded-full border',
                    m.severity === 'critical'
                      ? 'bg-error/10 text-error border-error/20'
                      : 'bg-warning/10 text-warning-dark border-warning/20'
                  )}
                  title={`Severity: ${m.severity}`}
                >
                  <Lock className="w-2.5 h-2.5" />
                  {m.label}
                </span>
              ))}
            </div>
          </Section>
        )}

        {ready.length === 0 && conflicts.length === 0 && missing.length === 0 && (
          <div className="px-5 py-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-2" />
            <div className="text-body-sm font-medium text-text-primary">Load is fully populated.</div>
            <p className="text-small text-text-secondary mt-1">
              Alex couldn't find anything to fix. {counts.verified ?? 0} fields verified.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Apply */}
      {(ready.length > 0 || conflicts.length > 0) && (
        <div className="px-5 py-3 border-t border-surface-tertiary flex items-center justify-between gap-3 bg-surface-secondary/40">
          <span className="text-body-sm text-text-secondary">
            {selectedCount} selected to apply
          </span>
          <button
            type="button"
            onClick={applySelected}
            disabled={selectedCount === 0 || applying}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-button text-body-sm font-medium transition-all',
              selectedCount > 0 && !applying
                ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white hover:scale-[1.02]'
                : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
            )}
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Apply {selectedCount > 0 ? `${selectedCount} ` : ''}
            change{selectedCount === 1 ? '' : 's'}
          </button>
        </div>
      )}
    </ReviewShell>
  );
}

function ReviewShell({ children }) {
  return (
    <section className="bg-surface-primary border border-fuchsia-500/20 rounded-card overflow-hidden shadow-[0_0_30px_-12px_rgba(168,85,247,0.25)]">
      {children}
    </section>
  );
}

function AlexAvatar() {
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br from-cyan-500 to-blue-500 shadow-elevated">
      <span className="text-white font-semibold">A</span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="p-6 flex items-center gap-3">
      <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
      <span className="text-body-sm text-text-secondary">Loading Alex's review…</span>
    </div>
  );
}

function Section({ title, hint, badgeTone, children }) {
  const tone = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-text-tertiary'
  }[badgeTone] || 'text-text-secondary';
  return (
    <div>
      <div className="px-5 pt-4 pb-2">
        <div className={cn('text-[10px] uppercase tracking-wider font-semibold', tone)}>
          {title}
        </div>
        {hint && <div className="text-small text-text-tertiary mt-0.5">{hint}</div>}
      </div>
      {children}
    </div>
  );
}

function ReadyRow({ item, checked, onToggle }) {
  return (
    <label className="flex items-start gap-3 px-5 py-3 hover:bg-surface-secondary/40 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/30"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-medium text-text-primary">
            {formatField(item.field)}
          </span>
          <ConfidencePill confidence={item.confidence} />
          <span className="text-small text-text-tertiary">→</span>
          <span className="text-body-sm font-medium text-emerald-600">
            {formatValue(item.suggested_value)}
          </span>
        </div>
        {item.user_message && (
          <div className="text-small text-text-secondary mt-1 leading-snug">
            {item.user_message}
          </div>
        )}
      </div>
    </label>
  );
}

function ConflictRow({ item, pick, onPick }) {
  return (
    <div className="px-5 py-3 hover:bg-surface-secondary/40 transition-colors">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-body-sm font-medium text-text-primary">
              {formatField(item.field)}
            </span>
            <ConfidencePill confidence={item.confidence} />
          </div>
          {item.user_message && (
            <div className="text-small text-text-secondary mt-1 leading-snug">
              {item.user_message}
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
            <ConflictChoice
              label="Keep current"
              value={item.current_value}
              selected={pick === 'keep_current'}
              onClick={() => onPick('keep_current')}
              tone="slate"
            />
            <ConflictChoice
              label="Use rate-con"
              value={item.suggested_value}
              selected={pick === 'use_rate_con'}
              onClick={() => onPick('use_rate_con')}
              tone="emerald"
              recommended
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictChoice({ label, value, selected, onClick, tone, recommended }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-0.5 px-3 py-2 rounded-button border text-left transition-all',
        selected
          ? tone === 'emerald'
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-text-tertiary bg-surface-secondary'
          : 'border-surface-tertiary hover:border-text-tertiary bg-surface-primary'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</span>
        {recommended && (
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">Recommended</span>
        )}
        {selected && <Check className={cn('w-3 h-3 ml-auto', tone === 'emerald' ? 'text-emerald-600' : 'text-text-primary')} />}
      </div>
      <div className="text-body-sm font-medium text-text-primary truncate">
        {formatValue(value)}
      </div>
    </button>
  );
}

function ConfidencePill({ confidence }) {
  const tone = {
    high: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30',
    medium: 'bg-amber-500/10 text-amber-700 border-amber-500/30',
    low: 'bg-slate-500/10 text-slate-700 border-slate-500/30'
  }[confidence] || 'bg-slate-500/10 text-slate-700 border-slate-500/30';
  return (
    <span className={cn('text-[9px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full border', tone)}>
      {confidence || 'unknown'}
    </span>
  );
}

function formatField(field) {
  return (field || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}

export default AlexReviewPanel;
