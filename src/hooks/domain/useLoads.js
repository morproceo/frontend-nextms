/**
 * useLoads - Domain hook for load management
 *
 * This hook composes the API hooks and adds business logic:
 * - Filtering
 * - Sorting
 * - Statistics calculation
 * - Search
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useLoadsList, useLoadDetail, useLoadStops, useLoadMutations } from '../api/useLoadsApi';
import { LoadStatus, LoadQuickFilterStatuses } from '../../config/status';

/**
 * Default sort configuration
 */
const DEFAULT_SORT = {
  field: 'created_at',
  direction: 'desc'
};

/**
 * useLoads - Main domain hook for loads list
 *
 * Usage:
 *   const { loads, stats, loading, filters, setFilters } = useLoads();
 */
export function useLoads(options = {}) {
  const {
    autoFetch = true,
    initialFilters = {}
  } = options;

  // API layer
  const {
    loads: rawLoads,
    loading,
    error,
    fetchLoads,
    setLoads,
    clearError
  } = useLoadsList();

  const mutations = useLoadMutations();

  // Local filter/sort state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [billingFilter, setBillingFilter] = useState(initialFilters.billing || 'all');
  const [sort, setSort] = useState(initialFilters.sort || DEFAULT_SORT);

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchLoads();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount, not when fetchLoads changes

  /**
   * Filtered and sorted loads
   */
  const filteredLoads = useMemo(() => {
    let result = [...rawLoads];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(load =>
        (load.reference_number || '').toLowerCase().includes(q) ||
        (load.customer_load_number || '').toLowerCase().includes(q) ||
        (load.broker?.name || load.broker_name || '').toLowerCase().includes(q) ||
        (load.shipper?.city || '').toLowerCase().includes(q) ||
        (load.consignee?.city || '').toLowerCase().includes(q) ||
        (load.driver?.first_name || '').toLowerCase().includes(q) ||
        (load.driver?.last_name || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(load => load.status === statusFilter);
    }

    // Billing filter
    if (billingFilter !== 'all') {
      result = result.filter(load => load.billing_status === billingFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sort.field) {
        case 'reference_number':
          aVal = a.reference_number || '';
          bVal = b.reference_number || '';
          break;
        case 'pickup_date':
          aVal = a.schedule?.pickup_date || '';
          bVal = b.schedule?.pickup_date || '';
          break;
        case 'delivery_date':
          aVal = a.schedule?.delivery_date || '';
          bVal = b.schedule?.delivery_date || '';
          break;
        case 'revenue':
          aVal = parseFloat(a.financials?.revenue) || 0;
          bVal = parseFloat(b.financials?.revenue) || 0;
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        case 'broker':
          aVal = a.broker?.name || a.broker_name || '';
          bVal = b.broker?.name || b.broker_name || '';
          break;
        default:
          aVal = a.created_at || '';
          bVal = b.created_at || '';
      }

      if (sort.direction === 'asc') {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
      return aVal < bVal ? 1 : aVal > bVal ? -1 : 0;
    });

    return result;
  }, [rawLoads, searchQuery, statusFilter, billingFilter, sort]);

  /**
   * Statistics computed from all loads (not filtered)
   */
  const stats = useMemo(() => {
    const statusCounts = {};
    let totalRevenue = 0;
    let totalDriverPay = 0;
    let totalMiles = 0;

    rawLoads.forEach(load => {
      // Count by status
      statusCounts[load.status] = (statusCounts[load.status] || 0) + 1;

      // Financial totals
      totalRevenue += parseFloat(load.financials?.revenue) || 0;
      totalDriverPay += parseFloat(load.financials?.driver_pay) || 0;
      totalMiles += parseInt(load.financials?.miles) || 0;
    });

    return {
      total: rawLoads.length,
      filtered: filteredLoads.length,
      byStatus: statusCounts,
      totalRevenue,
      totalDriverPay,
      totalMiles,
      margin: totalRevenue - totalDriverPay,
      rpm: totalMiles > 0 ? totalRevenue / totalMiles : 0
    };
  }, [rawLoads, filteredLoads]);

  /**
   * Statistics for filtered loads only
   */
  const filteredStats = useMemo(() => {
    let totalRevenue = 0;
    let totalMiles = 0;

    filteredLoads.forEach(load => {
      totalRevenue += parseFloat(load.financials?.revenue) || 0;
      totalMiles += parseInt(load.financials?.miles) || 0;
    });

    return {
      count: filteredLoads.length,
      totalRevenue,
      totalMiles
    };
  }, [filteredLoads]);

  /**
   * Quick filter chips data
   */
  const quickFilters = useMemo(() => {
    return LoadQuickFilterStatuses.map(status => ({
      status,
      count: stats.byStatus[status] || 0
    })).filter(f => f.count > 0);
  }, [stats.byStatus]);

  /**
   * Sort handler
   */
  const handleSort = useCallback((field) => {
    setSort(prev => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  }, []);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setBillingFilter('all');
    setSort(DEFAULT_SORT);
  }, []);

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback((filters) => {
    if (filters.search !== undefined) setSearchQuery(filters.search);
    if (filters.status !== undefined) setStatusFilter(filters.status);
    if (filters.billing !== undefined) setBillingFilter(filters.billing);
    if (filters.sort !== undefined) setSort(filters.sort);
  }, []);

  /**
   * Refetch loads
   */
  const refetch = useCallback(() => {
    return fetchLoads();
  }, [fetchLoads]);

  /**
   * Create load and refetch list
   */
  const createLoad = useCallback(async (data) => {
    const result = await mutations.createLoad(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update load status and update local state
   */
  const updateLoadStatus = useCallback(async (loadId, status) => {
    await mutations.updateStatus(loadId, status);
    setLoads(prev => prev.map(l =>
      l.id === loadId ? { ...l, status } : l
    ));
  }, [mutations, setLoads]);

  return {
    // Data
    loads: filteredLoads,
    allLoads: rawLoads,
    stats,
    filteredStats,
    quickFilters,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      status: statusFilter,
      billing: billingFilter,
      sort
    },
    setSearchQuery,
    setStatusFilter,
    setBillingFilter,
    setSort: handleSort,
    setFilters,
    resetFilters,

    // Actions
    refetch,
    createLoad,
    updateLoad: mutations.updateLoad,
    deleteLoad: mutations.deleteLoad,
    updateLoadStatus,
    updateBillingStatus: mutations.updateBillingStatus,

    // Mutation state
    mutating: mutations.loading
  };
}

/**
 * useLoad - Domain hook for single load detail
 */
export function useLoad(loadId, options = {}) {
  const { autoFetch = true } = options;

  const detail = useLoadDetail(loadId);
  const stops = useLoadStops(loadId);
  const mutations = useLoadMutations();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && loadId) {
      detail.fetchLoad();
      stops.fetchStops();
    }
  }, [autoFetch, loadId]);

  /**
   * Update a single field on the load
   */
  const updateField = useCallback(async (field, value) => {
    await mutations.updateLoad(loadId, { [field]: value });
    detail.setLoad(prev => prev ? { ...prev, [field]: value } : prev);
  }, [mutations, loadId, detail]);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback(async (updates) => {
    await mutations.updateLoad(loadId, updates);
    detail.setLoad(prev => prev ? { ...prev, ...updates } : prev);
  }, [mutations, loadId, detail]);

  /**
   * Update load status
   */
  const updateStatus = useCallback(async (status) => {
    await mutations.updateStatus(loadId, status);
    detail.setLoad(prev => prev ? { ...prev, status } : prev);
  }, [mutations, loadId, detail]);

  /**
   * Refetch all load data
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      detail.fetchLoad(),
      stops.fetchStops()
    ]);
  }, [detail, stops]);

  return {
    // Load data
    load: detail.load,
    stops: stops.stops,

    // State
    loading: detail.loading || stops.loading,
    error: detail.error || stops.error,

    // Actions
    refetch,
    updateField,
    updateFields,
    updateStatus,
    updateBillingStatus: (status) => mutations.updateBillingStatus(loadId, status),

    // Stop actions
    addStop: stops.addStop,
    updateStop: stops.updateStop,
    deleteStop: stops.deleteStop,
    reorderStops: stops.reorderStops,

    // Mutation state
    mutating: mutations.loading || stops.loading
  };
}

export default useLoads;
