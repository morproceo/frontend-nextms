/**
 * Super Admin — organization detail.
 *
 * Inspect an org, flip app grants (admin override), and toggle
 * complimentary free access (Stripe bypass + hides the trial banner).
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Gift, Check, Power
} from 'lucide-react';
import superAdminApi from '../../api/superAdmin.api';
import { APPS } from '../../config/apps';

const APP_NAME = APPS.reduce((m, a) => ({ ...m, [a.id]: a.name }), {});
const label = (id) => APP_NAME[id] || id;

export default function AdminOrgDetailPage() {
  const { orgSlug, orgId } = useParams();
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyApp, setBusyApp] = useState(null);
  const [freeBusy, setFreeBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setOrg(await superAdminApi.getOrganization(orgId));
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => { load(); }, [load]);

  const toggleApp = async (app) => {
    setBusyApp(app.id);
    setError(null);
    try {
      if (app.status === 'active') await superAdminApi.deactivateOrgApp(orgId, app.id);
      else await superAdminApi.activateOrgApp(orgId, app.id);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusyApp(null);
    }
  };

  const toggleFree = async () => {
    setFreeBusy(true);
    setError(null);
    try {
      await superAdminApi.setOrgFreeAccess(orgId, !org.free_access);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setFreeBusy(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-text-tertiary" /></div>;
  }
  if (!org) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 p-3 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error || 'Organization not found'}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        to={`/o/${orgSlug}/admin/orgs`}
        className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Organizations
      </Link>

      <h1 className="text-headline text-text-primary">{org.name}</h1>
      <p className="text-body-sm text-text-secondary mt-1">
        /{org.slug} · {org.subscription?.status || '—'}
        {org.subscription?.plan ? ` · ${org.subscription.plan}` : ''}
        {org.network_roles?.length ? ` · ${org.network_roles.join(', ')}` : ''}
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 mt-4 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Free access comp */}
      <section className="bg-surface-primary border border-surface-tertiary rounded-card p-5 mt-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center flex-shrink-0">
              <Gift className="w-5 h-5 text-violet-600" />
            </div>
            <div>
              <div className="text-body-sm font-medium text-text-primary">
                Complimentary free access
              </div>
              <div className="text-small text-text-tertiary mt-0.5 max-w-md">
                Bypasses Stripe for paid modules and hides the trial banner
                / notifications. Reversible — doesn’t alter real subscription
                data.
              </div>
            </div>
          </div>
          <button
            onClick={toggleFree}
            disabled={freeBusy}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors ${
              org.free_access ? 'bg-violet-600' : 'bg-surface-tertiary'
            }`}
            aria-label="Toggle free access"
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                org.free_access ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* App grants */}
      <section className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-3 px-1">
          Modules
        </div>
        <div className="bg-surface-primary border border-surface-tertiary rounded-card divide-y divide-surface-tertiary overflow-hidden">
          {org.apps.map((app) => {
            const active = app.status === 'active';
            const busy = busyApp === app.id;
            return (
              <div key={app.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-text-primary">
                    {label(app.id)}
                    <span className="ml-2 text-small text-text-tertiary font-normal">
                      {app.pricing_model || ''}
                    </span>
                  </div>
                  <div className="text-small text-text-tertiary">
                    {active
                      ? `Active${app.activated_at ? ' · since ' + new Date(app.activated_at).toLocaleDateString() : ''}`
                      : app.status}
                  </div>
                </div>
                <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${
                  active ? 'bg-success-muted text-success' : 'bg-surface-secondary text-text-tertiary'
                }`}>
                  {app.status}
                </span>
                <button
                  onClick={() => toggleApp(app)}
                  disabled={busy}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button text-small font-medium disabled:opacity-50 ${
                    active
                      ? 'bg-error-muted text-error hover:opacity-90'
                      : 'bg-success text-white hover:opacity-90'
                  }`}
                >
                  {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    : active ? <Power className="w-3.5 h-3.5" />
                      : <Check className="w-3.5 h-3.5" />}
                  {active ? 'Deactivate' : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* Members */}
      <section className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-3 px-1">
          Members ({org.members.length})
        </div>
        <div className="bg-surface-primary border border-surface-tertiary rounded-card divide-y divide-surface-tertiary overflow-hidden">
          {org.members.length === 0 && (
            <div className="px-5 py-4 text-body-sm text-text-tertiary">No members.</div>
          )}
          {org.members.map((m) => (
            <div key={m.membership_id} className="flex items-center gap-4 px-5 py-3">
              <div className="flex-1 min-w-0">
                <div className="text-body-sm text-text-primary truncate">
                  {m.name || m.email}
                </div>
                <div className="text-small text-text-tertiary truncate">{m.email}</div>
              </div>
              <span className="text-small text-text-tertiary">
                {m.role} · {m.status}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
