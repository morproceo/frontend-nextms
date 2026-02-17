/**
 * Driver Connection API
 * Handles driver-organization connection management
 */

import api from './client';

/**
 * Find organization by code (minimal public info)
 */
export const findOrg = async (code) => {
  const response = await api.get('/v1/driver-connection/find-org', {
    params: { code }
  });
  return response.data;
};

/**
 * Request connection to an organization via org code
 */
export const requestConnection = async (orgCode) => {
  const response = await api.post('/v1/driver-connection/request', {
    org_code: orgCode
  });
  return response.data;
};

/**
 * Get driver's outbound pending connection requests
 */
export const getMyRequests = async () => {
  const response = await api.get('/v1/driver-connection/my-requests');
  return response.data;
};

/**
 * Cancel a pending connection request
 */
export const cancelRequest = async (id) => {
  const response = await api.delete(`/v1/driver-connection/requests/${id}`);
  return response.data;
};

// ============================================
// ADMIN ENDPOINTS (org-scoped)
// ============================================

/**
 * Get pending connection requests for an organization
 */
export const getPendingRequests = async () => {
  const response = await api.get('/v1/drivers/connection-requests');
  return response.data;
};

/**
 * Approve a connection request
 */
export const approveRequest = async (id) => {
  const response = await api.post(`/v1/drivers/connection-requests/${id}/approve`);
  return response.data;
};

/**
 * Reject a connection request
 */
export const rejectRequest = async (id) => {
  const response = await api.post(`/v1/drivers/connection-requests/${id}/reject`);
  return response.data;
};

/**
 * Update data sharing level for a driver
 */
export const updateSharingLevel = async (driverId, dataSharingLevel) => {
  const response = await api.patch(`/v1/drivers/${driverId}/sharing-level`, {
    data_sharing_level: dataSharingLevel
  });
  return response.data;
};

// ============================================
// ORG-INITIATED NETWORK SEARCH & INVITE
// ============================================

/**
 * Search the driver network for unconnected drivers
 */
export const searchDriverNetwork = async (query, limit = 20) => {
  const response = await api.get('/v1/drivers/search-network', {
    params: { query, limit }
  });
  return response.data;
};

/**
 * Invite a registered driver from the network
 */
export const inviteDriver = async (userId) => {
  const response = await api.post('/v1/drivers/invite-driver', {
    user_id: userId
  });
  return response.data;
};

/**
 * Get incoming org-initiated invites (driver-facing)
 */
export const getIncomingInvites = async () => {
  const response = await api.get('/v1/driver-connection/incoming-invites');
  return response.data;
};

/**
 * Accept an org-initiated invite
 */
export const acceptOrgInvite = async (id) => {
  const response = await api.post(`/v1/driver-connection/invites/${id}/accept`);
  return response.data;
};

/**
 * Reject an org-initiated invite
 */
export const rejectOrgInvite = async (id) => {
  const response = await api.post(`/v1/driver-connection/invites/${id}/reject`);
  return response.data;
};

// ============================================
// ORGANIZATION DIRECTORY (DRIVER-FACING)
// ============================================

/**
 * Search the public organization directory
 */
export const searchOrgDirectory = async (query, state, limit = 20) => {
  const response = await api.get('/v1/driver-connection/org-directory', {
    params: { query, state, limit }
  });
  return response.data;
};

/**
 * Get an organization's public profile by slug
 */
export const getOrgPublicProfile = async (slug) => {
  const response = await api.get(`/v1/driver-connection/org-directory/${slug}`);
  return response.data;
};

export default {
  findOrg,
  requestConnection,
  getMyRequests,
  cancelRequest,
  getPendingRequests,
  approveRequest,
  rejectRequest,
  updateSharingLevel,
  searchDriverNetwork,
  inviteDriver,
  getIncomingInvites,
  acceptOrgInvite,
  rejectOrgInvite,
  searchOrgDirectory,
  getOrgPublicProfile
};
