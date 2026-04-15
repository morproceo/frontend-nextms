/**
 * useReadinessApi - API hooks for Driver Readiness / Load Impact / Scoring Config
 *
 * Components should NOT import readinessApi directly.
 * Use this hook or the higher-level useReadiness domain hook.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import readinessApi from '../../api/readiness.api';

/** Latest readiness snapshot for a driver (recomputes inline if stale on the backend). */
export function useDriverReadinessLatest(driverId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => readinessApi.getDriverReadiness(driverId),
    { initialData: null }
  );

  const fetchReadiness = useCallback(() => {
    if (!driverId) return Promise.resolve(null);
    return fetch();
  }, [fetch, driverId]);

  return { snapshot: data, loading, error, fetchReadiness, setSnapshot: setData, clearError };
}

/** Snapshot history for a driver. */
export function useDriverReadinessHistory(driverId, limit = 20) {
  const { data, loading, error, fetch, setData } = useApiState(
    () => readinessApi.getDriverReadinessHistory(driverId, limit),
    { initialData: [] }
  );

  const fetchHistory = useCallback(() => {
    if (!driverId) return Promise.resolve([]);
    return fetch();
  }, [fetch, driverId]);

  return { history: data || [], loading, error, fetchHistory, setHistory: setData };
}

/** Force a recompute of driver readiness. */
export function useDriverReadinessRecompute() {
  const { mutate, loading, error } = useMutation();
  const recompute = useCallback((driverId, options) => {
    return mutate(() => readinessApi.recomputeDriverReadiness(driverId), options);
  }, [mutate]);
  return { recompute, loading, error };
}

/** Latest impact assessment for a load. */
export function useLoadImpactLatest(loadId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => readinessApi.getLoadImpact(loadId),
    { initialData: null }
  );

  const fetchImpact = useCallback(() => {
    if (!loadId) return Promise.resolve(null);
    return fetch();
  }, [fetch, loadId]);

  return { assessment: data, loading, error, fetchImpact, setAssessment: setData, clearError };
}

/** Force a recompute of load impact. */
export function useLoadImpactRecompute() {
  const { mutate, loading, error } = useMutation();
  const recompute = useCallback((loadId, options) => {
    return mutate(() => readinessApi.recomputeLoadImpact(loadId), options);
  }, [mutate]);
  return { recompute, loading, error };
}

/** Active scoring config for the current org (with global fallback). */
export function useScoringConfig() {
  const { data, loading, error, fetch, setData } = useApiState(
    () => readinessApi.getActiveScoringConfig(),
    { initialData: null }
  );

  return { config: data, loading, error, fetchConfig: fetch, setConfig: setData };
}

/** Org-wide latest tier per driver (for dropdown badges in AssignDriverModal). */
export function useDriverReadinessSummary() {
  const { data, loading, error, fetch, setData } = useApiState(
    () => readinessApi.getDriverReadinessSummary(),
    { initialData: [] }
  );

  return { summary: data || [], loading, error, fetchSummary: fetch, setSummary: setData };
}

/** Phase 6: bulk recompute every driver in the org. */
export function useBulkRecomputeReadiness() {
  const { mutate, loading, error } = useMutation();
  const recomputeAll = useCallback(() => mutate(() => readinessApi.recomputeAllDriverReadiness()), [mutate]);
  return { recomputeAll, loading, error };
}

// --- Phase 7: driver incidents ---

export function useDriverIncidents(driverId) {
  const { data, loading, error, fetch, setData } = useApiState(
    () => readinessApi.listDriverIncidents(driverId),
    { initialData: [] }
  );
  const fetchIncidents = useCallback(() => {
    if (!driverId) return Promise.resolve([]);
    return fetch();
  }, [fetch, driverId]);
  return { incidents: data || [], loading, error, fetchIncidents, setIncidents: setData };
}

