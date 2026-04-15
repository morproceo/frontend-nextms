/**
 * EvaluationDecisionBanner
 *
 * Compact decision banner shown inside AssignDriverModal between the
 * driver-select and the Assign button (UX/UI plan §7.1).
 *
 * Three visual variants drive operator clarity:
 *   - allowed         → green check + headline only
 *   - review_required → amber AlertTriangle + reason chips, advisory
 *   - blocked         → red XCircle + reason chips
 *
 * Phase 4 is non-blocking: this component renders the decision but the
 * Assign button stays usable. Override / Request Review controls land in
 * Phase 5.
 */

import { CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { ReadinessTierBadge } from './ReadinessTierBadge';
import { LoadImpactTierBadge } from './LoadImpactTierBadge';
import { ReasonCodeList } from './ReasonCodeList';
import { EvaluationDecisionConfig } from '../../config/status';
import { cn } from '../../lib/utils';

const VARIANT_STYLES = {
  allowed:         { wrap: 'bg-success/10 border-success/30 text-success', Icon: CheckCircle },
  review_required: { wrap: 'bg-warning/10 border-warning/30 text-warning', Icon: AlertTriangle },
  blocked:         { wrap: 'bg-error/10 border-error/30 text-error',       Icon: XCircle }
};

export function EvaluationDecisionBanner({ evaluation, maxReasons = 3 }) {
  if (!evaluation) return null;

  const decision = evaluation.decision;
  const cfg = EvaluationDecisionConfig[decision] || EvaluationDecisionConfig.allowed;
  const styles = VARIANT_STYLES[decision] || VARIANT_STYLES.allowed;
  const Icon = styles.Icon;
  const reasons = evaluation.reason_codes || [];

  // Filter out info-severity disclosures from the compact display unless they're
  // the only thing we have — keeps the banner focused on actionable signal.
  const actionable = reasons.filter(r => r.severity !== 'info');
  const display = actionable.length > 0 ? actionable : reasons;

  const headline = decision === 'allowed'
    ? 'Driver meets load requirements'
    : decision === 'review_required'
      ? 'Manual review recommended'
      : 'Driver cannot be assigned';

  return (
    <div className={cn('rounded-lg border p-3', styles.wrap)}>
      <div className="flex items-start gap-2">
        <Icon className="w-5 h-5 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          {/* Headline + tier facts */}
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-body-sm font-semibold">
              {headline}
            </span>
            <div className="flex items-center gap-1.5 text-text-primary">
              <ReadinessTierBadge tier={evaluation.driver_tier_at_eval} size="sm" />
              <span className="text-[10px] text-text-secondary">vs</span>
              <ReadinessTierBadge
                tier={evaluation.min_required_tier_at_eval}
                size="sm"
                title={`Minimum required for ${evaluation.load_tier_at_eval}`}
              />
              <LoadImpactTierBadge tier={evaluation.load_tier_at_eval} size="sm" className="ml-1" />
            </div>
          </div>

          {/* Reason codes (compact, capped) */}
          {display.length > 0 && (
            <div className="mt-2 text-text-primary">
              <ReasonCodeList reasons={display} compact max={maxReasons} />
            </div>
          )}

          {/* Phase 4 honesty: warn-only mode caption */}
          <div className="mt-2 flex items-center gap-1 text-[11px] text-text-secondary">
            <Info className="w-3 h-3" />
            {decision === 'allowed'
              ? `${cfg.label} — proceed to assign`
              : `${cfg.label} — advisory only in this rollout phase`
            }
          </div>
        </div>
      </div>
    </div>
  );
}

export default EvaluationDecisionBanner;
