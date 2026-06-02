/**
 * Dashboard API
 * Aggregator endpoints for the org dashboard.
 */

import api from './client';

/**
 * "What needs you today" feed — missing BOLs, overdue invoices, expiring docs.
 */
export const getActionItems = async () => {
  const res = await api.get('/v1/dashboard/action-items');
  return res.data?.data ?? res.data;
};

/**
 * Recent activity stream for the org timeline.
 */
export const getActivity = async () => {
  const res = await api.get('/v1/dashboard/activity');
  return res.data?.data ?? res.data;
};

/**
 * Finance pulse — four big numbers for the executive briefing.
 */
export const getFinancePulse = async () => {
  const res = await api.get('/v1/dashboard/finance-pulse');
  return res.data?.data ?? res.data;
};

export default { getActionItems, getActivity, getFinancePulse };
