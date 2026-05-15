import { NavLink, Outlet, useParams, Navigate } from 'react-router-dom';
import { Users, ShieldCheck, ArrowLeft } from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
import { useOrg } from '../../contexts/OrgContext';

/**
 * AdminShell — launcher-level chrome for the Super Admin section.
 *
 * Lives at /o/:orgSlug/admin, outside any product app. Hard-gated to the
 * morpro-super-admin org: if the current org isn't that, bounce to the
 * launcher (the backend independently enforces requireNetworkAdmin, so
 * this is just UX — not the security boundary).
 */
const SUPER_ADMIN_SLUG = 'morpro-super-admin';

export default function AdminShell() {
  const { orgSlug } = useParams();
  const { currentOrg } = useOrg();

  // UX gate only — backend requireNetworkAdmin is the real boundary.
  if (currentOrg && currentOrg.slug !== SUPER_ADMIN_SLUG) {
    return <Navigate to={`/o/${orgSlug}/launcher`} replace />;
  }

  const basePath = `/o/${orgSlug}/admin`;

  const nav = [
    { label: 'Users', to: basePath, icon: Users, end: true },
    { label: 'Approvals', to: `${basePath}/approvals`, icon: ShieldCheck }
  ];

  const moreLinks = [
    { label: 'Back to launcher', to: `/o/${orgSlug}/launcher`, icon: ArrowLeft }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Super Admin" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60">
          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              MorPro internal
            </div>
          </div>

          <nav className="flex-1 p-3 pt-1 space-y-1 overflow-y-auto">
            {nav.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  [
                    'flex items-center gap-3 px-3 py-2 rounded-button text-body-sm transition-colors',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  ].join(' ')
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
