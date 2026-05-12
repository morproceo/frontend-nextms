import { Link, useParams } from 'react-router-dom';
import {
  Network, Search, UserCircle, ShieldCheck, Package, ArrowRight, Clock
} from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';

/**
 * MorPro Direct dashboard.
 *
 * The card set is gated by network_roles:
 *   - Carrier orgs see "Your public profile" + a "Find loads — soon" placeholder.
 *   - Shipper / 3PL / manufacturer orgs see "Find carriers".
 *   - Hybrid orgs see both surfaces.
 *   - The super_admin org sees "Verifications".
 *
 * Phase 2 will replace the "Find loads" soon-placeholder with the real load board.
 */
export default function DashboardPage() {
  const { orgSlug } = useParams();
  const { currentOrg } = useOrg();
  const isSuperAdmin = currentOrg?.slug === 'morpro-super-admin';
  const networkRoles = currentOrg?.network_roles || [];
  const isCarrier = networkRoles.includes('carrier');
  const isShipperSide =
    networkRoles.includes('shipper') ||
    networkRoles.includes('3pl') ||
    networkRoles.includes('manufacturer');

  const basePath = `/o/${orgSlug}/direct`;

  const cards = [
    ...(isShipperSide ? [
      {
        label: 'Find carriers',
        description: 'Browse the verified carrier directory and view public profiles.',
        to: `${basePath}/carriers`,
        icon: Search,
        accent: 'from-cyan-500 to-blue-600'
      },
      {
        label: 'Post a load',
        description: 'Post a new load to the network and collect bids from carriers.',
        to: `${basePath}/loads/new`,
        icon: Package,
        accent: 'from-amber-500 to-orange-600'
      },
      {
        label: 'My loads',
        description: 'Track your posted loads and review bids.',
        to: `${basePath}/loads`,
        icon: Package,
        accent: 'from-blue-500 to-indigo-600'
      }
    ] : []),
    ...(isCarrier ? [
      {
        label: 'Find loads',
        description: 'Browse loads posted by shippers that match your equipment.',
        to: `${basePath}/loads`,
        icon: Package,
        accent: 'from-amber-500 to-orange-600'
      },
      {
        label: 'My bids',
        description: 'Track your active bids and respond to counter offers.',
        to: `${basePath}/bids`,
        icon: Package,
        accent: 'from-blue-500 to-indigo-600'
      },
      {
        label: 'Your public profile',
        description: 'Edit your carrier profile and submit it for verification.',
        to: `${basePath}/me/profile`,
        icon: UserCircle,
        accent: 'from-violet-500 to-fuchsia-500'
      }
    ] : []),
    ...(isSuperAdmin ? [{
      label: 'Verifications',
      description: 'Review pending carrier profiles and approve or reject them.',
      to: `${basePath}/admin/verifications`,
      icon: ShieldCheck,
      accent: 'from-emerald-500 to-teal-600'
    }] : [])
  ];

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <Network className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">MorPro Direct</h1>
          <p className="text-body-sm text-text-secondary">
            {isCarrier && isShipperSide && 'Carrier + shipper'}
            {isCarrier && !isShipperSide && 'Carrier'}
            {!isCarrier && isShipperSide && (networkRoles.includes('3pl') ? '3PL' : networkRoles.includes('manufacturer') ? 'Manufacturer' : 'Shipper')}
            {' · brokerless freight network'}
          </p>
        </div>
      </div>

      <div className="rounded-card border border-violet-500/20 bg-violet-500/5 p-4 mb-8">
        <p className="text-body-sm text-text-primary font-medium">
          Phase 2 — Load posting & bidding
        </p>
        <p className="text-small text-text-secondary mt-1">
          {isCarrier
            ? 'Find loads from verified shippers, place bids, and accept counter-offers. Booking confirms into your NextMS dispatch in Phase 3.'
            : 'Post loads, review bids from verified carriers, and accept the right offer. Shared command center for tracking + docs ships in Phase 4.'}
        </p>
      </div>

      {cards.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-8 text-center">
          <p className="text-body-sm text-text-secondary">
            Your organization isn't configured for any MorPro Direct network role yet.
          </p>
          <p className="text-small text-text-tertiary mt-2">
            Contact MorPro support to set <code>network_roles</code> on this org.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map(({ label, description, to, icon: Icon, accent, soon }) => {
            const inner = (
              <>
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-body font-medium text-text-primary">{label}</h3>
                  {soon && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium inline-flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" /> {soon}
                    </span>
                  )}
                </div>
                <p className="text-small text-text-secondary leading-relaxed">{description}</p>
                {!soon && (
                  <div className="flex items-center gap-1 mt-4 text-small text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                    Open <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </>
            );
            return soon ? (
              <div
                key={label}
                className="rounded-card border border-border-subtle bg-surface-primary p-5 opacity-70 cursor-not-allowed"
              >
                {inner}
              </div>
            ) : (
              <Link
                key={to}
                to={to}
                className="group rounded-card border border-border-subtle bg-surface-primary p-5 hover:border-border transition-all"
              >
                {inner}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
