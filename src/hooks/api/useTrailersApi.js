/**
 * useTrailersApi - API hook for trailer operations
 *
 * This hook wraps the trailers API and provides consistent
 * loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import trailersApi from '../../api/trailers.api';

/**
 * Hook for fetching trailers list
 */
export function useTrailersList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => trailersApi.getTrailers(filters),
    { initialData: [] }
  );

  const fetchTrailers = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    trailers: data || [],
    loading,
    error,
    fetchTrailers,
    setTrailers: setData,
    clearError
  };
}

/**
 * Hook for fetching a single trailer
 */
export function useTrailerDetail(trailerId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => trailersApi.getTrailer(trailerId),
    { initialData: null }
  );

  const fetchTrailer = useCallback(() => {
    if (!trailerId) return Promise.resolve(null);
    return fetch();
  }, [fetch, trailerId]);

  return {
    trailer: data,
    loading,
    error,
    fetchTrailer,
    setTrailer: setData,
    clearError
  };
}

/**
 * Hook for trailer mutations (create, update, delete)
 */
export function useTrailerMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createTrailer = useCallback(async (data, options) => {
    return mutate(() => trailersApi.createTrailer(data), options);
  }, [mutate]);

  const updateTrailer = useCallback(async (trailerId, data, options) => {
    return mutate(() => trailersApi.updateTrailer(trailerId, data), options);
  }, [mutate]);

  const deleteTrailer = useCallback(async (trailerId, options) => {
    return mutate(() => trailersApi.deleteTrailer(trailerId), options);
  }, [mutate]);

  return {
    createTrailer,
    updateTrailer,
    deleteTrailer,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for trailer assignment operations
 */
export function useTrailerAssignments() {
  const { mutate, loading, error, clearError } = useMutation();

  const assignToTruck = useCallback(async (trailerId, truckId, options) => {
    return mutate(() => trailersApi.assignToTruck(trailerId, truckId), options);
  }, [mutate]);

  return {
    assignToTruck,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for trailer statistics
 */
export function useTrailerStats() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => trailersApi.getTrailerStats(),
    { initialData: null }
  );

  return {
    stats: data,
    loading,
    error,
    fetchStats: fetch,
    clearError
  };
}

/**
 * Hook for trailers needing attention
 */
export function useTrailersNeedingAttention() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => trailersApi.getTrailersNeedingAttention(),
    { initialData: [] }
  );

  return {
    trailers: data || [],
    loading,
    error,
    fetch,
    clearError
  };
}

/**
 * Combined hook for common trailer operations
 */
export function useTrailersApi() {
  const list = useTrailersList();
  const mutations = useTrailerMutations();
  const assignments = useTrailerAssignments();

  return {
    // List operations
    trailers: list.trailers,
    loadingList: list.loading,
    listError: list.error,
    fetchTrailers: list.fetchTrailers,
    setTrailers: list.setTrailers,

    // Mutations
    createTrailer: mutations.createTrailer,
    updateTrailer: mutations.updateTrailer,
    deleteTrailer: mutations.deleteTrailer,
    mutating: mutations.loading,
    mutationError: mutations.error,

    // Assignments
    assignToTruck: assignments.assignToTruck,
    assigning: assignments.loading,

    // Combined
    loading: list.loading || mutations.loading || assignments.loading,
    clearErrors: () => {
      list.clearError();
      mutations.clearError();
      assignments.clearError();
    }
  };
}

export default useTrailersApi;
