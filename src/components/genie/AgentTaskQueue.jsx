import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ListChecks,
  RefreshCw,
  Plus,
  Loader2,
  Clock,
  Play,
  RotateCcw,
  X,
  Send,
  AlertTriangle,
  Sparkles,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';
import agentJobsApi from '../../api/agentJobs.api';
import agentPoliciesApi from '../../api/agentPolicies.api';
import client from '../../api/client';
import { cn } from '../../lib/utils';

/**
 * AgentTaskQueue — 4th column on the AgentPage workspace.
 *
 * Shows what the agent is doing or scheduled to do, plus a "+ Run task"
 * launcher and inline "Retry" buttons for failed jobs. Mirrors the
 * other column components' size/flex behavior so the workspace stays
 * symmetric.
 */
export function AgentTaskQueue({ agentSlug, agentName, accent, solidColor, className }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const pollRef = useRef(null);

  const fetchJobs = async () => {
    try {
      // Pending + running + recently failed (so user can retry).
      const result = await agentJobsApi.listJobs({
        agent: agentSlug,
        minutes: 60 * 24,
        limit: 40
      });
      const list = (result.jobs || []).filter(
        (j) => j.status === 'pending' || j.status === 'running' || j.status === 'failed'
      );
      setJobs(list);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 4000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentSlug]);

  const retry = async (job) => {
    try {
      await client.post(`/v1/agents/${agentSlug}/jobs`, {
        task_name: job.task_name,
        input_data: job.input_data || {},
        target_type: job.target_type || null,
        target_id: job.target_id || null
      });
      await fetchJobs();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    }
  };

  const running = jobs.filter((j) => j.status === 'running');
  const pending = jobs.filter((j) => j.status === 'pending');
  const failed = jobs.filter((j) => j.status === 'failed');

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden flex flex-col h-full', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Queue</span>
          {running.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-cyan-500/10 text-cyan-700">
              {running.length} running
            </span>
          )}
          {failed.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-rose-500/10 text-rose-700">
              {failed.length} failed
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchJobs}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh queue"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
        </button>
      </header>

      {/* Run task button */}
      <div className="px-3 py-2.5 border-b border-surface-tertiary bg-surface-secondary/40 flex-shrink-0">
        <button
          type="button"
          onClick={() => setComposeOpen(true)}
          className={cn(
            'w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium text-white transition-transform',
            'bg-gradient-to-br',
            accent || 'from-violet-500 via-fuchsia-500 to-orange-400',
            'hover:scale-[1.01] active:scale-[0.99]'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Run a task
        </button>
      </div>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error flex-shrink-0">
          {error}
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {loading && jobs.length === 0 ? (
          <div className="p-8 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
          </div>
        ) : jobs.length === 0 ? (
          <div className="p-8 text-center flex-1 flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-500/60 mx-auto mb-2" />
            <div className="text-body-sm text-text-secondary">
              No active tasks
            </div>
            <div className="text-small text-text-tertiary mt-1">
              Use "Run a task" to kick something off manually.
            </div>
          </div>
        ) : (
          <div>
            {running.length > 0 && (
              <Group label="Running" tone="cyan">
                {running.map((j) => (
                  <QueueRow key={j.id} job={j} />
                ))}
              </Group>
            )}
            {pending.length > 0 && (
              <Group label="Queued" tone="amber">
                {pending.map((j) => (
                  <QueueRow key={j.id} job={j} />
                ))}
              </Group>
            )}
            {failed.length > 0 && (
              <Group label="Failed — ready to retry" tone="rose">
                {failed.map((j) => (
                  <QueueRow key={j.id} job={j} onRetry={() => retry(j)} />
                ))}
              </Group>
            )}
          </div>
        )}
      </div>

      {composeOpen && (
        <RunTaskModal
          agentSlug={agentSlug}
          agentName={agentName}
          accent={accent}
          solidColor={solidColor}
          onClose={() => setComposeOpen(false)}
          onSubmitted={() => {
            setComposeOpen(false);
            fetchJobs();
          }}
        />
      )}
    </section>
  );
}

