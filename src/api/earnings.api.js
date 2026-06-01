/**
 * Driver Earnings Ledger API (carrier-facing)
 */

import api from './client';

/**
 * List earnings for the current org.
 * @param {object} filters - { driver_id, pay_status, limit, offset }
 */
export const listEarnings = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.pay_status) params.append('pay_status', filters.pay_status);
  if (filters.limit) params.append('limit', filters.limit);
  if (filters.offset) params.append('offset', filters.offset);
  const qs = params.toString();
  const url = qs ? `/v1/earnings?${qs}` : '/v1/earnings';
  const res = await api.get(url);
  return res.data;
};

/**
 * Look up an earning by (load_id, driver_id) for the current org. Used by
 * SettlementFormPage to resolve the underlying earning behind a LOAD_PAY
 * item before opening the adjust modal.
 */
export const lookupEarning = async ({ loadId, driverId }) => {
  const params = new URLSearchParams({ load_id: loadId, driver_id: driverId });
  const res = await api.get(`/v1/earnings/lookup?${params.toString()}`);
  return res.data;
};

/**
 * Append an adjustment to an earning.
 *   amount  - signed number (positive adds, negative deducts)
 *   reason  - free text, min 15 chars (server-enforced)
 * Server guard: net pay cannot drop below $0.
 */
export const adjustEarning = async (earningId, { amount, reason }) => {
  const res = await api.post(`/v1/earnings/${earningId}/adjust`, { amount, reason });
  return res.data;
};

export default { listEarnings, lookupEarning, adjustEarning };
