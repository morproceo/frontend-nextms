/**
 * DriverReadinessCard
 *
 * Renders the latest driver_readiness_snapshot for a driver. Inserted into
 * DriverDetailPage between the License & Compliance card and Pay & Classification
 * (UX/UI plan §8.1).
 *
 * V1 honesty:
 *   - service_reliability shows weight 0 with ⓘ tooltip (load_stops empty).
 *   - safety_performance / communication_quality / trend_improvement show
 *     manual-baseline tooltips.
 *   - HOS chip omitted for orgs without an active Motive integration.
 */

import { useState } from 'react';
import { Shield, RefreshCw, History, CheckCircle, XCircle, AlertTriangle, MinusCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Badge } from '../../ui/Badge';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { CategoryScoreBar } from '../../readiness/CategoryScoreBar';
import { ManualBaselineTooltip } from '../../readiness/ManualBaselineTooltip';
import { useDriverReadiness } from '../../../hooks/domain/useReadiness';
import { useOrg } from '../../../contexts/OrgContext';
import {
  ReadinessTierConfig,
  ReadinessCategoryLabels,
  ReadinessWeakCategories
} from '../../../config/status';
import { DriverReadinessHistoryDrawer } from './DriverReadinessHistoryDrawer';

// Hard gates we display chips for. Order is intentional (CDL, Medical first).
// HOS is conditionally appended only when org has Motive integration.
const HARD_GATE_CHIPS = [
  { code: 'HARD_GATE.CDL_VALID_FAILED',          label: 'CDL' },
  { code: 'HARD_GATE.MEDICAL_CURRENT_FAILED',    label: 'Medical' },
  { code: 'HARD_GATE.CLEARINGHOUSE_OK_FAILED',   label: 'Clearinghouse' },
  { code: 'HARD_GATE.MVR_OK_FAILED',             label: 'MVR' },
  { code: 'HARD_GATE.DQ_FILE_OK_FAILED',         label: 'DQ File' },
  { code: 'HARD_GATE.PSP_ON_FILE_FAILED',        label: 'PSP' },
  { code: 'HARD_GATE.ENDORSEMENTS_MATCH_FAILED', label: 'Endorsements' },
  { code: 'HARD_GATE.NO_ACTIVE_OOS_BLOCKER_FAILED', label: 'OOS' },
  { code: 'HARD_GATE.EQUIPMENT_MATCH_FAILED',    label: 'Equipment' }
];

function getGateStatus(failures, gateCode) {
  const fail = (failures || []).find(f => f.code === gateCode);
  if (!fail) return { variant: 'green', icon: CheckCircle, label: 'Pass' };
  if (fail.severity === 'block') return { variant: 'red', icon: XCircle, label: 'Block' };
  return { variant: 'yellow', icon: AlertTriangle, label: 'Review' };
}

