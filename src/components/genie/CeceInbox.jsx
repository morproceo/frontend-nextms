import { useEffect, useRef, useState } from 'react';
import {
  Inbox,
  RefreshCw,
  Loader2,
  Sparkles,
  Receipt,
  FileText,
  AlertTriangle,
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Tag,
  ArrowRight
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import agentJobsApi from '../../api/agentJobs.api';
import { cn } from '../../lib/utils';

/**
 * CeceInbox — Cece's recent finance actions.
 *
 * Cece doesn't have an "approve / discard" loop today (her tasks
 * auto-execute or surface as advisory), so this inbox is read-mostly:
 * each row shows what she did + a deep link to the underlying entity
 * (expense, invoice, etc.) so the user can verify or override.
 *
 * Layout mirrors AlexInbox so the agent surface feels cohesive.
 */
const PAGE_SIZE = 12;

export function CeceInbox({ className }) {
  const { orgSlug } = useParams();
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
        agent: 'cece',
        minutes: 60 * 24 * 14,
        limit: 80
      });
      setJobs((result.jobs || []).filter((j) => j.status === 'completed' || j.status === 'failed'));
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 8000);
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setDisplayLimit((n) => Math.min(n + PAGE_SIZE, 80));
        }
      },
      { root: scrollRef.current, threshold: 0.1 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [jobs.length, displayLimit]);

  const watchAlerts = jobs.filter(
    (j) => j.task_name === 'finance_watch' && (j.output_data?.alerts?.length || 0) > 0
  );
  const recent = jobs.filter((j) => !watchAlerts.includes(j));
  const recentShown = recent.slice(0, Math.max(0, displayLimit - watchAlerts.length));
  const totalShown = watchAlerts.length + recentShown.length;
  const hasMore = totalShown < watchAlerts.length + recent.length;

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden flex flex-col h-full', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <Inbox className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Cece's inbox</span>
          {watchAlerts.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
              {watchAlerts.length} watch alert{watchAlerts.length === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchJobs}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh inbox"
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
        <div className="p-10 text-center flex-1 flex flex-col justify-center">
          <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <div className="text-body-sm text-text-secondary">
            Inbox is empty — Cece hasn't run yet.
          </div>
          <div className="text-small text-text-tertiary mt-1">
            New expenses, invoices, and the daily watch trigger her tasks.
          </div>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {watchAlerts.length > 0 && (
            <>
              <Subhead label="Watch alerts" count={watchAlerts.length} tone="amber" />
              <div className="divide-y divide-surface-tertiary">
                {watchAlerts.map((j) => (
                  <CeceRow
                    key={j.id}
                    job={j}
                    orgSlug={orgSlug}
                    expanded={expandedId === j.id}
                    onToggle={() => setExpandedId((id) => (id === j.id ? null : j.id))}
                  />
                ))}
              </div>
            </>
          )}

          {recentShown.length > 0 && (
            <>
              <Subhead label="Recent activity" count={recent.length} tone="emerald" />
              <div className="divide-y divide-surface-tertiary">
                {recentShown.map((j) => (
                  <CeceRow
                    key={j.id}
                    job={j}
                    orgSlug={orgSlug}
                    expanded={expandedId === j.id}
                    onToggle={() => setExpandedId((id) => (id === j.id ? null : j.id))}
                  />
                ))}
              </div>
            </>
          )}
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

const TASK_META = {
  categorize_expense: {
    Icon: Tag,
    label: 'Categorized expense',
    tone: 'emerald'
  },
  review_pending_expense: {
    Icon: Receipt,
    label: 'Reviewed expense',
    tone: 'amber'
  },
  generate_invoice_for_load: {
    Icon: FileText,
    label: 'Generated invoice',
    tone: 'emerald'
  },
  finance_watch: {
    Icon: TrendingUp,
    label: 'Finance watch',
    tone: 'amber'
  },
  audit_finances: {
    Icon: Sparkles,
    label: 'Audit',
    tone: 'emerald'
  }
};

function CeceRow({ job, orgSlug, expanded, onToggle }) {
  const meta = TASK_META[job.task_name] || { Icon: Sparkles, label: humanize(job.task_name), tone: 'slate' };
  const out = job.output_data || {};
  const summary = out.summary || out.output?.summary || '';
  const isAlert = job.task_name === 'finance_watch' && (out.alerts?.length || 0) > 0;

  return (
    <div className={cn(expanded && 'bg-surface-secondary/30')}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-3 hover:bg-surface-secondary/40 transition-colors"
      >
        <div className="flex items-start gap-3">
          <div className={cn(
            'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
            isAlert ? 'bg-amber-500/10' : `bg-emerald-500/10`
          )}>
            <meta.Icon className={cn(
              'w-3.5 h-3.5',
              isAlert ? 'text-amber-600' : 'text-emerald-600'
            )} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className="text-body-sm font-semibold text-text-primary">{meta.label}</span>
              {job.target_type && job.target_id && (
                <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
                  {job.target_type} · {String(job.target_id).slice(0, 8)}
                </span>
              )}
              <span
                className="text-small text-text-tertiary ml-auto"
                title={new Date(job.completed_at || job.created_at).toLocaleString()}
              >
                {relTime(job.completed_at || job.created_at)}
              </span>
            </div>

            {summary && (
              <div className="text-body-sm text-text-secondary mt-0.5 leading-snug line-clamp-2">
                {summary}
              </div>
            )}

            <div className="flex items-center gap-3 mt-1.5 text-small text-text-tertiary">
              <span className="text-[10px] uppercase tracking-wider">
                {job.triggered_by || 'manual'}
              </span>
              {job.status === 'failed' && (
                <span className="inline-flex items-center gap-1 text-rose-600">
                  <AlertTriangle className="w-3 h-3" />
                  failed
                </span>
              )}
              <span className="ml-auto">
                {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </span>
            </div>
          </div>
        </div>
      </button>

      {expanded && (
        <CeceDetail job={job} orgSlug={orgSlug} />
      )}
    </div>
  );
}

function CeceDetail({ job, orgSlug }) {
  const out = job.output_data || {};
  const data = out.output || out;

  const deepLink = buildDeepLink(orgSlug, job);

  return (
    <div className="border-t border-surface-tertiary bg-surface-primary px-5 py-4 space-y-3">
      {/* Task-specific rendering */}
      {job.task_name === 'categorize_expense' && data?.category && (
        <KVRow label="Category" value={`${data.category}${data.confidence ? ` · ${data.confidence} confidence` : ''}`} />
      )}
      {job.task_name === 'categorize_expense' && data?.reasoning && (
        <KVRow label="Reasoning" value={data.reasoning} />
      )}
      {job.task_name === 'generate_invoice_for_load' && data?.invoice_number && (
        <KVRow label="Invoice" value={data.invoice_number} />
      )}
      {job.task_name === 'generate_invoice_for_load' && data?.total_cents != null && (
        <KVRow label="Total" value={`$${(data.total_cents / 100).toLocaleString()}`} />
      )}
      {job.task_name === 'finance_watch' && Array.isArray(data?.alerts) && data.alerts.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-amber-700 font-semibold">Alerts</div>
          {data.alerts.map((a, i) => (
            <div key={i} className="text-body-sm text-text-secondary flex items-start gap-2">
              <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 flex-shrink-0" />
              <span>{a.message || a.summary || JSON.stringify(a)}</span>
            </div>
          ))}
        </div>
      )}
      {job.task_name === 'review_pending_expense' && data?.recommendation && (
        <KVRow label="Recommendation" value={data.recommendation} />
      )}

      {/* Fallback: pretty-print the output when no special renderer exists */}
      {!hasSpecialRenderer(job.task_name) && (
        <pre className="text-small text-text-secondary bg-surface-secondary border border-surface-tertiary rounded-button px-3 py-2 max-h-48 overflow-auto whitespace-pre-wrap font-mono">
{JSON.stringify(data, null, 2)}
        </pre>
      )}

      {/* Error */}
      {job.status === 'failed' && job.error_message && (
        <div className="text-small text-error flex items-start gap-1">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          {job.error_message}
        </div>
      )}

      {/* Deep link to the entity */}
      {deepLink && (
        <Link
          to={deepLink}
          className="inline-flex items-center gap-1.5 text-body-sm text-fuchsia-600 hover:text-fuchsia-700"
        >
          Open {job.target_type}
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

function KVRow({ label, value }) {
  return (
    <div className="flex items-baseline gap-3">
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary w-24 flex-shrink-0">
        {label}
      </div>
      <div className="text-body-sm text-text-primary flex-1 min-w-0 break-words">
        {value}
      </div>
    </div>
  );
}

function hasSpecialRenderer(taskName) {
  return ['categorize_expense', 'generate_invoice_for_load', 'finance_watch', 'review_pending_expense'].includes(taskName);
}

function buildDeepLink(orgSlug, job) {
  if (!orgSlug || !job?.target_id) return null;
  const type = job.target_type;
  if (type === 'expense' || type === 'fuel_transaction') return `/o/${orgSlug}/expenses/${job.target_id}`;
  if (type === 'invoice') return `/o/${orgSlug}/invoices/${job.target_id}`;
  if (type === 'load') return `/o/${orgSlug}/loads/${job.target_id}`;
  return null;
}

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function relTime(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default CeceInbox;
