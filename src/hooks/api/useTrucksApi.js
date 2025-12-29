/**
 * useTrucksApi - API hook for truck operations
 *
 * This hook wraps the trucks API and provides consistent
 * loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import trucksApi from '../../api/trucks.api';

/**
 * Hook for fetching trucks list
 */
export function useTrucksList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => trucksApi.getTrucks(filters),
    { initialData: [] }
  );

  const fetchTrucks = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    trucks: data || [],
    loading,
    error,
    fetchTrucks,
    setTrucks: setData,
    clearError
  };
}

/**
 * Hook for fetching a single truck
 */
export function useTruckDetail(truckId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => trucksApi.getTruck(truckId),
    { initialData: null }
  );

  const fetchTruck = useCallback(() => {
    if (!truckId) return Promise.resolve(null);
    return fetch();
  }, [fetch, truckId]);

  return {
    truck: data,
    loading,
    error,
    fetchTruck,
    setTruck: setData,
    clearError
  };
}

/**
 * Hook for truck mutations (create, update, delete)
 */
export function useTruckMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createTruck = useCallback(async (data, options) => {
    return mutate(() => trucksApi.createTruck(data), options);
  }, [mutate]);

  const updateTruck = useCallback(async (truckId, data, options) => {
    return mutate(() => trucksApi.updateTruck(truckId, data), options);
  }, [mutate]);

  const deleteTruck = useCallback(async (truckId, options) => {
    return mutate(() => trucksApi.deleteTruck(truckId), options);
  }, [mutate]);

  return {
    createTruck,
    updateTruck,
    deleteTruck,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for truck assignment operations
 */
export function useTruckAssignments() {
  const { mutate, loading, error, clearError } = useMutation();

  const assignDriver = useCallback(async (truckId, driverId, options) => {
    return mutate(() => trucksApi.assignDriver(truckId, driverId), options);
  }, [mutate]);

  const assignTrailer = useCallback(async (truckId, trailerId, options) => {
    return mutate(() => trucksApi.assignTrailer(truckId, trailerId), options);
  }, [mutate]);

  return {
    assignDriver,
    assignTrailer,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for truck statistics
 */
export function useTruckStats() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => trucksApi.getTruckStats(),
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
 * Hook for trucks needing attention
 */
export function useTrucksNeedingAttention() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => trucksApi.getTrucksNeedingAttention(),
    { initialData: [] }
  );

  return {
    trucks: data || [],
    loading,
    error,
    fetch,
    clearError
  };
}

/**
 * Combined hook for common truck operations
 */
export function useTrucksApi() {
  const list = useTrucksList();
  const mutations = useTruckMutations();
  const assignments = useTruckAssignments();

  return {
    // List operations
    trucks: list.trucks,
    loadingList: list.loading,
    listError: list.error,
    fetchTrucks: list.fetchTrucks,
    setTrucks: list.setTrucks,

    // Mutations
    createTruck: mutations.createTruck,
    updateTruck: mutations.updateTruck,
    deleteTruck: mutations.deleteTruck,
    mutating: mutations.loading,
    mutationError: mutations.error,

    // Assignments
    assignDriver: assignments.assignDriver,
    assignTrailer: assignments.assignTrailer,
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

export default useTrucksApi;
