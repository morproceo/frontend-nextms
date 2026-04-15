/**
 * ReadinessSummaryCard (Phase 6)
 *
 * Tier-distribution overview for the Compliance Dashboard. Reads the
 * org-wide /v1/drivers/readiness-summary and bins drivers by tier.
 *
 * V1 honesty: drivers without a snapshot are shown as "Not yet computed"
 * (not silently merged into a tier).
 */

import { useEffect, useMemo } from 'react';
import { Shield } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { useDriverReadinessSummary } from '../../../hooks/api/useReadinessApi';

const TIERS = ['D0', 'D1', 'D2', 'D3', 'D4'];

export function ReadinessSummaryCard({ totalDrivers }) {
  const { summary, loading, error, fetchSummary } = useDriverReadinessSummary();

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  const counts = useMemo(() => {
    const c = { D0: 0, D1: 0, D2: 0, D3: 0, D4: 0 };
    for (const r of summary) if (c[r.readiness_tier] != null) c[r.readiness_tier] += 1;
    return c;
  }, [summary]);

  const computed = summary.length;
  const uncomputed = typeof totalDrivers === 'number' ? Math.max(0, totalDrivers - computed) : null;
  const max = Math.max(1, ...Object.values(counts), uncomputed ?? 0);

  return (
    <Card padding="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-accent" /> Readiness Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && !summary.length ? (
          <Spinner size="sm" />
        ) : error ? (
          <p className="text-body-sm text-error">{error}</p>
        ) : (
          <div className="space-y-1.5">
            {TIERS.map(tier => (
              <div key={tier} className="flex items-center gap-3">
                <ReadinessTierBadge tier={tier} size="sm" className="w-10 justify-center" />
                <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${(counts[tier] / max) * 100}%` }} />
                </div>
                <span className="text-body-sm tabular-nums w-8 text-right text-text-primary">{counts[tier]}</span>
              </div>
            ))}
            {uncomputed != null && uncomputed > 0 && (
              <div className="flex items-center gap-3 pt-1 border-t border-surface-tertiary mt-2">
                <span className="text-[11px] uppercase tracking-wide text-text-secondary w-10 text-right shrink-0">N/A</span>
                <div className="flex-1 h-2 bg-surface-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-text-secondary/30 rounded-full" style={{ width: `${(uncomputed / max) * 100}%` }} />
                </div>
                <span className="text-body-sm tabular-nums w-8 text-right text-text-secondary">{uncomputed}</span>
              </div>
            )}
            {uncomputed != null && uncomputed > 0 && (
              <p className="text-[11px] text-text-secondary mt-2">
                {uncomputed} driver{uncomputed !== 1 ? 's' : ''} without a readiness snapshot yet — visit the Readiness tab to recompute.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ReadinessSummaryCard;
