/**
 * Fuel API Hooks
 * Wraps fuel API calls with loading/error state
 */

import { useCallback } from 'react';
import { useApiRequest, useApiState, useMutation } from './useApiRequest';
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

  return { cards: data || [], loading, error, fetchCards, clearError };
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
// FUEL TRANSACTIONS
// ============================================

export function useFuelTransactionsList() {
  const { data, loading, error, fetch, clearError } = useApiState(
    (filters) => fuelApi.getFuelTransactions(filters),
    { initialData: { transactions: [], total: 0 } }
  );

  const fetchTransactions = useCallback((filters = {}) => {
    return fetch(filters);
  }, [fetch]);

  return {
    transactions: data?.transactions || [],
    total: data?.total || 0,
    loading,
    error,
    fetchTransactions,
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
