/**
 * ATLAS API
 * Handles ATLAS freight intelligence operations
 */

import api from './client';

// ============================================
// DASHBOARD
// ============================================

export const getDashboard = async () => {
  const response = await api.get('/v1/atlas/dashboard');
  return response.data;
};

// ============================================
// PROCESSING STATUS
// ============================================

export const getProcessingStatus = async () => {
  const response = await api.get('/v1/atlas/processing-status');
  return response.data;
};

// ============================================
// CONNECTIONS
// ============================================

export const getConnections = async () => {
  const response = await api.get('/v1/atlas/connections');
  return response.data;
};

export const getOAuthUrl = async (provider) => {
  const response = await api.get(`/v1/atlas/connections/oauth-url?provider=${provider}`);
  return response.data;
};

export const updateConnection = async (id, data) => {
  const response = await api.put(`/v1/atlas/connections/${id}`, data);
  return response.data;
};

export const deleteConnection = async (id) => {
  const response = await api.delete(`/v1/atlas/connections/${id}`);
  return response.data;
};

export const syncConnection = async (id) => {
  const response = await api.post(`/v1/atlas/connections/${id}/sync`);
  return response.data;
};

// ============================================
// EMAILS
// ============================================

export const getEmails = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.processing_status) params.append('processing_status', filters.processing_status);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/atlas/emails?${queryString}` : '/v1/atlas/emails';

  const response = await api.get(url);
  return response.data;
};

export const getEmail = async (id) => {
  const response = await api.get(`/v1/atlas/emails/${id}`);
  return response.data;
};

export const submitManualEmail = async (data) => {
  const response = await api.post('/v1/atlas/emails/manual', data);
  return response.data;
};

export const reprocessEmail = async (id) => {
  const response = await api.post(`/v1/atlas/emails/${id}/reprocess`);
  return response.data;
};

// ============================================
// OPPORTUNITIES
// ============================================

export const getOpportunities = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.status) params.append('status', filters.status);
  if (filters.search) params.append('search', filters.search);
  if (filters.equipment_type) params.append('equipment_type', filters.equipment_type);

  const queryString = params.toString();
  const url = queryString ? `/v1/atlas/opportunities?${queryString}` : '/v1/atlas/opportunities';

  const response = await api.get(url);
  return response.data;
};

export const getOpportunity = async (id) => {
  const response = await api.get(`/v1/atlas/opportunities/${id}`);
  return response.data;
};

export const updateOpportunity = async (id, data) => {
  const response = await api.put(`/v1/atlas/opportunities/${id}`, data);
  return response.data;
};

export const acceptOpportunity = async (id) => {
  const response = await api.post(`/v1/atlas/opportunities/${id}/accept`);
  return response.data;
};

export const rejectOpportunity = async (id, reason) => {
  const response = await api.post(`/v1/atlas/opportunities/${id}/reject`, { reason });
  return response.data;
};

// ============================================
// SETTINGS
// ============================================

export const getSettings = async () => {
  const response = await api.get('/v1/atlas/settings');
  return response.data;
};

export const updateSettings = async (data) => {
  const response = await api.put('/v1/atlas/settings', data);
  return response.data;
};

export default {
  getDashboard,
  getProcessingStatus,
  getConnections,
  getOAuthUrl,
  updateConnection,
  deleteConnection,
  syncConnection,
  getEmails,
  getEmail,
  submitManualEmail,
  reprocessEmail,
  getOpportunities,
  getOpportunity,
  updateOpportunity,
  acceptOpportunity,
  rejectOpportunity,
  getSettings,
  updateSettings
};
