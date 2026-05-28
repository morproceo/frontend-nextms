import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Check } from 'lucide-react';
import { listWidgets } from '../../widgets/registry';
import { cn } from '../../lib/utils';

/**
 * AddWidgetSheet — modal gallery of available widgets the user can
 * drop onto their dashboard. Portal-mounted so it escapes any
 * ancestor `transform`/`overflow` that would clip it.
 *
 * Each tile shows the widget icon (gradient tinted), its title,
 * and a one-line description. Tiles representing widgets already
 * placed get a "Added" badge — clicking still adds another copy
 * (multiple instances of the same widget type are allowed).
 */
export function AddWidgetSheet({
  open,
  onClose,
  onAdd,
  placedWidgetIds = [],
  role,
  activeApps
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const widgets = listWidgets({ role, activeApps });
  const placedSet = new Set(placedWidgetIds);

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />
      <div
        className="relative bg-surface-primary rounded-t-card md:rounded-card border border-surface-tertiary w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'min(90vh, 700px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-orange-400/10">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-fuchsia-500" />
            <span className="text-body-sm font-medium text-text-primary">Add a widget</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-text-tertiary hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto bg-surface-primary p-3 sm:p-4">
          {widgets.length === 0 ? (
            <div className="p-8 text-center text-body-sm text-text-tertiary">
              No widgets available yet. Hire an app or change role to see more.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              {widgets.map((w) => {
                const placed = placedSet.has(w.id);
                const Icon = w.icon;
                return (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => onAdd?.(w)}
                    className={cn(
                      'text-left p-3 sm:p-4 rounded-card border border-surface-tertiary bg-surface-secondary',
                      'hover:border-fuchsia-500/40 hover:bg-fuchsia-500/5 transition-colors'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={cn(
                          'w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-gradient-to-br',
                          w.accent || 'from-fuchsia-500 to-violet-500'
                        )}
                      >
                        {Icon && <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-body-sm font-medium text-text-primary truncate">
                            {w.title}
                          </span>
                          {placed && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-700">
                              <Check className="w-2.5 h-2.5" />
                              Added
                            </span>
                          )}
                        </div>
                        {w.description && (
                          <div className="text-[11px] sm:text-small text-text-tertiary leading-snug">
                            {w.description}
                          </div>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <footer className="px-5 py-3 border-t border-surface-tertiary bg-surface-secondary/40 text-[10px] text-text-tertiary">
          Tip: drag the widget header in edit mode to rearrange. Resize from any corner.
        </footer>
      </div>
    </div>,
    document.body
  );
}

export default AddWidgetSheet;