function Group({ label, tone, children }) {
  const toneClass = {
    cyan: 'text-cyan-700',
    amber: 'text-amber-700',
    rose: 'text-rose-700'
  }[tone] || 'text-text-tertiary';
  return (
    <div>
      <div className="px-5 py-2 bg-surface-secondary/40 border-b border-surface-tertiary">
        <div className={cn('text-[10px] uppercase tracking-wider font-semibold', toneClass)}>
          {label}
        </div>
      </div>
      <div className="divide-y divide-surface-tertiary">
        {children}
      </div>
    </div>
  );
}

function QueueRow({ job, onRetry }) {
  const created = new Date(job.created_at);
  return (
    <div className="px-5 py-3 flex items-start gap-3">
      <StatusDot status={job.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-medium text-text-primary">
            {humanize(job.task_name)}
          </span>
          {job.target_type && job.target_id && (
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
              {job.target_type} · {String(job.target_id).slice(0, 8)}
            </span>
          )}
          <span className="text-small text-text-tertiary ml-auto" title={created.toLocaleString()}>
            {relTime(created)}
          </span>
        </div>
        {job.status === 'failed' && job.error_message && (
          <div className="text-small text-rose-700 mt-1 line-clamp-2">
            {job.error_message}
          </div>
        )}
        <div className="flex items-center gap-2 mt-1.5">
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            {job.triggered_by || 'manual'}
          </span>
          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="ml-auto flex items-center gap-1 px-2 py-1 rounded-button text-[10px] uppercase tracking-wider font-semibold text-rose-700 bg-rose-500/10 hover:bg-rose-500/15 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    pending:   { Icon: Clock,           cls: 'text-amber-500 bg-amber-500/10' },
    running:   { Icon: Loader2,         cls: 'text-cyan-500 bg-cyan-500/10' },
    failed:    { Icon: AlertTriangle,   cls: 'text-rose-600 bg-rose-500/10' }
  }[status] || { Icon: Clock, cls: 'text-text-tertiary bg-surface-secondary' };
  const { Icon, cls } = map;
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', cls)}>
      <Icon className={cn('w-3.5 h-3.5', status === 'running' && 'animate-spin')} />
    </div>
  );
}

/* ────────────────────────────── Run Task modal ─────────────────────────── */

