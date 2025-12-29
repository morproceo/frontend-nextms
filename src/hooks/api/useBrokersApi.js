/**
 * useBrokersApi - API hook for broker operations
 *
 * This hook wraps the brokers API and provides consistent
 * loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import brokersApi from '../../api/brokers.api';

/**
 * Hook for fetching brokers list
 */
export function useBrokersList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => brokersApi.getBrokers(filters),
    { initialData: [] }
  );

  const fetchBrokers = useCallback((filters = initialFilters) => {
    return fetch(filters);
  }, [fetch, initialFilters]);

  return {
    brokers: data || [],
    loading,
    error,
    fetchBrokers,
    setBrokers: setData,
    clearError
  };
}

/**
 * Hook for fetching a single broker
 */
export function useBrokerDetail(brokerId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => brokersApi.getBroker(brokerId),
    { initialData: null }
  );

  const fetchBroker = useCallback(() => {
    if (!brokerId) return Promise.resolve(null);
    return fetch();
  }, [fetch, brokerId]);

  return {
    broker: data,
    loading,
    error,
    fetchBroker,
    setBroker: setData,
    clearError
  };
}

/**
 * Hook for broker mutations (create, update, delete)
 */
export function useBrokerMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createBroker = useCallback(async (data, options) => {
    return mutate(() => brokersApi.createBroker(data), options);
  }, [mutate]);

  const updateBroker = useCallback(async (brokerId, data, options) => {
    return mutate(() => brokersApi.updateBroker(brokerId, data), options);
  }, [mutate]);

  const deleteBroker = useCallback(async (brokerId, options) => {
    return mutate(() => brokersApi.deleteBroker(brokerId), options);
  }, [mutate]);

  return {
    createBroker,
    updateBroker,
    deleteBroker,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for FMCSA lookup
 */
export function useFmcsaLookup() {
  const { mutate, loading, error, clearError } = useMutation();

  const lookup = useCallback(async (params, options) => {
    return mutate(() => brokersApi.fmcsaLookup(params), options);
  }, [mutate]);

  return {
    lookup,
    loading,
    error,
    clearError
  };
}

/**
 * Combined hook for common broker operations
 */
export function useBrokersApi() {
  const list = useBrokersList();
  const mutations = useBrokerMutations();

  return {
    // List operations
    brokers: list.brokers,
    loadingList: list.loading,
    listError: list.error,
    fetchBrokers: list.fetchBrokers,
    setBrokers: list.setBrokers,

    // Mutations
    createBroker: mutations.createBroker,
    updateBroker: mutations.updateBroker,
    deleteBroker: mutations.deleteBroker,
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

export default useBrokersApi;
