/**
 * Driver Settings API
 * Handles driver organization management and settings
 */

import api from './client';

/**
 * Get all organizations for current user (active + left)
 */
export const getOrganizations = async () => {
  const response = await api.get('/v1/driver-settings/organizations');
  return response.data;
};

/**
 * Get pending invitations
 */
export const getPendingInvites = async () => {
  const response = await api.get('/v1/driver-settings/invites');
  return response.data;
};

/**
 * Accept invite by entering short code
 */
export const acceptInviteByCode = async (code) => {
  const response = await api.post('/v1/driver-settings/invites/accept-code', { code });
  return response.data;
};

/**
 * Accept a pending invite from the UI
 */
export const acceptInvite = async (inviteId) => {
  const response = await api.post(`/v1/driver-settings/invites/${inviteId}/accept`);
  return response.data;
};

/**
 * Decline a pending invite
 */
export const declineInvite = async (inviteId) => {
  const response = await api.post(`/v1/driver-settings/invites/${inviteId}/decline`);
  return response.data;
};

/**
 * Disconnect from an organization
 */
export const disconnectFromOrg = async (orgId) => {
  const response = await api.post(`/v1/driver-settings/organizations/${orgId}/disconnect`);
  return response.data;
};

/**
 * Get organization history timeline
 */
export const getHistory = async () => {
  const response = await api.get('/v1/driver-settings/history');
  return response.data;
};

/**
 * Get driver profiles across all organizations
 */
export const getProfiles = async () => {
  const response = await api.get('/v1/driver-settings/profiles');
  return response.data;
};

export default {
  getOrganizations,
  getPendingInvites,
  acceptInviteByCode,
  acceptInvite,
  declineInvite,
  disconnectFromOrg,
  getHistory,
  getProfiles
};
