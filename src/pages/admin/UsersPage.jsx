/**
 * Super Admin — users list. Cross-tenant, searchable. Click a row to
 * open the detail/support view.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Search, Loader2, ChevronRight, AlertCircle } from 'lucide-react';
import superAdminApi from '../../api/superAdmin.api';

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const [search, setSearch] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);

  const load = useCallback(async (term, pg) => {
    setLoading(true);
    setError(null);
    try {
      const res = await superAdminApi.listUsers({ search: term, page: pg, limit: 25 });
      setData(res);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search.
  useEffect(() => {
    const t = setTimeout(() => load(search, page), 300);
    return () => clearTimeout(t);
  }, [search, page, load]);

  const users = data?.users || [];
  const pg = data?.pagination;

  return (
    <div className="max-w-5xl">
      <h1 className="text-headline text-text-primary">Users</h1>
      <p className="text-body-sm text-text-secondary mt-1">
        Every user across all tenants. {pg ? `${pg.total} total.` : ''}
      </p>

      <div className="relative mt-6 mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          value={search}
          onChange={(e) => { setPage(1); setSearch(e.target.value); }}
          placeholder="Search name, email, or phone…"
          className="w-full pl-10 pr-4 py-2.5 rounded-button bg-surface-primary border border-surface-tertiary text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent"
        />
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
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-body-sm text-text-tertiary">
            No users match “{search}”.
          </div>
        ) : (
          <div className="divide-y divide-surface-tertiary">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => navigate(`/o/${orgSlug}/admin/users/${u.id}`)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-surface-secondary/50 transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {u.name || u.email}
                    {u.is_driver && (
                      <span className="ml-2 text-[10px] uppercase tracking-wider text-accent bg-accent-muted rounded-full px-2 py-0.5">
                        driver
                      </span>
                    )}
                  </div>
                  <div className="text-small text-text-tertiary truncate">
                    {u.email}{u.phone ? ` · ${u.phone}` : ''}
                  </div>
                </div>
                <div className="hidden sm:block text-small text-text-tertiary text-right">
                  <div>{u.org_count} org{u.org_count === 1 ? '' : 's'}</div>
                  <div>
                    {u.last_login_at
                      ? `Last in ${new Date(u.last_login_at).toLocaleDateString()}`
                      : 'Never logged in'}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              </button>
            ))}
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
