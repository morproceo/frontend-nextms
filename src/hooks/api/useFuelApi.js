/**
 * Fuel API Hooks
 * Wraps fuel API calls with loading/error state
 */

import { useCallback, useState } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import * as fuelApi from '../../api/fuel.api';

// ============================================
// FUEL CARDS
// ============================================

export function useFuelCardsList() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => fuelApi.getFuelCards(filters),
    { initialData: [] }
  );

  const fetchCards = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return { cards: Array.isArray(data) ? data : (data?.data || []), loading, error, fetchCards, clearError };
}

export function useFuelCardDetail(cardId) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => fuelApi.getFuelCard(cardId),
    { initialData: null }
  );

  const fetchCard = useCallback(() => {
    if (!cardId) return;
    return fetch();
  }, [cardId, fetch]);

  return { card: data, loading, error, fetchCard, clearError };
}

export function useFuelCardMutations() {
  const { mutate, loading } = useMutation();

  const createCard = useCallback(async (data, options) => {
    return mutate(() => fuelApi.createFuelCard(data), options);
  }, [mutate]);

  const updateCard = useCallback(async (cardId, data, options) => {
    return mutate(() => fuelApi.updateFuelCard(cardId, data), options);
  }, [mutate]);

  const deleteCard = useCallback(async (cardId, options) => {
    return mutate(() => fuelApi.deleteFuelCard(cardId), options);
  }, [mutate]);

  return { createCard, updateCard, deleteCard, loading };
}

// ============================================
// FUEL CARD ASSIGNMENTS
// ============================================

export function useFuelCardAssignmentMutations() {
  const { mutate, loading } = useMutation();

  const assignCard = useCallback(async (cardId, payload, options) => {
    return mutate(() => fuelApi.assignFuelCard(cardId, payload), options);
  }, [mutate]);

  const returnCard = useCallback(async (cardId, payload, options) => {
    return mutate(() => fuelApi.returnFuelCard(cardId, payload), options);
  }, [mutate]);

  return { assignCard, returnCard, loading };
}

export function useFuelCardAssignments(cardId) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => fuelApi.getFuelCardAssignments(cardId),
    { initialData: { assignments: [], total: 0 } }
  );

  const fetchAssignments = useCallback(() => {
    if (!cardId) return;
    return fetch();
  }, [cardId, fetch]);

  return {
    assignments: data?.assignments || [],
    total: data?.total || 0,
    loading,
    error,
    fetchAssignments,
    clearError
  };
}

// ============================================
// FUEL TRANSACTIONS
// ============================================

const FUEL_PAGE_SIZE = 50;

export function useFuelTransactionsList() {
  const [page, setPage] = useState(1);
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => fuelApi.getFuelTransactions({ limit: FUEL_PAGE_SIZE, offset: 0, ...filters }),
    { initialData: { transactions: [], total: 0, limit: FUEL_PAGE_SIZE, offset: 0 } }
  );

  // Page 1 = offset 0; replaces the list every time.
  const fetchTransactions = useCallback((filters = {}, targetPage = 1) => {
    const safePage = Math.max(1, targetPage);
    setPage(safePage);
    return fetch({ limit: FUEL_PAGE_SIZE, offset: (safePage - 1) * FUEL_PAGE_SIZE, ...filters });
  }, [fetch]);

  const goToPage = useCallback((targetPage, filters = {}) => {
    return fetchTransactions(filters, targetPage);
  }, [fetchTransactions]);

  const total = data?.total || 0;

  return {
    transactions: data?.transactions || [],
    total,
    page,
    pageSize: FUEL_PAGE_SIZE,
    totalPages: Math.max(1, Math.ceil(total / FUEL_PAGE_SIZE)),
    loading,
    error,
    fetchTransactions,
    goToPage,
    clearError
  };
}

export function useFuelTransactionDetail(txnId) {
  const { data, loading, error, fetch, clearError } = useApiState(
    () => fuelApi.getFuelTransaction(txnId),
    { initialData: null }
  );

  const fetchTransaction = useCallback(() => {
    if (!txnId) return;
    return fetch();
  }, [txnId, fetch]);

  return { transaction: data, loading, error, fetchTransaction, clearError };
}

