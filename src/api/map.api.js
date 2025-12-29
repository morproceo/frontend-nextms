/**
 * Map API
 * Handles map-related API calls (geocoding, routing)
 */

import api from './client';

/**
 * Get Mapbox public token
 */
export const getToken = async () => {
  const response = await api.get('/v1/map/token');
  return response.data;
};

/**
 * Geocode an address
 * @param {string} address - Address to geocode
 */
export const geocode = async (address) => {
  const response = await api.post('/v1/map/geocode', { address });
  return response.data;
};

/**
 * Calculate route between waypoints
 * @param {Array<{lat: number, lng: number}>} waypoints - Array of coordinates
 * @param {Object} options - Route options
 */
export const calculateRoute = async (waypoints, options = {}) => {
  const response = await api.post('/v1/map/route', { waypoints, options });
  return response.data;
};

/**
 * Get route for a specific load
 * @param {string} loadId - Load ID
 * @param {Object} options - Options
 * @param {boolean} options.refresh - Force recalculate route (ignore cache)
 */
export const getLoadRoute = async (loadId, options = {}) => {
  const params = options.refresh ? '?refresh=true' : '';
  const response = await api.get(`/v1/map/load/${loadId}/route${params}`);
  return response.data;
};

/**
 * Calculate miles from address objects (for load creation wizard)
 * @param {Object} origin - Origin address {city, state, address?, zip?}
 * @param {Object} destination - Destination address {city, state, address?, zip?}
 * @param {Array<Object>} stops - Optional intermediate stops
 * @returns {Promise<{success: boolean, distanceMiles?: number, durationHours?: number, error?: string}>}
 */
export const calculateMiles = async (origin, destination, stops = []) => {
  const response = await api.post('/v1/map/calculate-miles', { origin, destination, stops });
  return response.data;
};

/**
 * Batch geocode multiple addresses
 * @param {Array<string>} addresses - Array of addresses
 */
export const batchGeocode = async (addresses) => {
  const response = await api.post('/v1/map/batch-geocode', { addresses });
  return response.data;
};

export default {
  getToken,
  geocode,
  calculateRoute,
  getLoadRoute,
  calculateMiles,
  batchGeocode
};
