/**
 * useExpensesApi - API hook for expense operations
 *
 * This hook wraps the expenses API and provides consistent
 * loading/error state management.
 */

import { useCallback, useState } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import expensesApi from '../../api/expenses.api';

/**
 * Hook for fetching expenses list
 */
const PAGE_SIZE = 50;

export function useExpensesList(initialFilters = {}) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    (filters) => expensesApi.getExpenses({ limit: PAGE_SIZE, offset: 0, ...filters }),
    { initialData: { expenses: [], total: 0, limit: PAGE_SIZE, offset: 0 } }
  );
  const [loadingMore, setLoadingMore] = useState(false);
  const [appendError, setAppendError] = useState(null);

  // First-page or filter-change fetch: replaces the list.
  const fetchExpenses = useCallback((filters = initialFilters) => {
    return fetch({ limit: PAGE_SIZE, offset: 0, ...filters });
  }, [fetch, initialFilters]);

  // Subsequent pages: append onto the existing list.
  const loadMore = useCallback(async (filters = initialFilters) => {
    if (loadingMore) return;
    setLoadingMore(true);
    setAppendError(null);
    try {
      const next = await expensesApi.getExpenses({
        ...filters,
        limit: PAGE_SIZE,
        offset: (data?.expenses?.length ?? 0)
      });
      setData((prev) => ({
        ...(prev || {}),
        expenses: [...(prev?.expenses || []), ...(next?.expenses || [])],
        total: next?.total ?? prev?.total ?? 0,
        limit: PAGE_SIZE,
        offset: (prev?.expenses?.length ?? 0) + (next?.expenses?.length ?? 0)
      }));
    } catch (err) {
      setAppendError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [data, loadingMore, setData, initialFilters]);

  const expenses = data?.expenses || [];
  const total = data?.total || 0;

  return {
    expenses,
    total,
    hasMore: expenses.length < total,
    loading,
    loadingMore,
    error: error || appendError,
    fetchExpenses,
    loadMore,
    setExpenses: (next) =>
      setData((prev) => ({
        ...(prev || {}),
        expenses: typeof next === 'function' ? next(prev?.expenses || []) : next
      })),
    clearError
  };
}

/**
 * Hook for fetching a single expense
 */
export function useExpenseDetail(expenseId) {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => expensesApi.getExpense(expenseId),
    { initialData: null }
  );

  const fetchExpense = useCallback(() => {
    if (!expenseId) return Promise.resolve(null);
    return fetch();
  }, [fetch, expenseId]);

  return {
    expense: data,
    loading,
    error,
    fetchExpense,
    setExpense: setData,
    clearError
  };
}

/**
 * Hook for expense mutations (create, update, delete)
 */
export function useExpenseMutations() {
  const { mutate, loading, error, clearError } = useMutation();

  const createExpense = useCallback(async (data, options) => {
    return mutate(() => expensesApi.createExpense(data), options);
  }, [mutate]);

  const updateExpense = useCallback(async (expenseId, data, options) => {
    return mutate(() => expensesApi.updateExpense(expenseId, data), options);
  }, [mutate]);

  const deleteExpense = useCallback(async (expenseId, options) => {
    return mutate(() => expensesApi.deleteExpense(expenseId), options);
  }, [mutate]);

  return {
    createExpense,
    updateExpense,
    deleteExpense,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for expense workflow operations (submit, approve, reject, mark paid)
 */
export function useExpenseWorkflow() {
  const { mutate, loading, error, clearError } = useMutation();

  const submitForApproval = useCallback(async (expenseId, options) => {
    return mutate(() => expensesApi.submitForApproval(expenseId), options);
  }, [mutate]);

  const approveExpense = useCallback(async (expenseId, options) => {
    return mutate(() => expensesApi.approveExpense(expenseId), options);
  }, [mutate]);

  const rejectExpense = useCallback(async (expenseId, reason, options) => {
    return mutate(() => expensesApi.rejectExpense(expenseId, reason), options);
  }, [mutate]);

  const markAsPaid = useCallback(async (expenseId, paymentDetails, options) => {
    return mutate(() => expensesApi.markAsPaid(expenseId, paymentDetails), options);
  }, [mutate]);

  return {
    submitForApproval,
    approveExpense,
    rejectExpense,
    markAsPaid,
    loading,
    error,
    clearError
  };
}

/**
 * Hook for expense statistics
 */
export function useExpenseStats(dateRange = {}) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => expensesApi.getExpenseStats(dateRange),
    { initialData: null }
  );

  const fetchStats = useCallback((range = dateRange) => {
    return fetch(range);
  }, [fetch, dateRange]);

  return {
    stats: data,
    loading,
    error,
    fetchStats,
    clearError
  };
}