function RunTaskModal({ agentSlug, agentName, accent, solidColor = 'fuchsia', onClose, onSubmitted }) {
  // Tailwind needs the class strings to be statically visible. The
  // genieTeam config only ships a small set of solidColors — so we
  // resolve to a known-safe class map rather than interpolating.
  const COLOR_MAP = {
    fuchsia: { iconText: 'text-fuchsia-500', headerBg: 'from-violet-500/10 via-fuchsia-500/10 to-orange-400/10', cardBorder: 'border-fuchsia-500/40', cardBg: 'bg-fuchsia-500/5', radioBorder: 'border-fuchsia-500', radioDot: 'bg-fuchsia-500', inputFocus: 'focus:border-fuchsia-500' },
    cyan:    { iconText: 'text-cyan-500',    headerBg: 'from-cyan-500/10 to-blue-500/10',                       cardBorder: 'border-cyan-500/40',    cardBg: 'bg-cyan-500/5',    radioBorder: 'border-cyan-500',    radioDot: 'bg-cyan-500',    inputFocus: 'focus:border-cyan-500' },
    emerald: { iconText: 'text-emerald-500', headerBg: 'from-emerald-500/10 to-green-500/10',                   cardBorder: 'border-emerald-500/40', cardBg: 'bg-emerald-500/5', radioBorder: 'border-emerald-500', radioDot: 'bg-emerald-500', inputFocus: 'focus:border-emerald-500' },
    pink:    { iconText: 'text-pink-500',    headerBg: 'from-pink-500/10 to-rose-500/10',                       cardBorder: 'border-pink-500/40',    cardBg: 'bg-pink-500/5',    radioBorder: 'border-pink-500',    radioDot: 'bg-pink-500',    inputFocus: 'focus:border-pink-500' },
    amber:   { iconText: 'text-amber-500',   headerBg: 'from-amber-500/10 to-orange-500/10',                    cardBorder: 'border-amber-500/40',   cardBg: 'bg-amber-500/5',   radioBorder: 'border-amber-500',   radioDot: 'bg-amber-500',   inputFocus: 'focus:border-amber-500' },
    rose:    { iconText: 'text-rose-500',    headerBg: 'from-red-500/10 to-pink-500/10',                        cardBorder: 'border-rose-500/40',    cardBg: 'bg-rose-500/5',    radioBorder: 'border-rose-500',    radioDot: 'bg-rose-500',    inputFocus: 'focus:border-rose-500' }
  };
  const theme = COLOR_MAP[solidColor] || COLOR_MAP.fuchsia;
  const [tasks, setTasks] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [inputs, setInputs] = useState({});

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  useEffect(() => {
    let alive = true;
    agentPoliciesApi
      .getTasks(agentSlug)
      .then((res) => {
        if (!alive) return;
        const list = (res?.tasks || []).filter(taskIsManuallyRunnable);
        setTasks(list);
        if (list.length > 0) setSelected(list[0].name);
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.error?.message || err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => { alive = false; };
  }, [agentSlug]);

  const currentTask = tasks.find((t) => t.name === selected);
  const schema = currentTask ? INPUT_SCHEMAS[currentTask.name] || [] : [];
  const canSubmit = schema.every((f) => !f.required || (inputs[f.key] || '').trim().length > 0);

  const submit = async () => {
    if (!currentTask) return;
    setBusy(true); setError(null);
    try {
      const input_data = {};
      let target_type = null;
      let target_id = null;
      for (const f of schema) {
        const v = (inputs[f.key] || '').trim();
        if (!v) continue;
        input_data[f.key] = f.coerce ? f.coerce(v) : v;
        if (f.targetType) target_type = f.targetType;
        if (f.targetField) target_id = v;
      }
      await client.post(`/v1/agents/${agentSlug}/jobs`, {
        task_name: currentTask.name,
        input_data,
        target_type,
        target_id
      });
      onSubmitted?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      <div
        className="relative bg-surface-primary rounded-t-card md:rounded-card border border-surface-tertiary w-full max-w-xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(90vh, 700px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className={cn(
          'px-5 py-3 border-b border-surface-tertiary flex items-center justify-between bg-gradient-to-r',
          theme.headerBg
        )}>
          <div className="flex items-center gap-2">
            <Play className={cn('w-4 h-4', theme.iconText)} />
            <span className="text-body-sm font-medium text-text-primary">
              Run a task with {agentName || 'this agent'}
            </span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-tertiary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-surface-primary">
          {loading ? (
            <div className="p-8 flex items-center justify-center">
              <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
            </div>
          ) : tasks.length === 0 ? (
            <div className="p-8 text-center">
              <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <div className="text-body-sm text-text-secondary">
                No manually-runnable tasks available right now.
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-surface-tertiary">
                <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-2">
                  Pick a task
                </div>
                <div className="space-y-1.5">
                  {tasks.map((t) => (
                    <button
                      key={t.name}
                      type="button"
                      onClick={() => { setSelected(t.name); setInputs({}); }}
                      className={cn(
                        'w-full text-left p-3 rounded-button border transition-colors',
                        selected === t.name
                          ? `${theme.cardBorder} ${theme.cardBg}`
                          : 'border-surface-tertiary hover:border-text-tertiary bg-surface-primary'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <div className={cn(
                          'w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center',
                          selected === t.name ? theme.radioBorder : 'border-text-tertiary'
                        )}>
                          {selected === t.name && (
                            <div className={cn('w-2 h-2 rounded-full', theme.radioDot)} />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-body-sm font-medium text-text-primary">
                            {humanize(t.name)}
                          </div>
                          {t.summary && (
                            <div className="text-small text-text-tertiary mt-0.5 leading-snug">
                              {t.summary}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {currentTask && schema.length > 0 && (
                <div className="px-5 py-4 space-y-3">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
                    Inputs
                  </div>
                  {schema.map((field) => (
                    <div key={field.key} className="space-y-1">
                      <label className="text-body-sm font-medium text-text-primary">
                        {field.label}{field.required && <span className="text-rose-600"> *</span>}
                      </label>
                      <input
                        type="text"
                        value={inputs[field.key] || ''}
                        onChange={(e) => setInputs((s) => ({ ...s, [field.key]: e.target.value }))}
                        placeholder={field.placeholder}
                        className={cn(
                          'w-full px-3 py-2 rounded-button border border-surface-tertiary focus:outline-none text-body-sm bg-surface-secondary',
                          theme.inputFocus
                        )}
                      />
                      {field.hint && (
                        <div className="text-small text-text-tertiary">{field.hint}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {currentTask && schema.length === 0 && (
                <div className="px-5 py-4 text-body-sm text-text-secondary">
                  This task takes no manual inputs — Alex will figure out what to look at.
                </div>
              )}
            </>
          )}

          {error && (
            <div className="mx-5 mb-3 px-3 py-2 rounded-button bg-error/8 border border-error/20 text-small text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {error}
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-surface-tertiary bg-surface-secondary/40 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-button text-body-sm text-text-secondary hover:text-text-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!currentTask || !canSubmit || busy}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2 rounded-button text-body-sm font-medium text-white transition-transform',
              'bg-gradient-to-br',
              accent || 'from-violet-500 via-fuchsia-500 to-orange-400',
              'hover:scale-[1.02] disabled:opacity-40 disabled:hover:scale-100'
            )}
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Run task
          </button>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/**
 * Which tasks make sense for a user to run by hand. Reactive-only
 * tasks (and tasks that need IDs the user wouldn't have at their
 * fingertips, like an Atlas email UUID) are filtered out.
 */
function taskIsManuallyRunnable(task) {
  const denied = new Set([
    'notify_broker_on_status_change', // reactive on load status change
    'finance_watch',                  // scheduled poller
    'finance_audit',                  // scheduled poller (Cece)
    // Reactive: triggered by Atlas after it processes an inbound email.
    // The user wouldn't have an emailId/opportunityId handy here.
    'scan_email_for_leads'
  ]);
  if (denied.has(task.name)) return false;
  return true;
}

/**
 * Per-task input schema for the Run modal. Adding a new task = adding
 * its key/label/placeholder here.
 *
 * `targetType` + `targetField` tell the modal which value should be
 * attached to the agent_job as its target — that lets the queue row
 * render a "load · abcd1234" chip.
 */
const INPUT_SCHEMAS = {
  check_load_completeness: [
    {
      key: 'loadId',
      label: 'Load',
      placeholder: 'Paste a load ID',
      hint: 'Use the load\'s UUID. (You can copy it from the load detail page URL.)',
      required: true,
      targetType: 'load',
      targetField: true
    },
    {
      key: 'forceRescan',
      label: 'Force re-scan rate-con?',
      placeholder: 'true / false (default false)',
      hint: 'Set to "true" to bypass Alex\'s rate-con extraction cache.',
      required: false,
      coerce: (v) => v.toLowerCase() === 'true'
    }
  ],
  apply_load_fixes: [
    {
      key: 'load_id',
      label: 'Load',
      placeholder: 'Paste a load ID',
      required: true,
      targetType: 'load',
      targetField: true
    }
  ],
  scan_email_for_leads: [
    {
      key: 'emailId',
      label: 'Atlas email',
      placeholder: 'Paste an Atlas email ID (optional)',
      hint: 'Leave blank to use opportunityId instead.',
      required: false
    },
    {
      key: 'opportunityId',
      label: 'Existing opportunity',
      placeholder: 'Paste an Atlas opportunity ID',
      hint: 'Skip Atlas processing and just attribute an existing lead to Alex.',
      required: false,
      targetType: 'atlas_opportunity',
      targetField: true
    }
  ],
  categorize_expense: [
    { key: 'expenseId', label: 'Expense', placeholder: 'Paste an expense ID', required: true, targetType: 'expense', targetField: true }
  ],
  review_pending_expense: [
    { key: 'expenseId', label: 'Pending expense', placeholder: 'Paste an expense ID', required: true, targetType: 'expense', targetField: true }
  ],
  generate_invoice_for_load: [
    { key: 'load_id', label: 'Load', placeholder: 'Paste a load ID', required: true, targetType: 'load', targetField: true }
  ]
};

/* ────────────────────────────── Helpers ────────────────────────────────── */

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function relTime(date) {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default AgentTaskQueue;
