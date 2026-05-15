import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, Link, useLocation } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  Users,
  LayoutGrid,
  Plug,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { cn } from '../../lib/utils';

/**
 * OrgSettingsShell — launcher-level chrome for organization-wide settings.
 *
 * Lives at /o/:orgSlug/settings, outside of any app's shell. Because billing
 * and members and app entitlements belong to the org (not to NextMS), the
 * settings surface gets its own dedicated chrome with the EcosystemHeader
 * up top — the same chrome the launcher uses. Switching orgs in the header
 * keeps the user on the settings page but flips to the new org's data.
 */
export default function OrgSettingsShell() {
  const { orgSlug } = useParams();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const basePath = `/o/${orgSlug}/settings`;

  const nav = [
    { label: 'General', to: basePath, icon: Building2, end: true },
    { label: 'Billing', to: `${basePath}/billing`, icon: CreditCard },
    { label: 'Apps', to: `${basePath}/apps`, icon: LayoutGrid },
    { label: 'Integrations', to: `${basePath}/integrations`, icon: Plug },
    { label: 'Members', to: `${basePath}/members`, icon: Users }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Settings" />

      <div className="lg:hidden h-12 bg-[#05080f] border-b border-white/[0.08] flex items-center px-3 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
          aria-label="Open settings navigation"
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
            'fixed top-14 left-0 bottom-0 w-64 z-50',
            'transform transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            'lg:relative lg:top-0 lg:translate-x-0 lg:w-60 lg:z-auto'
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

          <div className="px-4 pt-4 pb-2">
            <div className="text-[10px] uppercase tracking-wider text-white/40">
              Organization
            </div>
          </div>

          <nav className="flex-1 p-3 pt-1 lg:pt-1 space-y-1 overflow-y-auto">
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
