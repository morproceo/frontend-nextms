import { useEffect, useRef, useState } from 'react';
import {
  Activity,
  RefreshCw,
  Loader2,
  Check,
  Clock,
  AlertTriangle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import agentJobsApi from '../../api/agentJobs.api';
import { cn } from '../../lib/utils';

/**
 * AgentActivityFeed — full timeline of agent_jobs grouped by day.
 *
 * Replaces both the old "Worker activity" details + the basic recent-
 * actions list. Each row expands to show input/output JSON and a tidy
 * 5-stage pipeline trace (GATHER → REASON → GATE → ACT → AUDIT) so the
 * user can see WHY the agent did what it did.
 *
 * Polls /v1/agents/jobs every 6s.
 */
const PAGE_SIZE = 15;

export function AgentActivityFeed({ agentSlug, className }) {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedId, setExpandedId] = useState(null);
  const [displayLimit, setDisplayLimit] = useState(PAGE_SIZE);
  const pollRef = useRef(null);
  const scrollRef = useRef(null);
  const sentinelRef = useRef(null);

  const fetchJobs = async () => {
    try {
      const result = await agentJobsApi.listJobs({
        agent: agentSlug,
        minutes: 60 * 24 * 14,
        limit: 120
      });
      setJobs(result.jobs || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 6000);
    return () => clearInterval(pollRef.current);
  }, [agentSlug]);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((n) => Math.min(n + PAGE_SIZE, 120));
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [jobs.length, displayLimit]);

  // Cap the rendered job set to displayLimit, then re-group by day.
  const shownJobs = jobs.slice(0, displayLimit);
  const groups = groupByDay(shownJobs);
  const hasMore = jobs.length > shownJobs.length;

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden flex flex-col h-full', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Activity</span>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            last 14 days
          </span>
        </div>
        <button
          type="button"
          onClick={fetchJobs}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh activity"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error flex-shrink-0">
          {error}
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center flex-1">
          <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="p-8 text-center text-body-sm text-text-tertiary flex-1 flex items-center justify-center">
          No activity in the last 14 days.
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {groups.map((g) => (
            <div key={g.label}>
              <div className="px-5 py-2 bg-surface-secondary/40 border-b border-surface-tertiary">
                <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
                  {g.label} · {g.jobs.length}
                </div>
              </div>
              <div className="divide-y divide-surface-tertiary">
                {g.jobs.map((j) => (
                  <ActivityRow
                    key={j.id}
                    job={j}
                    expanded={expandedId === j.id}
                    onToggle={() => setExpandedId((id) => (id === j.id ? null : j.id))}
                  />
                ))}
              </div>
            </div>
          ))}
          {hasMore && (
            <div ref={sentinelRef} className="px-5 py-3 text-center text-small text-text-tertiary">
              <Loader2 className="w-4 h-4 animate-spin inline-block" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ActivityRow({ job, expanded, onToggle }) {
  const out = job.output_data || {};
  const summary = out.summary || out.output?.summary || '';
  const created = new Date(job.created_at);
  const completed = job.completed_at ? new Date(job.completed_at) : null;
  const duration = completed && job.started_at
    ? `${Math.max(1, Math.round((completed - new Date(job.started_at)) / 1000))}s`
    : null;

  return (
    <div className={cn(expanded && 'bg-surface-secondary/30')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-3 hover:bg-surface-secondary/40 transition-colors"
      >
        <div className="flex items-start gap-3">
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
              <span
                className="text-small text-text-tertiary ml-auto"
                title={created.toLocaleString()}
              >
                {relTime(created)}
                {duration && <> · {duration}</>}
              </span>
            </div>

            {summary && (
              <div className="text-small text-text-secondary mt-0.5 line-clamp-2">
                {summary}
              </div>
            )}

            {job.status === 'failed' && job.error_message && (
              <div className="text-small text-error mt-1 line-clamp-1">
                {job.error_message}
              </div>
            )}

            <div className="flex items-center gap-3 mt-1 text-[10px] uppercase tracking-wider text-text-tertiary">
              <span>{job.triggered_by || 'manual'}</span>
              <span className="ml-auto">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && <PipelineTrace job={job} />}
    </div>
  );
}

const STAGES = [
  { key: 'gather', label: 'Gather' },
  { key: 'reason', label: 'Reason' },
  { key: 'gate', label: 'Gate' },
  { key: 'act', label: 'Act' },
  { key: 'audit', label: 'Audit' }
];

function PipelineTrace({ job }) {
  // The 5-stage pipeline is reflected in the job lifecycle:
  //   gather: input_data present
  //   reason: started_at present
  //   gate:   completed (any decision was reached)
  //   act:    output_data has result and the agent actually wrote something
  //   audit:  action_id present (or output written)
  const stagesDone = {
    gather: !!job.input_data,
    reason: !!job.started_at,
    gate: job.status !== 'pending' && job.status !== 'running',
    act: job.status === 'completed' && !!job.output_data,
    audit: job.status === 'completed' && (!!job.action_id || !!job.output_data)
  };

  return (
    <div className="border-t border-surface-tertiary bg-surface-primary px-5 py-4 space-y-4">
      {/* Pipeline strip */}
      <div className="flex items-center gap-1">
        {STAGES.map((stage, i) => {
          const done = stagesDone[stage.key];
          return (
            <div key={stage.key} className="flex items-center flex-1">
              <div
                className={cn(
                  'flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium',
                  done
                    ? job.status === 'failed' && i === STAGES.length - 1
                      ? 'bg-rose-500/10 text-rose-600'
                      : 'bg-emerald-500/10 text-emerald-600'
                    : 'bg-surface-secondary text-text-tertiary'
                )}
              >
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  done ? 'bg-current' : 'bg-text-tertiary/40'
                )} />
                {stage.label}
              </div>
              {i < STAGES.length - 1 && (
                <div className={cn(
                  'h-px flex-1 mx-1',
                  done && stagesDone[STAGES[i + 1].key] ? 'bg-emerald-500/40' : 'bg-surface-tertiary'
                )} />
              )}
            </div>
          );
        })}
      </div>

      {/* Input */}
      {job.input_data && Object.keys(job.input_data || {}).length > 0 && (
        <Block label="Input">
          <pre className="text-small text-text-secondary whitespace-pre-wrap font-mono max-h-32 overflow-auto">
{JSON.stringify(job.input_data, null, 2)}
          </pre>
        </Block>
      )}

      {/* Output */}
      {job.output_data && (
        <Block label="Output">
          <pre className="text-small text-text-secondary whitespace-pre-wrap font-mono max-h-48 overflow-auto">
{JSON.stringify(job.output_data, null, 2)}
          </pre>
        </Block>
      )}
    </div>
  );
}

