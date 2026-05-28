import { Minus } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * WidgetHost — minimal chrome around a widget body.
 *
 * Inspired by Apple's iCloud / Sequoia widget grid:
 *   - The host is just a rounded glass card. No header bar.
 *   - Widget bodies own their own internal heading + content.
 *   - In edit mode, a small floating "−" remove button overlays the
 *     top-left corner. The whole tile is draggable (no `.handle`
 *     selector — RGL's `isDraggable` toggles the whole grid item).
 *   - A subtle ring + slight scale-down telegraphs "I'm editable".
 *
 * Widgets that need a chromeless presentation (e.g. the Profile
 * tile) can pass `bare` to drop the inner background/border.
 */
export function WidgetHost({
  title, // kept for a11y aria-label only
  bare = false,
  editMode = false,
  onRemove,
  className,
  children
}) {
  return (
    // Outer layer: relative, no overflow clipping. The inner layer
    // is the actual rounded card with overflow-hidden so widget
    // content can't escape the corners. The "−" remove button sits
    // OVER the card's top-left corner (fully visible, not clipped).
    <div
      aria-label={title}
      className={cn('relative h-full w-full', className)}
    >
      <div
        className={cn(
          'relative h-full w-full overflow-hidden',
          bare
            ? 'bg-transparent'
            : 'rounded-[28px] bg-white/[0.04] border border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)_inset]',
          editMode && 'ring-1 ring-fuchsia-400/40'
        )}
      >
        {children}
      </div>

      {editMode && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${title || 'widget'}`}
          className={cn(
            'absolute top-1.5 left-1.5 z-20 w-7 h-7 rounded-full',
            'bg-white text-slate-900 shadow-[0_4px_14px_rgba(0,0,0,0.35)] ring-1 ring-black/10',
            'flex items-center justify-center',
            'hover:scale-110 active:scale-95 transition-transform'
          )}
        >
          <Minus className="w-4 h-4" strokeWidth={2.75} />
        </button>
      )}
    </div>
  );
}

export default WidgetHost;
