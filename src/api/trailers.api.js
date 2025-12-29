/**
 * Trailers API
 * Handles trailer CRUD and assignment operations
 */

import api from './client';

/**
 * Get all trailers for the current organization
 */
export const getTrailers = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.type) params.append('type', filters.type);
  if (filters.available !== undefined) params.append('available', filters.available);
  if (filters.assigned !== undefined) params.append('assigned', filters.assigned);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/trailers?${queryString}` : '/v1/trailers';

  const response = await api.get(url);
  return response.data;
};

/**
 * Get a single trailer by ID
 */
export const getTrailer = async (trailerId) => {
  const response = await api.get(`/v1/trailers/${trailerId}`);
  return response.data;
};

/**
 * Create a new trailer
 */
export const createTrailer = async (data) => {
  const response = await api.post('/v1/trailers', data);
  return response.data;
};

/**
 * Update a trailer
 */
export const updateTrailer = async (trailerId, data) => {
  const response = await api.patch(`/v1/trailers/${trailerId}`, data);
  return response.data;
};

/**
 * Delete a trailer (soft delete)
 */
export const deleteTrailer = async (trailerId) => {
  const response = await api.delete(`/v1/trailers/${trailerId}`);
  return response.data;
};

/**
 * Assign trailer to a truck
 */
export const assignToTruck = async (trailerId, truckId) => {
  const response = await api.post(`/v1/trailers/${trailerId}/assign-truck`, { truck_id: truckId });
  return response.data;
};

/**
 * Get trailer statistics
 */
export const getTrailerStats = async () => {
  const response = await api.get('/v1/trailers/stats');
  return response.data;
};

/**
 * Get trailers needing attention
 */
export const getTrailersNeedingAttention = async () => {
  const response = await api.get('/v1/trailers/attention');
  return response.data;
};

export default {
  getTrailers,
  getTrailer,
  createTrailer,
  updateTrailer,
  deleteTrailer,
  assignToTruck,
  getTrailerStats,
  getTrailersNeedingAttention
};
