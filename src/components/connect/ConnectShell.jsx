import { NavLink, Outlet, useParams } from 'react-router-dom';
import { LayoutDashboard, Search, UsersRound, ClipboardList, Building2, ArrowLeft } from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { cn } from '../../lib/utils';

/**
 * ConnectShell — MorPro Connect chrome (Phase 1).
 *
 * Mirrors DirectShell's slim ecosystem chrome. Phase 1 nav is just the
 * dashboard; discovery / onboarding / requests surfaces are added as
 * Phase 2 ships (each becomes a nav item here).
 */
export default function ConnectShell() {
  const { orgSlug } = useParams();
  const basePath = `/o/${orgSlug}/connect`;

  const nav = [
    { label: 'Dashboard', to: basePath, icon: LayoutDashboard, end: true },
    { label: 'Browse drivers', to: `${basePath}/drivers`, icon: Search },
    { label: 'Candidates', to: `${basePath}/candidates`, icon: UsersRound },
    { label: 'Onboarding', to: `${basePath}/onboarding`, icon: ClipboardList },
    { label: 'Company profile', to: `${basePath}/profile`, icon: Building2 }
  ];

  const moreLinks = [
    { label: 'Back to launcher', to: `/o/${orgSlug}/launcher`, icon: ArrowLeft }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="MorPro Connect" appId="connect" />

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

      <MobileTabBar items={nav} moreLinks={moreLinks} />
    </div>
  );
}