function Block({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1">
        {label}
      </div>
      <div className="bg-surface-secondary border border-surface-tertiary rounded-button px-3 py-2">
        {children}
      </div>
    </div>
  );
}

function StatusDot({ status }) {
  const map = {
    pending:   { Icon: Clock,    cls: 'text-amber-500 bg-amber-500/10' },
    running:   { Icon: Loader2,  cls: 'text-cyan-500 bg-cyan-500/10' },
    completed: { Icon: Check,    cls: 'text-emerald-600 bg-emerald-500/10' },
    failed:    { Icon: AlertTriangle, cls: 'text-rose-600 bg-rose-500/10' },
    cancelled: { Icon: AlertTriangle, cls: 'text-text-tertiary bg-surface-secondary' }
  }[status] || { Icon: Clock, cls: 'text-text-tertiary bg-surface-secondary' };

  const { Icon, cls } = map;
  return (
    <div className={cn('w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0', cls)}>
      <Icon className={cn('w-3.5 h-3.5', status === 'running' && 'animate-spin')} />
    </div>
  );
}

function groupByDay(jobs) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const buckets = { Today: [], Yesterday: [], Earlier: [] };
  for (const j of jobs) {
    const d = new Date(j.completed_at || j.created_at);
    if (d >= today) buckets.Today.push(j);
    else if (d >= yesterday) buckets.Yesterday.push(j);
    else buckets.Earlier.push(j);
  }
  return Object.entries(buckets)
    .filter(([, list]) => list.length > 0)
    .map(([label, list]) => ({ label, jobs: list }));
}

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function relTime(date) {
  const ms = Date.now() - date.getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default AgentActivityFeed;
