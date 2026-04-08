/**
 * Fuel Domain Hooks
 * Business logic for fuel cards and transactions
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useFuelCardsList,
  useFuelCardDetail,
  useFuelCardMutations,
  useFuelTransactionsList,
  useFuelTransactionDetail,
  useFuelTransactionMutations,
  useFuelWorkflow,
  useFuelStats,
  useFuelImport,
  useFuelExport
} from '../api/useFuelApi';

// ============================================
// FUEL CARDS
// ============================================

export function useFuelCards(options = {}) {
  const { autoFetch = true } = options;
  const { cards, loading, error, fetchCards } = useFuelCardsList();
  const mutations = useFuelCardMutations();

  const [filters, setFilters] = useState({
    status: '',
    card_provider: '',
    driver_id: '',
    search: ''
  });

  const fetchWithFilters = useCallback(() => {
    const activeFilters = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val) activeFilters[key] = val;
    });
    return fetchCards(activeFilters);
  }, [fetchCards, filters]);

  useEffect(() => {
    if (autoFetch) fetchWithFilters();
  }, [autoFetch, filters]);

  const setStatusFilter = useCallback((status) => {
    setFilters(prev => ({ ...prev, status }));
  }, []);

  const setProviderFilter = useCallback((card_provider) => {
    setFilters(prev => ({ ...prev, card_provider }));
  }, []);

  const setSearchQuery = useCallback((search) => {
    setFilters(prev => ({ ...prev, search }));
  }, []);

  const createCard = useCallback(async (data) => {
    const result = await mutations.createCard(data);
    await fetchWithFilters();
    return result;
  }, [mutations, fetchWithFilters]);

  const updateCard = useCallback(async (cardId, data) => {
    const result = await mutations.updateCard(cardId, data);
    await fetchWithFilters();
    return result;
  }, [mutations, fetchWithFilters]);

  const deleteCard = useCallback(async (cardId) => {
    const result = await mutations.deleteCard(cardId);
    await fetchWithFilters();
    return result;
  }, [mutations, fetchWithFilters]);

  return {
    cards,
    loading,
    error,
    filters,
    setStatusFilter,
    setProviderFilter,
    setSearchQuery,
    refetch: fetchWithFilters,
    createCard,
    updateCard,
    deleteCard,
    mutating: mutations.loading
  };
}

export function useFuelCard(cardId, options = {}) {
  const { autoFetch = true } = options;
  const { card, loading, error, fetchCard } = useFuelCardDetail(cardId);
  const mutations = useFuelCardMutations();

  useEffect(() => {
    if (autoFetch && cardId) fetchCard();
  }, [autoFetch, cardId]);

  const updateCard = useCallback(async (data) => {
    const result = await mutations.updateCard(cardId, data);
    await fetchCard();
    return result;
  }, [mutations, cardId, fetchCard]);

  const deleteCard = useCallback(async () => {
    return mutations.deleteCard(cardId);
  }, [mutations, cardId]);

  return {
    card,
    loading,
    error,
    refetch: fetchCard,
    updateCard,
    deleteCard,
    mutating: mutations.loading
  };
}

// ============================================
// FUEL TRANSACTIONS
// ============================================

export function useFuelTransactions(options = {}) {
  const { autoFetch = true } = options;
  const { transactions, total, loading, error, fetchTransactions } = useFuelTransactionsList();
  const mutations = useFuelTransactionMutations();
  const workflow = useFuelWorkflow();
  const { exportTransactions } = useFuelExport();

  const [filters, setFilters] = useState({
    status: '',
    fuel_card_id: '',
    driver_id: '',
    truck_id: '',
    fuel_type: '',
    date_from: '',
    date_to: '',
    search: '',
    sort_by: 'transaction_date',
    sort_order: 'DESC'
  });

  const fetchWithFilters = useCallback(() => {
    const activeFilters = {};
    Object.entries(filters).forEach(([key, val]) => {
      if (val) activeFilters[key] = val;
    });
    return fetchTransactions(activeFilters);
  }, [fetchTransactions, filters]);

  useEffect(() => {
    if (autoFetch) fetchWithFilters();
  }, [autoFetch, filters]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const setStatusFilter = useCallback((status) => setFilter('status', status), [setFilter]);
  const setSearchQuery = useCallback((search) => setFilter('search', search), [setFilter]);

  const handleSort = useCallback((field) => {
    setFilters(prev => ({
      ...prev,
      sort_by: field,
      sort_order: prev.sort_by === field && prev.sort_order === 'ASC' ? 'DESC' : 'ASC'
    }));
  }, []);

  // Workflow actions that refresh after
  const submitForVerification = useCallback(async (txnId) => {
    const result = await workflow.submitForVerification(txnId);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const verifyTransaction = useCallback(async (txnId) => {
    const result = await workflow.verify(txnId);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const confirmTransaction = useCallback(async (txnId) => {
    const result = await workflow.confirm(txnId);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const flagTransaction = useCallback(async (txnId, reason) => {
    const result = await workflow.flag(txnId, reason);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const rejectTransaction = useCallback(async (txnId, reason) => {
    const result = await workflow.reject(txnId, reason);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const bulkVerify = useCallback(async (txnIds) => {
    const result = await workflow.bulkVerify(txnIds);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const bulkConfirm = useCallback(async (txnIds) => {
    const result = await workflow.bulkConfirm(txnIds);
    await fetchWithFilters();
    return result;
  }, [workflow, fetchWithFilters]);

  const deleteTransaction = useCallback(async (txnId) => {
    const result = await mutations.deleteTransaction(txnId);
    await fetchWithFilters();
    return result;
  }, [mutations, fetchWithFilters]);

  return {
    transactions,
    total,
    loading,
    error,
    filters,
    setFilter,
    setStatusFilter,
    setSearchQuery,
    handleSort,
    refetch: fetchWithFilters,
    // CRUD
    deleteTransaction,
    // Workflow
    submitForVerification,
    verifyTransaction,
    confirmTransaction,
    flagTransaction,
    rejectTransaction,
    bulkVerify,
    bulkConfirm,
    workflowLoading: workflow.loading,
    mutating: mutations.loading,
    // Export
    exportTransactions
  };
}

export function useFuelTransaction(txnId, options = {}) {
  const { autoFetch = true } = options;
  const { transaction, loading, error, fetchTransaction } = useFuelTransactionDetail(txnId);
  const mutations = useFuelTransactionMutations();
  const workflow = useFuelWorkflow();

  useEffect(() => {
    if (autoFetch && txnId) fetchTransaction();
  }, [autoFetch, txnId]);

  const updateTransaction = useCallback(async (data) => {
    const result = await mutations.updateTransaction(txnId, data);
    await fetchTransaction();
    return result;
  }, [mutations, txnId, fetchTransaction]);

  const deleteTransaction = useCallback(async () => {
    return mutations.deleteTransaction(txnId);
  }, [mutations, txnId]);

  const submitForVerification = useCallback(async () => {
    const result = await workflow.submitForVerification(txnId);
    await fetchTransaction();
    return result;
  }, [workflow, txnId, fetchTransaction]);

  const verify = useCallback(async () => {
    const result = await workflow.verify(txnId);
    await fetchTransaction();
    return result;
  }, [workflow, txnId, fetchTransaction]);

  const confirmTxn = useCallback(async () => {
    const result = await workflow.confirm(txnId);
    await fetchTransaction();
    return result;
  }, [workflow, txnId, fetchTransaction]);

  const flag = useCallback(async (reason) => {
    const result = await workflow.flag(txnId, reason);
    await fetchTransaction();
    return result;
  }, [workflow, txnId, fetchTransaction]);

  const reject = useCallback(async (reason) => {
    const result = await workflow.reject(txnId, reason);
    await fetchTransaction();
    return result;
  }, [workflow, txnId, fetchTransaction]);

  return {
    transaction,
    loading,
    error,
    refetch: fetchTransaction,
    updateTransaction,
    deleteTransaction,
    submitForVerification,
    verify,
    confirm: confirmTxn,
    flag,
    reject,
    mutating: mutations.loading,
    workflowLoading: workflow.loading
  };
}

// ============================================
// FUEL DASHBOARD
// ============================================

export function useFuelDashboard(options = {}) {
  const { autoFetch = true } = options;
  const { stats, loading, error, fetchStats } = useFuelStats();
  const { transactions, fetchTransactions } = useFuelTransactionsList();

  useEffect(() => {
    if (autoFetch) {
      fetchStats();
      fetchTransactions({ limit: 10, sort_by: 'transaction_date', sort_order: 'DESC' });
    }
  }, [autoFetch]);

  return {
    stats,
    recentTransactions: transactions,
    loading,
    error,
    refetch: () => {
      fetchStats();
      fetchTransactions({ limit: 10, sort_by: 'transaction_date', sort_order: 'DESC' });
    }
  };
}

// ============================================
// FUEL IMPORTER
// ============================================

export function useFuelImporter() {
  const { importCsv, loading: importing } = useFuelImport();

  const [step, setStep] = useState(1); // 1: upload, 2: map, 3: review, 4: results
  const [csvData, setCsvData] = useState(null); // { headers: [], rows: [] }
  const [columnMapping, setColumnMapping] = useState({});
  const [defaults, setDefaults] = useState({ fuel_card_id: '', driver_id: '', truck_id: '' });
  const [results, setResults] = useState(null);

  /**
   * Parse a single CSV line respecting quoted fields (handles commas inside quotes)
   */
  const parseCsvLine = useCallback((line) => {
    const values = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  }, []);

  const parseCsvFile = useCallback((file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target.result;
        // Handle both \r\n and \n line endings
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());
        if (lines.length < 2) {
          resolve(null);
          return;
        }

        const headers = parseCsvLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
        const rows = lines.slice(1).map(line => {
          const values = parseCsvLine(line).map(v => v.replace(/^"|"$/g, ''));
          const row = {};
          headers.forEach((h, i) => {
            row[h] = values[i] || '';
          });
          return row;
        });

        resolve({ headers, rows });
      };
      reader.readAsText(file);
    });
  }, [parseCsvLine]);

  const uploadFile = useCallback(async (file, autoMapFn) => {
    const data = await parseCsvFile(file);
    if (data) {
      setCsvData(data);
      // Auto-map headers if a mapping function is provided
      if (autoMapFn) {
        const autoMapped = autoMapFn(data.headers);
        setColumnMapping(autoMapped);
      }
      setStep(2);
    }
    return data;
  }, [parseCsvFile]);

  const setMapping = useCallback((csvHeader, systemField) => {
    setColumnMapping(prev => ({ ...prev, [csvHeader]: systemField }));
  }, []);

  const executeImport = useCallback(async () => {
    if (!csvData?.rows) return null;
    const result = await importCsv(csvData.rows, columnMapping, defaults);
    if (result) {
      setResults(result);
      setStep(4);
    }
    return result;
  }, [csvData, columnMapping, defaults, importCsv]);

  const reset = useCallback(() => {
    setStep(1);
    setCsvData(null);
    setColumnMapping({});
    setDefaults({ fuel_card_id: '', driver_id: '', truck_id: '' });
    setResults(null);
  }, []);

  return {
    step,
    setStep,
    csvData,
    columnMapping,
    defaults,
    setDefaults,
    results,
    importing,
    uploadFile,
    setMapping,
    executeImport,
    reset
  };
}
