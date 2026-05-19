import { NavLink, Outlet } from 'react-router-dom';
import { Wrench, ArrowLeft } from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { cn } from '../../lib/utils';

/**
 * MyTruckShell — driver "My Truck" (AI Mechanic) as its own ecosystem
 * app, same chrome/color as the carrier apps and driver MorPro Connect
 * (EcosystemHeader driver-variant + dark #05080f sidebar + MobileTabBar).
 *
 * My Truck is a standalone module (will be a paid module for drivers
 * with no organization), so it gets its own shell — not the generic
 * driver portal chrome.
 */
export default function MyTruckShell() {
  const basePath = '/driver/my-truck';

  const nav = [
    { label: 'My Truck', to: basePath, icon: Wrench, end: true }
  ];

  const moreLinks = [
    { label: 'Back to launcher', to: '/driver', icon: ArrowLeft }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="My Truck" appId="wrench" variant="driver" />

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
