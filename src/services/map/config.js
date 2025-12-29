/**
 * Mapbox Configuration
 * Centralized configuration for Mapbox integration
 */

// Public token - safe for frontend use
export const MAPBOX_TOKEN = 'pk.eyJ1IjoibW9ycHJvY2VvIiwiYSI6ImNtanEyZHV0YjJ1a2UzZHB1ZnVuMjc1dWEifQ.LmXFKj4IzMGAyQYJ6r9vwQ';

// Map styles
export const MAP_STYLES = {
  dark: 'mapbox://styles/mapbox/dark-v11',
  light: 'mapbox://styles/mapbox/light-v11',
  streets: 'mapbox://styles/mapbox/streets-v12',
  satellite: 'mapbox://styles/mapbox/satellite-streets-v12',
  navigation: 'mapbox://styles/mapbox/navigation-day-v1',
  navigationNight: 'mapbox://styles/mapbox/navigation-night-v1'
};

// Default map settings
export const DEFAULT_CENTER = [-98.5795, 39.8283]; // Center of USA [lng, lat]
export const DEFAULT_ZOOM = 4;

// Route line styling
export const ROUTE_STYLE = {
  lineColor: '#0066FF',
  lineWidth: 4,
  lineOpacity: 0.85
};

// Marker colors
export const MARKER_COLORS = {
  pickup: '#22c55e',    // green
  delivery: '#ef4444',  // red
  stop: '#f59e0b',      // amber
  truck: '#0066FF'      // blue
};

export default {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ROUTE_STYLE,
  MARKER_COLORS
};
