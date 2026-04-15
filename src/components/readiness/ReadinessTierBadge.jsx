/**
 * ReadinessTierBadge — D0..D4 badge with consistent color mapping.
 * Maps to UX/UI plan §4 (new shared components).
 */

import { Badge } from '../ui/Badge';
import { ReadinessTierConfig } from '../../config/status';
import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-sm px-3 py-1'
};

export function ReadinessTierBadge({ tier, size = 'md', showLabel = false, className, title }) {
  if (!tier) return null;
  const cfg = ReadinessTierConfig[tier];
  if (!cfg) return null;

  return (
    <Badge
      variant={cfg.variant}
      className={cn(sizeClasses[size], className)}
      title={title || cfg.description}
    >
      {showLabel ? cfg.label : cfg.short}
    </Badge>
  );
}

export default ReadinessTierBadge;
