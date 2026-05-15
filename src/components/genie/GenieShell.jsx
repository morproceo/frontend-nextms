import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, Link, useLocation } from 'react-router-dom';
import {
  Users,
  Activity,
  ShoppingBag,
  Settings as SettingsIcon,
  ArrowLeft,
  Menu,
  X,
  Lock
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { GENIE_TEAM } from '../../config/genieTeam';
import { AgentAvatar } from './AgentAvatar';
import { cn } from '../../lib/utils';

/**
 * GenieShell — slim ecosystem-app chrome for /o/:slug/genie.
 *
 * Layout mirrors DirectShell / WrenchShell: EcosystemHeader on top, slim
 * left sidebar with role-aware nav, scrollable main area for the page.
 *
 * Nav is in three groups:
 *   1. Top-level views  — Team (default) + Activity feed
 *   2. The roster        — Genie (CEO) first, then the five specialists.
 *                          Locked agents render with a Lock badge.
 *   3. Management        — Hire agents, Settings
 *
 * For now, "hired" state is mocked client-side from a hard-coded set in
 * GenieShell — when the backend organization_agents endpoint exists, swap
 * this for a hook that reads the org's actual hire state.
 */
export default function GenieShell() {
  const { orgSlug } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // MOCK: in real impl this comes from `GET /v1/agents/active` returning
  // a Set of agent_slug values, or from the `genie-suite` bundle being
  // active on this org. Treat 'genie' as always-hired for now since she
  // ships free.
  const hired = new Set(['genie', 'sage', 'alex']);
  const bundleActive = false;

  const basePath = `/o/${orgSlug}/genie`;

  const topNav = [
    { label: 'Team', to: basePath, icon: Users, end: true },
    { label: 'Activity feed', to: `${basePath}/activity`, icon: Activity }
  ];

  const managementNav = [
    { label: 'Hire agents', to: `${basePath}/hire`, icon: ShoppingBag },
    { label: 'Settings', to: `${basePath}/settings`, icon: SettingsIcon }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Genie Suite" appId="genie" />

      <div className="lg:hidden h-12 bg-[#05080f] border-b border-white/[0.08] flex items-center px-3 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
          aria-label="Open Genie navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        <aside
          className={cn(
            'bg-[#05080f] text-white flex-shrink-0 flex flex-col',
            'fixed top-14 left-0 bottom-0 w-72 z-50',
            'transform transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:relative lg:top-0 lg:translate-x-0 lg:w-64 lg:z-auto'
          )}
        >
          <div className="lg:hidden flex items-center justify-end p-3 border-b border-white/[0.08]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* — Top-level views — */}
          <nav className="p-3 pt-4 space-y-1">
            {topNav.map(({ label, to, icon: Icon, end }) => (
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

          {/* — Roster — */}
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Your team
            </div>
          </div>
          <nav className="px-3 space-y-0.5 overflow-y-auto">
            {GENIE_TEAM.map((agent) => {
              const isHired = bundleActive || hired.has(agent.slug);
              return (
                <NavLink
                  key={agent.slug}
                  to={`${basePath}/agents/${agent.slug}`}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-2 py-2 rounded-button transition-colors',
                      isActive
                        ? 'bg-white/[0.08]'
                        : 'hover:bg-white/[0.04]'
                    )
                  }
                >
                  <AgentAvatar agent={agent} size="sm" muted={!isHired} />
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm text-white leading-tight truncate">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-white/45 truncate">
                      {agent.role}
                    </div>
                  </div>
                  {!isHired && (
                    <Lock className="w-3.5 h-3.5 text-white/30 flex-shrink-0" />
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* — Management — */}
          <div className="px-4 pt-5 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Manage
            </div>
          </div>
          <nav className="p-3 pt-0 space-y-1">
            {managementNav.map(({ label, to, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
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

          <div className="flex-1" />

          <div className="border-t border-white/[0.08] p-3">
            <Link
              to={`/o/${orgSlug}/launcher`}
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to launcher</span>
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0 bg-surface-secondary">
          <div className="p-6 sm:p-8 lg:p-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
