import { useMemo, useState, useEffect, useRef } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { Plus, Pencil, Check, RotateCcw } from 'lucide-react';
import { getWidget } from '../../widgets/registry';
import { defaultLayout } from '../../widgets/layoutStore';
import { WidgetHost } from './WidgetHost';
import { cn } from '../../lib/utils';

const ResponsiveGrid = WidthProvider(Responsive);

// IMPORTANT: react-grid-layout's WidthProvider measures the
// CONTAINER, not the viewport. Our launcher container is capped at
// max-w-[1080px], so the largest width RGL ever sees is ~1080.
// Anything above that range is moot — set the lg threshold below it
// so desktop always lands on lg (12 cols, side-by-side widgets).
//
// Two breakpoints: lg for desktop layout, xs for phones (1-col
// stack). Tablets land on lg because the desktop layout works fine
// down to ~700px.
const BREAKPOINTS = { lg: 700, xs: 0 };
const COLS = { lg: 12, xs: 1 };
// Smaller row height + bigger gap → more iCloud-like rhythm.
const ROW_HEIGHT = 44;

/**
 * WidgetGrid — responsive dashboard for the launcher.
 *
 * Props:
 *   layout      : { widgets: [{ id, widgetId, x, y, w, h }] }
 *   onChange    : (nextLayout) => void  — fires when user moves/resizes/removes
 *   onAdd       : () => void            — open the "+ Add widget" gallery
 *
 * Drag handle scope: only the WidgetHost header is grabable
 * (`.widget-drag-handle`). Clicks inside a widget body never
 * trigger a drag.
 *
 * Edit mode: toggled by the button in the header. While editing,
 * widgets get a fuchsia ring, the header turns into a drag handle,
 * and an X appears to remove. Outside edit mode the grid is read-
 * only and looks clean.
 */
