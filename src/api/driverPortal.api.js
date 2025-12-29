/**
 * Driver Portal API
 * Handles driver-facing operations
 */

import api from './client';

/**
 * Get driver profiles for current user
 */
export const getProfiles = async () => {
  const response = await api.get('/v1/driver-portal/profiles');
  return response.data;
};

/**
 * Get dashboard data
 */
export const getDashboard = async (organizationId = null) => {
  const params = organizationId ? `?organization_id=${organizationId}` : '';
  const response = await api.get(`/v1/driver-portal/dashboard${params}`);
  return response.data;
};

/**
 * Get loads assigned to the driver
 */
export const getLoads = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.organization_id) params.append('organization_id', filters.organization_id);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const url = queryString ? `/v1/driver-portal/loads?${queryString}` : '/v1/driver-portal/loads';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single load with details
 */
export const getLoad = async (loadId) => {
  const response = await api.get(`/v1/driver-portal/loads/${loadId}`);
  return response.data;
};

/**
 * Start a trip (mark as in transit)
 */
export const startTrip = async (loadId) => {
  const response = await api.post(`/v1/driver-portal/loads/${loadId}/start`);
  return response.data;
};

/**
 * Update load status
 */
export const updateLoadStatus = async (loadId, status, notes = null) => {
  const response = await api.post(`/v1/driver-portal/loads/${loadId}/update-status`, {
    status,
    notes
  });
  return response.data;
};

/**
 * Complete a trip (mark as delivered)
 */
export const completeTrip = async (loadId, notes = null) => {
  const response = await api.post(`/v1/driver-portal/loads/${loadId}/complete`, {
    notes
  });
  return response.data;
};

/**
 * Get documents for a load
 */
export const getLoadDocuments = async (loadId) => {
  const response = await api.get(`/v1/driver-portal/loads/${loadId}/documents`);
  return response.data;
};

/**
 * Upload a document for a load
 */
export const uploadDocument = async (loadId, documentData) => {
  const response = await api.post(`/v1/driver-portal/loads/${loadId}/documents`, documentData);
  return response.data;
};

/**
 * Get earnings summary
 */
export const getEarnings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.organization_id) params.append('organization_id', filters.organization_id);

  const queryString = params.toString();
  const url = queryString ? `/v1/driver-portal/earnings?${queryString}` : '/v1/driver-portal/earnings';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get earnings history
 */
export const getEarningsHistory = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.organization_id) params.append('organization_id', filters.organization_id);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const url = queryString ? `/v1/driver-portal/earnings/history?${queryString}` : '/v1/driver-portal/earnings/history';

  const response = await api.get(url);
  return response.data;
};

/**
 * Update driver location
 */
export const updateLocation = async (locationData) => {
  const response = await api.post('/v1/driver-portal/location', locationData);
  return response.data;
};

// ============================================
// EXPENSES
// ============================================

/**
 * Get driver expenses
 */
export const getExpenses = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.organization_id) params.append('organization_id', filters.organization_id);
  if (filters.status) params.append('status', filters.status);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);

  const queryString = params.toString();
  const url = queryString ? `/v1/driver-portal/expenses?${queryString}` : '/v1/driver-portal/expenses';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single expense
 */
export const getExpense = async (expenseId) => {
  const response = await api.get(`/v1/driver-portal/expenses/${expenseId}`);
  return response.data;
};

/**
 * Submit a new expense
 */
export const submitExpense = async (data) => {
  const response = await api.post('/v1/driver-portal/expenses', data);
  return response.data;
};

/**
 * Update an expense
 */
export const updateExpense = async (expenseId, data) => {
  const response = await api.patch(`/v1/driver-portal/expenses/${expenseId}`, data);
  return response.data;
};

export default {
  getProfiles,
  getDashboard,
  getLoads,
  getLoad,
  startTrip,
  updateLoadStatus,
  completeTrip,
  getLoadDocuments,
  uploadDocument,
  getEarnings,
  getEarningsHistory,
  updateLocation,
  getExpenses,
  getExpense,
  submitExpense,
  updateExpense
};
