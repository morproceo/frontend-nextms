import { NavLink, Outlet } from 'react-router-dom';
import {
  User,
  ShieldCheck,
  Bell,
  BadgeCheck,
  ArrowLeft
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { cn } from '../../lib/utils';

/**
 * UserSettingsShell — launcher-level chrome for personal account settings.
 *
 * Lives at /me, outside of any org. The user is a global entity, not
 * org-scoped. We still render the EcosystemHeader so the OrgSwitcher stays
 * visible — switching orgs while in /me keeps the user where they are
 * (it's their account, not the org's).
 *
 * The "Back to launcher" footer points at the user's currently-selected
 * org if one is in context, otherwise the marketing site.
 */
export default function UserSettingsShell() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  const backHref = currentOrg?.slug ? `/o/${currentOrg.slug}/launcher` : '/';

  const nav = [
    { label: 'Profile', to: '/me', icon: User, end: true },
    { label: 'Security', to: '/me/security', icon: ShieldCheck },
    { label: 'Notifications', to: '/me/notifications', icon: Bell },
    ...(user?.is_driver
      ? [{ label: 'Driver', to: '/me/driver', icon: BadgeCheck }]
      : [])
  ];

  const moreLinks = [
    { label: 'Back to launcher', to: backHref, icon: ArrowLeft }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Account" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60">
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Your account
            </div>
          </div>

          <nav className="flex-1 p-3 pt-1 space-y-1 overflow-y-auto">
            {nav.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-button text-body-sm transition-colors',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/[0.08] p-3">
            <NavLink
              to={backHref}
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to launcher</span>
            </NavLink>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 bg-surface-secondary">
          <div className="p-6 sm:p-8 lg:p-10 pb-24 lg:pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      <MobileTabBar items={nav} moreLinks={moreLinks} />
    </div>
  );
}
