/**
 * Dispatch API
 * Handles dispatch command center API calls
 */

import api from './client';

// Backend wraps every successful response with successResponse() →
// `{ success: true, data: <payload> }`. Axios surfaces the HTTP body as
// `r.data`, so the actual payload lives at `r.data.data`. Unwrap once
// here so callers (hooks, components) get the bare payload (array,
// object, etc.) — same shape they'd get from any other clean API.
const unwrap = (r) => r?.data?.data ?? r?.data ?? null;

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
  return unwrap(response) || [];
};

/**
 * Get org cost-per-mile settings
 */
export const getCostSettings = async () => {
  const response = await api.get('/v1/dispatch/cost-settings');
  return unwrap(response);
};

/**
 * Save org cost-per-mile settings
 * @param {Object} data - Cost breakdown fields
 */
export const saveCostSettings = async (data) => {
  const response = await api.put('/v1/dispatch/cost-settings', data);
  return unwrap(response);
};

export default { getTimeline, getCostSettings, saveCostSettings };
