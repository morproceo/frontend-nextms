import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ShieldCheck, Loader2, ChevronRight, Building2 } from 'lucide-react';
import networkApi from '../../../api/network.api';

const TABS = [
  { value: 'pending', label: 'Pending review' },
  { value: 'public', label: 'Approved' },
  { value: 'private', label: 'Private / rejected' }
];

export default function VerificationsPage() {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('pending');
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async (s = status) => {
    setLoading(true);
    setError(null);
    try {
      const list = await networkApi.listAdminProfiles(s);
      setProfiles(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(status); /* eslint-disable-line */ }, [status]);

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Carrier verifications</h1>
          <p className="text-body-sm text-text-secondary">Review and approve carrier public profiles.</p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 border-b border-border-subtle">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setStatus(t.value)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors ${
              status === t.value
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}
          >
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
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        </div>
      ) : profiles.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No profiles in this state.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {profiles.map((p) => {
            const o = p.organization || {};
            return (
              <li key={p.id}>
                <Link
                  to={`/o/${orgSlug}/direct/admin/verifications/${o.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-card border border-border-subtle bg-surface-primary hover:border-border transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {o.logo_url ? (
                      <img src={o.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-text-tertiary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-body font-medium text-text-primary truncate">{o.name}</p>
                      <p className="text-small text-text-tertiary truncate">
                        MC {o.mc_number || '—'} · DOT {o.dot_number || '—'} · submitted {fmt(p.updated_at)}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function fmt(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString();
}
