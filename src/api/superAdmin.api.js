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

export default { listUsers, getUser, updateUser, setUserPassword };
