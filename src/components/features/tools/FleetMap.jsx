/**
 * FleetMap - Real-time fleet tracking map with Mapbox GL
 *
 * Features:
 * - Displays all trucks with valid locations as colored circle markers
 * - Marker color reflects ELD status (driving, on_duty, sleeper, off_duty)
 * - Click a marker to select truck and fly to it
 * - Selected truck shows info popup with driver, speed, location
 * - Markers rotate by bearing when available
 * - Loading overlay spinner
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../../../services/map/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

// ELD status to marker color
const ELD_COLORS = {
  driving: '#ef4444',
  on_duty: '#f59e0b',
  sleeper_berth: '#3b82f6',
  off_duty: '#22c55e',
  available: '#22c55e',
};

const ELD_LABELS = {
  driving: 'Driving',
  on_duty: 'On Duty',
  sleeper_berth: 'Sleeper',
  off_duty: 'Off Duty',
  available: 'Available',
};

function getEldColor(status) {
  return ELD_COLORS[status] || '#6b7280';
}

function getEldLabel(status) {
  return ELD_LABELS[status] || status || 'Unknown';
}

/**
 * Format a timestamp into relative time like "2 min ago"
 */
function relativeTime(timestamp) {
  if (!timestamp) return '';
  const now = Date.now();
  const then = new Date(timestamp).getTime();
  const diffMs = now - then;
  if (diffMs < 0) return 'just now';

  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/**
 * Create an HTML marker element — a colored circle with unit number
 */
function createTruckMarkerEl(color, unitNumber, bearing) {
  const el = document.createElement('div');
  const rotation = typeof bearing === 'number' ? `transform: rotate(${bearing}deg);` : '';
  el.innerHTML = `
    <div style="
      width: 36px; height: 36px;
      background: ${color};
      border: 2.5px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
      ${rotation}
    ">
      <span style="
        color: white;
        font-size: 12px;
        font-weight: 700;
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1;
        user-select: none;
      ">${unitNumber || ''}</span>
    </div>
  `;
  return el;
}

/**
 * Build popup HTML for a selected truck
 */
function buildPopupHTML(truck) {
  const driver = truck.driver || {};
  const loc = truck.location || {};
  const driverName = [driver.first_name, driver.last_name].filter(Boolean).join(' ') || 'No driver';
  const eldStatus = driver.eld_status;
  const eldColor = getEldColor(eldStatus);
  const eldLabel = getEldLabel(eldStatus);
  const speed = loc.speed_mph != null ? `${Math.round(loc.speed_mph)} mph` : '';
  const description = loc.description || '';
  const detail = [speed, description].filter(Boolean).join(' \u00b7 ');
  const updated = relativeTime(loc.located_at);

  return `
    <div style="font-family: system-ui; padding: 4px;">
      <div style="font-weight: 700; font-size: 14px;">Unit #${truck.unit_number || ''}</div>
      <div style="color: #666; font-size: 12px;">${driverName}</div>
      <div style="margin: 4px 0;">
        <span style="background: ${eldColor}; color: white; padding: 2px 8px; border-radius: 10px; font-size: 11px;">${eldLabel}</span>
      </div>
      ${detail ? `<div style="font-size: 12px; color: #666;">${detail}</div>` : ''}
      ${updated ? `<div style="font-size: 11px; color: #999;">Updated ${updated}</div>` : ''}
    </div>
  `;
}

export function FleetMap({
  trucks = [],
  selectedTruckId = null,
  onTruckSelect,
  loading = false,
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: true,
      attributionControl: false,
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.on('load', () => setMapLoaded(true));

    return () => {
      markersRef.current.forEach((m) => m.marker.remove());
      markersRef.current = [];
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle marker click
  const handleMarkerClick = useCallback(
    (truck) => {
      const id = truck.truck_id || truck.motive_vehicle_id;
      if (onTruckSelect) onTruckSelect(id);
      if (map.current && truck.location) {
        map.current.flyTo({
          center: [truck.location.lng, truck.location.lat],
          zoom: 12,
        });
      }
    },
    [onTruckSelect]
  );

  // Draw / update markers when trucks change
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Remove old markers
    markersRef.current.forEach((m) => m.marker.remove());
    markersRef.current = [];

    // Add markers for trucks with locations
    trucks.forEach((truck) => {
      if (!truck.location || truck.location.lat == null || truck.location.lng == null) return;

      const eldStatus = truck.driver?.eld_status;
      const color = getEldColor(eldStatus);
      const el = createTruckMarkerEl(color, truck.unit_number, truck.location.bearing);

      el.addEventListener('click', () => handleMarkerClick(truck));

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([truck.location.lng, truck.location.lat])
        .addTo(map.current);

      markersRef.current.push({
        marker,
        truckId: truck.truck_id || truck.motive_vehicle_id,
      });
    });
  }, [trucks, mapLoaded, handleMarkerClick]);

  // Fly to selected truck and show popup
  useEffect(() => {
    if (!mapLoaded || !map.current) return;

    // Remove existing popup
    if (popupRef.current) {
      popupRef.current.remove();
      popupRef.current = null;
    }

    if (!selectedTruckId) return;

    const truck = trucks.find(
      (t) => t.truck_id === selectedTruckId || t.motive_vehicle_id === selectedTruckId
    );
    if (!truck || !truck.location) return;

    const { lng, lat } = truck.location;

    map.current.flyTo({
      center: [lng, lat],
      zoom: 12,
    });

    const popup = new mapboxgl.Popup({
      closeOnClick: true,
      closeButton: true,
      maxWidth: '260px',
      offset: 20,
    })
      .setLngLat([lng, lat])
      .setHTML(buildPopupHTML(truck))
      .addTo(map.current);

    popupRef.current = popup;
  }, [selectedTruckId, trucks, mapLoaded]);

  return (
    <div className="relative w-full h-full rounded-xl overflow-hidden border border-border bg-surface">
      <div ref={mapContainer} className="absolute inset-0" />

      {/* Loading overlay */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-surface/60 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin"
            />
            <span className="text-body-sm text-text-secondary font-medium">Loading fleet data...</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default FleetMap;
