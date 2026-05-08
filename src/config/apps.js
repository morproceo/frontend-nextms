import { Truck, MapPin } from 'lucide-react';

/**
 * Morpro app registry.
 *
 * Each app is one tile on the ecosystem launcher. Adding a new app =
 * appending one entry. When an app is later extracted to its own deploy,
 * change `href` from a relative route to a full URL.
 */
export const APPS = [
  {
    id: 'nextms',
    name: 'NextMS',
    tagline: 'Transportation management',
    icon: Truck,
    accent: 'from-blue-500 to-cyan-500',
    href: ({ orgSlug }) => `/o/${orgSlug}/dashboard`,
    visible: ({ role }) =>
      ['owner', 'admin', 'dispatcher', 'accountant'].includes(role)
  },
  {
    id: 'spotty',
    name: 'Spotty',
    tagline: 'Truck parking & bookings',
    icon: MapPin,
    accent: 'from-cyan-400 to-blue-600',
    href: ({ orgSlug }) => `/o/${orgSlug}/spotty`,
    // Visible to anyone with org admin access — bookings/payments are tied
    // to the individual user's Spotty account, not the org's role.
    visible: ({ role }) =>
      ['owner', 'admin', 'dispatcher', 'accountant', 'viewer'].includes(role)
  }
];

export function visibleApps({ role, org }) {
  return APPS.filter((app) => {
    try {
      return app.visible({ role, org });
    } catch {
      return false;
    }
  });
}
