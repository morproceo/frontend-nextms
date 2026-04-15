/**
 * CategoryScoreBar — One row of a category score in the Readiness card.
 *
 * Renders: label, score (0–100), weight badge, optional ⓘ tooltip when
 * the category is weak/manual/neutralized (v1.2 §6.3, UX/UI plan §13.1).
 */

import { ManualBaselineTooltip } from './ManualBaselineTooltip';
import { cn } from '../../lib/utils';

export function CategoryScoreBar({ label, score = 0, weight = 0, weakMessage = null }) {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  const isNeutralized = weight === 0;
  const weightPct = (Number(weight) * 100).toFixed(0);

  return (
    <div className="flex items-center gap-3 py-1">
      {/* Label */}
      <div className="flex-1 min-w-0 flex items-center gap-1.5">
        <span className={cn(
          'text-body-sm truncate',
          isNeutralized ? 'text-text-secondary' : 'text-text-primary'
        )}>
          {label}
        </span>
        {weakMessage && <ManualBaselineTooltip message={weakMessage} />}
      </div>

      {/* Bar */}
      <div className="flex-1 max-w-[180px] h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-300',
            isNeutralized ? 'bg-text-secondary/30' : 'bg-accent'
          )}
          style={{ width: `${clamped}%`, opacity: isNeutralized ? 0.5 : 1 }}
        />
      </div>

      {/* Score + weight */}
      <div className="flex items-center gap-2 w-[110px] justify-end shrink-0">
        <span className={cn(
          'text-body-sm font-medium tabular-nums',
          isNeutralized ? 'text-text-secondary' : 'text-text-primary'
        )}>
          {clamped.toFixed(0)}
        </span>
        <span className="text-[10px] text-text-secondary tabular-nums whitespace-nowrap">
          w {weightPct}%
        </span>
      </div>
    </div>
  );
}

export default CategoryScoreBar;
