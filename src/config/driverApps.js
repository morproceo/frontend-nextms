import { Navigation, Wrench, Network, Sparkles } from 'lucide-react';

/**
 * Driver launcher module registry.
 *
 * Same model as the carrier launcher (config/apps.js): the launcher is
 * a grid of MODULES, not individual screens. A driver's day-to-day —
 * loads, documents, expenses, earnings, fuel, settings — all live
 * inside the "Operations" module (their equivalent of the carrier
 * Operations/NextMS module). The launcher stays free to host other
 * driver micro-services as their own tiles as they ship.
 */
const MORPRO_BLUE = '#34CCFF';

export const DRIVER_APPS = [
  {
    id: 'operations',
    name: 'Operations',
    tagline: 'Loads, documents, pay & fuel',
    icon: Navigation,
    tint: MORPRO_BLUE,
    to: '/driver/dashboard'
  },
  {
    id: 'my-truck',
    name: 'My Truck',
    tagline: 'Health, fault codes & AI mechanic',
    icon: Wrench,
    tint: '#F97316',
    to: '/driver/my-truck'
  },
  {
    id: 'connect',
    name: 'MorPro Connect',
    tagline: 'Find work & get hired',
    icon: Network,
    tint: '#10B981',
    to: '/driver/connect'
  },
  {
    id: 'genie',
    name: 'Genie',
    tagline: 'Your AI co-pilot — voice or text',
    icon: Sparkles,
    tint: '#A855F7',
    // Not a navigation tile — opens the Genie chat panel in place.
    // DriverTile dispatches the `open-genie` window event; EcosystemHeader
    // listens and toggles the panel open (so we reuse one panel instance
    // instead of mounting a second one alongside the header's).
    action: 'open-genie'
  }
  // More driver micro-services (e.g. Parking) get added here as tiles.
];

export default DRIVER_APPS;
