/**
 * Super Admin — organizations list. Cross-tenant, searchable.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Loader2, ChevronRight, AlertCircle, Gift, Trash2 } from 'lucide-react';
import superAdminApi from '../../api/superAdmin.api';

const SUB_TONE = {
  active: 'bg-success-muted text-success',
  trialing: 'bg-accent-muted text-accent',
  past_due: 'bg-warning-muted text-warning',
  cancelled: 'bg-error-muted text-error',
  expired: 'bg-error-muted text-error'
};

export default function AdminOrgsPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [view, setView] = useState('active'); // active | deleted
  const [purgingId, setPurgingId] = useState(null);

  const load = useCallback(async (term, pg, status) => {
    setLoading(true);
    setError(null);
    try {
      setData(await superAdminApi.listOrganizations({ search: term, page: pg, limit: 25, status }));
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => load(search, page, view), 300);
    return () => clearTimeout(t);
  }, [search, page, view, load]);

  const purge = async (org) => {
    if (!window.confirm(`PERMANENTLY purge "${org.name}" and all its data? This cannot be undone.`)) return;
    setPurgingId(org.id);
    try {
      await superAdminApi.purgeOrganization(org.id);
      await load(search, page, view);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setPurgingId(null);
    }
  };

  const orgs = data?.organizations || [];
  const pg = data?.pagination;

  return (
    <div className="max-w-5xl">
      <h1 className="text-headline text-text-primary">Organizations</h1>
      <p className="text-body-sm text-text-secondary mt-1">
        Every organization on the platform. {pg ? `${pg.total} total.` : ''}
      </p>

      <div className="relative mt-6 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search name or slug…"
          className="w-full pl-10 pr-4 py-2.5 rounded-button bg-surface-primary border border-surface-tertiary text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
        />
      </div>

      <div className="flex gap-1 mb-4 p-1 bg-surface-primary border border-surface-tertiary rounded-button w-fit">
        {[{ k: 'active', l: 'Active' }, { k: 'deleted', l: 'Deleted' }].map((t) => (
          <button
            key={t.k}
            onClick={() => { setView(t.k); setPage(1); }}
            className={`px-4 py-1.5 rounded-chip text-body-sm font-medium transition-colors ${
              view === t.k ? 'bg-text-primary text-white' : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {t.l}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          </div>
        ) : orgs.length === 0 ? (
          <div className="p-12 text-center text-body-sm text-text-tertiary">
            No organizations match “{search}”.
          </div>
        ) : (
          <div className="divide-y divide-surface-tertiary">
            {orgs.map((o) => {
              const deleted = !!o.deleted_at;
              const purgeOk = deleted && o.purge_eligible_at && new Date(o.purge_eligible_at) <= new Date();
              return (
                <div key={o.id} className="flex items-center gap-3 pr-4 hover:bg-surface-secondary/50 transition-colors">
                  <button
                    onClick={() => navigate(`/o/${orgSlug}/admin/orgs/${o.id}`)}
                    className="flex-1 flex items-center gap-4 px-5 py-4 text-left min-w-0"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="text-body-sm font-medium text-text-primary truncate flex items-center gap-2">
                        {o.name}
                        {o.free_access && (
                          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-violet-600 bg-violet-500/10 rounded-full px-2 py-0.5">
                            <Gift className="w-3 h-3" /> free
                          </span>
                        )}
                      </div>
                      <div className="text-small text-text-tertiary truncate">
                        /{o.slug}
                        {deleted
                          ? ` · deleted ${new Date(o.deleted_at).toLocaleDateString()}`
                          : ` · ${o.active_apps.length} active app${o.active_apps.length === 1 ? '' : 's'}`}
                      </div>
                    </div>
                    {!deleted && (
                      <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${SUB_TONE[o.subscription_status] || 'bg-surface-secondary text-text-secondary'}`}>
                        {o.subscription_status || '—'}{o.subscription_plan ? ` · ${o.subscription_plan}` : ''}
                      </span>
                    )}
                    {!deleted && <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />}
                  </button>
                  {deleted && (
                    <button
                      onClick={() => purge(o)}
                      disabled={!purgeOk || purgingId === o.id}
                      title={purgeOk ? 'Permanently purge' : `Purge available ${new Date(o.purge_eligible_at).toLocaleDateString()}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-error-muted text-error text-small font-medium hover:opacity-90 disabled:opacity-40 flex-shrink-0"
                    >
                      {purgingId === o.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                      Purge
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {pg && pg.pages > 1 && (
        <div className="flex items-center justify-between mt-4 text-body-sm text-text-secondary">
          <button
            disabled={pg.page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="px-3 py-1.5 rounded-button border border-surface-tertiary disabled:opacity-40 hover:bg-surface-secondary"
          >
            Previous
          </button>
          <span>Page {pg.page} of {pg.pages}</span>
          <button
            disabled={pg.page >= pg.pages}
            onClick={() => setPage((p) => p + 1)}
            className="px-3 py-1.5 rounded-button border border-surface-tertiary disabled:opacity-40 hover:bg-surface-secondary"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
