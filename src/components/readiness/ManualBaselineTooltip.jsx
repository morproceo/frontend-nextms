/**
 * ManualBaselineTooltip — Info icon with hover tooltip.
 *
 * Used next to readiness/impact categories that are weak, manual, or
 * neutralized in V1 (per v1.2 §6.3 and UX/UI plan §13.1). Honest disclosure
 * is a feature.
 */

import { Info } from 'lucide-react';
import { cn } from '../../lib/utils';

export function ManualBaselineTooltip({ message, className }) {
  if (!message) return null;
  return (
    <span
      className={cn(
        'inline-flex items-center text-text-secondary hover:text-text-primary cursor-help',
        className
      )}
      title={message}
      aria-label={message}
    >
      <Info className="w-3.5 h-3.5" />
    </span>
  );
}

export default ManualBaselineTooltip;
