/**
 * useReadiness - Domain hooks for Driver Readiness & Load Impact
 *
 * Composes the API hooks and adds business logic (auto-fetch, recompute
 * with refetch, derived fields).
 *
 * Maps to v1.2 §9 + UX/UI plan §16 Phase 3.
 */

import { useEffect, useCallback } from 'react';
import {
  useDriverReadinessLatest,
  useDriverReadinessHistory,
  useDriverReadinessRecompute,
  useLoadImpactLatest,
  useLoadImpactRecompute
} from '../api/useReadinessApi';

/**
 * Driver Readiness — latest snapshot + recompute action.
 */
export function useDriverReadiness(driverId, { autoFetch = true } = {}) {
  const latest = useDriverReadinessLatest(driverId);
  const recompute = useDriverReadinessRecompute();

  useEffect(() => {
    if (autoFetch && driverId) latest.fetchReadiness();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, driverId]);

  const refresh = useCallback(() => latest.fetchReadiness(), [latest]);

  const recomputeNow = useCallback(async () => {
    const updated = await recompute.recompute(driverId);
    if (updated) latest.setSnapshot(updated);
    return updated;
  }, [recompute, driverId, latest]);

  return {
    snapshot: latest.snapshot,
    loading: latest.loading,
    error: latest.error,
    refresh,
    recomputeNow,
    recomputing: recompute.loading,
    recomputeError: recompute.error
  };
}

/**
 * Driver Readiness History (paginated last N snapshots).
 */
export function useDriverReadinessHistoryDomain(driverId, { limit = 20, autoFetch = true } = {}) {
  const { history, loading, error, fetchHistory } = useDriverReadinessHistory(driverId, limit);

  useEffect(() => {
    if (autoFetch && driverId) fetchHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, driverId, limit]);

  return { history, loading, error, refresh: fetchHistory };
}

/**
 * Load Impact — latest assessment + recompute action.
 */
export function useLoadImpact(loadId, { autoFetch = true } = {}) {
  const latest = useLoadImpactLatest(loadId);
  const recompute = useLoadImpactRecompute();

  useEffect(() => {
    if (autoFetch && loadId) latest.fetchImpact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, loadId]);

  const refresh = useCallback(() => latest.fetchImpact(), [latest]);

  const recomputeNow = useCallback(async () => {
    const updated = await recompute.recompute(loadId);
    if (updated) latest.setAssessment(updated);
    return updated;
  }, [recompute, loadId, latest]);

  return {
    assessment: latest.assessment,
    loading: latest.loading,
    error: latest.error,
    refresh,
    recomputeNow,
    recomputing: recompute.loading,
    recomputeError: recompute.error
  };
}
