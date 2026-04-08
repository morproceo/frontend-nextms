/**
 * DispatchMap - Multi-route Mapbox map with truck sidebar
 *
 * Features:
 * - Left sidebar listing all trucks/loads with driver info
 * - Click a truck to fly to its route on the map
 * - Selected truck shows expanded driver info with call/message actions
 * - Color-coded route lines by load status
 * - Pickup (green) and delivery (red) markers
 * - Route progress indicator (simulated position along route)
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../../../services/map/config';
import { calculateBounds } from '../../../services/map/mapbox';
import {
  Map as MapIcon,
  Truck,
  User,
  Phone,
  MessageSquare,
  Navigation,
  ChevronRight,
  DollarSign,
  X
} from 'lucide-react';

mapboxgl.accessToken = MAPBOX_TOKEN;

// ELD status config: color-coded badges
const ELD_STATUS_CONFIG = {
  driving:       { dot: 'bg-red-500',    label: 'Driving',  text: 'text-red-400' },
  on_duty:       { dot: 'bg-orange-500', label: 'On Duty',  text: 'text-orange-400' },
  sleeper_berth: { dot: 'bg-blue-500',   label: 'Sleeper',  text: 'text-blue-400' },
  off_duty:      { dot: 'bg-green-500',  label: 'Off Duty', text: 'text-green-400' },
};

const getEldConfig = (status) =>
  ELD_STATUS_CONFIG[status] || { dot: 'bg-gray-400', label: 'No ELD', text: 'text-text-tertiary' };

const formatEldHours = (hours) => {
  if (hours == null) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m left`;
};

const isEldStale = (updatedAt) => {
  if (!updatedAt) return false;
  return (Date.now() - new Date(updatedAt).getTime()) > 30 * 60 * 1000;
};

const STATUS_COLORS = {
  IN_TRANSIT: '#f97316',
  DISPATCHED: '#3b82f6',
  BOOKED: '#8b5cf6',
  DELIVERED: '#22c55e'
};

const STATUS_LABELS = {
  IN_TRANSIT: 'In Transit',
  DISPATCHED: 'Dispatched',
  BOOKED: 'Booked',
  DELIVERED: 'Delivered'
};

const STATUS_BG = {
  IN_TRANSIT: 'bg-orange-500/15 text-orange-500',
  DISPATCHED: 'bg-blue-500/15 text-blue-500',
  BOOKED: 'bg-purple-500/15 text-purple-500',
  DELIVERED: 'bg-green-500/15 text-green-500'
};

// Estimate truck position along route based on status
function estimateTruckPosition(load) {
  if (!load.route?.coordinates?.length) return null;
  const coords = load.route.coordinates;
  let progress;
  switch (load.status) {
    case 'IN_TRANSIT': progress = 0.55; break;
    case 'DISPATCHED': progress = 0.05; break;
    case 'DELIVERED': progress = 1.0; break;
    case 'BOOKED': progress = 0; break;
    default: progress = 0.3;
  }
  const idx = Math.min(Math.floor(progress * (coords.length - 1)), coords.length - 1);
  return { lng: coords[idx][0], lat: coords[idx][1] };
}

const formatCurrency = (amount) => {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);
};

// ─── Truck Sidebar Item ─────────────────────────────────
function TruckItem({ load, isSelected, onClick }) {
  const color = STATUS_COLORS[load.status] || '#6b7280';
  const statusBg = STATUS_BG[load.status] || 'bg-gray-500/15 text-gray-500';

  return (
    <button
      onClick={onClick}
      className={`w-full text-left p-3 rounded-xl transition-all ${
        isSelected
          ? 'bg-accent/10 border border-accent/30 shadow-sm'
          : 'hover:bg-surface-secondary/60 border border-transparent'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Truck icon with status color */}
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
          style={{ backgroundColor: `${color}20` }}
        >
          <Truck className="w-4 h-4" style={{ color }} />
        </div>

        <div className="min-w-0 flex-1">
          {/* Reference + status */}
          <div className="flex items-center gap-2">
            <span className="text-body-sm font-bold text-text-primary">
              {load.reference_number}
            </span>
            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${statusBg}`}>
              {STATUS_LABELS[load.status] || load.status}
            </span>
          </div>

          {/* Lane */}
          <p className="text-[11px] text-text-tertiary mt-0.5 truncate">{load.lane}</p>

          {/* Driver + truck */}
          <div className="flex items-center gap-2 mt-1">
            {load.driver && (
              <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                <User className="w-3 h-3" />
                {load.driver.name}
              </span>
            )}
            {load.truck && (
              <span className="flex items-center gap-1 text-[11px] text-text-secondary">
                <Truck className="w-3 h-3" />
                {load.truck.unit_number}
              </span>
            )}
          </div>

          {/* ELD Status */}
          {load.driver && (() => {
            const eld = getEldConfig(load.driver.eld_status);
            const stale = isEldStale(load.driver.eld_status_updated_at);
            const hoursLeft = formatEldHours(load.driver.eld_hours_remaining);
            return (
              <div className={`flex items-center gap-2 mt-1 ${stale ? 'opacity-50 italic' : ''}`}>
                <span className="flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${eld.dot}`} />
                  <span className={`text-[10px] font-semibold ${eld.text}`}>{eld.label}</span>
                </span>
                {hoursLeft && (
                  <span className="text-[10px] text-text-tertiary">{hoursLeft}</span>
                )}
              </div>
            );
          })()}

          {/* Revenue */}
          {load.revenue > 0 && (
            <div className="flex items-center gap-1 mt-1">
              <DollarSign className="w-3 h-3 text-text-tertiary" />
              <span className="text-[11px] font-semibold text-text-primary">{formatCurrency(load.revenue)}</span>
              {load.rpm > 0 && (
                <span className="text-[10px] text-text-tertiary">(${Number(load.rpm).toFixed(2)}/mi)</span>
              )}
            </div>
          )}
        </div>

        {/* Chevron */}
        <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-colors ${
          isSelected ? 'text-accent' : 'text-text-tertiary/40'
        }`} />
      </div>
    </button>
  );
}

// ─── Selected Truck Detail Panel ────────────────────────
function TruckDetail({ load, onClose }) {
  const color = STATUS_COLORS[load.status] || '#6b7280';
  const statusBg = STATUS_BG[load.status] || 'bg-gray-500/15 text-gray-500';

  return (
    <div className="mx-1 mt-1 mb-2 p-3 rounded-xl bg-gradient-to-b from-accent/8 to-surface-secondary/80 border border-accent/25 shadow-lg shadow-accent/5 ring-1 ring-accent/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-5 rounded-full bg-accent" />
          <span className="text-body-sm font-bold text-text-primary">{load.reference_number} Details</span>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-surface-tertiary/60 transition-colors">
          <X className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      </div>

      {/* Driver card */}
      {load.driver ? (
        <div className="bg-surface/80 border border-surface-tertiary/40 rounded-xl p-3 mb-2 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-2.5">
            <div className="w-10 h-10 rounded-full bg-accent/15 border border-accent/20 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-body-sm font-semibold text-text-primary">{load.driver.name}</p>
              {(() => {
                const eld = getEldConfig(load.driver.eld_status);
                const stale = isEldStale(load.driver.eld_status_updated_at);
                const hoursLeft = formatEldHours(load.driver.eld_hours_remaining);
                return (
                  <div className={`flex items-center gap-2 ${stale ? 'opacity-50 italic' : ''}`}>
                    <span className="flex items-center gap-1">
                      <span className={`w-1.5 h-1.5 rounded-full ${eld.dot}`} />
                      <span className={`text-[11px] font-medium ${eld.text}`}>{eld.label}</span>
                    </span>
                    {hoursLeft && (
                      <span className="text-[10px] text-text-tertiary">{hoursLeft}</span>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => load.driver.phone && window.open(`tel:${load.driver.phone}`)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-[12px] font-semibold hover:bg-emerald-500/25 transition-colors"
            >
              <Phone className="w-3.5 h-3.5" />
              Call
            </button>
            <button
              onClick={() => load.driver.phone && window.open(`sms:${load.driver.phone}`)}
              className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-500/15 border border-blue-500/25 text-blue-400 text-[12px] font-semibold hover:bg-blue-500/25 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Message
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-surface/80 border border-surface-tertiary/40 rounded-xl p-3 mb-2 text-center backdrop-blur-sm">
          <User className="w-5 h-5 text-text-tertiary/30 mx-auto mb-1" />
          <p className="text-[11px] text-text-tertiary">No driver assigned</p>
        </div>
      )}

      {/* Truck info */}
      {load.truck && (
        <div className="bg-surface/80 border border-surface-tertiary/40 rounded-xl p-3 mb-2 backdrop-blur-sm">
          <div className="flex items-center gap-2">
            <Truck className="w-4 h-4 text-text-tertiary" />
            <span className="text-body-sm font-semibold text-text-primary">{load.truck.unit_number}</span>
          </div>
        </div>
      )}

      {/* Load details */}
      <div className="bg-surface/80 border border-surface-tertiary/40 rounded-xl p-3 space-y-1.5 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">Status</span>
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusBg}`}>
            {STATUS_LABELS[load.status]}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px] text-text-tertiary">Lane</span>
          <span className="text-[11px] font-medium text-text-primary">{load.lane}</span>
        </div>
        {load.revenue > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">Rate</span>
            <span className="text-[11px] font-bold text-text-primary">{formatCurrency(load.revenue)}</span>
          </div>
        )}
        {load.miles > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-text-tertiary">Miles</span>
            <span className="text-[11px] font-medium text-text-primary">{load.miles} mi</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────
export function DispatchMap({ loads = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const markersRef = useRef([]);
  const truckMarkersRef = useRef([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const selectedLoad = loads.find(l => l.id === selectedId);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: true,
      attributionControl: false
    });

    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.on('load', () => setLoaded(true));

    return () => {
      markersRef.current.forEach(m => m.remove());
      truckMarkersRef.current.forEach(m => m.remove());
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Draw routes and markers
  useEffect(() => {
    if (!loaded || !map.current) return;

    // Clear existing routes
    let cleanIdx = 0;
    while (map.current.getSource(`route-${cleanIdx}`)) {
      if (map.current.getLayer(`route-line-${cleanIdx}`)) map.current.removeLayer(`route-line-${cleanIdx}`);
      if (map.current.getLayer(`route-glow-${cleanIdx}`)) map.current.removeLayer(`route-glow-${cleanIdx}`);
      map.current.removeSource(`route-${cleanIdx}`);
      cleanIdx++;
    }

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];
    truckMarkersRef.current.forEach(m => m.remove());
    truckMarkersRef.current = [];

    if (loads.length === 0) return;

    const allCoords = [];

    loads.forEach((load, i) => {
      const color = STATUS_COLORS[load.status] || '#6b7280';
      const sourceId = `route-${i}`;
      const isSelected = load.id === selectedId;

      if (load.route?.coordinates?.length > 1) {
        map.current.addSource(sourceId, {
          type: 'geojson',
          data: { type: 'Feature', geometry: load.route }
        });

        // Glow layer for selected
        if (isSelected) {
          map.current.addLayer({
            id: `route-glow-${i}`,
            type: 'line',
            source: sourceId,
            layout: { 'line-join': 'round', 'line-cap': 'round' },
            paint: { 'line-color': color, 'line-width': 10, 'line-opacity': 0.2 }
          });
        }

        map.current.addLayer({
          id: `route-line-${i}`,
          type: 'line',
          source: sourceId,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': color,
            'line-width': isSelected ? 4 : 2.5,
            'line-opacity': isSelected ? 1 : 0.6
          }
        });
      }

      // Pickup marker
      if (load.pickup) {
        allCoords.push(load.pickup);
        const el = createMarkerEl('#22c55e', 'P');
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([load.pickup.lng, load.pickup.lat])
          .addTo(map.current);
        markersRef.current.push(marker);
      }

      // Delivery marker
      if (load.delivery) {
        allCoords.push(load.delivery);
        const el = createMarkerEl('#ef4444', 'D');
        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([load.delivery.lng, load.delivery.lat])
          .addTo(map.current);
        markersRef.current.push(marker);
      }

      // Truck position marker (estimated along route)
      if (load.status === 'IN_TRANSIT' || load.status === 'DISPATCHED') {
        const pos = estimateTruckPosition(load);
        if (pos) {
          const el = createTruckMarkerEl(color, load.driver?.name);
          const marker = new mapboxgl.Marker({ element: el })
            .setLngLat([pos.lng, pos.lat])
            .addTo(map.current);
          truckMarkersRef.current.push(marker);
        }
      }
    });

    // Fit bounds (only if nothing selected — let flyTo handle selected)
    if (!selectedId && allCoords.length > 0) {
      const bounds = calculateBounds(allCoords);
      if (bounds) {
        map.current.fitBounds([bounds.sw, bounds.ne], { padding: 60, duration: 500 });
      }
    }
  }, [loads, loaded, selectedId]);

  // Fly to selected load
  const flyToLoad = useCallback((load) => {
    if (!map.current || !load) return;
    const coords = [];
    if (load.pickup) coords.push(load.pickup);
    if (load.delivery) coords.push(load.delivery);
    if (coords.length > 0) {
      const bounds = calculateBounds(coords);
      if (bounds) {
        map.current.fitBounds([bounds.sw, bounds.ne], { padding: 80, duration: 800 });
      }
    }
  }, []);

  const handleSelectLoad = useCallback((load) => {
    setSelectedId(prev => prev === load.id ? null : load.id);
    flyToLoad(load);
  }, [flyToLoad]);

  return (
    <div className="flex rounded-xl overflow-hidden border border-border bg-surface" style={{ height: '620px' }}>
      {/* Left sidebar — truck list */}
      <div className="w-[300px] xl:w-[340px] shrink-0 border-r border-border flex flex-col bg-surface">
        {/* Sidebar header */}
        <div className="px-4 py-3 border-b border-surface-tertiary/40">
          <div className="flex items-center justify-between">
            <h3 className="text-body-sm font-bold text-text-primary">Active Trucks</h3>
            <span className="text-[11px] bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
              {loads.length}
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mt-0.5">Click a truck to view on map</p>
        </div>

        {/* Truck list */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loads.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center px-4">
              <Truck className="w-8 h-8 text-text-tertiary/30 mb-2" />
              <p className="text-body-sm text-text-tertiary">No active trucks</p>
            </div>
          ) : (
            loads.map(load => (
              <div key={load.id}>
                <TruckItem
                  load={load}
                  isSelected={selectedId === load.id}
                  onClick={() => handleSelectLoad(load)}
                />
                {/* Expanded detail panel */}
                {selectedId === load.id && (
                  <TruckDetail
                    load={load}
                    onClose={() => setSelectedId(null)}
                  />
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <div ref={mapContainer} className="absolute inset-0" />

        {/* Legend */}
        {loads.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur-sm border border-border rounded-lg p-3 space-y-1.5 z-10">
            <p className="text-[11px] font-semibold text-text-secondary uppercase tracking-wide mb-1">Routes</p>
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} className="flex items-center gap-2">
                <div className="w-4 h-0.5 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] text-text-secondary">{STATUS_LABELS[status]}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 pt-1 border-t border-border mt-1">
              <div className="w-2.5 h-2.5 rounded-full bg-green-500 border border-white" />
              <span className="text-[11px] text-text-secondary">Pickup</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500 border border-white" />
              <span className="text-[11px] text-text-secondary">Delivery</span>
            </div>
            <div className="flex items-center gap-2">
              <Navigation className="w-3 h-3 text-text-secondary" />
              <span className="text-[11px] text-text-secondary">Truck Position</span>
            </div>
          </div>
        )}

        {/* Empty state */}
        {loads.length === 0 && loaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-sm z-10">
            <MapIcon className="w-12 h-12 text-text-tertiary mb-3" />
            <p className="text-text-secondary font-medium">No active routes to display</p>
            <p className="text-body-sm text-text-tertiary mt-1">
              Routes appear when loads have cached route data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function createMarkerEl(color, label) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="
      width: 22px; height: 22px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex; align-items: center; justify-content: center;
      cursor: pointer;
    ">
      <span style="color: white; font-size: 9px; font-weight: 700;">${label}</span>
    </div>
  `;
  return el;
}

function createTruckMarkerEl(color, driverName) {
  const el = document.createElement('div');
  el.innerHTML = `
    <div style="display:flex;flex-direction:column;align-items:center;">
      <div style="
        width: 32px; height: 32px;
        background: ${color};
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 2px 10px ${color}66, 0 0 20px ${color}33;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        animation: pulse-ring 2s infinite;
      ">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L19 21l-7-4-7 4z"/>
        </svg>
      </div>
      ${driverName ? `
        <div style="
          margin-top: 2px;
          background: rgba(0,0,0,0.75);
          color: white;
          font-size: 9px;
          font-weight: 600;
          padding: 1px 6px;
          border-radius: 4px;
          white-space: nowrap;
          font-family: system-ui, sans-serif;
        ">${driverName.split(' ')[0]}</div>
      ` : ''}
    </div>
    <style>
      @keyframes pulse-ring {
        0% { box-shadow: 0 0 0 0 ${color}66; }
        70% { box-shadow: 0 0 0 10px ${color}00; }
        100% { box-shadow: 0 0 0 0 ${color}00; }
      }
    </style>
  `;
  return el;
}

export default DispatchMap;
