import { useEffect, useState } from 'react';
import { ShieldAlert, Loader2, CheckCircle2, ArrowLeft, Building2 } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import networkApi from '../../../api/network.api';

const TABS = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Reviewing' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' }
];

export default function DisputesPage() {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('open');
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await networkApi.listAdminDisputes(status);
      setDisputes(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, [status]);

  const onResolve = async (id, action) => {
    const resolution = window.prompt(`Resolution note for ${action}:`);
    if (resolution === null) return;
    setActing(id);
    try { await networkApi.resolveDispute(id, { resolution, action }); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
          <ShieldAlert className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Disputes</h1>
          <p className="text-body-sm text-text-secondary">Open disputes across all loads. Resolve to release or refund payment.</p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 border-b border-border-subtle overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              status === t.value ? 'border-accent text-accent' : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4"><p className="text-body-sm">{error}</p></div>}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : disputes.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <ShieldAlert className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No disputes in this state.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {disputes.map((d) => (
            <li key={d.id} className="rounded-card border border-border-subtle bg-surface-primary p-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <Building2 className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">
                      {d.networkLoad?.reference_number || d.network_load_id?.slice(0, 8)} · {d.reason}
                    </p>
                    <p className="text-small text-text-tertiary truncate">
                      Opened by {d.openedByOrganization?.name} · {new Date(d.created_at).toLocaleDateString()}
                    </p>
                    {d.description && <p className="text-small text-text-secondary mt-1">{d.description}</p>}
                    {d.resolution && <p className="text-small text-text-tertiary mt-1">Resolution: {d.resolution}</p>}
                  </div>
                </div>
                {d.status === 'open' && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => onResolve(d.id, 'refund')} disabled={acting === d.id}
                      className="px-3 py-1 rounded-button text-small font-medium border border-error/40 text-error hover:bg-error-muted">
                      Refund
                    </button>
                    <button onClick={() => onResolve(d.id, 'release')} disabled={acting === d.id}
                      className="px-3 py-1 rounded-button text-small font-medium bg-emerald-500 text-white hover:bg-emerald-600">
                      <CheckCircle2 className="w-3 h-3 inline mr-1" /> Release
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
