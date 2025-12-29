/**
 * Facilities API
 * Handles shipper/receiver (facility) CRUD operations
 */

import api from './client';

/**
 * Get all facilities for the current organization
 */
export const getFacilities = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
  if (filters.facility_type) params.append('facility_type', filters.facility_type);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/facilities?${queryString}` : '/v1/facilities';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single facility by ID
 */
export const getFacility = async (facilityId) => {
  const response = await api.get(`/v1/facilities/${facilityId}`);
  return response.data;
};

/**
 * Create a new facility
 */
export const createFacility = async (data) => {
  const response = await api.post('/v1/facilities', data);
  return response.data;
};

/**
 * Update a facility
 */
export const updateFacility = async (facilityId, data) => {
  const response = await api.patch(`/v1/facilities/${facilityId}`, data);
  return response.data;
};

/**
 * Delete a facility (soft delete)
 */
export const deleteFacility = async (facilityId) => {
  const response = await api.delete(`/v1/facilities/${facilityId}`);
  return response.data;
};

export default {
  getFacilities,
  getFacility,
  createFacility,
  updateFacility,
  deleteFacility
};
