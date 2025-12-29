/**
 * useAssets - Domain hooks for asset management (Trucks + Trailers)
 *
 * This hook composes the API hooks and adds business logic:
 * - Filtering by status, type
 * - Search
 * - Statistics calculation
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTrucksList, useTruckDetail, useTruckMutations, useTruckAssignments } from '../api/useTrucksApi';
import { useTrailersList, useTrailerDetail, useTrailerMutations, useTrailerAssignments } from '../api/useTrailersApi';
import {
  AssetStatus,
  AssetStatusConfig,
  TruckTypeConfig,
  TrailerTypeConfig,
  getStatusConfig
} from '../../config/status';

// ============================================
// TRUCKS DOMAIN HOOK
// ============================================

/**
 * useTrucks - Domain hook for trucks list with filtering
 */
export function useTrucks(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // API layer
  const {
    trucks: rawTrucks,
    loading,
    error,
    fetchTrucks,
    setTrucks,
    clearError
  } = useTrucksList();

  const mutations = useTruckMutations();
  const assignments = useTruckAssignments();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchTrucks();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount, not when fetchTrucks changes

  /**
   * Enrich trucks with status config and type config
   */
  const enrichedTrucks = useMemo(() => {
    return rawTrucks.map(truck => ({
      ...truck,
      statusConfig: getStatusConfig(AssetStatusConfig, truck.status),
      typeConfig: TruckTypeConfig[truck.truck_type] || null
    }));
  }, [rawTrucks]);

  /**
   * Filtered trucks
   */
  const filteredTrucks = useMemo(() => {
    let result = [...enrichedTrucks];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(truck => truck.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(truck => {
        const unitNumber = (truck.unit_number || '').toLowerCase();
        const vin = (truck.vin || '').toLowerCase();
        const make = (truck.make || '').toLowerCase();
        const model = (truck.model || '').toLowerCase();
        return unitNumber.includes(q) || vin.includes(q) || make.includes(q) || model.includes(q);
      });
    }

    return result;
  }, [enrichedTrucks, searchQuery, statusFilter]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    const byStatus = {};
    Object.values(AssetStatus).forEach(s => { byStatus[s] = 0; });

    enrichedTrucks.forEach(truck => {
      if (byStatus[truck.status] !== undefined) {
        byStatus[truck.status]++;
      }
    });

    return {
      total: enrichedTrucks.length,
      filtered: filteredTrucks.length,
      byStatus,
      active: byStatus[AssetStatus.AVAILABLE] || 0,
      inUse: byStatus[AssetStatus.IN_USE] || 0,
      maintenance: byStatus[AssetStatus.MAINTENANCE] || 0,
      outOfService: byStatus[AssetStatus.OUT_OF_SERVICE] || 0,
      // Additional useful stats
      withDrivers: enrichedTrucks.filter(t => t.current_driver_id).length,
      withTrailers: enrichedTrucks.filter(t => t.current_trailer_id).length
    };
  }, [enrichedTrucks, filteredTrucks]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
  }, []);

  /**
   * Refetch trucks
   */
  const refetch = useCallback(() => {
    return fetchTrucks();
  }, [fetchTrucks]);

  /**
   * Create truck and refetch
   */
  const createTruck = useCallback(async (data) => {
    const result = await mutations.createTruck(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update truck and update local state
   */
  const updateTruck = useCallback(async (truckId, data) => {
    const result = await mutations.updateTruck(truckId, data);
    setTrucks(prev => prev.map(t =>
      t.id === truckId ? { ...t, ...data } : t
    ));
    return result;
  }, [mutations, setTrucks]);

  /**
   * Delete truck and update local state
   */
  const deleteTruck = useCallback(async (truckId) => {
    await mutations.deleteTruck(truckId);
    setTrucks(prev => prev.filter(t => t.id !== truckId));
  }, [mutations, setTrucks]);

  /**
   * Assign driver and refetch
   */
  const assignDriver = useCallback(async (truckId, driverId) => {
    const result = await assignments.assignDriver(truckId, driverId);
    await refetch();
    return result;
  }, [assignments, refetch]);

  /**
   * Assign trailer and refetch
   */
  const assignTrailer = useCallback(async (truckId, trailerId) => {
    const result = await assignments.assignTrailer(truckId, trailerId);
    await refetch();
    return result;
  }, [assignments, refetch]);

  return {
    // Data
    trucks: filteredTrucks,
    allTrucks: enrichedTrucks,
    stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      status: statusFilter
    },
    setSearchQuery,
    setStatusFilter,
    resetFilters,

    // Actions
    refetch,
    createTruck,
    updateTruck,
    deleteTruck,
    assignDriver,
    assignTrailer,

    // Mutation state
    mutating: mutations.loading,
    assigning: assignments.loading
  };
}

// ============================================
// TRUCK DETAIL DOMAIN HOOK
// ============================================

/**
 * useTruck - Domain hook for single truck detail
 */
export function useTruck(truckId, options = {}) {
  const { autoFetch = true } = options;

  const { truck, loading, error, fetchTruck, setTruck, clearError } = useTruckDetail(truckId);
  const mutations = useTruckMutations();
  const assignments = useTruckAssignments();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && truckId) {
      fetchTruck();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, truckId]); // Only run on mount/id change

  /**
   * Enriched truck with status config
   */
  const enrichedTruck = useMemo(() => {
    if (!truck) return null;
    return {
      ...truck,
      statusConfig: getStatusConfig(AssetStatusConfig, truck.status),
      typeConfig: TruckTypeConfig[truck.truck_type] || null
    };
  }, [truck]);

  /**
   * Update truck
   */
  const updateTruck = useCallback(async (data) => {
    const result = await mutations.updateTruck(truckId, data);
    await fetchTruck();
    return result;
  }, [mutations, truckId, fetchTruck]);

  /**
   * Delete truck
   */
  const deleteTruck = useCallback(async () => {
    return mutations.deleteTruck(truckId);
  }, [mutations, truckId]);

  /**
   * Assign driver
   */
  const assignDriver = useCallback(async (driverId) => {
    const result = await assignments.assignDriver(truckId, driverId);
    await fetchTruck();
    return result;
  }, [assignments, truckId, fetchTruck]);

  /**
   * Assign trailer
   */
  const assignTrailer = useCallback(async (trailerId) => {
    const result = await assignments.assignTrailer(truckId, trailerId);
    await fetchTruck();
    return result;
  }, [assignments, truckId, fetchTruck]);

  /**
   * Check if date is expiring soon (within 30 days)
   */
  const isExpiringSoon = useCallback((dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date <= thirtyDaysFromNow;
  }, []);

  return {
    // Data
    truck: enrichedTruck,

    // State
    loading,
    error,
    clearError,

    // Actions
    refetch: fetchTruck,
    updateTruck,
    deleteTruck,
    assignDriver,
    assignTrailer,

    // Mutation state
    mutating: mutations.loading,
    assigning: assignments.loading,

    // Helpers
    isExpiringSoon
  };
}

