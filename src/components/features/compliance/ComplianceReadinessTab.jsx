/**
 * ComplianceReadinessTab (Phase 6)
 *
 * Driver tier list with filter chips + bulk recompute. Uses the shared
 * /v1/drivers list and joins to /v1/drivers/readiness-summary client-side.
 *
 * Per UX/UI plan §10.1: tier filter (multi-select chips), Recompute selected
 * (V2), Recompute all stale → calls POST /v1/drivers/readiness/recompute-all.
 */

import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, RefreshCw, Users, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { Badge } from '../../ui/Badge';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { useDriversList } from '../../../hooks';
import {
  useDriverReadinessSummary,
  useBulkRecomputeReadiness
} from '../../../hooks/api/useReadinessApi';
import { useOrg } from '../../../contexts/OrgContext';

const TIER_FILTERS = ['D0', 'D1', 'D2', 'D3', 'D4', 'N/A'];

function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function ComplianceReadinessTab() {
  const navigate = useNavigate();
  const { currentOrg, hasPermission } = useOrg();
  const canRecompute = hasPermission('readiness:recompute');

  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();
  const { summary, loading: summaryLoading, fetchSummary } = useDriverReadinessSummary();
  const { recomputeAll, loading: bulking, error: bulkError } = useBulkRecomputeReadiness();

  const [activeFilters, setActiveFilters] = useState(new Set());
  const [bulkResult, setBulkResult] = useState(null);

  useEffect(() => {
    fetchDrivers();
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const summaryByDriver = useMemo(() => {
    const m = new Map();
    const arr = Array.isArray(summary) ? summary : [];
    for (const r of arr) m.set(r.driver_id, r);
    return m;
  }, [summary]);

  const enriched = useMemo(() => {
    const arr = Array.isArray(drivers) ? drivers : [];
    return arr.map(d => {
      const snap = summaryByDriver.get(d.id);
      return {
        ...d,
        tier: snap?.readiness_tier || null,
        score: snap?.readiness_score != null ? Number(snap.readiness_score) : null,
        high_impact_eligible: snap?.high_impact_eligible || false,
        dedicated_eligible: snap?.dedicated_eligible || false,
        computed_at: snap?.computed_at || null
      };
    });
  }, [drivers, summaryByDriver]);

  const filtered = useMemo(() => {
    if (activeFilters.size === 0) return enriched;
    return enriched.filter(d => {
      if (!d.tier) return activeFilters.has('N/A');
      return activeFilters.has(d.tier);
    });
  }, [enriched, activeFilters]);

  const toggleFilter = (key) => {
    const next = new Set(activeFilters);
    next.has(key) ? next.delete(key) : next.add(key);
    setActiveFilters(next);
  };

  const handleRecomputeAll = async () => {
    setBulkResult(null);
    try {
      const result = await recomputeAll();
      setBulkResult(result);
      await fetchSummary();
    } catch {
      /* error is surfaced via bulkError */
    }
  };

  const loading = driversLoading || summaryLoading;

  return (
    <Card padding="none">
      <CardHeader className="px-4 sm:px-5 py-3 mb-0 border-b border-border">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent" /> Driver Readiness
            <span className="text-[11px] font-normal text-text-secondary">
              ({enriched.length} drivers • {summary.length} with snapshot)
            </span>
          </CardTitle>
          {canRecompute && (
            <Button onClick={handleRecomputeAll} disabled={bulking} variant="outline" size="sm">
              {bulking ? <><Spinner size="sm" className="mr-2" /> Recomputing…</> : <><RefreshCw className="w-4 h-4 mr-1" /> Recompute All</>}
            </Button>
          )}
        </div>

        {/* Filter chips */}
        <div className="flex items-center gap-1.5 mt-3 flex-wrap">
          <span className="text-[11px] text-text-secondary mr-1">Filter:</span>
          {TIER_FILTERS.map(t => {
            const active = activeFilters.has(t);
            return (
              <button
                key={t}
                onClick={() => toggleFilter(t)}
                className={`text-[11px] px-2 py-0.5 rounded-chip border transition-colors ${
                  active ? 'bg-accent text-white border-accent' : 'bg-white text-text-primary border-surface-tertiary hover:border-accent'
                }`}
              >
                {t}
              </button>
            );
          })}
          {activeFilters.size > 0 && (
            <button onClick={() => setActiveFilters(new Set())} className="text-[11px] text-text-secondary hover:text-text-primary ml-1">
              Clear
            </button>
          )}
        </div>

        {bulkResult && (
          <div className="mt-3 text-body-sm bg-success/10 border border-success/20 text-success rounded p-2">
            Recomputed {bulkResult.succeeded}/{bulkResult.requested} drivers
            {bulkResult.failed > 0 ? ` (${bulkResult.failed} failed)` : ''}.
          </div>
        )}
        {bulkError && (
          <div className="mt-3 text-body-sm bg-error/10 border border-error/20 text-error rounded p-2">
            {bulkError}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {loading && (
          <div className="flex items-center justify-center py-12"><Spinner size="md" /></div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="text-center py-10 text-body-sm text-text-secondary">
            {activeFilters.size > 0 ? 'No drivers match the active filters.' : 'No drivers in this organization yet.'}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="divide-y divide-border">
            {filtered.map(d => (
              <button
                key={d.id}
                onClick={() => navigate(`/o/${currentOrg?.slug}/drivers/${d.id}`)}
                className="w-full grid grid-cols-[auto_1fr_auto_auto_auto_16px] items-center gap-3 px-4 py-3 text-left hover:bg-surface-secondary/40 transition-colors"
              >
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <div className="min-w-0">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {d.first_name} {d.last_name}
                  </div>
                  <div className="text-[11px] text-text-secondary">
                    {d.tier ? `Computed ${timeAgo(d.computed_at)}` : 'Not yet computed'}
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  {d.high_impact_eligible && <Badge variant="green" className="text-[10px]">HI</Badge>}
                  {d.dedicated_eligible && <Badge variant="blue" className="text-[10px]">Ded.</Badge>}
                </div>
                {d.score != null && (
                  <span className="text-[11px] tabular-nums text-text-secondary">{d.score.toFixed(0)}</span>
                )}
                {d.tier
                  ? <ReadinessTierBadge tier={d.tier} size="sm" />
                  : <span className="text-[11px] text-text-tertiary">—</span>
                }
                <ChevronRight className="w-4 h-4 text-text-tertiary" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default ComplianceReadinessTab;
