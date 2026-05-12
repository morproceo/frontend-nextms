import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import orgAppGrantsApi from '../../api/orgAppGrants.api';
import { useOrg } from '../../contexts/OrgContext';

/**
 * Per-tile state machine:
 *   active     — clickable, routes to the app
 *   inactive   — greyed out + lock badge; click triggers Activate (free) or
 *                routes to billing (paid)
 *   activating — in-flight (free apps) — disabled + spinner
 */
export function AppTile({ app, orgSlug }) {
  const navigate = useNavigate();
  const { currentOrg, refreshAppGrants } = useOrg();
  const [activating, setActivating] = useState(false);
  const [error, setError] = useState(null);
  const Icon = app.icon;

  const isActive = app.status === 'active';
  const isFree = app.pricing === 'free';

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
    // Inactive — paid apps go to billing; free apps activate inline.
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
          'relative w-20 h-20 rounded-[22px] shadow-elevated overflow-hidden',
          // Designed icon → full-bleed image, no gradient.
          // No icon → gradient + Lucide line icon.
          !app.iconUrl && 'bg-gradient-to-br flex items-center justify-center',
          !app.iconUrl && (app.accent || 'from-slate-600 to-slate-800'),
          isActive && 'transition-shadow duration-200 group-hover:shadow-[0_12px_40px_rgba(0,113,227,0.35)]',
          !isActive && 'opacity-50 grayscale'
        )}
      >
        {app.iconUrl ? (
          <img
            src={app.iconUrl}
            alt={`${app.name} icon`}
            className="w-full h-full object-cover"
            loading="lazy"
            draggable={false}
          />
        ) : (
          <Icon className="w-9 h-9 text-white" strokeWidth={1.75} />
        )}
        {!isActive && !activating && (
          <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-black/80 border-2 border-[#05080f] flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-white/80" />
          </div>
        )}
        {activating && (
          <div className="absolute inset-0 rounded-[22px] bg-black/40 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
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
