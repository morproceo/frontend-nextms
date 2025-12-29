/**
 * Loads API
 * Handles load CRUD, status updates, and dispatch operations
 */

import api from './client';

/**
 * Get all loads for the current organization
 */
export const getLoads = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.billing_status) params.append('billing_status', filters.billing_status);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.search) params.append('search', filters.search);
  if (filters.pickup_date_from) params.append('pickup_date_from', filters.pickup_date_from);
  if (filters.pickup_date_to) params.append('pickup_date_to', filters.pickup_date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/loads?${queryString}` : '/v1/loads';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single load by ID
 */
export const getLoad = async (loadId) => {
  const response = await api.get(`/v1/loads/${loadId}`);
  return response.data;
};

/**
 * Create a new load
 */
export const createLoad = async (data) => {
  const response = await api.post('/v1/loads', data);
  return response.data;
};

/**
 * Update a load
 */
export const updateLoad = async (loadId, data) => {
  const response = await api.patch(`/v1/loads/${loadId}`, data);
  return response.data;
};

/**
 * Delete a load (soft delete)
 */
export const deleteLoad = async (loadId) => {
  const response = await api.delete(`/v1/loads/${loadId}`);
  return response.data;
};

/**
 * Update load status (triggers history on DELIVERED)
 */
export const updateLoadStatus = async (loadId, status) => {
  const response = await api.patch(`/v1/loads/${loadId}/status`, { status });
  return response.data;
};

/**
 * Update billing status
 */
export const updateBillingStatus = async (loadId, billingStatus) => {
  const response = await api.patch(`/v1/loads/${loadId}/billing-status`, { billing_status: billingStatus });
  return response.data;
};

/**
 * Get load statistics
 */
export const getLoadStats = async (dateRange = {}) => {
  const params = new URLSearchParams();
  if (dateRange.from) params.append('from', dateRange.from);
  if (dateRange.to) params.append('to', dateRange.to);

  const queryString = params.toString();
  const url = queryString ? `/v1/loads/stats?${queryString}` : '/v1/loads/stats';

  const response = await api.get(url);
  return response.data;
};

// ============================================
// DISPATCH OPERATIONS
// ============================================

/**
 * Assign a load to a driver
 */
export const assignLoad = async (data) => {
  const response = await api.post('/v1/dispatch/assign', data);
  return response.data;
};

/**
 * Get all dispatch assignments
 */
export const getAssignments = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.load_id) params.append('load_id', filters.load_id);

  const queryString = params.toString();
  const url = queryString ? `/v1/dispatch?${queryString}` : '/v1/dispatch';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single assignment
 */
export const getAssignment = async (assignmentId) => {
  const response = await api.get(`/v1/dispatch/${assignmentId}`);
  return response.data;
};

/**
 * Cancel an assignment
 */
export const cancelAssignment = async (assignmentId, reason = null) => {
  const response = await api.post(`/v1/dispatch/${assignmentId}/cancel`, { reason });
  return response.data;
};

// ============================================
// STOPS OPERATIONS
// ============================================

/**
 * Get stops for a load
 */
export const getStops = async (loadId) => {
  const response = await api.get(`/v1/loads/${loadId}/stops`);
  return response.data;
};

/**
 * Add a stop to a load
 */
export const addStop = async (loadId, data) => {
  const response = await api.post(`/v1/loads/${loadId}/stops`, data);
  return response.data;
};

/**
 * Update a stop
 */
export const updateStop = async (loadId, stopId, data) => {
  const response = await api.patch(`/v1/loads/${loadId}/stops/${stopId}`, data);
  return response.data;
};

/**
 * Delete a stop
 */
export const deleteStop = async (loadId, stopId) => {
  const response = await api.delete(`/v1/loads/${loadId}/stops/${stopId}`);
  return response.data;
};

/**
 * Reorder stops
 */
export const reorderStops = async (loadId, stopOrder) => {
  const response = await api.put(`/v1/loads/${loadId}/stops/reorder`, { stop_order: stopOrder });
  return response.data;
};

// ============================================
// AI OPERATIONS
// ============================================

/**
 * Parse rate confirmation document using AI
 * @param {File} file - The rate con file (PDF or image)
 * @returns {Promise<object>} Extracted load data
 */
export const parseRateCon = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await api.post('/v1/loads/parse-rate-con', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export default {
  getLoads,
  getLoad,
  createLoad,
  updateLoad,
  deleteLoad,
  updateLoadStatus,
  updateBillingStatus,
  getLoadStats,
  assignLoad,
  getAssignments,
  getAssignment,
  cancelAssignment,
  // Stops
  getStops,
  addStop,
  updateStop,
  deleteStop,
  reorderStops,
  // AI
  parseRateCon
};
