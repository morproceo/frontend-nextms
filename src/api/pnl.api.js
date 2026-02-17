/**
 * P&L API
 * Handles profit & loss reporting endpoints
 */

import api from './client';

/**
 * Get profit & loss report
 */
export const getPnl = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/pnl?${queryString}` : '/v1/pnl';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get monthly P&L trend data
 */
export const getPnlTrend = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);

  const queryString = params.toString();
  const url = queryString ? `/v1/pnl/trend?${queryString}` : '/v1/pnl/trend';

  const response = await api.get(url);
  return response.data;
};

export default {
  getPnl,
  getPnlTrend
};
