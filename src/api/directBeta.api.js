import api from './client';

/**
 * MorPro Direct (Load Network) beta-access gate.
 *
 * Org-scoped status/request use the shared client (sends
 * X-Organization-Slug). Admin endpoints require morpro-super-admin.
 */

export async function getBetaStatus() {
  const { data } = await api.get('/v1/network/beta/status');
  return data?.data ?? data;
}

export async function requestBetaAccess(note) {
  const { data } = await api.post('/v1/network/beta/request', { note });
  return data?.data ?? data;
}

// Super Admin
export async function adminListBeta(status = 'requested') {
  const { data } = await api.get('/v1/admin/direct-beta', { params: { status } });
  return data?.data ?? data;
}

export async function adminApproveBeta(id) {
  const { data } = await api.post(`/v1/admin/direct-beta/${id}/approve`);
  return data?.data ?? data;
}

export async function adminRejectBeta(id, reason) {
  const { data } = await api.post(`/v1/admin/direct-beta/${id}/reject`, { reason });
  return data?.data ?? data;
}

export default {
  getBetaStatus, requestBetaAccess,
  adminListBeta, adminApproveBeta, adminRejectBeta
};
