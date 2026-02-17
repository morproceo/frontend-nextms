/**
 * usePnlApi - API hook for P&L reporting
 *
 * Wraps the P&L API with consistent loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState } from './useApiRequest';
import pnlApi from '../../api/pnl.api';

/**
 * Hook for fetching P&L report
 */
export function usePnlReport() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => pnlApi.getPnl(filters),
    { initialData: null }
  );

  const fetchPnl = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return {
    report: data,
    loading,
    error,
    fetchPnl,
    clearError
  };
}

/**
 * Hook for fetching P&L trend data
 */
export function usePnlTrend() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => pnlApi.getPnlTrend(filters),
    { initialData: [] }
  );

  const fetchTrend = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return {
    trend: data || [],
    loading,
    error,
    fetchTrend,
    clearError
  };
}

export default usePnlReport;
