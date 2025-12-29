/**
 * useDriversApi - API hook for driver operations
 *
 * This hook wraps the drivers API and provides consistent
 * loading/error state management.
 *
 * Components should NOT import driversApi directly.
 * Use this hook or the higher-level useDrivers domain hook.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import driversApi from '../../api/drivers.api';

/**
 * Hook for fetching drivers list
 */
export function useDriversList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => driversApi.getDrivers(filters),
    { initialData: [] }
  );

  const fetchDrivers = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    drivers: data || [],
    loading,
    error,
    fetchDrivers,
    setDrivers: setData,
    clearError
  };
}

/**
 * Hook for fetching a single driver
 */
export function useDriverDetail(driverId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => driversApi.getDriver(driverId),
    { initialData: null }
  );

  const fetchDriver = useCallback(() => {
    if (!driverId) return Promise.resolve(null);
    return fetch();
  }, [fetch, driverId]);

  return {
    driver: data,
    loading,
    error,
    fetchDriver,
    setDriver: setData,
    clearError
  };
}

/**
 * Hook for driver mutations (create, update, delete)
 */
export function useDriverMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createDriver = useCallback(async (data, options) => {
    return mutate(() => driversApi.createDriver(data), options);
  }, [mutate]);

  const updateDriver = useCallback(async (driverId, data, options) => {
    return mutate(() => driversApi.updateDriver(driverId, data), options);
  }, [mutate]);

  const deleteDriver = useCallback(async (driverId, options) => {
    return mutate(() => driversApi.deleteDriver(driverId), options);
  }, [mutate]);

  return {
    createDriver,
    updateDriver,
    deleteDriver,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for driver invitation operations
 */
export function useDriverInvite(driverId) {
  const { mutate, loading, error, clearError } = useMutation();

  const { data: inviteStatus, fetch: fetchStatus } = useApiState(
    () => driversApi.getDriverInviteStatus(driverId),
    { initialData: null }
  );

  const inviteDriver = useCallback(async (options) => {
    return mutate(() => driversApi.inviteDriver(driverId), options);
  }, [mutate, driverId]);

  const resendInvite = useCallback(async (options) => {
    return mutate(() => driversApi.resendDriverInvite(driverId), options);
  }, [mutate, driverId]);

  const getInviteStatus = useCallback(() => {
    if (!driverId) return Promise.resolve(null);
    return fetchStatus();
  }, [fetchStatus, driverId]);

  return {
    inviteStatus,
    inviteDriver,
    resendInvite,
    getInviteStatus,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for driver invite acceptance (public route - no auth required)
 */
export function useDriverInviteAccept(token) {
  const { mutate, loading: accepting, error: acceptError, clearError } = useMutation();

  const { data: inviteInfo, loading: loadingInfo, error: infoError, fetch } = useApiState(
    () => driversApi.getDriverInviteInfo(token),
    { initialData: null }
  );

  const fetchInviteInfo = useCallback(() => {
    if (!token) return Promise.resolve(null);
    return fetch();
  }, [fetch, token]);

  const acceptInvite = useCallback(async (password, options) => {
    return mutate(() => driversApi.acceptDriverInvite(token, password), options);
  }, [mutate, token]);

  return {
    inviteInfo,
    loadingInfo,
    infoError,
    fetchInviteInfo,
    acceptInvite,
    accepting,
    acceptError,
    clearError
  };
}

/**
 * Hook for getting current user's driver profiles
 */
export function useMyDriverProfiles() {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => driversApi.getMyDriverProfiles(),
    { initialData: [] }
  );

  return {
    profiles: data || [],
    loading,
    error,
    fetchProfiles: fetch,
    clearError
  };
}

/**
 * Combined hook for common driver operations
 * Use this when you need multiple driver operations in one component
 */
export function useDriversApi() {
  const list = useDriversList();
  const mutations = useDriverMutations();

  return {
    // List operations
    drivers: list.drivers,
    loadingList: list.loading,
    listError: list.error,
    fetchDrivers: list.fetchDrivers,
    setDrivers: list.setDrivers,

    // Mutations
    createDriver: mutations.createDriver,
    updateDriver: mutations.updateDriver,
    deleteDriver: mutations.deleteDriver,
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

export default useDriversApi;
