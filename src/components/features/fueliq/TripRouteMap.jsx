/**
 * TripRouteMap - Route map with state segment coloring and fuel stop markers
 * Extends the RouteMap pattern for trip planning
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, MARKER_COLORS } from '../../../services/map/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

export function TripRouteMap({
  route,
  locations = [],
  suggestedStops = [],
  className = '',
  height = '400px'
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [loaded, setLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: 4,
      interactive: true,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.on('load', () => setLoaded(true));

    return () => {
      markers.current.forEach(m => m.remove());
      markers.current = [];
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Draw route and markers
  useEffect(() => {
    if (!loaded || !map.current || !route) return;

    // Remove old layers
    if (map.current.getLayer('route-line')) map.current.removeLayer('route-line');
    if (map.current.getSource('route-source')) map.current.removeSource('route-source');
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add route line
    map.current.addSource('route-source', {
      type: 'geojson',
      data: { type: 'Feature', properties: {}, geometry: route }
    });

    map.current.addLayer({
      id: 'route-line',
      type: 'line',
      source: 'route-source',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-color': '#0066FF',
        'line-width': 4,
        'line-opacity': 0.85
      }
    });

    // Add location markers
    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((loc) => {
      if (!loc.coordinates) return;
      const { lat, lng } = loc.coordinates;
      bounds.extend([lng, lat]);

      const color = loc.type === 'pickup' ? MARKER_COLORS.pickup
        : loc.type === 'delivery' ? MARKER_COLORS.delivery
        : MARKER_COLORS.stop;

      const label = loc.type === 'pickup' ? 'P'
        : loc.type === 'delivery' ? 'D'
        : 'S';

      const el = document.createElement('div');
      el.innerHTML = `
        <div style="
          width:28px;height:28px;border-radius:50%;
          background:${color};color:white;
          display:flex;align-items:center;justify-content:center;
          font-weight:700;font-size:12px;font-family:system-ui;
          border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);
        ">${label}</div>
      `;

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 20 }).setHTML(
            `<strong>${loc.name || loc.city || 'Stop'}</strong>
             <div style="font-size:12px;color:#666;">${loc.city || ''}, ${loc.state || ''}</div>`
          )
        )
        .addTo(map.current);

      markers.current.push(marker);
    });

    // Add fuel stop markers
    suggestedStops.forEach((stop) => {
      // We don't have exact coordinates for fuel stops, skip visual markers
      // The TripCostBreakdown component handles displaying these
    });

    // Fit bounds
    if (locations.length > 0) {
      map.current.fitBounds(bounds, { padding: 60, maxZoom: 10 });
    }
  }, [loaded, route, locations, suggestedStops]);

  return (
    <div className={`relative rounded-card overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
          <div className="text-text-tertiary text-body-sm">Loading map...</div>
        </div>
      )}
    </div>
  );
}

export default TripRouteMap;
