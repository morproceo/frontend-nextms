/**
 * useExpenses - Domain hook for expense management
 *
 * This hook composes the API hooks and adds business logic:
 * - Filtering by status, category, entity
 * - Sorting
 * - Search
 * - Statistics calculation
 * - Approval workflow
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useExpensesList,
  useExpenseDetail,
  useExpenseMutations,
  useExpenseWorkflow,
  useExpenseStats,
  useExpenseExport
} from '../api/useExpensesApi';
import {
  ExpenseStatus,
  ExpenseStatusConfig,
  ExpenseCategoryConfig,
  EntityTypeConfig,
  getStatusConfig
} from '../../config/status';

/**
 * useExpenses - Main domain hook for expenses list
 */
export function useExpenses(options = {}) {
  const { autoFetch = true, initialFilters = {} } = options;

  // API layer
  const {
    expenses: rawExpenses,
    loading,
    error,
    fetchExpenses,
    setExpenses,
    clearError
  } = useExpensesList();

  const mutations = useExpenseMutations();
  const workflow = useExpenseWorkflow();
  const statsHook = useExpenseStats();
  const exportHook = useExpenseExport();

  // Local filter state
  const [searchQuery, setSearchQuery] = useState(initialFilters.search || '');
  const [statusFilter, setStatusFilter] = useState(initialFilters.status || 'all');
  const [categoryFilter, setCategoryFilter] = useState(initialFilters.category || 'all');
  const [sortField, setSortField] = useState(initialFilters.sortField || 'date');
  const [sortDirection, setSortDirection] = useState(initialFilters.sortDirection || 'desc');

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch) {
      fetchExpenses();
      statsHook.fetchStats();
    }
  }, [autoFetch]);

  /**
   * Enrich expenses with status and category configs
   */
  const enrichedExpenses = useMemo(() => {
    return rawExpenses.map(expense => ({
      ...expense,
      statusConfig: getStatusConfig(ExpenseStatusConfig, expense.status),
      categoryConfig: ExpenseCategoryConfig[expense.category] || null,
      entityTypeConfig: expense.entity_type ? EntityTypeConfig[expense.entity_type] : null
    }));
  }, [rawExpenses]);

  /**
   * Filtered and sorted expenses
   */
  const filteredExpenses = useMemo(() => {
    let result = [...enrichedExpenses];

    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(exp =>
        (exp.vendor || '').toLowerCase().includes(q) ||
        (exp.description || '').toLowerCase().includes(q) ||
        (exp.reference_number || '').toLowerCase().includes(q)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      result = result.filter(exp => exp.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      result = result.filter(exp => exp.category === categoryFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortField) {
        case 'vendor':
          aVal = a.vendor || '';
          bVal = b.vendor || '';
          break;
        case 'amount':
          aVal = parseFloat(a.amount) || 0;
          bVal = parseFloat(b.amount) || 0;
          break;
        case 'category':
          aVal = a.category || '';
          bVal = b.category || '';
          break;
        case 'status':
          aVal = a.status || '';
          bVal = b.status || '';
          break;
        default:
          aVal = a.date || '';
          bVal = b.date || '';
      }
      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      }
      return aVal < bVal ? 1 : -1;
    });

    return result;
  }, [enrichedExpenses, searchQuery, statusFilter, categoryFilter, sortField, sortDirection]);

  /**
   * Statistics computed from expenses
   */
  const stats = useMemo(() => {
    const byStatus = {};
    const byCategory = {};
    let totalAmount = 0;
    let pendingAmount = 0;
    let approvedAmount = 0;

    enrichedExpenses.forEach(exp => {
      const amount = parseFloat(exp.amount) || 0;
      totalAmount += amount;

      // Count by status
      byStatus[exp.status] = (byStatus[exp.status] || 0) + 1;

      // Track amounts by status
      if (exp.status === 'pending_approval' || exp.status === 'pending') {
        pendingAmount += amount;
      } else if (exp.status === 'approved' || exp.status === 'paid') {
        approvedAmount += amount;
      }

      // Count by category
      if (exp.category) {
        byCategory[exp.category] = (byCategory[exp.category] || 0) + 1;
      }
    });

    return {
      total: enrichedExpenses.length,
      filtered: filteredExpenses.length,
      byStatus,
      byCategory,
      amounts: {
        total: totalAmount,
        pending: pendingAmount,
        approved: approvedAmount,
        filtered: filteredExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0)
      },
      // Convenience accessors
      pendingApproval: byStatus.pending_approval || 0,
      approved: byStatus.approved || 0,
      paid: byStatus.paid || 0,
      rejected: byStatus.rejected || 0
    };
  }, [enrichedExpenses, filteredExpenses]);

  /**
   * Handle sort change
   */
  const handleSort = useCallback((field) => {
    if (sortField === field) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  }, [sortField]);

  /**
   * Reset filters
   */
  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setCategoryFilter('all');
    setSortField('date');
    setSortDirection('desc');
  }, []);

  /**
   * Refetch expenses and stats
   */
  const refetch = useCallback(async () => {
    await Promise.all([
      fetchExpenses(),
      statsHook.fetchStats()
    ]);
  }, [fetchExpenses, statsHook]);

  /**
   * Create expense and refetch
   */
  const createExpense = useCallback(async (data) => {
    const result = await mutations.createExpense(data);
    await refetch();
    return result;
  }, [mutations, refetch]);

  /**
   * Update expense and update local state
   */
  const updateExpense = useCallback(async (expenseId, data) => {
    const result = await mutations.updateExpense(expenseId, data);
    setExpenses(prev => prev.map(e =>
      e.id === expenseId ? { ...e, ...data } : e
    ));
    return result;
  }, [mutations, setExpenses]);

  /**
   * Delete expense and update local state
   */
  const deleteExpense = useCallback(async (expenseId) => {
    await mutations.deleteExpense(expenseId);
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  }, [mutations, setExpenses]);

  /**
   * Approve expense and refetch
   */
  const approveExpense = useCallback(async (expenseId) => {
    await workflow.approveExpense(expenseId);
    await refetch();
  }, [workflow, refetch]);

  /**
   * Reject expense and refetch
   */
  const rejectExpense = useCallback(async (expenseId, reason) => {
    await workflow.rejectExpense(expenseId, reason);
    await refetch();
  }, [workflow, refetch]);

  /**
   * Mark expense as paid and refetch
   */
  const markAsPaid = useCallback(async (expenseId, paymentDetails) => {
    await workflow.markAsPaid(expenseId, paymentDetails);
    await refetch();
  }, [workflow, refetch]);

  /**
   * Export expenses
   */
  const exportExpenses = useCallback(async () => {
    return exportHook.exportExpenses({
      status: statusFilter !== 'all' ? statusFilter : undefined,
      category: categoryFilter !== 'all' ? categoryFilter : undefined
    });
  }, [exportHook, statusFilter, categoryFilter]);

  return {
    // Data
    expenses: filteredExpenses,
    allExpenses: enrichedExpenses,
    stats,
    apiStats: statsHook.stats,

    // State
    loading,
    error,
    clearError,

    // Filters
    filters: {
      search: searchQuery,
      status: statusFilter,
      category: categoryFilter,
      sortField,
      sortDirection
    },
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    handleSort,
    resetFilters,

    // Actions
    refetch,
    createExpense,
    updateExpense,
    deleteExpense,

    // Workflow
    approveExpense,
    rejectExpense,
    markAsPaid,
    workflowLoading: workflow.loading,

    // Export
    exportExpenses,
    exporting: exportHook.exporting,

    // Mutation state
    mutating: mutations.loading
  };
}

