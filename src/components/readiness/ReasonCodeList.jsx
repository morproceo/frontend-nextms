/**
 * ReasonCodeList — Renders an array of reason codes with severity-colored chips.
 *
 * Used by the Load Impact card (review reasons), the assignment-modal
 * EvaluationPanel (Phase 4), and the Evaluations history view (Phase 6).
 */

import { Badge } from '../ui/Badge';
import { ReasonSeverityVariant } from '../../config/status';

export function ReasonCodeList({ reasons = [], compact = false, max = null }) {
  if (!reasons || reasons.length === 0) return null;

  const display = max ? reasons.slice(0, max) : reasons;
  const overflow = max && reasons.length > max ? reasons.length - max : 0;

  return (
    <ul className="space-y-1.5">
      {display.map((r, idx) => (
        <li key={`${r.code}-${idx}`} className="flex items-start gap-2">
          <Badge variant={ReasonSeverityVariant[r.severity] || 'gray'} className="mt-0.5 shrink-0">
            {r.severity || 'info'}
          </Badge>
          <div className="flex-1 min-w-0">
            <div className="text-body-sm text-text-primary">
              {r.message || r.code}
            </div>
            {!compact && r.code && r.code !== r.message && (
              <div className="text-[10px] text-text-secondary font-mono mt-0.5">{r.code}</div>
            )}
          </div>
        </li>
      ))}
      {overflow > 0 && (
        <li className="text-body-sm text-text-secondary">+{overflow} more</li>
      )}
    </ul>
  );
}

export default ReasonCodeList;
