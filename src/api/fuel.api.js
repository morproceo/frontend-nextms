/**
 * Fuel API
 * Handles fuel card and transaction operations
 */

import api from './client';

// ============================================
// FUEL CARDS
// ============================================

export const getFuelCards = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.card_provider) params.append('card_provider', filters.card_provider);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/fuel/cards?${queryString}` : '/v1/fuel/cards';
  const response = await api.get(url);
  return response.data;
};

export const getFuelCard = async (cardId) => {
  const response = await api.get(`/v1/fuel/cards/${cardId}`);
  return response.data;
};

export const createFuelCard = async (data) => {
  const response = await api.post('/v1/fuel/cards', data);
  return response.data;
};

export const updateFuelCard = async (cardId, data) => {
  const response = await api.patch(`/v1/fuel/cards/${cardId}`, data);
  return response.data;
};

export const deleteFuelCard = async (cardId) => {
  const response = await api.delete(`/v1/fuel/cards/${cardId}`);
  return response.data;
};

// ============================================
// FUEL TRANSACTIONS
// ============================================

export const getFuelTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      filters.status.forEach(s => params.append('status', s));
    } else {
      params.append('status', filters.status);
    }
  }
  if (filters.fuel_card_id) params.append('fuel_card_id', filters.fuel_card_id);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.truck_id) params.append('truck_id', filters.truck_id);
  if (filters.fuel_type) params.append('fuel_type', filters.fuel_type);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.search) params.append('search', filters.search);
  if (filters.sort_by) params.append('sort_by', filters.sort_by);
  if (filters.sort_order) params.append('sort_order', filters.sort_order);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  if (filters.import_batch_id) params.append('import_batch_id', filters.import_batch_id);

  const queryString = params.toString();
  const url = queryString ? `/v1/fuel/transactions?${queryString}` : '/v1/fuel/transactions';
  const response = await api.get(url);
  return response.data;
};

export const getFuelTransaction = async (txnId) => {
  const response = await api.get(`/v1/fuel/transactions/${txnId}`);
  return response.data;
};

export const createFuelTransaction = async (data) => {
  const response = await api.post('/v1/fuel/transactions', data);
  return response.data;
};

export const updateFuelTransaction = async (txnId, data) => {
  const response = await api.patch(`/v1/fuel/transactions/${txnId}`, data);
  return response.data;
};

export const deleteFuelTransaction = async (txnId) => {
  const response = await api.delete(`/v1/fuel/transactions/${txnId}`);
  return response.data;
};

// ============================================
// STATS & EXPORT
// ============================================

export const getFuelStats = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/fuel/transactions/stats?${queryString}` : '/v1/fuel/transactions/stats';
  const response = await api.get(url);
  return response.data;
};

export const exportFuelTransactions = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.truck_id) params.append('truck_id', filters.truck_id);

  const queryString = params.toString();
  const url = queryString ? `/v1/fuel/transactions/export?${queryString}` : '/v1/fuel/transactions/export';
  const response = await api.get(url, { responseType: 'blob' });
  return response;
};

// ============================================
// WORKFLOW
// ============================================

export const submitForVerification = async (txnId) => {
  const response = await api.post(`/v1/fuel/transactions/${txnId}/submit-verification`);
  return response.data;
};

export const verifyTransaction = async (txnId) => {
  const response = await api.post(`/v1/fuel/transactions/${txnId}/verify`);
  return response.data;
};

export const confirmTransaction = async (txnId) => {
  const response = await api.post(`/v1/fuel/transactions/${txnId}/confirm`);
  return response.data;
};

export const flagTransaction = async (txnId, reason) => {
  const response = await api.post(`/v1/fuel/transactions/${txnId}/flag`, { reason });
  return response.data;
};

export const rejectTransaction = async (txnId, reason) => {
  const response = await api.post(`/v1/fuel/transactions/${txnId}/reject`, { reason });
  return response.data;
};

export const bulkVerify = async (transactionIds) => {
  const response = await api.post('/v1/fuel/transactions/bulk-verify', { transaction_ids: transactionIds });
  return response.data;
};

export const bulkConfirm = async (transactionIds) => {
  const response = await api.post('/v1/fuel/transactions/bulk-confirm', { transaction_ids: transactionIds });
  return response.data;
};

// ============================================
// CSV IMPORT
// ============================================

export const importFuelCsv = async (rows, columnMapping, defaults = {}) => {
  const response = await api.post('/v1/fuel/transactions/import', {
    rows,
    column_mapping: columnMapping,
    fuel_card_id: defaults.fuel_card_id,
    driver_id: defaults.driver_id,
    truck_id: defaults.truck_id
  });
  return response.data;
};

// ============================================
// FUEL CARD ASSIGNMENTS
// ============================================

export const assignFuelCard = async (cardId, payload) => {
  const response = await api.post(`/v1/fuel/cards/${cardId}/assign`, payload);
  return response.data;
};

export const returnFuelCard = async (cardId, payload) => {
  const response = await api.post(`/v1/fuel/cards/${cardId}/return`, payload);
  return response.data;
};

export const getFuelCardAssignments = async (cardId, params = {}) => {
  const response = await api.get(`/v1/fuel/cards/${cardId}/assignments`, { params });
  return response.data;
};

export const getDriverFuelCards = async (driverId) => {
  const response = await api.get(`/v1/fuel/drivers/${driverId}/fuel-cards`);
  return response.data;
};

export default {
  // Cards
  getFuelCards,
  getFuelCard,
  createFuelCard,
  updateFuelCard,
  deleteFuelCard,
  // Transactions
  getFuelTransactions,
  getFuelTransaction,
  createFuelTransaction,
  updateFuelTransaction,
  deleteFuelTransaction,
  // Stats & Export
  getFuelStats,
  exportFuelTransactions,
  // Workflow
  submitForVerification,
  verifyTransaction,
  confirmTransaction,
  flagTransaction,
  rejectTransaction,
  bulkVerify,
  bulkConfirm,
  // Import
  importFuelCsv,
  // Card Assignments
  assignFuelCard,
  returnFuelCard,
  getFuelCardAssignments,
  getDriverFuelCards
};
