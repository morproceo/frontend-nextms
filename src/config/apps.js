import { Truck, MapPin, Network, Wrench } from 'lucide-react';

/**
 * Morpro app registry.
 *
 * Each app is one tile on the ecosystem launcher. Adding a new app = append
 * one entry. When an app is later extracted to its own deploy, change
 * `href` from a relative route to a full URL.
 *
 * Tile visibility uses three gates (in order):
 *   1. The user's role on this org (must be in the per-app allowlist).
 *   2. The org's network_roles — TMS-flavored apps (NextMS/Spotty) require
 *      'carrier'; MorPro Direct allows any role.
 *   3. The org's per-app entitlement (`org.app_grants[id]`) — the tile is
 *      ACTIVE when status='active'; otherwise it shows an Activate/Subscribe
 *      CTA. The tile is hidden entirely only when role+network gates fail.
 */
const isCarrierOrg = (org) =>
  Array.isArray(org?.network_roles) && org.network_roles.includes('carrier');

export const APPS = [
  {
    id: 'nextms',
    name: 'NextMS',
    tagline: 'Transportation management',
    icon: Truck,
    iconUrl: '/next-app-icon.svg',
    accent: 'from-blue-500 to-cyan-500',
    pricing: 'paid',
    href: ({ orgSlug }) => `/o/${orgSlug}/dashboard`,
    // Eligible (tile shown on launcher; may be greyed out if not active).
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'spotty',
    name: 'Spotty',
    tagline: 'Truck parking & bookings',
    icon: MapPin,
    iconUrl: '/Spotty-app-icon.svg',
    accent: 'from-cyan-400 to-blue-600',
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/spotty`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant', 'viewer'].includes(role)
  },
  {
    id: 'direct',
    name: 'MorPro Direct',
    tagline: 'Brokerless freight network',
    icon: Network,
    accent: 'from-violet-500 to-fuchsia-500',
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/direct`,
    // MorPro Direct is open to any role. The org-level feature flag still
    // gates it (during the staged rollout); once feature_flags.morproDirect
    // is true everywhere this becomes a no-op.
    eligible: ({ role, org }) =>
      org?.feature_flags?.morproDirect === true &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'wrench',
    name: 'AiMechanic',
    tagline: 'AI fleet mechanic',
    icon: Wrench,
    accent: 'from-orange-500 to-amber-600',
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/wrench`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  }
];

/**
 * Return the apps eligible for this org+role, with each app's grant state
 * attached (or null if no grant row exists yet).
 */
export function eligibleApps({ role, org }) {
  const grants = org?.app_grants || {};
  return APPS
    .filter((app) => {
      try { return app.eligible({ role, org }); } catch { return false; }
    })
    .map((app) => ({
      ...app,
      grant: grants[app.id] || null,
      status: grants[app.id]?.status || 'inactive'
    }));
}

// Backwards-compat: existing callers of visibleApps get the same filter
// behavior (only active tiles), but new code should use eligibleApps to also
// surface inactive entries with their CTAs.
export function visibleApps({ role, org }) {
  return eligibleApps({ role, org }).filter((a) => a.status === 'active');
}
