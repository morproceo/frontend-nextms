/**
 * Mapbox Utility Functions
 * Helper functions for map operations
 */

import { MAPBOX_TOKEN } from './config';

/**
 * Geocode an address to coordinates
 * @param {string} address - Address string
 * @returns {Promise<{lat: number, lng: number, place_name: string}>}
 */
export async function geocodeAddress(address) {
  const encoded = encodeURIComponent(address);
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Geocoding failed');
  }

  const data = await response.json();
  if (!data.features || data.features.length === 0) {
    throw new Error('No results found');
  }

  const feature = data.features[0];
  const [lng, lat] = feature.center;

  return { lat, lng, place_name: feature.place_name };
}

/**
 * Calculate bounds for a set of coordinates
 * @param {Array<{lat: number, lng: number}>} coordinates
 * @returns {{sw: [number, number], ne: [number, number]}}
 */
export function calculateBounds(coordinates) {
  if (!coordinates || coordinates.length === 0) {
    return null;
  }

  let minLat = Infinity, maxLat = -Infinity;
  let minLng = Infinity, maxLng = -Infinity;

  for (const coord of coordinates) {
    if (coord.lat < minLat) minLat = coord.lat;
    if (coord.lat > maxLat) maxLat = coord.lat;
    if (coord.lng < minLng) minLng = coord.lng;
    if (coord.lng > maxLng) maxLng = coord.lng;
  }

  // Add padding
  const latPadding = (maxLat - minLat) * 0.15;
  const lngPadding = (maxLng - minLng) * 0.15;

  return {
    sw: [minLng - lngPadding, minLat - latPadding],
    ne: [maxLng + lngPadding, maxLat + latPadding]
  };
}

/**
 * Format coordinates for display
 */
export function formatCoordinates(lat, lng) {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

/**
 * Convert meters to miles
 */
export function metersToMiles(meters) {
  return Math.round(meters * 0.000621371);
}

/**
 * Convert seconds to hours (with 1 decimal)
 */
export function secondsToHours(seconds) {
  return Math.round(seconds / 3600 * 10) / 10;
}

/**
 * Format duration for display
 */
export function formatDuration(hours) {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Build address string from components
 */
export function buildAddressString({ name, address, city, state, zip }) {
  const parts = [];
  if (address) parts.push(address);
  if (city) parts.push(city);
  if (state) parts.push(state);
  if (zip) parts.push(zip);
  return parts.join(', ') || name || '';
}

export default {
  geocodeAddress,
  calculateBounds,
  formatCoordinates,
  metersToMiles,
  secondsToHours,
  formatDuration,
  buildAddressString
};
