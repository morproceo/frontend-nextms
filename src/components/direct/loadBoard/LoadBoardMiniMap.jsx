import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2 } from 'lucide-react';
import { MAPBOX_TOKEN, MAP_STYLES, MARKER_COLORS } from '../../../services/map/config';
import { geocodeLoadEndpoints } from './geocode';

mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * Compact pickup → delivery preview shown in the inline row expansion.
 * Geocodes both endpoints lazily, draws straight-line route, fits bounds.
 */
export default function LoadBoardMiniMap({ load, className = '' }) {
  const container = useRef(null);
  const map = useRef(null);
  const [endpoints, setEndpoints] = useState(null);
  const [error, setError] = useState(null);

  // Geocode endpoints once per load.
  useEffect(() => {
    let cancelled = false;
    setError(null);
    setEndpoints(null);
    geocodeLoadEndpoints(load).then((res) => {
      if (cancelled) return;
      if (!res.pickup || !res.delivery) {
        setError('Could not locate one or both endpoints');
        return;
      }
      setEndpoints(res);
    });
    return () => { cancelled = true; };
  }, [load.id]);

  // Render map once we have both points.
  useEffect(() => {
    if (!endpoints || !container.current || map.current) return;

    const { pickup, delivery } = endpoints;

    map.current = new mapboxgl.Map({
      container: container.current,
      style: MAP_STYLES.streets,
      center: [(pickup.lng + delivery.lng) / 2, (pickup.lat + delivery.lat) / 2],
      zoom: 5,
      interactive: false,
      attributionControl: false
    });

    map.current.on('load', () => {
      // Markers
      new mapboxgl.Marker({ color: MARKER_COLORS.pickup })
        .setLngLat([pickup.lng, pickup.lat])
        .addTo(map.current);
      new mapboxgl.Marker({ color: MARKER_COLORS.delivery })
        .setLngLat([delivery.lng, delivery.lat])
        .addTo(map.current);

      // Straight-line route
      map.current.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: [
              [pickup.lng, pickup.lat],
              [delivery.lng, delivery.lat]
            ]
          }
        }
      });
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#000',
          'line-width': 2.5,
          'line-dasharray': [2, 1.5]
        }
      });

      // Fit bounds with padding
      const bounds = new mapboxgl.LngLatBounds()
        .extend([pickup.lng, pickup.lat])
        .extend([delivery.lng, delivery.lat]);
      map.current.fitBounds(bounds, { padding: 40, duration: 0 });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [endpoints]);

  if (error) {
    return (
      <div className={`flex items-center justify-center bg-surface-secondary text-text-tertiary text-small ${className}`}>
        {error}
      </div>
    );
  }

  return (
    <div className={`relative bg-surface-secondary ${className}`}>
      <div ref={container} className="absolute inset-0" />
      {!endpoints && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        </div>
      )}
    </div>
  );
}