export function useFuelTransactionMutations() {
  const { mutate, loading } = useMutation();

  const createTransaction = useCallback(async (data, options) => {
    return mutate(() => fuelApi.createFuelTransaction(data), options);
  }, [mutate]);

  const updateTransaction = useCallback(async (txnId, data, options) => {
    return mutate(() => fuelApi.updateFuelTransaction(txnId, data), options);
  }, [mutate]);

  const deleteTransaction = useCallback(async (txnId, options) => {
    return mutate(() => fuelApi.deleteFuelTransaction(txnId), options);
  }, [mutate]);

  return { createTransaction, updateTransaction, deleteTransaction, loading };
}

// ============================================
// WORKFLOW
// ============================================

export function useFuelWorkflow() {
  const { mutate, loading } = useMutation();

  const submitForVerification = useCallback(async (txnId, options) => {
    return mutate(() => fuelApi.submitForVerification(txnId), options);
  }, [mutate]);

  const verify = useCallback(async (txnId, options) => {
    return mutate(() => fuelApi.verifyTransaction(txnId), options);
  }, [mutate]);

  const confirmTxn = useCallback(async (txnId, options) => {
    return mutate(() => fuelApi.confirmTransaction(txnId), options);
  }, [mutate]);

  const flag = useCallback(async (txnId, reason, options) => {
    return mutate(() => fuelApi.flagTransaction(txnId, reason), options);
  }, [mutate]);

  const reject = useCallback(async (txnId, reason, options) => {
    return mutate(() => fuelApi.rejectTransaction(txnId, reason), options);
  }, [mutate]);

  const bulkVerifyTxns = useCallback(async (txnIds, options) => {
    return mutate(() => fuelApi.bulkVerify(txnIds), options);
  }, [mutate]);

  const bulkConfirmTxns = useCallback(async (txnIds, options) => {
    return mutate(() => fuelApi.bulkConfirm(txnIds), options);
  }, [mutate]);

  return {
    submitForVerification,
    verify,
    confirm: confirmTxn,
    flag,
    reject,
    bulkVerify: bulkVerifyTxns,
    bulkConfirm: bulkConfirmTxns,
    loading
  };
}

// ============================================
// STATS & IMPORT/EXPORT
// ============================================

export function useFuelStats() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => fuelApi.getFuelStats(filters),
    { initialData: null }
  );

  const fetchStats = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return { stats: data, loading, error, fetchStats, clearError };
}

export function useFuelImport() {
  const { mutate, loading } = useMutation();

  const importCsv = useCallback(async (rows, columnMapping, defaults, options) => {
    return mutate(() => fuelApi.importFuelCsv(rows, columnMapping, defaults), options);
  }, [mutate]);

  return { importCsv, loading };
}

export function useFuelExport() {
  const exportTransactions = useCallback(async (filters = {}) => {
    const response = await fuelApi.exportFuelTransactions(filters);
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fuel-transactions-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }, []);

  return { exportTransactions };
}

// ============================================
// COMBINED CONVENIENCE HOOK
// ============================================

export function useFuelApi() {
  const cardsList = useFuelCardsList();
  const cardMutations = useFuelCardMutations();
  const transactionsList = useFuelTransactionsList();
  const transactionMutations = useFuelTransactionMutations();
  const workflow = useFuelWorkflow();
  const stats = useFuelStats();

  return {
    // Cards
    cards: cardsList.cards,
    cardsLoading: cardsList.loading,
    fetchCards: cardsList.fetchCards,
    ...cardMutations,
    // Transactions
    transactions: transactionsList.transactions,
    transactionsTotal: transactionsList.total,
    transactionsLoading: transactionsList.loading,
    fetchTransactions: transactionsList.fetchTransactions,
    ...transactionMutations,
    // Workflow
    ...workflow,
    // Stats
    stats: stats.stats,
    statsLoading: stats.loading,
    fetchStats: stats.fetchStats
  };
}
