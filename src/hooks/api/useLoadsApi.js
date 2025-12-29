/**
 * useLoadsApi - API hook for load operations
 *
 * This hook wraps the loads API and provides consistent
 * loading/error state management.
 *
 * Components should NOT import loadsApi directly.
 * Use this hook or the higher-level useLoads domain hook.
 */

import { useCallback } from 'react';
import { useApiRequest, useApiState, useMutation } from './useApiRequest';
import loadsApi from '../../api/loads.api';

/**
 * Hook for fetching loads list
 */
export function useLoadsList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => loadsApi.getLoads(filters),
    { initialData: [] }
  );

  const fetchLoads = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    loads: data || [],
    loading,
    error,
    fetchLoads,
    setLoads: setData,
    clearError
  };
}

/**
 * Hook for fetching a single load
 */
export function useLoadDetail(loadId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => loadsApi.getLoad(loadId),
    { initialData: null }
  );

  const fetchLoad = useCallback(() => {
    if (!loadId) return Promise.resolve(null);
    return fetch();
  }, [fetch, loadId]);

  return {
    load: data,
    loading,
    error,
    fetchLoad,
    setLoad: setData,
    clearError
  };
}

/**
 * Hook for load mutations (create, update, delete)
 */
export function useLoadMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createLoad = useCallback(async (data, options) => {
    return mutate(() => loadsApi.createLoad(data), options);
  }, [mutate]);

  const updateLoad = useCallback(async (loadId, data, options) => {
    return mutate(() => loadsApi.updateLoad(loadId, data), options);
  }, [mutate]);

  const deleteLoad = useCallback(async (loadId, options) => {
    return mutate(() => loadsApi.deleteLoad(loadId), options);
  }, [mutate]);

  const updateStatus = useCallback(async (loadId, status, options) => {
    return mutate(() => loadsApi.updateLoadStatus(loadId, status), options);
  }, [mutate]);

  const updateBillingStatus = useCallback(async (loadId, status, options) => {
    return mutate(() => loadsApi.updateBillingStatus(loadId, status), options);
  }, [mutate]);

  return {
    createLoad,
    updateLoad,
    deleteLoad,
    updateStatus,
    updateBillingStatus,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for load stops operations
 */
export function useLoadStops(loadId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => loadsApi.getStops(loadId),
    { initialData: [] }
  );

  const { mutate, loading: mutating } = useMutation();

  const fetchStops = useCallback(() => {
    if (!loadId) return Promise.resolve([]);
    return fetch();
  }, [fetch, loadId]);

  const addStop = useCallback(async (stopData, options) => {
    const result = await mutate(() => loadsApi.addStop(loadId, stopData), options);
    // Optimistically add to local state
    if (result) {
      setData(prev => [...(prev || []), result]);
    }
    return result;
  }, [mutate, loadId, setData]);

  const updateStop = useCallback(async (stopId, data, options) => {
    const result = await mutate(() => loadsApi.updateStop(loadId, stopId, data), options);
    if (result) {
      setData(prev => (prev || []).map(s => s.id === stopId ? { ...s, ...data } : s));
    }
    return result;
  }, [mutate, loadId, setData]);

  const deleteStop = useCallback(async (stopId, options) => {
    await mutate(() => loadsApi.deleteStop(loadId, stopId), options);
    setData(prev => (prev || []).filter(s => s.id !== stopId));
  }, [mutate, loadId, setData]);

  const reorderStops = useCallback(async (stopOrder, options) => {
    await mutate(() => loadsApi.reorderStops(loadId, stopOrder), options);
    // Refetch to get correct order
    return fetchStops();
  }, [mutate, loadId, fetchStops]);

  return {
    stops: data || [],
    loading: loading || mutating,
    error,
    fetchStops,
    addStop,
    updateStop,
    deleteStop,
    reorderStops,
    clearError
  };
}

/**
 * Hook for AI rate con parsing
 */
export function useRateConParser() {
  const { mutate, loading, error, clearError } = useMutation();

  const parseRateCon = useCallback(async (file, options) => {
    return mutate(() => loadsApi.parseRateCon(file), options);
  }, [mutate]);

  return {
    parseRateCon,
    parsing: loading,
    error,
    clearError
  };
}

/**
 * Hook for load statistics
 */
export function useLoadStats(dateRange = {}) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => loadsApi.getLoadStats(dateRange),
    { initialData: null }
  );

  const fetchStats = useCallback((range = dateRange) => {
    return fetch(range);
  }, [fetch, dateRange]);

  return {
    stats: data,
    loading,
    error,
    fetchStats,
    clearError
  };
}

/**
 * Combined hook for common load operations
 * Use this when you need multiple load operations in one component
 */
export function useLoadsApi() {
  const list = useLoadsList();
  const mutations = useLoadMutations();

  return {
    // List operations
    loads: list.loads,
    loadingList: list.loading,
    listError: list.error,
    fetchLoads: list.fetchLoads,
    setLoads: list.setLoads,

    // Mutations
    createLoad: mutations.createLoad,
    updateLoad: mutations.updateLoad,
    deleteLoad: mutations.deleteLoad,
    updateStatus: mutations.updateStatus,
    updateBillingStatus: mutations.updateBillingStatus,
    mutating: mutations.loading,
    mutationError: mutations.error,

    // Combined
    loading: list.loading || mutations.loading,
    clearErrors: () => {
      list.clearError();
      mutations.clearError();
    }
  };
}

export default useLoadsApi;