function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function DriverReadinessCard({ driverId }) {
  const { hasPermission } = useOrg();
  const { snapshot, loading, error, recomputeNow, recomputing } = useDriverReadiness(driverId);
  const [historyOpen, setHistoryOpen] = useState(false);

  const canRecompute = hasPermission('readiness:recompute');
  const orgHasMotive = snapshot?.signals_snapshot?.org_has_motive ?? false;

  if (loading && !snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-error/5 border border-error/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-error">
            <AlertTriangle className="w-5 h-5" /> Readiness — error
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

  if (!snapshot) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> Readiness
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mb-3">
              <Shield className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">Readiness not yet computed</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              Generate the first readiness snapshot for this driver.
            </p>
            {canRecompute && (
              <Button onClick={recomputeNow} loading={recomputing}>
                <RefreshCw className="w-4 h-4 mr-2" /> Recompute
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const tier = snapshot.readiness_tier;
  const score = Number(snapshot.readiness_score) || 0;
  const tierCfg = ReadinessTierConfig[tier] || {};
  const categoryScores = snapshot.category_scores || {};
  const weights = snapshot.signals_snapshot?.weights || {};
  const failures = snapshot.hard_gate_result?.failures || [];

  // Filter HOS chip per v1.2 §6.10 — suppress entirely for non-Motive orgs.
  const visibleGates = HARD_GATE_CHIPS.filter(g => {
    return true; // CDL/Medical/etc always shown
  });
  const showHosChip = orgHasMotive;

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-accent" /> Readiness
            </CardTitle>
            <div className="flex items-center gap-2">
              {canRecompute && (
                <Button
                  onClick={recomputeNow}
                  loading={recomputing}
                  variant="ghost"
                  size="sm"
                  title="Recompute readiness"
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <Button
                onClick={() => setHistoryOpen(true)}
                variant="ghost"
                size="sm"
                title="View snapshot history"
              >
                <History className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          {/* Tier + score row */}
          <div className="flex items-center gap-4">
            <ReadinessTierBadge tier={tier} size="lg" showLabel />
            <div className="flex-1">
              <div className="text-title-sm tabular-nums text-text-primary">
                {score.toFixed(0)} <span className="text-body-sm text-text-secondary">/ 100</span>
              </div>
              <div className="text-body-sm text-text-secondary">{tierCfg.description}</div>
            </div>
          </div>

          {/* Eligibility flags */}
          <div className="flex flex-wrap gap-2">
            {snapshot.high_impact_eligible && <Badge variant="green">High-impact eligible</Badge>}
            {snapshot.dedicated_eligible && <Badge variant="blue">Dedicated eligible</Badge>}
            {!snapshot.high_impact_eligible && tier !== 'D0' && (
              <Badge variant="gray">Not yet high-impact eligible</Badge>
            )}
          </div>

          {/* Hard gate chips */}
          <div>
            <div className="text-body-sm text-text-secondary mb-2">Hard gates</div>
            <div className="flex flex-wrap gap-1.5">
              {visibleGates.map(g => {
                const status = getGateStatus(failures, g.code);
                const Icon = status.icon;
                return (
                  <span
                    key={g.code}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-[11px]
                      bg-surface-secondary border border-surface-tertiary"
                    title={`${g.label}: ${status.label}`}
                  >
                    <Icon className={`w-3 h-3 ${
                      status.variant === 'green' ? 'text-success' :
                      status.variant === 'yellow' ? 'text-warning' :
                      'text-error'
                    }`} />
                    {g.label}
                  </span>
                );
              })}
              {showHosChip && (() => {
                const status = getGateStatus(failures, 'HARD_GATE.HOS_FEASIBLE_FAILED');
                const Icon = status.icon;
                return (
                  <span
                    key="hos"
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-chip text-[11px]
                      bg-surface-secondary border border-surface-tertiary"
                    title={`HOS: ${status.label} (Motive)`}
                  >
                    <Icon className={`w-3 h-3 ${
                      status.variant === 'green' ? 'text-success' :
                      status.variant === 'yellow' ? 'text-warning' :
                      'text-error'
                    }`} />
                    HOS
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Categories */}
          <div>
            <div className="text-body-sm text-text-secondary mb-2">Categories</div>
            <div className="space-y-0.5">
              {Object.entries(ReadinessCategoryLabels).map(([key, label]) => (
                <CategoryScoreBar
                  key={key}
                  label={label}
                  score={categoryScores[key]}
                  weight={weights[key] != null ? weights[key] : (snapshot.weights || {})[key] || 0}
                  weakMessage={ReadinessWeakCategories[key]}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between text-[11px] text-text-secondary border-t border-surface-tertiary pt-3">
            <span>Last computed {timeAgo(snapshot.computed_at)}</span>
            <span>Config {snapshot.scoring_config_version}</span>
          </div>
        </CardContent>
      </Card>

      <DriverReadinessHistoryDrawer
        driverId={driverId}
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
      />
    </>
  );
}

export default DriverReadinessCard;
