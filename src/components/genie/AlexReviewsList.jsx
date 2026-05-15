import { useEffect, useState, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ClipboardCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  ArrowRight,
  Loader2,
  Sparkles
} from 'lucide-react';
import client from '../../api/client';
import { cn } from '../../lib/utils';

/**
 * AlexReviewsList — timeline of every load Alex has reviewed.
 *
 * One row per LOAD (deduplicated to the most recent check). Sorted so
 * loads that need user attention (have ready_to_apply or conflicts)
 * surface first, then clean ones.
 *
 * Click a row → goes to that load's NextMS detail page where the full
 * AlexReviewPanel renders.
 *
 * Polls every 6s so reactive triggers (new loads, new rate-cons) show
 * up without a manual refresh.
 */
export function AlexReviewsList({ className }) {
  const { orgSlug } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchReviews = async () => {
    try {
      const res = await client.get('/v1/agents/alex/recent-reviews?limit=20');
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

  const needsAttention = reviews.filter((r) => r.ready_count + r.conflict_count > 0);
  const clean = reviews.filter((r) => r.ready_count + r.conflict_count === 0);

  return (
    <section className={cn('bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden', className)}>
      <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Recent reviews</span>
          {needsAttention.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-amber-500/10 text-amber-700 border border-amber-500/30">
              {needsAttention.length} need{needsAttention.length === 1 ? 's' : ''} attention
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={fetchReviews}
          className="p-1.5 rounded-chip text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
          aria-label="Refresh"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </header>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error">{error}</div>
      )}

      {loading ? (
        <div className="p-6 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <div className="p-8 text-center">
          <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <div className="text-body-sm text-text-secondary">
            Alex hasn't reviewed any loads yet.
          </div>
          <div className="text-small text-text-tertiary mt-1">
            New loads + rate-con uploads trigger reactive reviews when his policy is on.
          </div>
        </div>
      ) : (
        <div>
          {needsAttention.length > 0 && (
            <SectionHeader label="Needs attention" tone="amber" count={needsAttention.length} />
          )}
          <div className="divide-y divide-surface-tertiary">
            {needsAttention.map((r) => (
              <ReviewRow key={r.job_id} review={r} orgSlug={orgSlug} />
            ))}
          </div>

          {clean.length > 0 && (
            <SectionHeader label="Clean" tone="emerald" count={clean.length} />
          )}
          <div className="divide-y divide-surface-tertiary">
            {clean.map((r) => (
              <ReviewRow key={r.job_id} review={r} orgSlug={orgSlug} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function SectionHeader({ label, tone, count }) {
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

function ReviewRow({ review, orgSlug }) {
  const ld = review.load || {};
  const ref = ld.reference_number || review.load_id?.slice(0, 8) || 'unknown';
  const needsAttn = review.ready_count + review.conflict_count > 0;
  const route =
    [ld.shipper_city, ld.shipper_state].filter(Boolean).join(', ') &&
    [ld.consignee_city, ld.consignee_state].filter(Boolean).join(', ')
      ? `${[ld.shipper_city, ld.shipper_state].filter(Boolean).join(', ')} → ${[ld.consignee_city, ld.consignee_state].filter(Boolean).join(', ')}`
      : null;

  return (
    <Link
      to={`/o/${orgSlug}/loads/${review.load_id}`}
      className="group flex items-start gap-3 px-5 py-3 hover:bg-surface-secondary/40 transition-colors"
    >
      <div
        className={cn(
          'w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0',
          needsAttn ? 'bg-amber-500/10' : 'bg-emerald-500/10'
        )}
      >
        {needsAttn ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
        ) : (
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-semibold text-text-primary">Load {ref}</span>
          {route && <span className="text-small text-text-tertiary">{route}</span>}
          <span className="text-small text-text-tertiary ml-auto" title={new Date(review.completed_at).toLocaleString()}>
            {formatRelative(new Date(review.completed_at))}
          </span>
        </div>

        {review.summary && (
          <div className="text-body-sm text-text-secondary mt-0.5 leading-snug line-clamp-2">
            {review.summary}
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5 text-small">
          {review.ready_count > 0 && (
            <Stat icon={Sparkles} tone="emerald" value={review.ready_count} label="ready" />
          )}
          {review.conflict_count > 0 && (
            <Stat icon={AlertTriangle} tone="amber" value={review.conflict_count} label="conflict" />
          )}
          {!review.has_rate_con && (
            <Stat icon={Lock} tone="slate" value="—" label="no rate-con" />
          )}
          {review.counts?.verified > 0 && (
            <Stat icon={CheckCircle2} tone="slate" value={review.counts.verified} label="verified" />
          )}
          <span className="ml-auto text-[10px] uppercase tracking-wider text-text-tertiary">
            {review.triggered_by}
          </span>
        </div>
      </div>

      <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 group-hover:text-fuchsia-500 transition-all mt-1 flex-shrink-0" />
    </Link>
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

export default AlexReviewsList;