export function useDriverIncidentMutations(driverId) {
  const { mutate, loading, error } = useMutation();
  const create = useCallback((data) => mutate(() => readinessApi.createDriverIncident(driverId, data)), [mutate, driverId]);
  const update = useCallback((incidentId, patch) => mutate(() => readinessApi.updateDriverIncident(driverId, incidentId, patch)), [mutate, driverId]);
  const remove = useCallback((incidentId) => mutate(() => readinessApi.deleteDriverIncident(driverId, incidentId)), [mutate, driverId]);
  return { create, update, remove, loading, error };
}

/** Phase 4: synchronously evaluate a (load, driver) pair without persisting an assignment. */
export function useAssignmentEvaluation() {
  const { mutate, loading, error, clearError } = useMutation();

  const evaluate = useCallback(async (loadId, driverId, options) => {
    return mutate(() => readinessApi.evaluateAssignment(loadId, driverId), options);
  }, [mutate]);

  return { evaluate, loading, error, clearError };
}

// --- Phase 5 + 7: evaluation lifecycle (pagination-aware) ---

/**
 * Pagination-aware evaluations list. Backend returns
 * {items, total, limit, offset, has_more}. The hook normalizes that into
 * `evaluations`, `total`, and a `loadMore` callback that appends.
 */
export function useEvaluationsList(initialFilters = {}) {
  const { data, loading, error, fetch, setData } = useApiState(
    (filters) => readinessApi.listEvaluations(filters),
    { initialData: { items: [], total: 0, limit: 50, offset: 0, has_more: false } }
  );

  const fetchEvaluations = useCallback(
    (filters = initialFilters) => fetch(filters),
    [fetch, initialFilters]
  );

  const loadMore = useCallback(async (filters = initialFilters) => {
    const offset = (data?.items?.length) || 0;
    const next = await readinessApi.listEvaluations({ ...filters, offset });
    setData(prev => ({
      ...next,
      items: [...((prev && prev.items) || []), ...((next && next.items) || [])]
    }));
    return next;
  }, [data, initialFilters, setData]);

  // Normalize for legacy consumers that expect `evaluations` to be the array.
  const evaluations = Array.isArray(data) ? data : (data?.items || []);
  return {
    evaluations,
    total: data?.total ?? evaluations.length,
    hasMore: data?.has_more ?? false,
    loading,
    error,
    fetchEvaluations,
    loadMore,
    setEvaluations: setData
  };
}

export function useEvaluationActions() {
  const { mutate, loading, error, clearError } = useMutation();
  const approve = useCallback((id, note) => mutate(() => readinessApi.approveEvaluation(id, note)), [mutate]);
  const reject = useCallback((id, note) => mutate(() => readinessApi.rejectEvaluation(id, note)), [mutate]);
  const override = useCallback((id, reason) => mutate(() => readinessApi.overrideEvaluation(id, reason)), [mutate]);
  return { approve, reject, override, loading, error, clearError };
}

export function useScoringConfigHistory() {
  const { data, loading, error, fetch } = useApiState(
    () => readinessApi.getScoringConfigHistory(),
    { initialData: [] }
  );
  return { history: data || [], loading, error, fetchHistory: fetch };
}

export function useScoringConfigPublish() {
  const { mutate, loading, error } = useMutation();
  const publish = useCallback((payload) => mutate(() => readinessApi.publishScoringConfig(payload)), [mutate]);
  return { publish, loading, error };
}

export function useReadinessFeatureFlag() {
  const { data, loading, error, fetch, setData } = useApiState(
    () => readinessApi.getReadinessFeatureFlag(),
    { initialData: null }
  );
  const { mutate, loading: saving } = useMutation();
  const update = useCallback(async (flag) => {
    const next = await mutate(() => readinessApi.updateReadinessFeatureFlag(flag));
    if (next) setData(next);
    return next;
  }, [mutate, setData]);
  return { flag: data, loading, error, fetchFlag: fetch, update, saving };
}