// ============================================
// TRAILERS DOMAIN HOOK
// ============================================

/**
 * useTrailers - Domain hook for trailers list with filtering
 */
export function useTrailers(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // API layer
  const {
    trailers: rawTrailers,
    loading,
    error,
    fetchTrailers,
    setTrailers,
    clearError
  } = useTrailersList();

  const mutations = useTrailerMutations();
  const assignments = useTrailerAssignments();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [typeFilter, setTypeFilter] = useState(initialFilters.type || 'all');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchTrailers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount

  /**
   * Enrich trailers with status config and type config
   */
  const enrichedTrailers = useMemo(() => {
    return rawTrailers.map(trailer => ({
      ...trailer,
      statusConfig: getStatusConfig(AssetStatusConfig, trailer.status),
      typeConfig: TrailerTypeConfig[trailer.type] || TrailerTypeConfig.other
    }));
  }, [rawTrailers]);

  /**
   * Filtered trailers
   */
  const filteredTrailers = useMemo(() => {
    let result = [...enrichedTrailers];

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(trailer => trailer.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(trailer => trailer.type === typeFilter);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(trailer => {
        const unitNumber = (trailer.unit_number || '').toLowerCase();
        const vin = (trailer.vin || '').toLowerCase();
        const make = (trailer.make || '').toLowerCase();
        return unitNumber.includes(q) || vin.includes(q) || make.includes(q);
      });
    }

    return result;
  }, [enrichedTrailers, searchQuery, statusFilter, typeFilter]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    const byStatus = {};
    Object.values(AssetStatus).forEach(s => { byStatus[s] = 0; });

    const byType = {};

    enrichedTrailers.forEach(trailer => {
      if (byStatus[trailer.status] !== undefined) {
        byStatus[trailer.status]++;
      }
      byType[trailer.type] = (byType[trailer.type] || 0) + 1;
    });

    return {
      total: enrichedTrailers.length,
      filtered: filteredTrailers.length,
      byStatus,
      byType,
      active: byStatus[AssetStatus.AVAILABLE] || 0,
      inUse: byStatus[AssetStatus.IN_USE] || 0,
      maintenance: byStatus[AssetStatus.MAINTENANCE] || 0,
      outOfService: byStatus[AssetStatus.OUT_OF_SERVICE] || 0,
      // Additional useful stats
      available: enrichedTrailers.filter(t => t.status === 'active' && !t.current_truck_id).length,
      reefers: byType.reefer || 0
    };
  }, [enrichedTrailers, filteredTrailers]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  }, []);

  /**
   * Refetch trailers
   */
  const refetch = useCallback(() => {
    return fetchTrailers();
  }, [fetchTrailers]);

  /**
   * Create trailer and refetch
   */
  const createTrailer = useCallback(async (data) => {
    const result = await mutations.createTrailer(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update trailer and update local state
   */
  const updateTrailer = useCallback(async (trailerId, data) => {
    const result = await mutations.updateTrailer(trailerId, data);
    setTrailers(prev => prev.map(t =>
      t.id === trailerId ? { ...t, ...data } : t
    ));
    return result;
  }, [mutations, setTrailers]);

  /**
   * Delete trailer and update local state
   */
  const deleteTrailer = useCallback(async (trailerId) => {
    await mutations.deleteTrailer(trailerId);
    setTrailers(prev => prev.filter(t => t.id !== trailerId));
  }, [mutations, setTrailers]);

  /**
   * Assign to truck and refetch
   */
  const assignToTruck = useCallback(async (trailerId, truckId) => {
    const result = await assignments.assignToTruck(trailerId, truckId);
    await refetch();
    return result;
  }, [assignments, refetch]);

  return {
    // Data
    trailers: filteredTrailers,
    allTrailers: enrichedTrailers,
    stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      status: statusFilter,
      type: typeFilter
    },
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    resetFilters,

    // Actions
    refetch,
    createTrailer,
    updateTrailer,
    deleteTrailer,
    assignToTruck,

    // Mutation state
    mutating: mutations.loading,
    assigning: assignments.loading
  };
}

// ============================================
// TRAILER DETAIL DOMAIN HOOK
// ============================================

/**
 * useTrailer - Domain hook for single trailer detail
 */
export function useTrailer(trailerId, options = {}) {
  const { autoFetch = true } = options;

  const { trailer, loading, error, fetchTrailer, setTrailer, clearError } = useTrailerDetail(trailerId);
  const mutations = useTrailerMutations();
  const assignments = useTrailerAssignments();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && trailerId) {
      fetchTrailer();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch, trailerId]); // Only run on mount/id change

  /**
   * Enriched trailer with status config
   */
  const enrichedTrailer = useMemo(() => {
    if (!trailer) return null;
    return {
      ...trailer,
      statusConfig: getStatusConfig(AssetStatusConfig, trailer.status),
      typeConfig: TrailerTypeConfig[trailer.type] || TrailerTypeConfig.other
    };
  }, [trailer]);

  /**
   * Update trailer
   */
  const updateTrailer = useCallback(async (data) => {
    const result = await mutations.updateTrailer(trailerId, data);
    await fetchTrailer();
    return result;
  }, [mutations, trailerId, fetchTrailer]);

  /**
   * Delete trailer
   */
  const deleteTrailer = useCallback(async () => {
    return mutations.deleteTrailer(trailerId);
  }, [mutations, trailerId]);

  /**
   * Assign to truck
   */
  const assignToTruck = useCallback(async (truckId) => {
    const result = await assignments.assignToTruck(trailerId, truckId);
    await fetchTrailer();
    return result;
  }, [assignments, trailerId, fetchTrailer]);

  /**
   * Check if date is expiring soon (within 30 days)
   */
  const isExpiringSoon = useCallback((dateString) => {
    if (!dateString) return false;
    const date = new Date(dateString);
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return date <= thirtyDaysFromNow;
  }, []);

  return {
    // Data
    trailer: enrichedTrailer,

    // State
    loading,
    error,
    clearError,

    // Actions
    refetch: fetchTrailer,
    updateTrailer,
    deleteTrailer,
    assignToTruck,

    // Mutation state
    mutating: mutations.loading,
    assigning: assignments.loading,

    // Helpers
    isExpiringSoon
  };
}

// ============================================
// COMBINED ASSETS HOOK
// ============================================

/**
 * useAssets - Combined hook for both trucks and trailers
 * Useful for dashboard views or unified fleet management
 */
export function useAssets(options = {}) {
  const trucks = useTrucks(options);
  const trailers = useTrailers(options);

  const combinedStats = useMemo(() => ({
    totalAssets: trucks.stats.total + trailers.stats.total,
    trucks: trucks.stats,
    trailers: trailers.stats
  }), [trucks.stats, trailers.stats]);

  return {
    // Individual hooks
    trucks,
    trailers,

    // Combined stats
    stats: combinedStats,

    // Combined state
    loading: trucks.loading || trailers.loading,
    mutating: trucks.mutating || trailers.mutating
  };
}

export default useAssets;
