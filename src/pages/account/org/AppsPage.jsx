/**
 * AppsPage — org-level app catalog.
 *
 * Lists every app in the registry for this org, shows whether it's active or
 * inactive, and provides Activate / Deactivate / Subscribe controls. This is
 * the org-level analogue of the launcher tile grid, surfaced as a settings
 * page so an org owner can manage their entitlements without clicking around
 * the launcher.
 */

import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Loader2,
  Check,
  Lock,
  AlertCircle,
  X,
  ExternalLink
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import orgAppGrantsApi from '../../../api/orgAppGrants.api';
import { APPS } from '../../../config/apps';
import { cn } from '../../../lib/utils';

export default function AppsPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { currentOrg, currentRole, refreshAppGrants } = useOrg();
  const [busyAppId, setBusyAppId] = useState(null);
  const [error, setError] = useState(null);

  if (!currentOrg) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const grants = currentOrg.app_grants || {};

  const eligibleHere = APPS
    .map((app) => {
      let eligible = false;
      try {
        eligible = app.eligible({ role: currentRole, org: currentOrg });
      } catch {
        eligible = false;
      }
      return {
        ...app,
        eligible,
        grant: grants[app.id] || null,
        status: grants[app.id]?.status || 'inactive'
      };
    });

  const handleActivate = async (app) => {
    setError(null);
    setBusyAppId(app.id);
    try {
      const r = await orgAppGrantsApi.activateApp(currentOrg.id, app.id);
      if (r?.requires_subscription && r?.redirect_to) {
        navigate(r.redirect_to);
        return;
      }
      if (r?.requires_verification && r?.redirect_to) {
        navigate(r.redirect_to);
        return;
      }
      if (refreshAppGrants) await refreshAppGrants();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusyAppId(null);
    }
  };

  const handleDeactivate = async (app) => {
    if (!confirm(`Deactivate ${app.name}? You can re-activate it any time.`)) return;
    setError(null);
    setBusyAppId(app.id);
    try {
      await orgAppGrantsApi.deactivateApp(currentOrg.id, app.id);
      if (refreshAppGrants) await refreshAppGrants();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusyAppId(null);
    }
  };

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-title text-text-primary">Apps</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage which apps are active for <span className="font-medium">{currentOrg.name}</span>.
          Active apps are available to every member of this organization.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      <div className="bg-surface-primary rounded-card border border-surface-tertiary overflow-hidden">
        <div className="divide-y divide-surface-tertiary">
          {eligibleHere.map((app) => (
            <AppRow
              key={app.id}
              app={app}
              busy={busyAppId === app.id}
              onActivate={() => handleActivate(app)}
              onDeactivate={() => handleDeactivate(app)}
              onOpen={() => navigate(app.href({ orgSlug }))}
            />
          ))}
        </div>
      </div>

      <p className="text-small text-text-tertiary mt-6">
        Apps shown in <span className="opacity-60">grey</span> are not available for this organization's role or network setup.
      </p>
    </div>
  );
}

function AppRow({ app, busy, onActivate, onDeactivate, onOpen }) {
  const Icon = app.icon;
  const isActive = app.status === 'active';
  const isFree = app.pricing === 'free';
  const isEligible = app.eligible;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'p-5 flex items-center gap-4 transition-colors',
        !isEligible && 'opacity-50',
        isEligible && 'hover:bg-surface-secondary/40'
      )}
    >
      <div
        className="relative w-12 h-12 rounded-[14px] flex items-center justify-center flex-shrink-0"
        style={{
          background: `${app.tint || '#34CCFF'}1f`,
          border: `1px solid ${app.tint || '#34CCFF'}38`
        }}
      >
        <Icon
          className="w-6 h-6"
          strokeWidth={1.75}
          style={{ color: app.tint || '#34CCFF' }}
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-body font-medium text-text-primary">{app.name}</h3>
          {isActive && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-success/10 text-success text-[10px] font-medium uppercase tracking-wider">
              <Check className="w-3 h-3" />
              Active
            </span>
          )}
          {!isActive && !isFree && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-[10px] font-medium uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Paid
            </span>
          )}
        </div>
        <p className="text-body-sm text-text-secondary mt-0.5">{app.tagline}</p>
        {!isEligible && (
          <p className="text-small text-text-tertiary mt-1">
            Not available for this organization
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {busy && <Loader2 className="w-4 h-4 animate-spin text-text-secondary" />}

        {isEligible && isActive && (
          <>
            <button
              onClick={onOpen}
              className="flex items-center gap-1 px-3 py-2 text-body-sm text-accent hover:text-accent-hover transition-colors"
            >
              Open
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDeactivate}
              disabled={busy}
              className="px-3 py-2 text-body-sm text-text-secondary hover:text-error transition-colors disabled:opacity-50"
            >
              Deactivate
            </button>
          </>
        )}

        {isEligible && !isActive && (
          <button
            onClick={onActivate}
            disabled={busy}
            className={cn(
              'px-4 py-2 rounded-button text-body-sm font-medium transition-colors disabled:opacity-50',
              isFree
                ? 'bg-accent hover:bg-accent-hover text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            )}
          >
            {isFree ? 'Activate' : 'Subscribe'}
          </button>
        )}
      </div>
    </motion.div>
  );
}
