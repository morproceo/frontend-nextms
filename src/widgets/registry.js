/**
 * Widget registry.
 *
 * Apps register their widgets here so the launcher dashboard can
 * surface them in the "+ Add widget" gallery. Each entry describes
 * the widget metadata + a React component that renders the body.
 *
 * Shape:
 *   {
 *     id            : string  — globally unique slug (kebab-case)
 *     title         : string  — shown in the widget header + gallery
 *     description   : string  — gallery copy ("what this widget does")
 *     app           : string  — the owning app id (matches src/config/apps.js)
 *     icon          : lucide icon component (for the gallery tile)
 *     accent        : tailwind gradient string for the icon tile
 *     component     : () => ReactNode — the body to render inside <WidgetHost>
 *     defaultSize   : { w: number, h: number } — react-grid-layout units
 *     minSize       : { w: number, h: number }
 *     maxSize?      : { w: number, h: number }
 *     gateForRole?  : 'admin' | 'driver' | ... — only show in the gallery
 *                     when the user has this role (optional)
 *     gateForApp?   : string — only show when the org has this app active
 *   }
 *
 * Grid units: the launcher grid is 12 cols wide on lg, with row
 * height ~80px. Reasonable widget sizes: 3×2 (tile), 4×4 (panel),
 * 6×6 (big surface), 12×4 (full-row banner).
 */

const _widgets = new Map();

export function registerWidget(spec) {
  if (!spec?.id || !spec?.component || !spec?.title) {
    console.warn('registerWidget: missing id/title/component', spec);
    return;
  }
  _widgets.set(spec.id, spec);
}

export function getWidget(id) {
  return _widgets.get(id) || null;
}

export function listWidgets({ role, activeApps } = {}) {
  const out = [];
  for (const w of _widgets.values()) {
    if (w.gateForRole && role && w.gateForRole !== role) continue;
    if (w.gateForApp && Array.isArray(activeApps) && !activeApps.includes(w.gateForApp)) continue;
    out.push(w);
  }
  return out;
}

export default { registerWidget, getWidget, listWidgets };
