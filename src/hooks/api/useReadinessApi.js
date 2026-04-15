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

/** Phase 4: synchronously evaluate a (load, driver) pair without persisting an assignment. */
export function useAssignmentEvaluation() {
  const { mutate, loading, error, clearError } = useMutation();

  const evaluate = useCallback(async (loadId, driverId, options) => {
    return mutate(() => readinessApi.evaluateAssignment(loadId, driverId), options);
  }, [mutate]);

  return { evaluate, loading, error, clearError };
}
