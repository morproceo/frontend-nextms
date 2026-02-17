/**
 * Driver Portal Domain Hooks
 *
 * Composes API hooks and adds business logic for the driver portal:
 * - Dashboard with stats and current load
 * - Loads list with filtering
 * - Single load detail with actions
 * - Expenses list and form
 * - Earnings summary
 * - Settings/organizations management
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useDriverDashboard,
  useDriverLoads,
  useDriverLoad,
  useDriverLoadActions,
  useDriverEarnings,
  useDriverExpenses,
  useDriverExpense,
  useDriverExpenseMutations,
  useDriverProfiles
} from '../api/useDriverPortalApi';
import {
  useDriverOrganizations,
  useDriverInvites,
  useDriverDisconnect
} from '../api/useDriverSettingsApi';
import { ExpenseStatusConfig, ExpenseCategoryConfig, getStatusConfig } from '../../config/status';

// ============================================
// DASHBOARD
// ============================================

/**
 * useDriverPortalDashboard - Dashboard with invite code handling
 */
export function useDriverPortalDashboard(options = {}) {
  const { autoFetch = true } = options;

  const dashboard = useDriverDashboard();
  const invites = useDriverInvites();

  // Fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dashboard.fetchDashboard();
    }
  }, [autoFetch]);

  /**
   * Accept invite and refresh dashboard
   */
  const acceptInviteByCode = useCallback(async (code) => {
    const result = await invites.acceptInviteByCode(code);
    // Refresh dashboard after joining
    setTimeout(() => {
      dashboard.setHasNoOrgs(false);
      dashboard.fetchDashboard();
    }, 1500);
    return result;
  }, [invites, dashboard]);

  /**
   * Start trip and refresh
   */
  const startTrip = useCallback(async (loadId) => {
    const actions = useDriverLoadActions();
    await actions.startTrip(loadId);
    dashboard.fetchDashboard();
  }, [dashboard]);

  // Independent mode data
  const isIndependent = dashboard.dashboard?.mode === 'independent';
  const profile = dashboard.dashboard?.profile;
  const personalStats = dashboard.dashboard?.personalStats;
  const recentHistory = dashboard.dashboard?.recentHistory;

  return {
    // Data
    dashboard: dashboard.dashboard,
    currentLoad: dashboard.dashboard?.currentLoad,
    upcomingLoads: dashboard.dashboard?.upcomingLoads,
    stats: dashboard.dashboard?.stats,
    profiles: dashboard.dashboard?.profiles,
    driverName: isIndependent
      ? (profile?.first_name || 'Driver')
      : (dashboard.dashboard?.profiles?.[0]?.first_name || 'Driver'),

    // Independent mode
    isIndependent,
    profile,
    personalStats,
    recentHistory,

    // State
    loading: dashboard.loading,
    error: dashboard.error,
    hasNoOrgs: dashboard.hasNoOrgs,

    // Actions
    refetch: dashboard.fetchDashboard,
    startTrip,

    // Invite handling
    acceptInviteByCode,
    inviteLoading: invites.loading,
    inviteError: invites.error,
    inviteSuccess: invites.success,
    clearInviteMessages: invites.clearMessages
  };
}

// ============================================
// LOADS LIST
// ============================================

/**
 * useDriverPortalLoads - Loads list with filtering
 */
