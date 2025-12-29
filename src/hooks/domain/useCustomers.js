/**
 * useCustomers - Domain hooks for customer management (Brokers + Facilities)
 *
 * This hook composes the API hooks and adds business logic:
 * - Filtering by type, status
 * - Search
 * - Statistics calculation
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useBrokersList,
  useBrokerDetail,
  useBrokerMutations,
  useFmcsaLookup
} from '../api/useBrokersApi';
import {
  useFacilitiesList,
  useFacilityDetail,
  useFacilityMutations
} from '../api/useFacilitiesApi';
import { FacilityType, FacilityTypeConfig } from '../../config/status';

// ============================================
// BROKERS DOMAIN HOOK
// ============================================

/**
 * useBrokers - Domain hook for brokers list with filtering
 */
export function useBrokers(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // API layer
  const {
    brokers: rawBrokers,
    loading,
    error,
    fetchBrokers,
    setBrokers,
    clearError
  } = useBrokersList();

  const mutations = useBrokerMutations();
  const fmcsaLookup = useFmcsaLookup();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [activeFilter, setActiveFilter] = useState(initialFilters.isActive ?? 'all');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchBrokers({ is_active: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount

  /**
   * Filtered brokers
   */
  const filteredBrokers = useMemo(() => {
    let result = [...rawBrokers];

    // Active filter
    if (activeFilter !== 'all') {
      const isActive = activeFilter === 'active';
      result = result.filter(broker => broker.is_active === isActive);
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(broker => {
        return (
          (broker.name || '').toLowerCase().includes(q) ||
          (broker.mc_number || '').toLowerCase().includes(q) ||
          (broker.contact?.name || '').toLowerCase().includes(q) ||
          (broker.address?.city || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [rawBrokers, searchQuery, activeFilter]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    const active = rawBrokers.filter(b => b.is_active).length;
    const inactive = rawBrokers.filter(b => !b.is_active).length;
    const preferred = rawBrokers.filter(b => b.is_preferred).length;

    return {
      total: rawBrokers.length,
      filtered: filteredBrokers.length,
      active,
      inactive,
      preferred
    };
  }, [rawBrokers, filteredBrokers]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setActiveFilter('all');
  }, []);

  /**
   * Refetch brokers
   */
  const refetch = useCallback(() => {
    return fetchBrokers({ is_active: activeFilter === 'all' ? undefined : activeFilter === 'active' });
  }, [fetchBrokers, activeFilter]);

  /**
   * Create broker and refetch
   */
  const createBroker = useCallback(async (data) => {
    const result = await mutations.createBroker(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update broker and update local state
   */
  const updateBroker = useCallback(async (brokerId, data) => {
    const result = await mutations.updateBroker(brokerId, data);
    setBrokers(prev => prev.map(b =>
      b.id === brokerId ? { ...b, ...data } : b
    ));
    return result;
  }, [mutations, setBrokers]);

  /**
   * Delete broker and update local state
   */
  const deleteBroker = useCallback(async (brokerId) => {
    await mutations.deleteBroker(brokerId);
    setBrokers(prev => prev.filter(b => b.id !== brokerId));
  }, [mutations, setBrokers]);

  /**
   * FMCSA search
   */
  const searchFmcsa = useCallback(async (query) => {
    return fmcsaLookup.lookup({ query });
  }, [fmcsaLookup]);

  return {
    // Data
    brokers: filteredBrokers,
    allBrokers: rawBrokers,
    stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      isActive: activeFilter
    },
    setSearchQuery,
    setActiveFilter,
    resetFilters,

    // Actions
    refetch,
    createBroker,
    updateBroker,
    deleteBroker,

    // FMCSA
    searchFmcsa,
    fmcsaLoading: fmcsaLookup.loading,

    // Mutation state
    mutating: mutations.loading
  };
}

/**
 * useBroker - Domain hook for single broker detail
 */
export function useBroker(brokerId, options = {}) {
  const { autoFetch = true } = options;

  // API layer
  const detail = useBrokerDetail(brokerId);
  const mutations = useBrokerMutations();
  const fmcsaLookup = useFmcsaLookup();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && brokerId) {
      detail.fetchBroker();
    }
  }, [autoFetch, brokerId]);

  /**
   * Update broker
   */
  const updateBroker = useCallback(async (data) => {
    const result = await mutations.updateBroker(brokerId, data);
    detail.setBroker(prev => prev ? { ...prev, ...data } : prev);
    return result;
  }, [mutations, brokerId, detail]);

  /**
   * Delete broker
   */
  const deleteBroker = useCallback(async () => {
    return mutations.deleteBroker(brokerId);
  }, [mutations, brokerId]);

  /**
   * FMCSA search
   */
  const searchFmcsa = useCallback(async (query) => {
    return fmcsaLookup.lookup({ query });
  }, [fmcsaLookup]);

  return {
    // Data
    broker: detail.broker,

    // State
    loading: detail.loading,
    error: detail.error || mutations.error,

    // Actions
    refetch: detail.fetchBroker,
    updateBroker,
    deleteBroker,

    // FMCSA
    searchFmcsa,
    fmcsaLoading: fmcsaLookup.loading,
    fmcsaResults: null, // Results managed externally for flexibility

    // Mutation state
    mutating: mutations.loading
  };
}

// ============================================
// FACILITIES DOMAIN HOOK
// ============================================

/**
 * useFacilities - Domain hook for facilities list with filtering
 */
export function useFacilities(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // API layer
  const {
    facilities: rawFacilities,
    loading,
    error,
    fetchFacilities,
    setFacilities,
    clearError
  } = useFacilitiesList();

  const mutations = useFacilityMutations();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [typeFilter, setTypeFilter] = useState(initialFilters.type || 'all');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchFacilities({ is_active: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount

  /**
   * Enrich facilities with type config
   */
  const enrichedFacilities = useMemo(() => {
    return rawFacilities.map(facility => ({
      ...facility,
      typeConfig: FacilityTypeConfig[facility.facility_type] || FacilityTypeConfig[FacilityType.BOTH]
    }));
  }, [rawFacilities]);

  /**
   * Filtered facilities
   */
  const filteredFacilities = useMemo(() => {
    let result = [...enrichedFacilities];

    // Type filter
    if (typeFilter !== 'all') {
      if (typeFilter === 'shipper') {
        result = result.filter(f =>
          f.facility_type === FacilityType.SHIPPER || f.facility_type === FacilityType.BOTH
        );
      } else if (typeFilter === 'receiver') {
        result = result.filter(f =>
          f.facility_type === FacilityType.RECEIVER || f.facility_type === FacilityType.BOTH
        );
      }
    }

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(facility => {
        return (
          (facility.company_name || '').toLowerCase().includes(q) ||
          (facility.address?.city || '').toLowerCase().includes(q) ||
          (facility.address?.state || '').toLowerCase().includes(q) ||
          (facility.contact?.name || '').toLowerCase().includes(q)
        );
      });
    }

    return result;
  }, [enrichedFacilities, searchQuery, typeFilter]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    const byType = {
      shipper: 0,
      receiver: 0,
      both: 0
    };

    enrichedFacilities.forEach(f => {
      if (byType[f.facility_type] !== undefined) {
        byType[f.facility_type]++;
      }
    });

    return {
      total: enrichedFacilities.length,
      filtered: filteredFacilities.length,
      byType,
      shippers: byType.shipper + byType.both,
      receivers: byType.receiver + byType.both
    };
  }, [enrichedFacilities, filteredFacilities]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setTypeFilter('all');
  }, []);

  /**
   * Refetch facilities
   */
  const refetch = useCallback(() => {
    return fetchFacilities({ is_active: true });
  }, [fetchFacilities]);

  /**
   * Create facility and refetch
   */
  const createFacility = useCallback(async (data) => {
    const result = await mutations.createFacility(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update facility and update local state
   */
  const updateFacility = useCallback(async (facilityId, data) => {
    const result = await mutations.updateFacility(facilityId, data);
    setFacilities(prev => prev.map(f =>
      f.id === facilityId ? { ...f, ...data } : f
    ));
    return result;
  }, [mutations, setFacilities]);

  /**
   * Delete facility and update local state
   */
  const deleteFacility = useCallback(async (facilityId) => {
    await mutations.deleteFacility(facilityId);
    setFacilities(prev => prev.filter(f => f.id !== facilityId));
  }, [mutations, setFacilities]);

  return {
    // Data
    facilities: filteredFacilities,
    allFacilities: enrichedFacilities,
    stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      type: typeFilter
    },
    setSearchQuery,
    setTypeFilter,
    resetFilters,

    // Actions
    refetch,
    createFacility,
    updateFacility,
    deleteFacility,

    // Mutation state
    mutating: mutations.loading
  };
}

/**
 * useFacility - Domain hook for single facility detail
 */
export function useFacility(facilityId, options = {}) {
  const { autoFetch = true } = options;

  // API layer
  const detail = useFacilityDetail(facilityId);
  const mutations = useFacilityMutations();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && facilityId) {
      detail.fetchFacility();
    }
  }, [autoFetch, facilityId]);

  /**
   * Enriched facility with type config
   */
  const enrichedFacility = useMemo(() => {
    if (!detail.facility) return null;
    return {
      ...detail.facility,
      typeConfig: FacilityTypeConfig[detail.facility.facility_type] || FacilityTypeConfig[FacilityType.BOTH]
    };
  }, [detail.facility]);

  /**
   * Update facility
   */
  const updateFacility = useCallback(async (data) => {
    const result = await mutations.updateFacility(facilityId, data);
    detail.setFacility(prev => prev ? { ...prev, ...data } : prev);
    return result;
  }, [mutations, facilityId, detail]);

  /**
   * Delete facility
   */
  const deleteFacility = useCallback(async () => {
    return mutations.deleteFacility(facilityId);
  }, [mutations, facilityId]);

  return {
    // Data
    facility: enrichedFacility,

    // State
    loading: detail.loading,
    error: detail.error || mutations.error,

    // Actions
    refetch: detail.fetchFacility,
    updateFacility,
    deleteFacility,

    // Mutation state
    mutating: mutations.loading
  };
}

// ============================================
// COMBINED CUSTOMERS HOOK
// ============================================

/**
 * useCustomers - Combined hook for both brokers and facilities
 * Useful for cross-cutting concerns or unified customer views
 */
export function useCustomers(options = {}) {
  const brokers = useBrokers(options);
  const facilities = useFacilities(options);

  const combinedStats = useMemo(() => ({
    totalCustomers: brokers.stats.total + facilities.stats.total,
    brokers: brokers.stats,
    facilities: facilities.stats
  }), [brokers.stats, facilities.stats]);

  return {
    // Individual hooks
    brokers,
    facilities,

    // Combined stats
    stats: combinedStats,

    // Combined state
    loading: brokers.loading || facilities.loading,
    mutating: brokers.mutating || facilities.mutating
  };
}

export default useCustomers;
