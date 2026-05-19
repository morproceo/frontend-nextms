import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Search, UserRound, ArrowLeft } from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { cn } from '../../lib/utils';

/**
 * DriverConnectShell — MorPro Connect chrome for the DRIVER side.
 *
 * Identical layout/color to the carrier ConnectShell (EcosystemHeader +
 * dark #05080f sidebar + MobileTabBar) so Connect is a consistent
 * ecosystem app on both sides. Driver-scoped: EcosystemHeader runs in
 * variant="driver" (no org switcher / org app-grid / Genie) and links
 * point back to the driver launcher.
 */
export default function DriverConnectShell() {
  const basePath = '/driver/connect';

  const nav = [
    { label: 'Dashboard', to: basePath, icon: LayoutDashboard, end: true },
    { label: 'Find carriers', to: `${basePath}/carriers`, icon: Search },
    { label: 'My profile', to: `${basePath}/profile`, icon: UserRound }
  ];

  const moreLinks = [
    { label: 'Back to launcher', to: '/driver', icon: ArrowLeft }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="MorPro Connect" appId="connect" variant="driver" />

      <div className="flex flex-1 min-h-0">
        <aside className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60">
          <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
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
              to="/driver"
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

      <MobileTabBar items={nav} moreLinks={moreLinks} />
    </div>
  );
}
