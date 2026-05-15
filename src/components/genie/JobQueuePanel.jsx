import { useEffect, useState, useRef } from 'react';
import {
  Loader2,
  Check,
  AlertTriangle,
  Clock,
  Activity,
  RefreshCw
} from 'lucide-react';
import agentJobsApi from '../../api/agentJobs.api';
import { cn } from '../../lib/utils';

/**
 * JobQueuePanel — live view of an agent's job queue.
 *
 * Shows pending / running / recently-finished jobs for a single agent.
 * Polls /v1/agents/jobs every 4s while the panel is mounted.
 *
 * Props:
 *   - agentSlug (required) : 'alex' | 'ava' | ...
 *   - lookbackMinutes (default 120) : how far back to fetch completed/failed
 *   - className : optional wrapper classes
 */
export function JobQueuePanel({ agentSlug, lookbackMinutes = 120, className }) {
  const [jobs, setJobs] = useState([]);
  const [counts, setCounts] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchJobs = async () => {
    try {
      const result = await agentJobsApi.listJobs({
        agent: agentSlug,
        minutes: lookbackMinutes,
        limit: 30
      });
      setJobs(result.jobs || []);
      setCounts(result.counts || {});
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
  }, [agentSlug, lookbackMinutes]);

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Job queue</span>
          <CountChips counts={counts} />
        </div>
        <button
          type="button"
          onClick={fetchJobs}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh queue"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-8 text-center text-body-sm text-text-tertiary">
          No recent jobs. Triggers run when you click "Check a load" or when a new load is created (if the org has enabled auto-check).
        </div>
      ) : (
        <div className="divide-y divide-surface-tertiary">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} />
          ))}
        </div>
      )}
    </section>
  );
}

function CountChips({ counts }) {
  const entries = [
    { key: 'running',   label: 'Running',   color: 'text-cyan-600 bg-cyan-500/10' },
    { key: 'pending',   label: 'Pending',   color: 'text-amber-600 bg-amber-500/10' },
    { key: 'completed', label: 'Done',      color: 'text-emerald-600 bg-emerald-500/10' },
    { key: 'failed',    label: 'Failed',    color: 'text-rose-600 bg-rose-500/10' }
  ];
  return (
    <div className="flex items-center gap-1.5 ml-2">
      {entries.map((e) =>
        counts[e.key] ? (
          <span
            key={e.key}
            className={cn('text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded-full', e.color)}
          >
            {counts[e.key]} {e.label}
          </span>
        ) : null
      )}
    </div>
  );
}

function JobRow({ job }) {
  const created = new Date(job.created_at);
  const completed = job.completed_at ? new Date(job.completed_at) : null;
  const duration = completed && job.started_at
    ? `${Math.max(1, Math.round((completed - new Date(job.started_at)) / 1000))}s`
    : null;

  return (
    <div className="px-5 py-3 flex items-start gap-3 hover:bg-surface-secondary/30 transition-colors">
      <StatusIcon status={job.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-medium text-text-primary">
            {humanizeTaskName(job.task_name)}
          </span>
          {job.target_id && (
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
              {job.target_type} · {job.target_id.slice(0, 8)}
            </span>
          )}
          <span className="text-small text-text-tertiary ml-auto" title={created.toLocaleString()}>
            {formatRelative(created)}
            {duration && <> · {duration}</>}
          </span>
        </div>

        {job.status === 'failed' && job.error_message && (
          <div className="text-small text-error mt-1 line-clamp-2">{job.error_message}</div>
        )}

        {job.status === 'completed' && (job.output_data?.summary || job.output_data?.output?.summary) && (
          <div className="text-small text-text-secondary mt-1 line-clamp-2">
            {job.output_data?.summary || job.output_data?.output?.summary}
          </div>
        )}

        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mt-1">
          Triggered by {job.triggered_by || 'manual'}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ status }) {
  const map = {
    pending:   { Icon: Clock,    cls: 'text-amber-500 bg-amber-500/10' },
    running:   { Icon: Loader2,  cls: 'text-cyan-500 bg-cyan-500/10 animate-spin' },
    completed: { Icon: Check,    cls: 'text-emerald-600 bg-emerald-500/10' },
    failed:    { Icon: AlertTriangle, cls: 'text-rose-600 bg-rose-500/10' },
    cancelled: { Icon: AlertTriangle, cls: 'text-text-tertiary bg-surface-secondary' }
  }[status] || { Icon: Clock, cls: 'text-text-tertiary bg-surface-secondary' };

  const { Icon, cls } = map;
  // Loader2 carries the animate-spin via cls already; everything else is static.
  const isSpinner = status === 'running';
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', cls)}>
      <Icon className={cn('w-3.5 h-3.5', isSpinner && 'animate-spin')} />
    </div>
  );
}

function humanizeTaskName(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function formatRelative(date) {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default JobQueuePanel;
