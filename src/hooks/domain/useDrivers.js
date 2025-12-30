/**
 * useDrivers - Domain hook for driver management
 *
 * This hook composes the API hooks and adds business logic:
 * - Filtering by status and account status
 * - Search
 * - Statistics calculation
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useDriversList, useDriverDetail, useDriverMutations, useDriverInvite } from '../api/useDriversApi';
import {
  DriverStatusConfig,
  DriverAccountStatus,
  DriverAccountStatusConfig,
  getDriverAccountStatus
} from '../../config/status';

/**
 * useDrivers - Main domain hook for drivers list
 *
 * Usage:
 *   const { drivers, stats, loading, filters, setFilters } = useDrivers();
 */
export function useDrivers(options = {}) {
  const {
    autoFetch = true,
    initialFilters = {}
  } = options;

  // API layer
  const {
    drivers: rawDrivers,
    loading,
    error,
    fetchDrivers,
    setDrivers,
    clearError
  } = useDriversList();

  const mutations = useDriverMutations();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [accountFilter, setAccountFilter] = useState(initialFilters.account || 'all');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchDrivers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFetch]); // Only run on mount, not when fetchDrivers changes

  /**
   * Enrich drivers with computed account status
   */
  const enrichedDrivers = useMemo(() => {
    return rawDrivers.map(driver => ({
      ...driver,
      accountStatus: getDriverAccountStatus(driver),
      accountStatusConfig: DriverAccountStatusConfig[getDriverAccountStatus(driver)]
    }));
  }, [rawDrivers]);

  /**
   * Filtered drivers
   */
  const filteredDrivers = useMemo(() => {
    let result = [...enrichedDrivers];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(driver => {
        const fullName = `${driver.first_name} ${driver.last_name}`.toLowerCase();
        const email = (driver.email || '').toLowerCase();
        const phone = (driver.phone || '').toLowerCase();
        return fullName.includes(q) || email.includes(q) || phone.includes(q);
      });
    }

    // Status filter (operational status)
    if (statusFilter !== 'all') {
      result = result.filter(driver => driver.status === statusFilter);
    }

    // Account status filter
    if (accountFilter !== 'all') {
      result = result.filter(driver => driver.accountStatus === accountFilter);
    }

    return result;
  }, [enrichedDrivers, searchQuery, statusFilter, accountFilter]);

  /**
   * Statistics computed from all drivers
   */
  const stats = useMemo(() => {
    const byStatus = {};
    const byAccountStatus = {};

    enrichedDrivers.forEach(driver => {
      // Count by operational status
      byStatus[driver.status] = (byStatus[driver.status] || 0) + 1;

      // Count by account status
      byAccountStatus[driver.accountStatus] = (byAccountStatus[driver.accountStatus] || 0) + 1;
    });

    return {
      total: enrichedDrivers.length,
      filtered: filteredDrivers.length,
      byStatus,
      byAccountStatus,
      // Convenience accessors
      active: byAccountStatus[DriverAccountStatus.ACTIVE] || 0,
      pending: byAccountStatus[DriverAccountStatus.PENDING] || 0,
      unclaimed: byAccountStatus[DriverAccountStatus.UNCLAIMED] || 0,
      left: byAccountStatus[DriverAccountStatus.LEFT] || 0,
      // Operational
      available: byStatus.available || 0,
      driving: byStatus.driving || 0,
      offDuty: byStatus.off_duty || 0,
      inactive: byStatus.inactive || 0
    };
  }, [enrichedDrivers, filteredDrivers]);

  /**
   * Reset all filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setAccountFilter('all');
  }, []);

  /**
   * Set multiple filters at once
   */
  const setFilters = useCallback((filters) => {
    if (filters.search !== undefined) setSearchQuery(filters.search);
    if (filters.status !== undefined) setStatusFilter(filters.status);
    if (filters.account !== undefined) setAccountFilter(filters.account);
  }, []);

  /**
   * Refetch drivers
   */
  const refetch = useCallback(() => {
    return fetchDrivers();
  }, [fetchDrivers]);

  /**
   * Create driver and refetch list
   */
  const createDriver = useCallback(async (data) => {
    const result = await mutations.createDriver(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update driver and update local state
   */
  const updateDriver = useCallback(async (driverId, data) => {
    const result = await mutations.updateDriver(driverId, data);
    setDrivers(prev => prev.map(d =>
      d.id === driverId ? { ...d, ...data } : d
    ));
    return result;
  }, [mutations, setDrivers]);

  /**
   * Delete driver and update local state
   */
  const deleteDriver = useCallback(async (driverId) => {
    await mutations.deleteDriver(driverId);
    setDrivers(prev => prev.filter(d => d.id !== driverId));
  }, [mutations, setDrivers]);

  return {
    // Data
    drivers: filteredDrivers,
    allDrivers: enrichedDrivers,
    stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      status: statusFilter,
      account: accountFilter
    },
    setSearchQuery,
    setStatusFilter,
    setAccountFilter,
    setFilters,
    resetFilters,

    // Actions
    refetch,
    createDriver,
    updateDriver,
    deleteDriver,

    // Mutation state
    mutating: mutations.loading
  };
}

/**
 * useDriver - Domain hook for single driver detail
 */
export function useDriver(driverId, options = {}) {
  const { autoFetch = true } = options;

  const detail = useDriverDetail(driverId);
  const mutations = useDriverMutations();
  const invite = useDriverInvite(driverId);

  // Fetch driver and invite status on mount if autoFetch
  useEffect(() => {
    if (autoFetch && driverId) {
      detail.fetchDriver();
      invite.getInviteStatus();
    }
  }, [autoFetch, driverId]);

  /**
   * Enriched driver with account status
   */
  const enrichedDriver = useMemo(() => {
    if (!detail.driver) return null;
    return {
      ...detail.driver,
      accountStatus: getDriverAccountStatus(detail.driver),
      accountStatusConfig: DriverAccountStatusConfig[getDriverAccountStatus(detail.driver)]
    };
  }, [detail.driver]);

  /**
   * Update a single field on the driver
   */
  const updateField = useCallback(async (field, value) => {
    await mutations.updateDriver(driverId, { [field]: value });
    detail.setDriver(prev => prev ? { ...prev, [field]: value } : prev);
  }, [mutations, driverId, detail]);

  /**
   * Update multiple fields at once
   */
  const updateFields = useCallback(async (updates) => {
    await mutations.updateDriver(driverId, updates);
    detail.setDriver(prev => prev ? { ...prev, ...updates } : prev);
  }, [mutations, driverId, detail]);

  /**
   * Send invitation to driver
   */
  const sendInvite = useCallback(async () => {
    const result = await invite.inviteDriver();
    await detail.fetchDriver(); // Refetch to get updated membership status
    await invite.getInviteStatus(); // Refetch invite status
    return result;
  }, [invite, detail]);

  /**
   * Resend invitation
   */
  const resendInvite = useCallback(async () => {
    const result = await invite.resendInvite();
    await invite.getInviteStatus(); // Refetch invite status
    return result;
  }, [invite]);

  return {
    // Driver data
    driver: enrichedDriver,

    // State
    loading: detail.loading,
    error: detail.error || invite.error,

    // Actions
    refetch: detail.fetchDriver,
    updateField,
    updateFields,
    deleteDriver: () => mutations.deleteDriver(driverId),

    // Invite actions
    sendInvite,
    resendInvite,
    inviteStatus: invite.inviteStatus,
    inviteLoading: invite.loading,

    // Mutation state
    mutating: mutations.loading || invite.loading
  };
}

export default useDrivers;
