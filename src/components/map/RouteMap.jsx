/**
 * RouteMap Component
 * Displays a Mapbox map with route visualization
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
  ROUTE_STYLE,
  MARKER_COLORS
} from '../../services/map/config';
import { calculateBounds } from '../../services/map/mapbox';

// Set Mapbox token
mapboxgl.accessToken = MAPBOX_TOKEN;

export function RouteMap({
  route,           // GeoJSON LineString geometry for the route
  locations = [],  // Array of { type, lat, lng, name, city, state }
  liveLocation = null, // { lat, lng, heading?, observed_at? } — moving truck pin
  className = '',
  style = 'dark',
  showMarkers = true,
  interactive = true,
  onMapLoad = null,
  onLocationClick = null
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const liveMarker = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES[style] || MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive,
      attributionControl: false
    });

    // Add navigation controls if interactive
    if (interactive) {
      map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    }

    map.current.on('load', () => {
      setLoaded(true);
      if (onMapLoad) onMapLoad(map.current);
    });

    return () => {
      markers.current.forEach(m => m.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [style, interactive, onMapLoad]);

  // Update route
  useEffect(() => {
    if (!loaded || !map.current) return;

    // Remove existing route
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }

    // Add new route if provided
    if (route && route.coordinates && route.coordinates.length > 0) {
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: route
        }
      });

      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': ROUTE_STYLE.lineColor,
          'line-width': ROUTE_STYLE.lineWidth,
          'line-opacity': ROUTE_STYLE.lineOpacity
        }
      });
    }
  }, [route, loaded]);

  // Update markers
  useEffect(() => {
    if (!loaded || !map.current || !showMarkers) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add new markers
    locations.forEach((loc, index) => {
      if (!loc.coordinates?.lat || !loc.coordinates?.lng) return;

      const color = MARKER_COLORS[loc.type] || MARKER_COLORS.stop;
      const isPickup = loc.type === 'pickup';
      const isDelivery = loc.type === 'delivery';

      // Create marker element
      const el = document.createElement('div');
      el.className = 'route-marker';
      el.innerHTML = `
        <div style="
          width: ${isPickup || isDelivery ? '28px' : '22px'};
          height: ${isPickup || isDelivery ? '28px' : '22px'};
          background: ${color};
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        ">
          <span style="
            color: white;
            font-size: 10px;
            font-weight: 600;
          ">${isPickup ? 'P' : isDelivery ? 'D' : index}</span>
        </div>
      `;

      // Create popup
      const popupContent = `
        <div style="padding: 4px 0;">
          <div style="font-weight: 600; font-size: 13px; color: #111;">
            ${loc.name || loc.city || 'Location'}
          </div>
          <div style="color: #666; font-size: 12px; margin-top: 2px;">
            ${loc.city ? `${loc.city}, ${loc.state}` : loc.place_name || ''}
          </div>
        </div>
      `;

      const popup = new mapboxgl.Popup({ offset: 25, closeButton: false })
        .setHTML(popupContent);

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
        .setPopup(popup)
        .addTo(map.current);

      // Click handler
      if (onLocationClick) {
        el.addEventListener('click', () => onLocationClick(loc, index));
      }

      markers.current.push(marker);
    });

    // Fit bounds if we have locations
    if (locations.length > 0) {
      const coords = locations
        .filter(l => l.coordinates?.lat && l.coordinates?.lng)
        .map(l => ({ lat: l.coordinates.lat, lng: l.coordinates.lng }));

      if (coords.length > 0) {
        const bounds = calculateBounds(coords);
        if (bounds) {
          map.current.fitBounds([bounds.sw, bounds.ne], {
            padding: 60,
            duration: 500
          });
        }
      }
    }
  }, [locations, loaded, showMarkers, onLocationClick]);

  // Live truck pin — kept separate from the static route markers so
  // each polling tick just calls setLngLat() instead of recreating
  // markers (which would flicker and reset the map's viewport).
  useEffect(() => {
    if (!loaded || !map.current) return;

    if (!liveLocation || !isFinite(liveLocation.lat) || !isFinite(liveLocation.lng)) {
      if (liveMarker.current) {
        liveMarker.current.remove();
        liveMarker.current = null;
      }
      return;
    }

    if (!liveMarker.current) {
      // First placement — build the DOM element once.
      const el = document.createElement('div');
      el.className = 'live-truck-marker';
      el.innerHTML = `
        <div style="position: relative; width: 28px; height: 28px;">
          <div style="
            position: absolute; inset: 0;
            border-radius: 50%;
            background: rgba(52, 204, 255, 0.25);
            animation: morpro-live-pulse 1.6s ease-out infinite;
          "></div>
          <div style="
            position: absolute; inset: 7px;
            width: 14px; height: 14px;
            background: #34CCFF;
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(52,204,255,0.6), 0 2px 4px rgba(0,0,0,0.4);
          "></div>
        </div>
      `;
      // Inject keyframes once.
      if (!document.getElementById('morpro-live-pulse-style')) {
        const styleTag = document.createElement('style');
        styleTag.id = 'morpro-live-pulse-style';
        styleTag.innerHTML = `
          @keyframes morpro-live-pulse {
            0%   { transform: scale(1);   opacity: 0.8; }
            70%  { transform: scale(2.2); opacity: 0;   }
            100% { transform: scale(2.2); opacity: 0;   }
          }
        `;
        document.head.appendChild(styleTag);
      }
      liveMarker.current = new mapboxgl.Marker({ element: el, anchor: 'center' })
        .setLngLat([liveLocation.lng, liveLocation.lat])
        .addTo(map.current);
    } else {
      liveMarker.current.setLngLat([liveLocation.lng, liveLocation.lat]);
    }
  }, [liveLocation, loaded]);

  return (
    <div
      ref={mapContainer}
      className={`w-full h-full ${className}`}
      style={{ minHeight: '400px' }}
    />
  );
}

export default RouteMap;
