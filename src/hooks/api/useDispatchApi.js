/**
 * useDispatchApi - API hooks for dispatch command center
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import dispatchApi from '../../api/dispatch.api';

/**
 * Hook for fetching dispatch timeline
 */
export function useDispatchTimeline() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => dispatchApi.getTimeline(filters),
    { initialData: [] }
  );

  const fetchTimeline = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return {
    timeline: data || [],
    loading,
    error,
    fetchTimeline,
    clearError
  };
}

/**
 * Hook for fetching org cost-per-mile settings
 */
export function useCostSettings() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => dispatchApi.getCostSettings(),
    { initialData: null }
  );

  const fetchCostSettings = useCallback(() => {
    return fetch();
  }, [fetch]);

  return {
    costSettings: data,
    loading,
    error,
    fetchCostSettings,
    clearError
  };
}

/**
 * Hook for saving org cost-per-mile settings
 */
export function useSaveCostSettings() {
  const { mutate, loading, error, clearError } = useMutation();

  const saveCostSettings = useCallback(async (data, options = {}) => {
    return mutate(() => dispatchApi.saveCostSettings(data), options);
  }, [mutate]);

  return {
    saveCostSettings,
    saving: loading,
    error,
    clearError
  };
}
