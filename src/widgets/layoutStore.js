/**
 * Per-(user, org) dashboard layout persistence.
 *
 * v1: localStorage. Stores the user's chosen widgets and their
 * x/y/w/h on the lg breakpoint. Smaller breakpoints derive from
 * react-grid-layout's responsive helpers (1-col stack on sm).
 *
 * Future: sync to user preferences via a backend endpoint so the
 * same layout follows the user across devices. The shape below is
 * already backend-safe — just swap the storage adapter.
 */

// Bumping VERSION orphans every existing localStorage layout key so
// the user falls back to defaultLayout() on next load. Use this any
// time defaultLayout() changes in a way we want all users to see
// (e.g. shipping a new launcher widget like the fleet map).
//
// v1 — initial widget shipment
// v2 — 4-widget default + iCloud-style chrome
// v3 — tuned proportions: 4/8 col split per row
// v4 — fixed RGL breakpoint bug (was stuck on md, stacking everything
//      full-width on desktop). Force-reset every cached layout.
const VERSION = 'v4';

function key(userId, orgId) {
  return `morpro_launcher_layout_${VERSION}__${userId || 'anon'}__${orgId || 'none'}`;
}

/**
 * Layout shape:
 *   {
 *     widgets: [
 *       { id: 'instance-uuid', widgetId: 'ai-activity', x, y, w, h }
 *     ]
 *   }
 *
 * `widgetId` is the spec id from the registry (a widget type can be
 * placed multiple times — each placement gets its own `id`).
 */
export function loadLayout(userId, orgId) {
  try {
    const raw = localStorage.getItem(key(userId, orgId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.widgets || !Array.isArray(parsed.widgets)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function saveLayout(userId, orgId, layout) {
  try {
    localStorage.setItem(key(userId, orgId), JSON.stringify(layout));
  } catch (err) {
    console.warn('saveLayout: localStorage write failed', err.message);
  }
}

export function clearLayout(userId, orgId) {
  try { localStorage.removeItem(key(userId, orgId)); } catch { /* noop */ }
}

/**
 * Default layout used when a user has no saved one yet. Lightweight
 * starter — just the AI activity widget. The user adds more from
 * the gallery.
 */
export function defaultLayout() {
  // iCloud-style 4/8 split per row. At a 1080px container with 12
  // cols + 20px gap, this produces:
  //   Profile     332 × 412   (near-square, hero name proportional to avatar)
  //   Apps        684 × 412   (wide, fits 6 icons + a More tile in one row)
  //   AI Activity 332 × 540   (tall narrow feed)
  //   Find my Truck 684 × 540 (dominant map, plenty of room for routes)
  return {
    widgets: [
      // Row 1
      { id: 'w-profile', widgetId: 'profile', x: 0, y: 0, w: 4, h: 8 },
      { id: 'w-apps',    widgetId: 'apps',    x: 4, y: 0, w: 8, h: 8 },
      // Row 2
      { id: 'w-ai-activity', widgetId: 'ai-activity', x: 0, y: 8, w: 4, h: 10 },
      { id: 'w-fleet-map',   widgetId: 'fleet-map',   x: 4, y: 8, w: 8, h: 10 }
    ]
  };
}

export default { loadLayout, saveLayout, clearLayout, defaultLayout };
