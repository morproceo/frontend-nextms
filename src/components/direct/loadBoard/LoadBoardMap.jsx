import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Loader2, AlertTriangle, ExternalLink, Building2 } from 'lucide-react';
import {
  MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM, MARKER_COLORS
} from '../../../services/map/config';
import { geocodeCityState, getCachedCoords } from './geocode';
import { codesForLoad } from './equipment';

mapboxgl.accessToken = MAPBOX_TOKEN;

/**
 * Map view of the load board. Each load = one origin pin (geocoded city,state).
 * Click a pin → side panel shows the load detail with origin → destination
 * route highlighted on the same map. Selected load also fits the map bounds.
 */
export default function LoadBoardMap({ loads, orgSlug }) {
  const container = useRef(null);
  const map = useRef(null);
  const markers = useRef(new Map()); // loadId -> mapboxgl.Marker
  const [selectedId, setSelectedId] = useState(null);
  const [geocoded, setGeocoded] = useState({}); // loadId -> { pickup, delivery }
  const [loading, setLoading] = useState(true);

  // 1. Geocode every load's pickup + delivery in parallel (cached across mounts).
  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const tasks = loads.map(async (l) => {
      const [pickup, delivery] = await Promise.all([
        geocodeCityState(l.pickup?.city, l.pickup?.state),
        geocodeCityState(l.delivery?.city, l.delivery?.state)
      ]);
      return [l.id, { pickup, delivery }];
    });

    Promise.all(tasks).then((entries) => {
      if (cancelled) return;
      setGeocoded(Object.fromEntries(entries));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [loads.map((l) => l.id).join(',')]);

  // 2. Initialize map (once).
  useEffect(() => {
    if (!container.current || map.current) return;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: MAP_STYLES.streets,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM
    });
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      // Empty source for the highlighted route
      map.current.addSource('selected-route', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.current.addLayer({
        id: 'selected-route-line',
        type: 'line',
        source: 'selected-route',
        paint: {
          'line-color': '#0066FF',
          'line-width': 3,
          'line-dasharray': [2, 1.5]
        }
      });
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // 3. Sync markers with geocoded loads.
  useEffect(() => {
    if (!map.current) return;
    const m = map.current;
    if (!m.isStyleLoaded()) {
      m.once('load', () => syncMarkers());
    } else {
      syncMarkers();
    }

    function syncMarkers() {
      // Remove markers for loads no longer present.
      const liveIds = new Set(loads.map((l) => l.id));
      for (const [id, marker] of markers.current.entries()) {
        if (!liveIds.has(id)) {
          marker.remove();
          markers.current.delete(id);
        }
      }
      // Add markers for newly geocoded loads.
      for (const l of loads) {
        if (markers.current.has(l.id)) continue;
        const coords = geocoded[l.id]?.pickup;
        if (!coords) continue;
        const el = makePinElement(l);
        const marker = new mapboxgl.Marker({ element: el, anchor: 'bottom' })
          .setLngLat([coords.lng, coords.lat])
          .addTo(m);
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          setSelectedId(l.id);
        });
        markers.current.set(l.id, marker);
      }
      // Fit to the bounds of all pickup pins on first geocode.
      const cs = loads
        .map((l) => geocoded[l.id]?.pickup)
        .filter(Boolean);
      if (cs.length >= 2) {
        const bounds = new mapboxgl.LngLatBounds();
        cs.forEach((c) => bounds.extend([c.lng, c.lat]));
        m.fitBounds(bounds, { padding: 60, duration: 600, maxZoom: 6 });
      } else if (cs.length === 1) {
        m.flyTo({ center: [cs[0].lng, cs[0].lat], zoom: 6 });
      }
    }
  }, [geocoded, loads]);

  // 4. When selected load changes, draw its route + zoom.
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;
    const src = map.current.getSource('selected-route');
    if (!src) return;
    if (!selectedId) {
      src.setData({ type: 'FeatureCollection', features: [] });
      return;
    }
    const g = geocoded[selectedId];
    if (!g?.pickup || !g?.delivery) return;
    src.setData({
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: [
          [g.pickup.lng, g.pickup.lat],
          [g.delivery.lng, g.delivery.lat]
        ]
      }
    });
    const bounds = new mapboxgl.LngLatBounds()
      .extend([g.pickup.lng, g.pickup.lat])
      .extend([g.delivery.lng, g.delivery.lat]);
    map.current.fitBounds(bounds, { padding: 100, duration: 600 });
  }, [selectedId, geocoded]);

  const selectedLoad = useMemo(
    () => (selectedId ? loads.find((l) => l.id === selectedId) : null),
    [selectedId, loads]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 h-[640px]">
      <div className="relative rounded-card overflow-hidden border border-border-subtle">
        <div ref={container} className="absolute inset-0" />
        {loading && (
          <div className="absolute top-3 left-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/70 text-white text-small">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Geocoding {loads.length} loads…
          </div>
        )}
        <div className="absolute bottom-3 left-3 inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-small">
          <span className="inline-flex items-center gap-1">
            <Dot color={MARKER_COLORS.pickup} /> Pickup
          </span>
          <span className="inline-flex items-center gap-1">
            <Dot color={MARKER_COLORS.delivery} /> Delivery
          </span>
        </div>
      </div>

      <SidePanel
        load={selectedLoad}
        loads={loads}
        orgSlug={orgSlug}
        onSelect={setSelectedId}
        selectedId={selectedId}
      />
    </div>
  );
}