/**
 * useExpense - Domain hook for single expense detail
 */
export function useExpense(expenseId, options = {}) {
  const { autoFetch = true } = options;

  const detail = useExpenseDetail(expenseId);
  const mutations = useExpenseMutations();
  const workflow = useExpenseWorkflow();

  // Fetch on mount if autoFetch
  useEffect(() => {
    if (autoFetch && expenseId) {
      detail.fetchExpense();
    }
  }, [autoFetch, expenseId]);

  /**
   * Enriched expense with configs
   */
  const enrichedExpense = useMemo(() => {
    if (!detail.expense) return null;
    return {
      ...detail.expense,
      statusConfig: getStatusConfig(ExpenseStatusConfig, detail.expense.status),
      categoryConfig: ExpenseCategoryConfig[detail.expense.category] || null,
      entityTypeConfig: detail.expense.entity_type ? EntityTypeConfig[detail.expense.entity_type] : null
    };
  }, [detail.expense]);

  /**
   * Update expense
   */
  const updateExpense = useCallback(async (data) => {
    await mutations.updateExpense(expenseId, data);
    detail.setExpense(prev => prev ? { ...prev, ...data } : prev);
  }, [mutations, expenseId, detail]);

  /**
   * Submit for approval
   */
  const submitForApproval = useCallback(async () => {
    await workflow.submitForApproval(expenseId);
    await detail.fetchExpense();
  }, [workflow, expenseId, detail]);

  /**
   * Approve expense
   */
  const approveExpense = useCallback(async () => {
    await workflow.approveExpense(expenseId);
    await detail.fetchExpense();
  }, [workflow, expenseId, detail]);

  /**
   * Reject expense
   */
  const rejectExpense = useCallback(async (reason) => {
    await workflow.rejectExpense(expenseId, reason);
    await detail.fetchExpense();
  }, [workflow, expenseId, detail]);

  /**
   * Mark as paid
   */
  const markAsPaid = useCallback(async (paymentDetails) => {
    await workflow.markAsPaid(expenseId, paymentDetails);
    await detail.fetchExpense();
  }, [workflow, expenseId, detail]);

  return {
    // Data
    expense: enrichedExpense,

    // State
    loading: detail.loading,
    error: detail.error || workflow.error,

    // Actions
    refetch: detail.fetchExpense,
    updateExpense,
    deleteExpense: () => mutations.deleteExpense(expenseId),

    // Workflow
    submitForApproval,
    approveExpense,
    rejectExpense,
    markAsPaid,

    // Mutation state
    mutating: mutations.loading || workflow.loading
  };
}

export default useExpenses;
