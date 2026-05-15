import api from './client';

export const listAppGrants = async (orgId) => {
  const res = await api.get(`/v1/orgs/${orgId}/app-grants`);
  return res.data?.data ?? res.data;
};

export const activateApp = async (orgId, appId) => {
  const res = await api.post(`/v1/orgs/${orgId}/app-grants/${appId}/activate`);
  return res.data?.data ?? res.data;
};

export const deactivateApp = async (orgId, appId) => {
  const res = await api.post(`/v1/orgs/${orgId}/app-grants/${appId}/deactivate`);
  return res.data?.data ?? res.data;
};

export const activateAllApps = async (orgId) => {
  const res = await api.post(`/v1/orgs/${orgId}/app-grants/activate-all`);
  return res.data?.data ?? res.data;
};

export default { listAppGrants, activateApp, activateAllApps, deactivateApp };