function Dot({ color }) {
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full"
      style={{ background: color }}
    />
  );
}

function makePinElement(load) {
  const el = document.createElement('div');
  el.className = 'mapbox-load-pin';
  el.style.cssText = `
    cursor: pointer;
    transform: translateY(0);
    transition: transform 0.15s ease;
  `;
  el.innerHTML = `
    <div style="
      background: ${MARKER_COLORS.pickup};
      color: white;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      white-space: nowrap;
      box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      border: 2px solid white;
    ">
      ${load.rate_offered != null ? `$${Math.round(Number(load.rate_offered)).toLocaleString()}` : 'Posted'}
    </div>
  `;
  el.addEventListener('mouseenter', () => { el.style.transform = 'translateY(-2px)'; });
  el.addEventListener('mouseleave', () => { el.style.transform = 'translateY(0)'; });
  return el;
}

function SidePanel({ load, loads, orgSlug, onSelect, selectedId }) {
  if (!load) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden flex flex-col">
        <div className="px-4 py-3 border-b border-border-subtle">
          <p className="text-body-sm font-medium text-text-primary">{loads.length} loads</p>
          <p className="text-small text-text-tertiary">Click a pin or row to preview</p>
        </div>
        <div className="overflow-y-auto flex-1 divide-y divide-border-subtle">
          {loads.map((l) => (
            <button
              key={l.id}
              onClick={() => onSelect(l.id)}
              className={`w-full text-left px-4 py-3 hover:bg-surface-secondary/40 transition-colors ${
                selectedId === l.id ? 'bg-surface-secondary' : ''
              }`}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-body-sm font-medium text-text-primary truncate">
                  {l.pickup?.city}, {l.pickup?.state} → {l.delivery?.city}, {l.delivery?.state}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 text-small text-text-tertiary">
                <span className="truncate">{l.postingOrganization?.name || 'Shipper'}</span>
                {l.rate_offered != null && (
                  <span className="font-medium text-text-primary">
                    ${Math.round(Number(l.rate_offered)).toLocaleString()}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }
  const trucks = codesForLoad(load);
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-body font-semibold text-text-primary truncate">
            {load.reference_number || `#${load.id.slice(0, 6)}`}
          </p>
          <p className="text-small text-text-tertiary truncate">
            {load.pickup?.city}, {load.pickup?.state} → {load.delivery?.city}, {load.delivery?.state}
          </p>
        </div>
        <button
          onClick={() => onSelect(null)}
          className="text-small text-text-tertiary hover:text-text-primary"
        >
          Back
        </button>
      </div>
      <div className="p-4 space-y-4 overflow-y-auto">
        {load.is_emergency && (
          <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-400">
            <AlertTriangle className="w-3 h-3" /> URGENT
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Truck" value={trucks.join(' / ') || '—'} />
          <Field label="Distance" value={load.miles ? `${load.miles} mi` : '—'} />
          <Field label="Weight" value={load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : '—'} />
          <Field label="Commodity" value={load.commodity || '—'} />
        </div>

        <div className="pt-3 border-t border-border-subtle">
          <Field
            label="Price"
            value={load.rate_offered != null
              ? `$${Number(load.rate_offered).toLocaleString()}`
              : 'Show price'}
            valueClass={load.rate_offered != null ? 'text-text-primary text-lg font-semibold' : 'text-accent'}
          />
          {load.miles && load.rate_offered != null && (
            <p className="text-small text-text-tertiary mt-1">
              ${(Number(load.rate_offered) / load.miles).toFixed(2)}/mi
            </p>
          )}
        </div>

        <div className="pt-3 border-t border-border-subtle">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Posted by</p>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-text-tertiary" />
            <span className="text-body-sm text-text-primary">
              {load.postingOrganization?.name || 'Shipper'}
            </span>
          </div>
        </div>

        <Link
          to={`/o/${orgSlug}/direct/loads/${load.id}/view`}
          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover"
        >
          <ExternalLink className="w-4 h-4" /> Open load
        </Link>
      </div>
    </div>
  );
}

function Field({ label, value, valueClass }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">
        {label}
      </p>
      <p className={`text-body-sm ${valueClass || 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}
