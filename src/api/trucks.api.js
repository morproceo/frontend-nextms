/**
 * Trucks API
 * Handles truck CRUD and assignment operations
 */

import api from './client';

/**
 * Get all trucks for the current organization
 */
export const getTrucks = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.status) params.append('status', filters.status);
  if (filters.available !== undefined) params.append('available', filters.available);
  if (filters.assigned !== undefined) params.append('assigned', filters.assigned);
  if (filters.search) params.append('search', filters.search);

  const queryString = params.toString();
  const url = queryString ? `/v1/trucks?${queryString}` : '/v1/trucks';

  // Debug: Log the request
  console.log('Fetching trucks from:', url);
  const response = await api.get(url);
  console.log('Full axios response:', response);
  return response.data;
};

/**
 * Get a single truck by ID
 */
export const getTruck = async (truckId) => {
  const response = await api.get(`/v1/trucks/${truckId}`);
  return response.data;
};

/**
 * Create a new truck
 */
export const createTruck = async (data) => {
  const response = await api.post('/v1/trucks', data);
  return response.data;
};

/**
 * Update a truck
 */
export const updateTruck = async (truckId, data) => {
  const response = await api.patch(`/v1/trucks/${truckId}`, data);
  return response.data;
};

/**
 * Delete a truck (soft delete)
 */
export const deleteTruck = async (truckId) => {
  const response = await api.delete(`/v1/trucks/${truckId}`);
  return response.data;
};

/**
 * Assign a driver to a truck
 */
export const assignDriver = async (truckId, driverId) => {
  const response = await api.post(`/v1/trucks/${truckId}/assign-driver`, { driver_id: driverId });
  return response.data;
};

/**
 * Assign a trailer to a truck
 */
export const assignTrailer = async (truckId, trailerId) => {
  const response = await api.post(`/v1/trucks/${truckId}/assign-trailer`, { trailer_id: trailerId });
  return response.data;
};

/**
 * Get truck statistics
 */
export const getTruckStats = async () => {
  const response = await api.get('/v1/trucks/stats');
  return response.data;
};

/**
 * Get trucks needing attention
 */
export const getTrucksNeedingAttention = async () => {
  const response = await api.get('/v1/trucks/attention');
  return response.data;
};

export default {
  getTrucks,
  getTruck,
  createTruck,
  updateTruck,
  deleteTruck,
  assignDriver,
  assignTrailer,
  getTruckStats,
  getTrucksNeedingAttention
};
