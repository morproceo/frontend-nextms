/**
 * LoadImpactCard
 *
 * Renders the latest load_impact_assessment for a load. Inserted into
 * LoadDetailPage directly below the FinancialStrip (UX/UI plan §9.1).
 *
 * Compact composition: tier badge + score + min required driver tier +
 * top contributors + review-required disclosure.
 */

import { Package, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Badge } from '../../ui/Badge';
import { LoadImpactTierBadge } from '../../readiness/LoadImpactTierBadge';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { ReasonCodeList } from '../../readiness/ReasonCodeList';
import { useLoadImpact } from '../../../hooks/domain/useReadiness';
import { useOrg } from '../../../contexts/OrgContext';
import { LoadImpactCategoryLabels, LoadImpactTierConfig } from '../../../config/status';

function topContributors(categoryScores = {}, weights = {}, max = 3) {
  return Object.entries(categoryScores)
    .map(([key, score]) => ({
      key,
      label: LoadImpactCategoryLabels[key] || key,
      contribution: (Number(score) || 0) * (Number(weights[key]) || 0)
    }))
    .filter(c => c.contribution > 0)
    .sort((a, b) => b.contribution - a.contribution)
    .slice(0, max);
}

export function LoadImpactCard({ loadId }) {
  const { hasPermission } = useOrg();
  const { assessment, loading, error, recomputeNow, recomputing } = useLoadImpact(loadId);

  const canRecompute = hasPermission('loads:update');

  if (loading && !assessment) {
    return (
      <Card padding="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" /> Load Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            <Spinner size="sm" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="sm" className="bg-error/5 border border-error/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" /> Load Impact — error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-secondary">{error}</p>
          {canRecompute && (
            <Button onClick={recomputeNow} variant="outline" size="sm" className="mt-3">
              Try Recompute
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!assessment) {
    return (
      <Card padding="sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" /> Load Impact
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <p className="text-body-sm text-text-secondary mb-3">
              Load impact not yet assessed.
            </p>
            {canRecompute && (
              <Button onClick={recomputeNow} loading={recomputing} size="sm">
                <RefreshCw className="w-4 h-4 mr-2" /> Compute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = assessment.impact_tier;
  const score = Number(assessment.impact_score) || 0;
  const minDriverTier = assessment.min_required_driver_tier;
  const tierCfg = LoadImpactTierConfig[tier] || {};
  const categoryScores = assessment.category_scores || {};
  const weights = assessment.signals_snapshot?.weights || {};
  const contributors = topContributors(categoryScores, weights);
  const reviewReasons = assessment.review_reasons || [];

  return (
    <Card padding="sm">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-accent" /> Load Impact
          </CardTitle>
          {canRecompute && (
            <Button
              onClick={recomputeNow}
              loading={recomputing}
              variant="ghost"
              size="sm"
              title="Recompute impact"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Tier + score + min required */}
        <div className="flex items-center gap-3 flex-wrap">
          <LoadImpactTierBadge tier={tier} size="lg" showLabel />
          <div className="flex-1 min-w-[160px]">
            <div className="text-title-sm tabular-nums text-text-primary">
              {score.toFixed(0)} <span className="text-body-sm text-text-secondary">/ 100</span>
            </div>
            <div className="text-body-sm text-text-secondary">{tierCfg.description}</div>
          </div>
          <div className="flex items-center gap-1.5 text-body-sm text-text-secondary">
            <span>Min driver:</span>
            <ReadinessTierBadge tier={minDriverTier} showLabel />
          </div>
        </div>

        {/* Top contributors */}
        {contributors.length > 0 && (
          <div>
            <div className="text-body-sm text-text-secondary mb-1.5">Top contributors</div>
            <ul className="space-y-1">
              {contributors.map(c => (
                <li key={c.key} className="flex items-center gap-2 text-body-sm text-text-primary">
                  <ArrowRight className="w-3 h-3 text-text-secondary shrink-0" />
                  {c.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Review-required disclosure */}
        {assessment.review_required && reviewReasons.length > 0 && (
          <div className="bg-warning/10 border border-warning/20 rounded p-2.5">
            <div className="flex items-center gap-1.5 text-body-sm font-medium text-warning mb-1">
              <AlertTriangle className="w-4 h-4" /> Dispatcher review recommended
            </div>
            <ReasonCodeList reasons={reviewReasons} compact max={3} />
          </div>
        )}

        {/* V1 honesty caption */}
        <div className="text-[11px] text-text-secondary border-t border-surface-tertiary pt-2">
          Sensitivity fields manually entered at booking • Config {assessment.scoring_config_version}
        </div>
      </CardContent>
    </Card>
  );
}

export default LoadImpactCard;
