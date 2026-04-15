/**
 * LoadImpactTierBadge — L1..L4 badge with consistent color mapping.
 * Maps to UX/UI plan §4.
 */

import { Badge } from '../ui/Badge';
import { LoadImpactTierConfig } from '../../config/status';
import { cn } from '../../lib/utils';

const sizeClasses = {
  sm: 'text-[10px] px-1.5 py-0.5',
  md: 'text-[11px] px-2 py-0.5',
  lg: 'text-sm px-3 py-1'
};

export function LoadImpactTierBadge({ tier, size = 'md', showLabel = false, className, title }) {
  if (!tier) return null;
  const cfg = LoadImpactTierConfig[tier];
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

export default LoadImpactTierBadge;
