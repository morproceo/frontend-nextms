/**
 * Widget bootstrap.
 *
 * Each app that ships a widget imports its component here and
 * registers it. Importing this module (anywhere in the app tree)
 * is enough to make every widget appear in the dashboard's
 * "+ Add widget" gallery.
 *
 * To add a new widget:
 *   1. Build the React component under `src/widgets/<app>/<Name>.jsx`
 *   2. Add a `registerWidget({...})` call below
 *
 * Keep this file's import surface light — widget bodies should
 * fetch their own data lazily on mount, not at module load.
 */

import { Sparkles, User, Layers, MapPin } from 'lucide-react';
import { registerWidget } from './registry';
import { AiActivityWidget } from './ai-activity/AiActivityWidget';
import { ProfileWidget } from './launcher/ProfileWidget';
import { AppsWidget } from './launcher/AppsWidget';
import { FleetMapWidget } from './fleet-map/FleetMapWidget';

// ── Launcher built-ins ────────────────────────────────────────────
// These tiles are part of the default layout so the launcher feels
// like a single unified board (à la iCloud / Sequoia). Both are
// `bare: true` — they paint their own content into the rounded
// glass card without any extra header chrome from WidgetHost.
registerWidget({
  id: 'profile',
  title: 'Profile',
  description: 'Your avatar, name, and current organization.',
  app: 'launcher',
  icon: User,
  accent: 'from-cyan-400 to-blue-500',
  component: ProfileWidget,
  bare: false,
  defaultSize: { w: 4, h: 9 },
  // Tiny mode kicks in below 220×180px. With ROW_HEIGHT 44 and gap
  // 20, a 2w × 3h tile is ~180×170 — that's exactly the tiny case,
  // and the layout still keeps the name visible there.
  minSize: { w: 2, h: 3 }
});

registerWidget({
  id: 'apps',
  title: 'Apps',
  description: 'Every MorPro module you can open from one place.',
  app: 'launcher',
  icon: Layers,
  accent: 'from-fuchsia-500 to-violet-500',
  component: AppsWidget,
  bare: false,
  defaultSize: { w: 8, h: 9 },
  minSize: { w: 4, h: 6 }
});

// ── Genie Suite ───────────────────────────────────────────────────
registerWidget({
  id: 'ai-activity',
  title: 'AI team activity',
  description: 'Live feed of what your Genie Suite agents are doing right now.',
  app: 'genie',
  icon: Sparkles,
  accent: 'from-violet-500 via-fuchsia-500 to-orange-400',
  component: AiActivityWidget,
  defaultSize: { w: 6, h: 10 },
  minSize: { w: 3, h: 6 }
});

// ── Find my Truck (live fleet map) ────────────────────────────────
registerWidget({
  id: 'fleet-map',
  title: 'Find my Truck',
  description: 'Real-time positions of every truck with an ELD connection.',
  app: 'operations',
  icon: MapPin,
  accent: 'from-cyan-400 to-blue-600',
  component: FleetMapWidget,
  defaultSize: { w: 6, h: 12 },
  minSize: { w: 4, h: 6 }
});

// Future widgets — add registerWidget(...) calls here as they ship.
// Examples planned:
//   - 'spotty-parking'   → live nearby parking from the Spotty integration
//   - 'fleet-health'     → Wrench critical fault count tile
//   - 'fueliq-prices'    → state diesel price ticker
//   - 'pnl-this-month'   → P&L snapshot
//   - 'loads-board'      → today's open loads
