import api from './client';

/**
 * Super Admin API — cross-tenant staff tooling.
 *
 * Backed by /v1/admin/* (requireNetworkAdmin). The shared client
 * interceptor sends X-Organization-Slug; the caller must be operating
 * in the morpro-super-admin org for these to authorize.
 */

export async function listUsers({ search = '', page = 1, limit = 25 } = {}) {
  const { data } = await api.get('/v1/admin/users', {
    params: { search, page, limit }
  });
  return data?.data ?? data;
}

export async function getUser(userId) {
  const { data } = await api.get(`/v1/admin/users/${userId}`);
  return data?.data ?? data;
}

export async function updateUser(userId, patch) {
  const { data } = await api.patch(`/v1/admin/users/${userId}`, patch);
  return data?.data ?? data;
}

export async function setUserPassword(userId, password) {
  const { data } = await api.post(`/v1/admin/users/${userId}/password`, { password });
  return data?.data ?? data;
}

// ── Organizations ────────────────────────────────────────────────────

export async function listOrganizations({ search = '', page = 1, limit = 25, status = 'active' } = {}) {
  const { data } = await api.get('/v1/admin/organizations', {
    params: { search, page, limit, status }
  });
  return data?.data ?? data;
}

export async function deleteOrganization(orgId) {
  const { data } = await api.delete(`/v1/admin/organizations/${orgId}`);
  return data?.data ?? data;
}

export async function purgeOrganization(orgId) {
  const { data } = await api.post(`/v1/admin/organizations/${orgId}/purge`);
  return data?.data ?? data;
}

export async function getOrganization(orgId) {
  const { data } = await api.get(`/v1/admin/organizations/${orgId}`);
  return data?.data ?? data;
}

export async function activateOrgApp(orgId, appId) {
  const { data } = await api.post(`/v1/admin/organizations/${orgId}/apps/${appId}/activate`);
  return data?.data ?? data;
}

export async function deactivateOrgApp(orgId, appId) {
  const { data } = await api.post(`/v1/admin/organizations/${orgId}/apps/${appId}/deactivate`);
  return data?.data ?? data;
}

export async function setOrgFreeAccess(orgId, enabled) {
  const { data } = await api.patch(`/v1/admin/organizations/${orgId}/free-access`, { enabled });
  return data?.data ?? data;
}

// ── Insights / stats ─────────────────────────────────────────────────

export async function getStatsDashboard(days = 30) {
  const { data } = await api.get('/v1/admin/stats/dashboard', { params: { days } });
  return data?.data ?? data;
}

export default {
  listUsers, getUser, updateUser, setUserPassword,
  listOrganizations, getOrganization,
  activateOrgApp, deactivateOrgApp, setOrgFreeAccess,
  deleteOrganization, purgeOrganization,
  getStatsDashboard
};