export function useDriverPortalLoads(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  const { loads, total, loading, error, fetchLoads, setLoads } = useDriverLoads();
  const actions = useDriverLoadActions();

  const [statusFilter, setStatusFilter] = useState(initialFilters.status || '');

  // Fetch on mount or filter change
  useEffect(() => {
    if (autoFetch) {
      fetchLoads({ status: statusFilter || undefined });
    }
  }, [autoFetch, statusFilter]);

  /**
   * Get status color for display
   */
  const getStatusColor = useCallback((status) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-600',
      new: 'bg-blue-100 text-blue-600',
      booked: 'bg-indigo-100 text-indigo-600',
      dispatched: 'bg-purple-100 text-purple-600',
      in_transit: 'bg-orange-100 text-orange-600',
      delivered: 'bg-green-100 text-green-600',
      invoiced: 'bg-teal-100 text-teal-600',
      paid: 'bg-emerald-100 text-emerald-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }, []);

  return {
    // Data
    loads,
    total,

    // State
    loading,
    error,

    // Filters
    statusFilter,
    setStatusFilter,

    // Actions
    refetch: () => fetchLoads({ status: statusFilter || undefined }),
    startTrip: actions.startTrip,
    actionLoading: actions.loading,

    // Helpers
    getStatusColor
  };
}

// ============================================
// LOAD DETAIL
// ============================================

/**
 * useDriverPortalLoad - Single load detail with actions
 */
export function useDriverPortalLoad(loadId, options = {}) {
  const { autoFetch = true } = options;

  const { load, loading, error, fetchLoad, setLoad } = useDriverLoad(loadId);
  const actions = useDriverLoadActions();

  // Fetch on mount
  useEffect(() => {
    if (autoFetch && loadId) {
      fetchLoad();
    }
  }, [autoFetch, loadId]);

  /**
   * Start trip and refresh
   */
  const startTrip = useCallback(async () => {
    await actions.startTrip(loadId);
    fetchLoad();
  }, [actions, loadId, fetchLoad]);

  /**
   * Complete trip and refresh
   */
  const completeTrip = useCallback(async (notes = null) => {
    await actions.completeTrip(loadId, notes);
    fetchLoad();
  }, [actions, loadId, fetchLoad]);

  /**
   * Get status color
   */
  const getStatusColor = useCallback((status) => {
    const colors = {
      dispatched: 'bg-purple-100 text-purple-600',
      in_transit: 'bg-orange-100 text-orange-600',
      delivered: 'bg-green-100 text-green-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }, []);

  return {
    // Data
    load,

    // State
    loading,
    error,
    actionLoading: actions.loading,

    // Actions
    refetch: fetchLoad,
    startTrip,
    completeTrip,

    // Helpers
    getStatusColor
  };
}

// ============================================
// EXPENSES LIST
// ============================================

/**
 * useDriverPortalExpenses - Expenses list with filtering and stats
 */
export function useDriverPortalExpenses(options = {}) {
  const { autoFetch = true } = options;

  const { expenses, loading, error, fetchExpenses, setExpenses } = useDriverExpenses();
  const [statusFilter, setStatusFilter] = useState('all');

  // Fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchExpenses();
    }
  }, [autoFetch]);

  /**
   * Enriched expenses with configs
   */
  const enrichedExpenses = useMemo(() => {
    return expenses.map(expense => ({
      ...expense,
      statusConfig: getStatusConfig(ExpenseStatusConfig, expense.status),
      categoryConfig: ExpenseCategoryConfig[expense.category] || null
    }));
  }, [expenses]);

  /**
   * Filtered expenses
   */
  const filteredExpenses = useMemo(() => {
    if (statusFilter === 'all') return enrichedExpenses;
    return enrichedExpenses.filter(exp => exp.status === statusFilter);
  }, [enrichedExpenses, statusFilter]);

  /**
   * Statistics
   */
  const stats = useMemo(() => {
    return {
      pending: expenses.filter(e => e.status === 'pending_approval').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      total: expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0)
    };
  }, [expenses]);

  return {
    // Data
    expenses: filteredExpenses,
    allExpenses: enrichedExpenses,
    stats,

    // State
    loading,
    error,

    // Filters
    statusFilter,
    setStatusFilter,

    // Actions
    refetch: fetchExpenses
  };
}

// ============================================
// EXPENSE FORM
// ============================================

/**
 * useDriverPortalExpenseForm - Expense form for create/edit
 */
export function useDriverPortalExpenseForm(expenseId, options = {}) {
  const { autoFetch = true } = options;
  const isEditing = Boolean(expenseId);

  const { expense, loading: detailLoading, error: detailError, fetchExpense } = useDriverExpense(expenseId);
  const { profiles, fetchProfiles } = useDriverProfiles();
  const { submitExpense, updateExpense, loading: mutationLoading, error: mutationError } = useDriverExpenseMutations();

  // Fetch on mount
  useEffect(() => {
    fetchProfiles();
    if (autoFetch && isEditing) {
      fetchExpense();
    }
  }, [autoFetch, isEditing]);

  return {
    // Data
    expense,
    profiles,
    isEditing,

    // State
    loading: detailLoading,
    saving: mutationLoading,
    error: detailError || mutationError,

    // Actions
    submitExpense,
    updateExpense: (data) => updateExpense(expenseId, data)
  };
}

// ============================================
// EARNINGS
// ============================================

