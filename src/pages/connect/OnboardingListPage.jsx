import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, ClipboardList, ChevronRight } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const STATUS_LABEL = {
  started: 'Started', documents_requested: 'Documents requested',
  documents_submitted: 'Documents submitted', under_review: 'Under review',
  verification_pending: 'Verification pending', approved: 'Approved',
  hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn', archived: 'Archived'
};
const tone = (s) =>
  s === 'hired' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : s === 'rejected' ? 'text-red-600 bg-red-50 border-red-200'
  : s === 'approved' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : 'text-amber-600 bg-amber-50 border-amber-200';

export default function OnboardingListPage() {
  const { orgSlug } = useParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    connectApi.getOnboardings()
      .then((r) => setRows(r.data?.onboardings || []))
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, []);

  const active = rows.filter((r) => !['hired', 'rejected', 'withdrawn', 'archived'].includes(r.status));
  const closed = rows.filter((r) => ['hired', 'rejected', 'withdrawn', 'archived'].includes(r.status));

  const Row = ({ r }) => (
    <Link
      to={`/o/${orgSlug}/connect/onboarding/${r.id}`}
      className="p-4 flex items-center gap-3 hover:bg-surface-secondary/50 transition-colors"
    >
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium text-text-primary truncate">{r.driver?.name || 'Driver'}</div>
        <div className="text-small text-text-tertiary">
          Updated {r.updated_at ? new Date(r.updated_at).toLocaleDateString() : '—'}
        </div>
      </div>
      <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border', tone(r.status))}>
        {STATUS_LABEL[r.status] || r.status}
      </span>
      <ChevronRight className="w-4 h-4 text-text-tertiary" />
    </Link>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <ClipboardList className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Onboarding</h1>
          <p className="text-body-sm text-text-secondary">
            Every driver you're onboarding — request documents, review, communicate, and hire.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-card border border-surface-tertiary p-10 text-center text-body-sm text-text-tertiary">
          No onboardings yet. They start automatically when you connect with a driver.
        </div>
      ) : (
        <>
          <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
            <div className="px-5 py-3 border-b border-surface-tertiary text-body-sm font-medium text-text-primary">
              In progress ({active.length})
            </div>
            {active.length === 0 ? (
              <div className="p-6 text-center text-body-sm text-text-tertiary">Nothing in progress.</div>
            ) : (
              <div className="divide-y divide-surface-tertiary">
                {active.map((r) => <Row key={r.id} r={r} />)}
              </div>
            )}
          </div>
          {closed.length > 0 && (
            <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
              <div className="px-5 py-3 border-b border-surface-tertiary text-body-sm font-medium text-text-primary">
                Closed ({closed.length})
              </div>
              <div className="divide-y divide-surface-tertiary">
                {closed.map((r) => <Row key={r.id} r={r} />)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
