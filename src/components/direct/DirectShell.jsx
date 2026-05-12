import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, Link, useLocation, Navigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Search,
  UserCircle,
  ShieldCheck,
  ShieldAlert,
  Package,
  Plus,
  Gavel,
  Inbox,
  Wallet,
  CreditCard,
  ArrowLeft,
  Menu,
  X
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { useOrg } from '../../contexts/OrgContext';
import { cn } from '../../lib/utils';

/**
 * DirectShell — Phase 1.
 *
 * Slim chrome with role-aware sidebar. The "Verifications" item appears only
 * when the current org is morpro_super_admin (slug match). The "Public
 * profile" item appears for all orgs (carrier flow). Filtering by network
 * role tightens in Phase 2 when shippers/carriers diverge more.
 */
export default function DirectShell() {
  const { orgSlug } = useParams();
  const { currentOrg } = useOrg();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const isSuperAdmin = currentOrg?.slug === 'morpro-super-admin';
  const networkRoles = currentOrg?.network_roles || [];
  const isCarrier = networkRoles.includes('carrier');
  const isShipperSide =
    networkRoles.includes('shipper') ||
    networkRoles.includes('3pl') ||
    networkRoles.includes('manufacturer');

  const basePath = `/o/${orgSlug}/direct`;

  // Carrier-side verification gate. Until status='approved' the wizard is the
  // only thing inside /direct/* that renders. Shipper-side orgs and the super
  // admin don't see this gate (they don't have MC numbers).
  const verification = currentOrg?.direct_verification || null;
  const needsVerification =
    isCarrier &&
    !isSuperAdmin &&
    (!verification || verification.status !== 'approved');
  const onVerifyRoute = location.pathname.startsWith(`${basePath}/verify`);
  if (needsVerification && !onVerifyRoute) {
    return <Navigate to={`${basePath}/verify`} replace />;
  }

  // Sidebar adapts to who you are on the network:
  //   - Carrier orgs hunt for loads (Phase 2 surface). They manage their own
  //     public profile so shippers can find them.
  //   - Shipper/3PL/manufacturer orgs hunt for carriers.
  //   - Hybrid orgs (rare today; common at scale) see both.
  //   - Super-admin orgs always see Verifications.
  const nav = [
    { label: 'Dashboard', to: basePath, icon: LayoutDashboard, end: true },
    ...(isShipperSide
      ? [
          { label: 'Find carriers', to: `${basePath}/carriers`, icon: Search },
          { label: 'My loads', to: `${basePath}/loads`, icon: Package },
          { label: 'Post a load', to: `${basePath}/loads/new`, icon: Plus },
          { label: 'Payment method', to: `${basePath}/payments/setup`, icon: CreditCard }
        ]
      : []),
    ...(isCarrier
      ? [
          { label: 'Find loads', to: `${basePath}/loads`, icon: Package },
          { label: 'My bids', to: `${basePath}/bids`, icon: Gavel },
          { label: 'Public profile', to: `${basePath}/me/profile`, icon: UserCircle },
          { label: 'Payouts', to: `${basePath}/payments/payouts`, icon: Wallet },
          { label: 'Onboarding', to: `${basePath}/onboarding`, icon: Wallet }
        ]
      : []),
    // Phase 3: direct requests visible to both sides
    ...((isCarrier || isShipperSide)
      ? [{ label: 'Requests', to: `${basePath}/requests`, icon: Inbox }]
      : []),
    ...(isSuperAdmin
      ? [
          { label: 'Verifications', to: `${basePath}/admin/verifications`, icon: ShieldCheck },
          { label: 'Carrier onboarding', to: `${basePath}/admin/carrier-verifications`, icon: ShieldCheck },
          { label: 'Disputes', to: `${basePath}/admin/disputes`, icon: ShieldAlert }
        ]
      : [])
  ];

  // Wizard route: render header only, no sidebar — clean single-column flow.
  if (onVerifyRoute) {
    return (
      <div className="min-h-screen bg-surface-secondary flex flex-col">
        <EcosystemHeader appName="MorPro Direct" appId="direct" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="MorPro Direct" appId="direct" />

      <div className="lg:hidden h-12 bg-[#05080f] border-b border-white/[0.08] flex items-center px-3 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
          aria-label="Open MorPro Direct navigation"
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

          <nav className="flex-1 p-3 pt-3 lg:pt-4 space-y-1 overflow-y-auto">
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
                /* `soon` no longer used in Phase 2 nav but kept for future placeholders */
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
            <Link
              to={`/o/${orgSlug}/launcher`}
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to launcher</span>
            </Link>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
