import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import {
  Users,
  Activity,
  MessageCircle,
  ShoppingBag,
  Settings as SettingsIcon,
  ArrowLeft,
  Lock
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { GENIE_TEAM } from '../../config/genieTeam';
import { AgentAvatar } from './AgentAvatar';
import { getActiveAgents } from '../../api/agents.api';
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

  // Real hire state from the org's organization_agents rows. Genie
  // (CEO) ships free so she's always considered hired.
  const [hired, setHired] = useState(new Set(['genie']));
  const [bundleActive, setBundleActive] = useState(false);

  useEffect(() => {
    let alive = true;
    getActiveAgents()
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const slugs = rows.map((r) => r.agent_slug).filter(Boolean);
        setBundleActive(slugs.includes('genie-suite'));
        setHired(new Set(['genie', ...slugs]));
      })
      .catch(() => { /* keep default (genie only) on failure */ });
  }, [orgSlug]);

  const basePath = `/o/${orgSlug}/genie`;

  const topNav = [
    { label: 'Chat with Genie', to: `${basePath}/chat`, icon: MessageCircle },
    { label: 'Team', to: basePath, icon: Users, end: true },
    { label: 'Activity feed', to: `${basePath}/activity`, icon: Activity }
  ];

  const managementNav = [
    { label: 'Hire agents', to: `${basePath}/hire`, icon: ShoppingBag },
    { label: 'Settings', to: `${basePath}/settings`, icon: SettingsIcon }
  ];

  // Mobile bottom bar: Team / Activity / Hire / Settings as tabs; the agent
  // roster renders as a tappable avatar grid inside "More".
  const mobileItems = [...topNav, ...managementNav];
  const agentGrid = GENIE_TEAM.map((agent) => {
    const isHired = bundleActive || hired.has(agent.slug);
    return {
      key: agent.slug,
      label: agent.name,
      sublabel: agent.role,
      to: `${basePath}/agents/${agent.slug}`,
      node: (
        <div className="relative">
          <AgentAvatar agent={agent} size="md" muted={!isHired} />
          {!isHired && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#0e1422] border border-white/15 flex items-center justify-center">
              <Lock className="w-2.5 h-2.5 text-white/50" />
            </span>
          )}
        </div>
      )
    };
  });
  const moreLinks = [
    {
      label: 'Back to launcher',
      to: `/o/${orgSlug}/launcher`,
      icon: ArrowLeft
    }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Genie Suite" appId="genie" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-64">
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
            <NavLink
              to={`/o/${orgSlug}/launcher`}
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

      <MobileTabBar
        items={mobileItems}
        gridItems={agentGrid}
        gridTitle="Your team"
        moreLinks={moreLinks}
      />
    </div>
  );
}