/**
 * useDriverPortalEarnings - Earnings summary and history
 */
export function useDriverPortalEarnings(options = {}) {
  const { autoFetch = true } = options;

  const { earnings, history, loading, error, fetchEarnings } = useDriverEarnings();

  // Fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchEarnings();
    }
  }, [autoFetch]);

  const summary = earnings?.summary || {};

  return {
    // Data
    earnings,
    history,
    summary: {
      monthToDate: summary.monthToDate || 0,
      yearToDate: summary.yearToDate || 0,
      completedLoads: summary.completedLoads || 0,
      totalMiles: summary.totalMiles || 0
    },

    // State
    loading,
    error,

    // Actions
    refetch: fetchEarnings
  };
}

// ============================================
// SETTINGS
// ============================================

/**
 * useDriverPortalSettings - Organization management
 */
export function useDriverPortalSettings(options = {}) {
  const { autoFetch = true } = options;

  const orgs = useDriverOrganizations();
  const invites = useDriverInvites();
  const disconnect = useDriverDisconnect();

  // Fetch on mount
  useEffect(() => {
    if (autoFetch) {
      orgs.fetchAll();
    }
  }, [autoFetch]);

  /**
   * Active and left organizations
   */
  const activeOrgs = useMemo(() => {
    return orgs.organizations.filter(o => !o.is_readonly);
  }, [orgs.organizations]);

  const leftOrgs = useMemo(() => {
    return orgs.organizations.filter(o => o.is_readonly);
  }, [orgs.organizations]);

  /**
   * Accept invite by code and refresh
   */
  const acceptInviteByCode = useCallback(async (code) => {
    const result = await invites.acceptInviteByCode(code);
    orgs.fetchAll();
    return result;
  }, [invites, orgs]);

  /**
   * Accept invite and refresh
   */
  const acceptInvite = useCallback(async (inviteId) => {
    await invites.acceptInvite(inviteId);
    orgs.fetchAll();
  }, [invites, orgs]);

  /**
   * Decline invite and refresh
   */
  const declineInvite = useCallback(async (inviteId) => {
    await invites.declineInvite(inviteId);
    orgs.fetchAll();
  }, [invites, orgs]);

  /**
   * Disconnect from org and refresh
   */
  const disconnectFromOrg = useCallback(async (orgId, orgName) => {
    if (!confirm(`Are you sure you want to disconnect from ${orgName}? You will still have read-only access to your historical data.`)) {
      return;
    }
    await disconnect.disconnectFromOrg(orgId);
    orgs.fetchAll();
  }, [disconnect, orgs]);

  return {
    // Data
    organizations: orgs.organizations,
    activeOrgs,
    leftOrgs,
    pendingInvites: orgs.pendingInvites,
    history: orgs.history,

    // State
    loading: orgs.loading,
    error: orgs.error,

    // Invite handling
    acceptInviteByCode,
    acceptInvite,
    declineInvite,
    inviteLoading: invites.loading,
    inviteError: invites.error,
    inviteSuccess: invites.success,
    clearInviteMessages: invites.clearMessages,

    // Disconnect handling
    disconnectFromOrg,
    disconnecting: disconnect.disconnectingOrgId,
    disconnectLoading: disconnect.loading,

    // Actions
    refetch: orgs.fetchAll
  };
}

// ============================================
// DOCUMENTS
// ============================================

/**
 * useDriverPortalDocuments - Loads with documents
 */
export function useDriverPortalDocuments(options = {}) {
  const { autoFetch = true } = options;

  const { loads, loading, error, fetchLoads } = useDriverLoads();

  // Fetch on mount
  useEffect(() => {
    if (autoFetch) {
      fetchLoads({ limit: 50 });
    }
  }, [autoFetch]);

  /**
   * Loads that have documents
   */
  const loadsWithDocs = useMemo(() => {
    return loads.filter(l => l.documents?.length > 0);
  }, [loads]);

  return {
    // Data
    loads,
    loadsWithDocs,

    // State
    loading,
    error,

    // Actions
    refetch: () => fetchLoads({ limit: 50 })
  };
}

export default {
  useDriverPortalDashboard,
  useDriverPortalLoads,
  useDriverPortalLoad,
  useDriverPortalExpenses,
  useDriverPortalExpenseForm,
  useDriverPortalEarnings,
  useDriverPortalSettings,
  useDriverPortalDocuments
};
