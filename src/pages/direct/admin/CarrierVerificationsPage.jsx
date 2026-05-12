import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, Loader2, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react';
import verificationApi from '../../../api/networkVerification.api';

/**
 * Super-admin queue for carrier-side onboarding submissions.
 * Lists rows in the new network_carrier_verifications table — separate
 * from the older `network_carrier_profiles` admin page.
 */
const TABS = [
  { value: 'submitted', label: 'Pending review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'all', label: 'All' }
];

export default function CarrierVerificationsPage() {
  const { orgSlug } = useParams();
  const [tab, setTab] = useState('submitted');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await verificationApi.adminListVerifications(tab);
      setRows(r || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [tab]);

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Carrier verifications</h1>
          <p className="text-body-sm text-text-secondary">Onboarding submissions waiting on a human review.</p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 border-b border-border-subtle overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setTab(t.value)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === t.value
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <ShieldCheck className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">Nothing in this queue.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id}>
              <Link to={`/o/${orgSlug}/direct/admin/carrier-verifications/${r.organization_id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-card border border-border-subtle bg-surface-primary hover:border-border transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-body font-medium text-text-primary truncate">
                      {r.organization?.name || r.organization?.slug || r.organization_id.slice(0, 8)}
                    </p>
                    <StatusPill status={r.status} />
                    {r.name_match_decision === 'flagged' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        <AlertCircle className="w-3 h-3" /> NAME MISMATCH
                      </span>
                    )}
                  </div>
                  <p className="text-small text-text-tertiary">
                    MC {r.mc_number || '—'} · DOT {r.dot_number || '—'}
                    {r.linq_legal_name ? ` · ${r.linq_legal_name}` : ''}
                  </p>
                  <p className="text-small text-text-secondary mt-1">
                    Submitted {r.submitted_at ? new Date(r.submitted_at).toLocaleString() : '—'}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = ({
    submitted: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400',
    not_started: 'bg-gray-500/15 text-gray-600',
    mc_pending: 'bg-blue-500/15 text-blue-700',
    otp_pending: 'bg-blue-500/15 text-blue-700',
    identity_pending: 'bg-violet-500/15 text-violet-700',
    profile_pending: 'bg-violet-500/15 text-violet-700'
  })[status] || 'bg-gray-500/15 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}
