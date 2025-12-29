/**
 * useApiRequest - Base hook for API requests
 *
 * Provides consistent loading/error state management across all API calls.
 * This is the foundation layer that all API hooks build upon.
 *
 * Usage:
 *   const { execute, loading, error } = useApiRequest();
 *   const data = await execute(() => api.getData());
 */

import { useState, useCallback, useRef } from 'react';

/**
 * Base hook for making API requests with loading/error state
 */
export function useApiRequest() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track mounted state to prevent state updates after unmount
  const mountedRef = useRef(true);

  /**
   * Execute an API call with automatic state management
   * @param {Function} apiCall - Async function that returns API response
   * @returns {Promise<any>} - Resolves with response data
   */
  const execute = useCallback(async (apiCall) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiCall();

      // Handle different response shapes
      // Some APIs return { success, data }, others return data directly
      const data = response?.data !== undefined ? response.data : response;

      if (mountedRef.current) {
        setLoading(false);
      }

      return data;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message
        || err.response?.data?.message
        || err.message
        || 'An unexpected error occurred';

      if (mountedRef.current) {
        setError(errorMessage);
        setLoading(false);
      }

      throw err;
    }
  }, []);

  /**
   * Clear the current error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Reset all state
   */
  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    execute,
    loading,
    error,
    clearError,
    reset
  };
}

/**
 * useApiState - Hook for managing data fetching with caching
 *
 * Extends useApiRequest with data state management.
 * Useful for GET requests where you want to store the result.
 *
 * Usage:
 *   const { data, loading, error, fetch } = useApiState(() => api.getItems());
 */
export function useApiState(fetcher, options = {}) {
  const { initialData = null, autoFetch = false } = options;

  const [data, setData] = useState(initialData);
  const { execute, loading, error, clearError, reset } = useApiRequest();

  /**
   * Fetch data and store in state
   */
  const fetch = useCallback(async (...args) => {
    try {
      const result = await execute(() => fetcher(...args));
      setData(result);
      return result;
    } catch (err) {
      // Error is already handled by useApiRequest
      return null;
    }
  }, [execute, fetcher]);

  /**
   * Update local data without API call
   */
  const setLocalData = useCallback((updater) => {
    setData(prev => typeof updater === 'function' ? updater(prev) : updater);
  }, []);

  /**
   * Refetch with same params
   */
  const refetch = useCallback(() => {
    return fetch();
  }, [fetch]);

  /**
   * Clear data and reset state
   */
  const clear = useCallback(() => {
    setData(initialData);
    reset();
  }, [initialData, reset]);

  return {
    data,
    loading,
    error,
    fetch,
    refetch,
    setData: setLocalData,
    clearError,
    clear
  };
}

/**
 * useMutation - Hook for create/update/delete operations
 *
 * Designed for operations that modify data on the server.
 * Does NOT store the result - just manages the request lifecycle.
 *
 * Usage:
 *   const { mutate, loading, error } = useMutation();
 *   const result = await mutate(() => api.createItem(data));
 */
export function useMutation() {
  const { execute, loading, error, clearError, reset } = useApiRequest();

  /**
   * Execute a mutation
   * @param {Function} mutationFn - Async mutation function
   * @param {Object} options - Optional callbacks
   * @returns {Promise<any>}
   */
  const mutate = useCallback(async (mutationFn, options = {}) => {
    const { onSuccess, onError } = options;

    try {
      const result = await execute(mutationFn);

      if (onSuccess) {
        onSuccess(result);
      }

      return result;
    } catch (err) {
      if (onError) {
        onError(err);
      }
      throw err;
    }
  }, [execute]);

  return {
    mutate,
    loading,
    error,
    clearError,
    reset
  };
}

export default useApiRequest;
