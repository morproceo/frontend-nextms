/**
 * Dispatch API
 * Handles dispatch command center API calls
 */

import api from './client';

/**
 * Get dispatch timeline for command center
 * @param {Object} filters - { days: number }
 */
export const getTimeline = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.days) params.append('days', filters.days);
  const queryString = params.toString();
  const url = queryString ? `/v1/dispatch/timeline?${queryString}` : '/v1/dispatch/timeline';
  const response = await api.get(url);
  return response.data;
};

/**
 * Get org cost-per-mile settings
 */
export const getCostSettings = async () => {
  const response = await api.get('/v1/dispatch/cost-settings');
  return response.data;
};

/**
 * Save org cost-per-mile settings
 * @param {Object} data - Cost breakdown fields
 */
export const saveCostSettings = async (data) => {
  const response = await api.put('/v1/dispatch/cost-settings', data);
  return response.data;
};

export default { getTimeline, getCostSettings, saveCostSettings };
