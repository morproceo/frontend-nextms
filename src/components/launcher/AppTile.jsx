import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import orgAppGrantsApi from '../../api/orgAppGrants.api';
import { useOrg } from '../../contexts/OrgContext';

/** Hex (#RRGGBB) → rgba() string at the given alpha. */
function rgba(hex, a) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

/**
 * Per-tile state machine:
 *   active     — clickable, routes to the module
 *   inactive   — greyed out + lock badge; click triggers Activate (free) or
 *                routes to billing (paid)
 *   activating — in-flight (free modules) — disabled + spinner
 */
export function AppTile({ app, orgSlug }) {
  const navigate = useNavigate();
  const { currentOrg, refreshAppGrants } = useOrg();
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);
  const Icon = app.icon;

  const isActive = app.status === 'active';
  const isFree = app.pricing === 'free';
  const tint = app.tint || '#34CCFF';

  const onClick = async () => {
    if (activating) return;
    if (isActive) {
      const target = app.href({ orgSlug });
      if (target.startsWith('http')) {
        window.location.href = target;
      } else {
        navigate(target);
      }
      return;
    }
    // Inactive — paid modules go to billing; free modules activate inline.
    if (!isFree) {
      navigate(`/o/${orgSlug}/settings/billing`);
      return;
    }
    if (!currentOrg?.id) {
      setError('No org context');
      return;
    }
    setActivating(true);
    setError(null);
    try {
      const r = await orgAppGrantsApi.activateApp(currentOrg.id, app.id);
      if (r?.requires_subscription && r?.redirect_to) {
        navigate(r.redirect_to);
        return;
      }
      if (refreshAppGrants) await refreshAppGrants();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setActivating(false);
    }
  };

  return (
    <motion.button
      whileHover={isActive ? { y: -4 } : { y: -2 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={onClick}
      disabled={activating}
      className={cn(
        'group flex flex-col items-center gap-3 p-2 rounded-2xl',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40'
      )}
    >
      <div
        className={cn(
          'relative w-20 h-20 rounded-[22px] flex items-center justify-center',
          'transition-shadow duration-200',
          !isActive && 'opacity-50 grayscale'
        )}
        style={{
          background: rgba(tint, 0.12),
          border: `1px solid ${rgba(tint, 0.22)}`,
          boxShadow: isActive ? `0 8px 28px ${rgba(tint, 0.18)}` : undefined
        }}
      >
        <Icon className="w-9 h-9" strokeWidth={1.75} style={{ color: tint }} />
        {!isActive && !activating && (
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/80 border-2 border-[#05080f] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white/80" />
          </div>
        )}
        {activating && (
          <div className="absolute inset-0 rounded-[22px] bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin" style={{ color: tint }} />
          </div>
        )}
      </div>
      <div className="text-center">
        <div className="text-body-sm font-medium text-white">{app.name}</div>
        {app.tagline && (
          <div className="text-small text-white/40 mt-0.5">{app.tagline}</div>
        )}
        <StateBadge status={app.status} pricing={app.pricing} error={error} />
      </div>
    </motion.button>
  );
}

function StateBadge({ status, pricing, error }) {
  if (error) {
    return (
      <div className="text-[10px] text-red-400 mt-1 max-w-[120px]">{error}</div>
    );
  }
  if (status === 'active') return null;
  const label = pricing === 'paid' ? 'Subscribe' : 'Activate';
  const tone = pricing === 'paid'
    ? 'bg-amber-500/20 text-amber-200'
    : 'bg-blue-500/20 text-blue-200';
  return (
    <span
      className={cn(
        'inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
        tone
      )}
    >
      {label}
    </span>
  );
}

export default AppTile;
