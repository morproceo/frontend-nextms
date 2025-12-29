/**
 * Drivers API
 * Handles driver CRUD and invite operations
 */

import api from './client';

/**
 * Get all drivers for the current organization
 */
export const getDrivers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.claimed !== undefined) params.append('claimed', filters.claimed);

  const queryString = params.toString();
  const url = queryString ? `/v1/drivers?${queryString}` : '/v1/drivers';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single driver by ID
 */
export const getDriver = async (driverId) => {
  const response = await api.get(`/v1/drivers/${driverId}`);
  return response.data;
};

/**
 * Create a new driver profile
 */
export const createDriver = async (data) => {
  const response = await api.post('/v1/drivers', data);
  return response.data;
};

/**
 * Update a driver profile
 */
export const updateDriver = async (driverId, data) => {
  const response = await api.patch(`/v1/drivers/${driverId}`, data);
  return response.data;
};

/**
 * Delete a driver (soft delete)
 */
export const deleteDriver = async (driverId) => {
  const response = await api.delete(`/v1/drivers/${driverId}`);
  return response.data;
};

/**
 * Invite a driver to claim their profile
 */
export const inviteDriver = async (driverId) => {
  const response = await api.post(`/v1/drivers/${driverId}/invite`);
  return response.data;
};

/**
 * Get the invite status for a driver
 */
export const getDriverInviteStatus = async (driverId) => {
  const response = await api.get(`/v1/drivers/${driverId}/invite-status`);
  return response.data;
};

/**
 * Resend an invitation to a driver
 */
export const resendDriverInvite = async (driverId) => {
  const response = await api.post(`/v1/drivers/${driverId}/resend-invite`);
  return response.data;
};

/**
 * Get driver invite info for claim page (public route)
 */
export const getDriverInviteInfo = async (token) => {
  const response = await api.get(`/v1/driver-invite/${token}`);
  return response.data;
};

/**
 * Accept a driver invitation with password (public route)
 */
export const acceptDriverInvite = async (token, password) => {
  const response = await api.post(`/v1/driver-invite/${token}/accept`, { password });
  return response.data;
};

/**
 * Get current user's driver profiles across all orgs
 */
export const getMyDriverProfiles = async () => {
  const response = await api.get('/v1/me/driver-profiles');
  return response.data;
};

export default {
  getDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  inviteDriver,
  getDriverInviteStatus,
  resendDriverInvite,
  getDriverInviteInfo,
  acceptDriverInvite,
  getMyDriverProfiles
};
