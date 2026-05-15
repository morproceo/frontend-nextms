import { NavLink, Outlet, useParams } from 'react-router-dom';
import {
  LayoutDashboard, Truck, AlertTriangle, Sparkles, Wrench as WrenchIcon,
  Plug, Settings, ArrowLeft
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { cn } from '../../lib/utils';

/**
 * WrenchShell — slim chrome for MorPro Wrench (AI fleet mechanic),
 * presented as the "Fleet Health" module.
 *
 * Desktop keeps the persistent left sidebar. Mobile drops the redundant
 * hamburger sub-bar and uses the shared ecosystem bottom tab bar; the
 * ecosystem top bar stays on both.
 */
export default function WrenchShell() {
  const { orgSlug } = useParams();

  const basePath = `/o/${orgSlug}/wrench`;
  const nav = [
    { label: 'Command center', to: basePath, icon: LayoutDashboard, end: true },
    { label: 'Trucks', to: `${basePath}/trucks`, icon: Truck },
    { label: 'Fault codes', to: `${basePath}/diagnoses`, icon: AlertTriangle },
    { label: 'Maintenance', to: `${basePath}/maintenance`, icon: WrenchIcon },
    { label: 'Insights', to: `${basePath}/insights`, icon: Sparkles, soon: true },
    { label: 'Connections', to: `${basePath}/connections`, icon: Plug },
    { label: 'Settings', to: `${basePath}/settings`, icon: Settings, soon: true }
  ];

  // Mobile bar only carries live destinations (skip `soon` placeholders).
  const mobileNav = nav.filter((n) => !n.soon);
  const moreLinks = [
    {
      label: 'Back to launcher',
      to: `/o/${orgSlug}/launcher`,
      icon: ArrowLeft
    }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Fleet Health" appId="wrench" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60">
          <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
            {nav.map(({ label, to, icon: Icon, end, soon }) => (
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
                onClick={(e) => { if (soon) e.preventDefault(); }}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span className="flex-1">{label}</span>
                {soon && (
                  <span className="text-[10px] uppercase tracking-wider text-white/40">soon</span>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/[0.08] p-3">
            <NavLink
              to={`/o/${orgSlug}/launcher`}
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to launcher</span>
            </NavLink>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 pb-20 lg:pb-0">
          <Outlet />
        </main>
      </div>

      <MobileTabBar items={mobileNav} moreLinks={moreLinks} />
    </div>
  );
}
