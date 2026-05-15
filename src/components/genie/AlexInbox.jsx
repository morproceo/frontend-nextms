import { useEffect, useState, useRef } from 'react';
import {
  Inbox,
  ChevronDown,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Loader2,
  Sparkles,
  Check,
  X,
  Mail,
  Send,
  Truck
} from 'lucide-react';
import client from '../../api/client';
import alexApi from '../../api/alex.api';
import { cn } from '../../lib/utils';

/**
 * AlexInbox — unified action surface for Alex's reviews.
 *
 * The replacement for both "Recent reviews" and the per-load
 * AlexReviewPanel that lived inside the TMS. One panel, one place to
 * triage what Alex did and act on it:
 *
 *   - Each row is one load Alex reviewed.
 *   - Collapsed row shows summary + counts.
 *   - Expand → inline action UI: fillable checkboxes + conflict toggles.
 *   - Apply → re-check → row updates in place. No navigation.
 *
 * Polls every 6s so reactive triggers (load created, rate-con uploaded)
 * land in the inbox automatically.
 *
 * Row order:
 *   1. Needs attention (has ready or conflicts) — newest first
 *   2. Clean — newest first
 */
export function AlexInbox({ className }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const pollRef = useRef(null);

  const fetchReviews = async () => {
    try {
      const res = await client.get('/v1/agents/alex/recent-reviews?limit=30');
      const data = res.data?.data ?? res.data;
      setReviews(data?.reviews || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
    pollRef.current = setInterval(fetchReviews, 6000);
    return () => clearInterval(pollRef.current);
  }, []);

  const onRowApplied = async () => {
    // Refetch the whole list after an apply so counts and row positions
    // (needs attention vs clean) update everywhere.
    await fetchReviews();
  };

  // Different task types have different "needs action" definitions.
  const needsAction = (r) => {
    if (r.task_name === 'check_load_completeness') {
      return (r.ready_count || 0) + (r.conflict_count || 0) > 0;
    }
    if (r.task_name === 'notify_broker_on_status_change') {
      // A drafted (not yet sent) notification needs action.
      return !r.skipped && r.authority === 'propose' && !r.sent;
    }
    return false;
  };
  const needsAttention = reviews.filter(needsAction);
  const clean = reviews.filter((r) => !needsAction(r));

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Alex's inbox</span>
          {needsAttention.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
              {needsAttention.length} need{needsAttention.length === 1 ? 's' : ''} action
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchReviews}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh inbox"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error">{error}</div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-10 text-center">
          <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <div className="text-body-sm text-text-secondary">
            Inbox is empty — Alex hasn't reviewed any loads yet.
          </div>
          <div className="text-small text-text-tertiary mt-1">
            New loads + rate-con uploads trigger reactive reviews when the policy is on.
          </div>
        </div>
      ) : (
        <div>
          {needsAttention.length > 0 && (
            <Subhead label="Needs your action" count={needsAttention.length} tone="amber" />
          )}
          <div className="divide-y divide-surface-tertiary">
            {needsAttention.map((r) => (
              <InboxRow
                key={r.job_id}
                review={r}
                expanded={expandedId === r.job_id}
                onToggle={() => setExpandedId((id) => (id === r.job_id ? null : r.job_id))}
                onApplied={onRowApplied}
              />
            ))}
          </div>

          {clean.length > 0 && (
            <Subhead label="Clean — reviewed, nothing to do" count={clean.length} tone="emerald" />
          )}
          <div className="divide-y divide-surface-tertiary">
            {clean.map((r) => (
              <InboxRow
                key={r.job_id}
                review={r}
                expanded={expandedId === r.job_id}
                onToggle={() => setExpandedId((id) => (id === r.job_id ? null : r.job_id))}
                onApplied={onRowApplied}
                cleanRow
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function Subhead({ label, count, tone }) {
  const toneClass = {
    amber: 'text-amber-700',
    emerald: 'text-emerald-700'
  }[tone] || 'text-text-tertiary';
  return (
    <div className="px-5 py-2 bg-surface-secondary/40 border-b border-surface-tertiary">
      <div className={cn('text-[10px] uppercase tracking-wider font-semibold', toneClass)}>
        {label} · {count}
      </div>
    </div>
  );
}

function InboxRow({ review, expanded, onToggle, onApplied, cleanRow }) {
  const ld = review.load || {};
  const ref = ld.reference_number || review.load_id?.slice(0, 8) || 'unknown';
  const route =
    ld.shipper_city || ld.consignee_city
      ? `${[ld.shipper_city, ld.shipper_state].filter(Boolean).join(', ') || '—'} → ${[ld.consignee_city, ld.consignee_state].filter(Boolean).join(', ') || '—'}`
      : null;

  const isNotify = review.task_name === 'notify_broker_on_status_change';
  const taskLabel = isNotify
    ? `Broker notification · ${review.status_event || 'status change'}`
    : 'Load completeness';

  return (
    <div className={cn(expanded && 'bg-surface-secondary/30')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-3 hover:bg-surface-secondary/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <RowIcon review={review} clean={cleanRow} />
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-body-sm font-semibold text-text-primary">Load {ref}</span>
              <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{taskLabel}</span>
              {route && <span className="text-small text-text-tertiary">{route}</span>}
              <span className="text-small text-text-tertiary ml-auto" title={new Date(review.completed_at).toLocaleString()}>
                {formatRelative(new Date(review.completed_at))}
              </span>
            </div>

            {review.summary && (
              <div className="text-body-sm text-text-secondary mt-0.5 leading-snug">
                {review.summary}
              </div>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-small">
              {!isNotify && review.ready_count > 0 && (
                <Stat icon={Sparkles} tone="emerald" value={review.ready_count} label="ready" />
              )}
              {!isNotify && review.conflict_count > 0 && (
                <Stat icon={AlertTriangle} tone="amber" value={review.conflict_count} label="conflict" />
              )}
              {!isNotify && !review.has_rate_con && (
                <Stat icon={Lock} tone="slate" value="—" label="no rate-con" />
              )}
              {!isNotify && (review.counts?.verified ?? 0) > 0 && (
                <Stat icon={CheckCircle2} tone="slate" value={review.counts.verified} label="verified" />
              )}

              {isNotify && review.sent && (
                <Stat icon={Send} tone="emerald" value="Sent" label="" />
              )}
              {isNotify && !review.sent && !review.skipped && review.authority === 'propose' && (
                <Stat icon={Mail} tone="amber" value="Draft" label="awaits approval" />
              )}
              {isNotify && review.confidence && (
                <Stat
                  icon={CheckCircle2}
                  tone={review.confidence === 'high' ? 'emerald' : review.confidence === 'medium' ? 'amber' : 'slate'}
                  value={review.confidence.toUpperCase()}
                  label="confidence"
                />
              )}

              <span className="ml-auto flex items-center gap-1 text-[10px] uppercase tracking-wider text-text-tertiary">
                <span>{review.triggered_by}</span>
                {expanded ? (
                  <ChevronDown className="w-3 h-3" />
                ) : (
                  <ChevronRight className="w-3 h-3" />
                )}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        isNotify
          ? <NotificationActionView review={review} onClose={onToggle} onApplied={onApplied} />
          : <InboxAction review={review} onApplied={onApplied} onClose={onToggle} />
      )}
    </div>
  );
}

function RowIcon({ review, clean }) {
  const isNotify = review.task_name === 'notify_broker_on_status_change';
  if (isNotify) {
    return (
      <div className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        review.sent ? 'bg-emerald-500/10' :
        review.skipped ? 'bg-slate-500/10' :
        'bg-amber-500/10'
      )}>
        {review.sent ? <Send className="w-3.5 h-3.5 text-emerald-600" /> :
         review.skipped ? <Lock className="w-3.5 h-3.5 text-text-tertiary" /> :
         <Mail className="w-3.5 h-3.5 text-amber-600" />}
      </div>
    );
  }
  return <StatusIcon clean={clean} />;
}

/**
 * Notification action panel. Renders the drafted email + the
 * Approve/Discard controls for drafts. Sent/discarded jobs render
 * read-only with the appropriate status indicator.
 */
function NotificationActionView({ review, onClose, onApplied }) {
  const email = review.drafted_email || {};
  const inbox = review.inbox_check || {};
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [doneState, setDoneState] = useState(null); // 'sent' | 'discarded'

  const status = doneState
    ? doneState
    : review.sent ? 'sent'
    : review.skipped ? 'skipped'
    : review.discarded ? 'discarded'
    : 'draft';

  const approve = async () => {
    setBusy(true);
    setError(null);
    try {
      await alexApi.approveNotification(review.job_id);
      setDoneState('sent');
      onApplied?.();
      setTimeout(() => onClose?.(), 1500);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const discard = async () => {
    if (!confirm('Discard this draft? It will not be sent.')) return;
    setBusy(true);
    setError(null);
    try {
      await alexApi.discardNotification(review.job_id);
      setDoneState('discarded');
      onApplied?.();
      setTimeout(() => onClose?.(), 1200);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="border-t border-surface-tertiary bg-surface-primary px-5 py-4 space-y-3">
      {/* Status banner */}
      <div className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-button text-body-sm',
        status === 'sent' ? 'bg-success/10 text-success border border-success/20' :
        status === 'discarded' ? 'bg-surface-secondary text-text-secondary border border-surface-tertiary' :
        status === 'skipped' ? 'bg-surface-secondary text-text-secondary border border-surface-tertiary' :
        'bg-amber-500/10 text-amber-700 border border-amber-500/30'
      )}>
        {status === 'sent' ? <Send className="w-3.5 h-3.5" /> :
         status === 'discarded' ? <X className="w-3.5 h-3.5" /> :
         status === 'skipped' ? <Lock className="w-3.5 h-3.5" /> :
         <Mail className="w-3.5 h-3.5" />}
        <span className="font-medium">
          {status === 'sent' ? `Sent · message ${review.message_id?.slice(0, 12) || '—'}` :
           status === 'discarded' ? `Discarded — not sent.` :
           status === 'skipped' ? `Skipped` :
           `Drafted — awaiting your approval`}
        </span>
        {review.send_override && (
          <span className="text-small text-text-tertiary ml-auto">
            DEV: redirected from {review.send_override.original_to}
          </span>
        )}
      </div>

      {/* Verification + conflict */}
      {inbox.reason && (
        <div className="text-small text-text-secondary px-1">
          <span className="font-medium">Verification:</span> {inbox.details}
        </div>
      )}
      {review.broker?.conflict && (
        <div className="text-small text-error px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Source conflict: rate-con and broker record disagree on email.
        </div>
      )}
      {error && (
        <div className="text-small text-error px-1 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </div>
      )}

      {/* Email preview */}
      <div className="bg-surface-secondary border border-surface-tertiary rounded-button px-4 py-3 space-y-1">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary">To</div>
        <div className="text-body-sm font-mono text-text-primary">
          {email.to}
          {review.send_override && (
            <span className="ml-2 text-small text-text-tertiary">
              (intended: {review.send_override.original_to})
            </span>
          )}
        </div>
        {email.reply_to && (
          <>
            <div className="text-[10px] uppercase tracking-wider text-text-tertiary pt-1">Reply-To</div>
            <div className="text-body-sm font-mono text-text-primary">{email.reply_to}</div>
          </>
        )}
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary pt-1">Subject</div>
        <div className="text-body-sm font-medium text-text-primary">{email.subject || '—'}</div>
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary pt-1">Body</div>
        <pre className="text-body-sm text-text-primary whitespace-pre-wrap font-sans">
{email.body || '—'}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-1">
        <div className="text-small text-text-tertiary">
          {status === 'draft'
            ? 'You can approve as-is, or discard if it shouldn\'t go out.'
            : ''}
        </div>
        <div className="flex items-center gap-2">
          {status === 'draft' ? (
            <>
              <button
                type="button"
                onClick={discard}
                disabled={busy}
                className="flex items-center gap-1.5 px-4 py-2 rounded-button text-body-sm font-medium bg-surface-secondary hover:bg-surface-tertiary text-text-secondary disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
                Discard
              </button>
              <button
                type="button"
                onClick={approve}
                disabled={busy}
                className={cn(
                  'flex items-center gap-1.5 px-4 py-2 rounded-button text-body-sm font-medium text-white transition-all disabled:opacity-50',
                  'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02]'
                )}
              >
                {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                Approve &amp; send
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-button text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ clean }) {
  return (
    <div
      className={cn(
        'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
        clean ? 'bg-emerald-500/10' : 'bg-amber-500/10'
      )}
    >
      {clean ? (
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
      )}
    </div>
  );
}

function Stat({ icon: Icon, tone, value, label }) {
  const toneClass = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    slate: 'text-text-tertiary'
  }[tone] || 'text-text-secondary';
  return (
    <span className={cn('inline-flex items-center gap-1', toneClass)}>
      <Icon className="w-3 h-3" />
      <span className="font-medium">{value}</span>
      <span className="text-text-tertiary">{label}</span>
    </span>
  );
}

/**
 * Inline action UI rendered when a row is expanded. Mirrors what
 * AlexReviewPanel did, but works on the data already in the review row.
 */
function InboxAction({ review, onApplied, onClose }) {
  const [readyChecks, setReadyChecks] = useState(() => {
    const m = {};
    for (const item of review.ready_to_apply || []) {
      m[item.field] = item.confidence === 'high';
    }
    return m;
  });
  const [conflictPicks, setConflictPicks] = useState(() => {
    const m = {};
    for (const item of review.conflicts || []) {
      m[item.field] = item.recommendation || 'use_rate_con';
    }
    return m;
  });
  const [applying, setApplying] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(null); // { appliedCount, summary }

  const ready = review.ready_to_apply || [];
  const conflicts = review.conflicts || [];
  const missing = review.missing_fields || [];

  const selectedCount =
    ready.filter((i) => readyChecks[i.field]).length +
    conflicts.filter((c) => conflictPicks[c.field] === 'use_rate_con').length;

  const apply = async () => {
    if (selectedCount === 0) return;
    setApplying(true);
    setError(null);
    setDone(null);
    try {
      const fixes = [];
      for (const item of ready) {
        if (readyChecks[item.field]) {
          fixes.push({ field: item.field, suggested_value: item.suggested_value });
        }
      }
      for (const item of conflicts) {
        if (conflictPicks[item.field] === 'use_rate_con') {
          fixes.push({
            field: item.field,
            suggested_value: item.suggested_value,
            overwrite: true
          });
        }
      }
      const applyResult = await alexApi.applyFix(review.load_id, fixes);
      // Re-run check so the inbox + parent's view of the load reflect
      // the post-apply state. The sync path now also writes a row to
      // agent_jobs so the parent's recent-reviews poll returns the new
      // truth, not the stale reactive job.
      const newCheck = await alexApi.checkLoad(review.load_id, { sync: true });
      setDone({
        applied: applyResult?.applied ?? fixes.length,
        skipped: applyResult?.skipped ?? 0,
        summary: newCheck?.summary,
        stillNeedsAction:
          (newCheck?.ready_to_apply || []).length + (newCheck?.conflicts || []).length > 0
      });
      // Notify parent — the next poll/refresh will replace this row's data.
      onApplied?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setApplying(false);
    }
  };

  const recheck = async () => {
    setApplying(true);
    setError(null);
    try {
      await alexApi.checkLoad(review.load_id, { sync: true });
      onApplied?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setApplying(false);
    }
  };

  // Done state — replaces the whole action surface with a clear confirmation.
  if (done) {
    return (
      <div className="border-t border-surface-tertiary bg-emerald-500/5">
        <div className="px-5 py-5 flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-emerald-700">
              {done.applied > 0
                ? `Applied ${done.applied} change${done.applied === 1 ? '' : 's'}`
                : 'No changes applied'}
              {done.skipped > 0 && (
                <span className="text-body-sm font-normal text-text-secondary">
                  {' '}({done.skipped} skipped)
                </span>
              )}
            </div>
            {done.summary && (
              <div className="text-body-sm text-text-secondary mt-1 leading-snug">
                Re-check: {done.summary}
              </div>
            )}
            <div className="mt-3 flex items-center gap-2">
              <button
                type="button"
                onClick={() => { setDone(null); onClose?.(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-emerald-600 text-white text-body-sm font-medium hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                {done.stillNeedsAction ? 'Close' : 'Done'}
              </button>
              {done.stillNeedsAction && (
                <span className="text-small text-text-tertiary">
                  Still has proposals after re-check — close to see updated row.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border-t border-surface-tertiary bg-surface-primary">
      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error flex items-center gap-2">
          <AlertTriangle className="w-3.5 h-3.5" /> {error}
        </div>
      )}

      {ready.length > 0 && (
        <Section title={`Ready to apply (${ready.length})`} tone="emerald">
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
        <Section title={`Conflicts (${conflicts.length})`} tone="amber">
          {conflicts.map((c) => (
            <ConflictRow
              key={c.field}
              item={c}
              pick={conflictPicks[c.field] || 'use_rate_con'}
              onPick={(v) => setConflictPicks((p) => ({ ...p, [c.field]: v }))}
            />
          ))}
        </Section>
      )}

      {missing.length > 0 && (
        <Section title={`Still missing (${missing.length})`} tone="slate">
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

      <div className="px-5 py-3 border-t border-surface-tertiary flex items-center justify-between gap-3 bg-surface-secondary/40">
        <button
          type="button"
          onClick={recheck}
          disabled={applying}
          className="flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', applying && 'animate-spin')} />
          Re-check
        </button>
        <div className="flex items-center gap-3">
          <span className="text-body-sm text-text-secondary">
            {selectedCount} selected
          </span>
          <button
            type="button"
            onClick={apply}
            disabled={selectedCount === 0 || applying}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-button text-body-sm font-medium transition-all',
              selectedCount > 0 && !applying
                ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white hover:scale-[1.02]'
                : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
            )}
          >
            {applying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            Apply {selectedCount > 0 ? selectedCount : ''}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, tone, children }) {
  const toneClass = {
    emerald: 'text-emerald-700',
    amber: 'text-amber-700',
    slate: 'text-text-tertiary'
  }[tone] || 'text-text-secondary';
  return (
    <div>
      <div className="px-5 pt-3 pb-1">
        <div className={cn('text-[10px] uppercase tracking-wider font-semibold', toneClass)}>
          {title}
        </div>
      </div>
      {children}
    </div>
  );
}

function ReadyRow({ item, checked, onToggle }) {
  return (
    <label className="flex items-start gap-3 px-5 py-2 hover:bg-surface-secondary/40 transition-colors cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onToggle(e.target.checked)}
        className="mt-1 w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/30"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-medium text-text-primary">{formatField(item.field)}</span>
          <ConfidencePill confidence={item.confidence} />
          <span className="text-small text-text-tertiary">→</span>
          <span className="text-body-sm font-medium text-emerald-700">{formatValue(item.suggested_value)}</span>
        </div>
        {item.user_message && (
          <div className="text-small text-text-secondary mt-0.5 leading-snug">{item.user_message}</div>
        )}
      </div>
    </label>
  );
}

function ConflictRow({ item, pick, onPick }) {
  return (
    <div className="px-5 py-2 hover:bg-surface-secondary/40 transition-colors">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-body-sm font-medium text-text-primary">{formatField(item.field)}</span>
            <ConfidencePill confidence={item.confidence} />
          </div>
          {item.user_message && (
            <div className="text-small text-text-secondary mt-0.5 leading-snug">{item.user_message}</div>
          )}
          <div className="grid grid-cols-2 gap-2 mt-2">
            <ConflictChoice
              label="Keep current"
              value={item.current_value}
              selected={pick === 'keep_current'}
              onClick={() => onPick('keep_current')}
            />
            <ConflictChoice
              label="Use rate-con"
              value={item.suggested_value}
              selected={pick === 'use_rate_con'}
              onClick={() => onPick('use_rate_con')}
              recommended
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function ConflictChoice({ label, value, selected, onClick, recommended }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex flex-col gap-0.5 px-3 py-2 rounded-button border text-left transition-all',
        selected
          ? recommended
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-text-tertiary bg-surface-secondary'
          : 'border-surface-tertiary hover:border-text-tertiary bg-surface-primary'
      )}
    >
      <div className="flex items-center gap-1.5">
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</span>
        {recommended && (
          <span className="text-[9px] uppercase tracking-wider text-emerald-600 font-semibold">Rec'd</span>
        )}
        {selected && <Check className={cn('w-3 h-3 ml-auto', recommended ? 'text-emerald-600' : 'text-text-primary')} />}
      </div>
      <div className="text-body-sm font-medium text-text-primary truncate">{formatValue(value)}</div>
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
      {confidence || '—'}
    </span>
  );
}

function formatField(f) {
  return (f || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatValue(v) {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'number') return v.toLocaleString();
  return String(v);
}
function formatRelative(date) {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 10) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default AlexInbox;