/**
 * Hook for expense summary/reporting
 */
export function useExpenseSummary(filters = {}) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => expensesApi.getExpenseSummary(filters),
    { initialData: null }
  );

  return {
    summary: data,
    loading,
    error,
    fetchSummary: fetch,
    clearError
  };
}

/**
 * Hook for expense categories
 */
export function useExpenseCategories() {
  const { data, loading, error, fetch, setData, clearError } = useApiState(
    () => expensesApi.getCategories(),
    { initialData: [] }
  );

  const { mutate, loading: mutating } = useMutation();

  const fetchCategories = useCallback(() => {
    return fetch();
  }, [fetch]);

  const createCategory = useCallback(async (categoryData, options) => {
    const result = await mutate(() => expensesApi.createCategory(categoryData), options);
    await fetchCategories();
    return result;
  }, [mutate, fetchCategories]);

  const updateCategory = useCallback(async (categoryId, categoryData, options) => {
    const result = await mutate(() => expensesApi.updateCategory(categoryId, categoryData), options);
    await fetchCategories();
    return result;
  }, [mutate, fetchCategories]);

  const deleteCategory = useCallback(async (categoryId, options) => {
    await mutate(() => expensesApi.deleteCategory(categoryId), options);
    setData(prev => prev.filter(c => c.id !== categoryId));
  }, [mutate, setData]);

  return {
    categories: Array.isArray(data) ? data : (data?.all || []),
    customCategories: Array.isArray(data) ? data.filter(c => c.type === 'custom') : (data?.custom || []),
    loading,
    mutating,
    error,
    fetchCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    clearError
  };
}

/**
 * Hook for AI receipt parsing
 */
export function useReceiptParser() {
  const { mutate, loading, error, clearError } = useMutation();

  const parseReceipt = useCallback(async (file, options) => {
    return mutate(() => expensesApi.parseReceipt(file), options);
  }, [mutate]);

  return {
    parseReceipt,
    parsing: loading,
    error,
    clearError
  };
}

/**
 * Hook for exporting expenses
 */
export function useExpenseExport() {
  const { mutate, loading, error, clearError } = useMutation();

  const exportExpenses = useCallback(async (filters = {}) => {
    const blob = await mutate(() => expensesApi.exportExpenses(filters));

    // Trigger download
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `expenses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    return blob;
  }, [mutate]);

  return {
    exportExpenses,
    exporting: loading,
    error,
    clearError
  };
}

/**
 * Combined hook for common expense operations
 */
export function useExpensesApi() {
  const list = useExpensesList();
  const mutations = useExpenseMutations();
  const workflow = useExpenseWorkflow();
  const stats = useExpenseStats();

  return {
    // List operations
    expenses: list.expenses,
    loadingList: list.loading,
    listError: list.error,
    fetchExpenses: list.fetchExpenses,
    setExpenses: list.setExpenses,

    // Mutations
    createExpense: mutations.createExpense,
    updateExpense: mutations.updateExpense,
    deleteExpense: mutations.deleteExpense,
    mutating: mutations.loading,
    mutationError: mutations.error,

    // Workflow
    submitForApproval: workflow.submitForApproval,
    approveExpense: workflow.approveExpense,
    rejectExpense: workflow.rejectExpense,
    markAsPaid: workflow.markAsPaid,
    workflowLoading: workflow.loading,

    // Stats
    stats: stats.stats,
    fetchStats: stats.fetchStats,

    // Combined
    loading: list.loading || mutations.loading || workflow.loading,
    clearErrors: () => {
      list.clearError();
      mutations.clearError();
      workflow.clearError();
    }
  };
}

export default useExpensesApi;
