import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUpRight, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { DRIVER_APPS } from '../../config/driverApps';
import { cn, getInitials } from '../../lib/utils';

/**
 * DriverLauncherPage — the driver portal landing, styled like the
 * ecosystem launcher: a welcome line, a slim identity card, and a
 * dark-glass grid of tool tiles (mirrors AppGrid's visual language but
 * with no entitlement gates — every tile just navigates).
 */
export function DriverLauncherPage() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Driver';
  const initials = getInitials(fullName) || (user?.email?.[0] || '?').toUpperCase();

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-headline text-white">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-body-sm text-white/50 mt-1">
          MorPro Cloud · Driver portal
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        {/* Identity card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl p-8 flex flex-col items-center text-center"
        >
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-1">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={fullName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <div className="w-full h-full rounded-full bg-[#0a0e1a] flex items-center justify-center">
                <span className="text-3xl font-semibold text-white">{initials}</span>
              </div>
            )}
          </div>
          <div className="mt-5 text-title-sm text-white">{fullName}</div>
          <div className="text-body-sm text-white/50 mt-0.5">{user?.email}</div>
          <div className="mt-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/[0.08]">
            <Truck className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-small text-white/70">
              {currentOrg?.name ? `Driving for ${currentOrg.name}` : 'Independent driver'}
            </span>
          </div>
        </motion.div>

        {/* Tile grid */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl p-8"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-6 gap-y-8">
            {DRIVER_APPS.map((app) => (
              <DriverTile key={app.id} app={app} />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function DriverTile({ app }) {
  const Icon = app.icon;
  return (
    <Link
      to={app.to}
      className="group flex flex-col items-center gap-3 p-2 text-center"
    >
      <div
        className="relative w-20 h-20 rounded-[22px] flex items-center justify-center transition-transform group-hover:scale-105"
        style={{
          backgroundColor: `${app.tint}1f`,
          border: `1px solid ${app.tint}33`
        }}
      >
        <Icon className="w-8 h-8" style={{ color: app.tint }} strokeWidth={1.75} />
        <ArrowUpRight
          className={cn(
            'absolute -top-1.5 -right-1.5 w-4 h-4 text-white/0',
            'group-hover:text-white/40 transition-colors'
          )}
        />
      </div>
      <div>
        <div className="text-body-sm font-medium text-white">{app.name}</div>
        <div className="text-[11px] text-white/45 mt-0.5">{app.tagline}</div>
      </div>
    </Link>
  );
}

export default DriverLauncherPage;
