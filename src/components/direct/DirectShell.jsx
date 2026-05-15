import { NavLink, Outlet, useParams, useLocation, Navigate } from 'react-router-dom';
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
  ArrowLeft
} from 'lucide-react';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
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
  const location = useLocation();

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
        <EcosystemHeader appName="Load Network" appId="direct" />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    );
  }

  const moreLinks = [
    {
      label: 'Back to launcher',
      to: `/o/${orgSlug}/launcher`,
      icon: ArrowLeft
    }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Load Network" appId="direct" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside
          className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60"
        >
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
