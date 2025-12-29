/**
 * Brokers API
 * Handles broker/customer CRUD operations
 */

import api from './client';

/**
 * Get all brokers for the current organization
 */
export const getBrokers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
  if (filters.is_preferred !== undefined) params.append('is_preferred', filters.is_preferred);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/brokers?${queryString}` : '/v1/brokers';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single broker by ID
 */
export const getBroker = async (brokerId) => {
  const response = await api.get(`/v1/brokers/${brokerId}`);
  return response.data;
};

/**
 * Create a new broker
 */
export const createBroker = async (data) => {
  const response = await api.post('/v1/brokers', data);
  return response.data;
};

/**
 * Update a broker
 */
export const updateBroker = async (brokerId, data) => {
  const response = await api.patch(`/v1/brokers/${brokerId}`, data);
  return response.data;
};

/**
 * Delete a broker (soft delete)
 */
export const deleteBroker = async (brokerId) => {
  const response = await api.delete(`/v1/brokers/${brokerId}`);
  return response.data;
};

/**
 * Search FMCSA for broker/carrier info
 */
export const fmcsaLookup = async ({ mc_number, dot_number, name, query }) => {
  const params = new URLSearchParams();
  if (mc_number) params.append('mc_number', mc_number);
  if (dot_number) params.append('dot_number', dot_number);
  if (name) params.append('name', name);
  if (query) params.append('query', query);

  const response = await api.get(`/v1/brokers/fmcsa-lookup?${params.toString()}`);
  return response.data;
};

export default {
  getBrokers,
  getBroker,
  createBroker,
  updateBroker,
  deleteBroker,
  fmcsaLookup
};
