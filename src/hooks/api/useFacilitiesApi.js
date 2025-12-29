/**
 * useFacilitiesApi - API hook for facility operations
 *
 * This hook wraps the facilities API and provides consistent
 * loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import facilitiesApi from '../../api/facilities.api';

/**
 * Hook for fetching facilities list
 */
export function useFacilitiesList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => facilitiesApi.getFacilities(filters),
    { initialData: [] }
  );

  const fetchFacilities = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    facilities: data || [],
    loading,
    error,
    fetchFacilities,
    setFacilities: setData,
    clearError
  };
}

/**
 * Hook for fetching a single facility
 */
export function useFacilityDetail(facilityId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => facilitiesApi.getFacility(facilityId),
    { initialData: null }
  );

  const fetchFacility = useCallback(() => {
    if (!facilityId) return Promise.resolve(null);
    return fetch();
  }, [fetch, facilityId]);

  return {
    facility: data,
    loading,
    error,
    fetchFacility,
    setFacility: setData,
    clearError
  };
}

/**
 * Hook for facility mutations (create, update, delete)
 */
export function useFacilityMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createFacility = useCallback(async (data, options) => {
    return mutate(() => facilitiesApi.createFacility(data), options);
  }, [mutate]);

  const updateFacility = useCallback(async (facilityId, data, options) => {
    return mutate(() => facilitiesApi.updateFacility(facilityId, data), options);
  }, [mutate]);

  const deleteFacility = useCallback(async (facilityId, options) => {
    return mutate(() => facilitiesApi.deleteFacility(facilityId), options);
  }, [mutate]);

  return {
    createFacility,
    updateFacility,
    deleteFacility,
    loading,
    error,
    clearError
  };
}

/**
 * Combined hook for common facility operations
 */
export function useFacilitiesApi() {
  const list = useFacilitiesList();
  const mutations = useFacilityMutations();

  return {
    // List operations
    facilities: list.facilities,
    loadingList: list.loading,
    listError: list.error,
    fetchFacilities: list.fetchFacilities,
    setFacilities: list.setFacilities,

    // Mutations
    createFacility: mutations.createFacility,
    updateFacility: mutations.updateFacility,
    deleteFacility: mutations.deleteFacility,
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

export default useFacilitiesApi;