export function WidgetGrid({ layout, onChange, onAdd, className }) {
  const [editMode, setEditMode] = useState(false);
  // Track the active RGL breakpoint via a ref so handleLayoutChange
  // sees the freshest value without waiting for a state flush. We
  // only persist while at lg — see handleLayoutChange below.
  const bpRef = useRef('lg');

  // react-grid-layout consumes a per-breakpoint layout map. We keep
  // the lg layout as the source of truth and derive smaller bps as
  // 1-col stacks (no drag value on phones anyway).
  const rglLayouts = useMemo(() => {
    const lg = (layout?.widgets || []).map((w) => {
      // Per-widget minimums come from each spec's `minSize`; falls
      // back to a sensible floor so unknown widgets stay usable.
      const spec = getWidget(w.widgetId);
      const minW = spec?.minSize?.w ?? 2;
      const minH = spec?.minSize?.h ?? 3;
      // Clamp persisted w/h up to minSize so already-corrupted layouts
      // in localStorage (saved at xs=1 col after a narrow resize round-
      // trip) self-heal on next render.
      return {
        i: w.id,
        x: w.x ?? 0,
        y: w.y ?? 0,
        w: Math.max(w.w ?? 6, minW),
        h: Math.max(w.h ?? 6, minH),
        minW,
        minH
      };
    });
    // Phone fallback: each widget becomes a full-width row in
    // source order. Drag/resize is gated off below md anyway.
    const xs = lg.map((it, i) => ({
      ...it,
      x: 0,
      y: i * 100,
      w: COLS.xs
    }));
    return { lg, xs };
  }, [layout]);

  // Persist layout changes only when the user actually moves/resizes
  // AT the lg breakpoint. RGL fires onLayoutChange on every render,
  // including when it switches to xs (1-col stack) on a narrow resize
  // — writing that back would clobber every widget's saved width down
  // to 1 and leave the dashboard stuck as thin strips after the user
  // resizes back wide. So we gate persistence to the lg breakpoint.
  const handleLayoutChange = (current /*, all */) => {
    if (!Array.isArray(current)) return;
    if (bpRef.current !== 'lg') return;
    const byI = new Map(current.map((it) => [it.i, it]));
    const next = {
      widgets: (layout?.widgets || []).map((w) => {
        const it = byI.get(w.id);
        if (!it) return w;
        return { ...w, x: it.x, y: it.y, w: it.w, h: it.h };
      })
    };
    // Cheap dirty check so we don't churn parent re-renders.
    if (JSON.stringify(next) !== JSON.stringify(layout)) {
      onChange?.(next);
    }
  };

  const handleRemove = (instanceId) => {
    onChange?.({
      widgets: (layout?.widgets || []).filter((w) => w.id !== instanceId)
    });
  };

  // Block edit-mode interactions on narrow viewports; the UX is too
  // hard to use on phones. (Was checking BREAKPOINTS.md, which is
  // undefined — `lg` is the only desktop key we define.)
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth < BREAKPOINTS.lg && editMode) setEditMode(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [editMode]);

  return (
    <section className={cn('relative', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-end gap-2 mb-3 sm:mb-4">
        {editMode && (
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Reset your dashboard to the default layout?')) {
                onChange?.(defaultLayout());
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm font-medium text-white/70 hover:text-white bg-white/[0.06] hover:bg-white/10 backdrop-blur transition-colors"
            title="Reset dashboard to the default layout"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        )}
        {editMode && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-body-sm font-medium text-white bg-white/10 hover:bg-white/15 backdrop-blur transition-colors"
          >
            <span>Add Tile</span>
            <span className="w-5 h-5 rounded-full bg-white text-slate-900 flex items-center justify-center">
              <Plus className="w-3.5 h-3.5" strokeWidth={2.5} />
            </span>
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditMode((v) => !v)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-body-sm font-medium transition-colors',
            editMode
              ? 'bg-white text-slate-900 hover:bg-white/90 shadow-sm'
              : 'bg-white/10 hover:bg-white/15 text-white backdrop-blur'
          )}
        >
          {editMode ? 'Done' : (
            <>
              <Pencil className="w-3.5 h-3.5" />
              <span>Edit</span>
            </>
          )}
        </button>
      </div>

      {(!layout?.widgets || layout.widgets.length === 0) ? (
        <EmptyState onAdd={onAdd} editMode={editMode} onEdit={() => setEditMode(true)} />
      ) : (
        <ResponsiveGrid
          className="layout"
          layouts={rglLayouts}
          breakpoints={BREAKPOINTS}
          cols={COLS}
          rowHeight={ROW_HEIGHT}
          margin={[20, 20]}
          containerPadding={[0, 0]}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          onBreakpointChange={(bp) => { bpRef.current = bp; }}
          compactType="vertical"
          preventCollision={false}
          useCSSTransforms
        >
          {(layout.widgets || []).map((w) => {
            const spec = getWidget(w.widgetId);
            if (!spec) return (
              <div key={w.id} className="h-full">
                <WidgetHost
                  title="Missing widget"
                  editMode={editMode}
                  onRemove={() => handleRemove(w.id)}
                >
                  <div className="p-4 text-small text-white/45">
                    Widget "{w.widgetId}" isn't registered.
                  </div>
                </WidgetHost>
              </div>
            );
            const Body = spec.component;
            return (
              <div key={w.id} className="h-full">
                <WidgetHost
                  title={spec.title}
                  bare={spec.bare}
                  editMode={editMode}
                  onRemove={() => handleRemove(w.id)}
                >
                  <Body />
                </WidgetHost>
              </div>
            );
          })}
        </ResponsiveGrid>
      )}
    </section>
  );
}

function EmptyState({ onAdd, editMode, onEdit }) {
  return (
    <div className="bg-white/[0.04] border border-white/[0.08] border-dashed rounded-card p-8 sm:p-10 text-center">
      <div className="text-white/70 text-body-sm mb-3">
        Your dashboard is empty. Add a widget to see live info from your apps.
      </div>
      <button
        type="button"
        onClick={editMode ? onAdd : onEdit}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] transition-transform"
      >
        <Plus className="w-3.5 h-3.5" />
        {editMode ? 'Pick a widget' : 'Add your first widget'}
      </button>
    </div>
  );
}

export default WidgetGrid;
