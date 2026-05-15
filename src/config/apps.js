import { Navigation, ParkingCircle, Waypoints, Wrench, Sparkles, ShieldCheck } from 'lucide-react';

/**
 * MorPro Cloud module registry.
 *
 * Each entry is one module tile on the MorPro Cloud launcher. These are
 * presented as native modules of one ecosystem — NOT separate apps. The
 * `id` slugs keep the original product names for backend/system continuity
 * (nextms, spotty, direct, wrench, genie); only the user-facing `name`
 * and `tagline` use the MorPro Cloud module language.
 *
 *   id 'nextms'  → Operations
 *   id 'spotty'  → Parking
 *   id 'direct'  → Network
 *   id 'wrench'  → Fleet Health
 *   id 'genie'   → Genie Suite
 *
 * `tint` is the module's accent (MorPro blue #34CCFF is the primary; a few
 * modules use a secondary hue where it aids recognition). It drives the
 * icon color, the soft icon-tile background, the glow, and the arrow.
 *
 * Tile visibility uses three gates (in order):
 *   1. The user's role on this org (must be in the per-module allowlist).
 *   2. The org's network_roles — carrier-flavored modules require 'carrier';
 *      Network allows any role.
 *   3. The org's per-module entitlement (`org.app_grants[id]`) — ACTIVE when
 *      status='active'; otherwise an Activate/Subscribe CTA. The tile is
 *      hidden only when role+network gates fail.
 */
const isCarrierOrg = (org) =>
  Array.isArray(org?.network_roles) && org.network_roles.includes('carrier');

// MorPro blue — primary ecosystem accent.
const MORPRO_BLUE = '#34CCFF';

export const APPS = [
  {
    id: 'nextms',
    name: 'Operations',
    tagline: 'Dispatch, loads & routing',
    icon: Navigation,
    tint: MORPRO_BLUE,
    pricing: 'paid',
    href: ({ orgSlug }) => `/o/${orgSlug}/dashboard`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'spotty',
    name: 'Parking',
    tagline: 'Truck parking & reservations',
    icon: ParkingCircle,
    tint: '#34D399', // emerald — parking availability
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/spotty`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant', 'viewer'].includes(role)
  },
  {
    id: 'direct',
    name: 'Load Network',
    tagline: 'Carriers, shippers & freight',
    icon: Waypoints,
    tint: '#A78BFA', // violet — the freight network
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/direct`,
    eligible: ({ role, org }) =>
      org?.feature_flags?.morproDirect === true &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'wrench',
    name: 'Fleet Health',
    tagline: 'Diagnostics, maintenance & safety',
    icon: Wrench,
    tint: '#FBBF24', // amber — maintenance alerts
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/wrench`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'genie',
    name: 'Genie Suite',
    tagline: 'Your AI team, working for you',
    icon: Sparkles,
    tint: '#E879F9', // fuchsia — the Suite mark
    // The tile is FREE to open — the Suite shell is always accessible.
    // Individual agents are hired inside the Suite, not via org_app_grants.
    pricing: 'free',
    href: ({ orgSlug }) => `/o/${orgSlug}/genie`,
    eligible: ({ role, org }) =>
      isCarrierOrg(org) &&
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'admin',
    name: 'Super Admin',
    tagline: 'Internal user & approvals console',
    icon: ShieldCheck,
    tint: '#F472B6', // pink — internal/staff
    pricing: 'free',
    // No org_app_grant — staff tooling is always on for the internal org.
    alwaysActive: true,
    href: ({ orgSlug }) => `/o/${orgSlug}/admin`,
    // Only the morpro-super-admin org sees this tile. Backend independently
    // enforces requireNetworkAdmin on every /v1/admin call.
    eligible: ({ org }) => org?.slug === 'morpro-super-admin'
  }
];

/**
 * Return the modules eligible for this org+role, with each module's grant
 * state attached (or null if no grant row exists yet).
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
      // alwaysActive modules (internal staff tooling) skip the grant flow.
      status: app.alwaysActive ? 'active' : (grants[app.id]?.status || 'inactive')
    }));
}

// Backwards-compat: existing callers of visibleApps get the same filter
// behavior (only active tiles), but new code should use eligibleApps to also
// surface inactive entries with their CTAs.
export function visibleApps({ role, org }) {
  return eligibleApps({ role, org }).filter((a) => a.status === 'active');
}
