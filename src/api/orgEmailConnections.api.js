import api from './client';

/**
 * Org-level email connections API.
 *
 * Powers the Organization → Integrations → Email panel.
 * Returns metadata only — tokens never cross the wire.
 */

export const listConnections = async (orgId) => {
  const res = await api.get(`/v1/organizations/${orgId}/email-connections`);
  return res.data?.data ?? res.data;
};

export const revokeConnection = async (orgId, connectionId) => {
  const res = await api.delete(`/v1/organizations/${orgId}/email-connections/${connectionId}`);
  return res.data?.data ?? res.data;
};

export const testConnection = async (orgId, connectionId) => {
  const res = await api.post(`/v1/organizations/${orgId}/email-connections/${connectionId}/test`);
  return res.data?.data ?? res.data;
};

/**
 * Start Gmail OAuth. Returns the Google consent URL the browser should
 * redirect to. The user lands on Google, grants scopes, and Google
 * redirects to our backend callback which finishes the dance and
 * sends the browser back to `returnTo`.
 */
export const startGmailOAuth = async (orgId, returnTo) => {
  const res = await api.post(
    `/v1/organizations/${orgId}/email-connections/oauth/gmail/start`,
    { return_to: returnTo || null }
  );
  return res.data?.data ?? res.data;
};

export default {
  listConnections,
  revokeConnection,
  testConnection,
  startGmailOAuth
};
