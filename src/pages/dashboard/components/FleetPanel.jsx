/**
 * FleetPanel — left column of the executive briefing. One vertical list
 * showing every truck with a status pill, driver, and last known
 * location. A small map sits beneath the list as visual confirmation
 * — not the focus.
 *
 * For owner-ops with 1-3 trucks this reads like a captain's roster.
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, User, Activity, Pause, Loader2 } from 'lucide-react';
import api from '../../../api/client';
import {
  MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER, DEFAULT_ZOOM
} from '../../../services/map/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

const SRC_ID = 'fleet-panel-src';
const PULSE_LAYER = 'fleet-panel-pulse';
const DOT_LAYER = 'fleet-panel-dot';

const STATUS_META = {
  driving:  { label: 'Driving',  cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', dot: 'bg-emerald-500' },
  on_duty:  { label: 'On duty',  cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
  off_duty: { label: 'Off duty', cls: 'bg-slate-500/10 text-slate-600 border-slate-500/30', dot: 'bg-slate-400' }
};

export function FleetPanel({ onTrucksLoaded }) {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await api.get('/v1/ava/fleet-locations');
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        const list = payload?.trucks || [];
        setTrucks(list);
        onTrucksLoaded?.(list);
        setUnavailable(false);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 400 || status === 404) {
          setUnavailable(true);
          onTrucksLoaded?.([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [onTrucksLoaded]);

  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary overflow-hidden h-full flex flex-col">
      <header className="px-5 py-4 border-b border-surface-tertiary flex items-center gap-2">
        <Truck className="w-4 h-4 text-cyan-500" />
        <h2 className="text-body font-semibold text-text-primary">The Fleet</h2>
        {trucks.length > 0 && (
          <span className="ml-auto text-small text-text-tertiary tabular-nums">
            {trucks.length} unit{trucks.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      {loading ? (
        <div className="flex-1 px-5 py-10 flex items-center justify-center text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : unavailable ? (
        <UnavailableState />
      ) : trucks.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <ul className="divide-y divide-surface-tertiary">
            {trucks.map((t) => <TruckRow key={t.id || t.unit_number} truck={t} />)}
          </ul>
          <MiniMap trucks={trucks} />
        </>
      )}
    </section>
  );
}

function TruckRow({ truck }) {
  const eldStatus = truck.driver?.eld_status || 'off_duty';
  const meta = STATUS_META[eldStatus] || STATUS_META.off_duty;
  const driverName = truck.driver
    ? [truck.driver.first_name, truck.driver.last_name].filter(Boolean).join(' ')
    : null;
  const place = truck.location?.description || null;
  const speed = truck.location?.speed_mph;
  const inMotion = eldStatus === 'driving' || (typeof speed === 'number' && speed > 5);

  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-blue-600/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
        <Truck className="w-4 h-4 text-cyan-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-body-sm font-semibold text-text-primary truncate">
            Unit {truck.unit_number || '—'}
          </p>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${meta.cls}`}>
            <span className={`w-1 h-1 rounded-full ${meta.dot} ${inMotion ? 'animate-pulse' : ''}`} />
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-small text-text-secondary">
          <User className="w-3 h-3 text-text-tertiary shrink-0" />
          <span className="truncate">
            {driverName || <span className="italic text-text-tertiary">No driver</span>}
          </span>
          {place && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="truncate">{place}</span>
            </>
          )}
          {typeof speed === 'number' && speed > 0 && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="tabular-nums">{Math.round(speed)} mph</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

function MiniMap({ trucks }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const styleLoadedRef = useRef(false);
  const fittedOnceRef = useRef(false);
  const animFrameRef = useRef(null);

  // Mount once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      interactive: false
    });
    mapRef.current = map;
    map.on('load', () => {
      map.addSource(SRC_ID, { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
      map.addLayer({
        id: PULSE_LAYER, type: 'circle', source: SRC_ID,
        paint: { 'circle-radius': 6, 'circle-color': '#34CCFF', 'circle-opacity': 0.55, 'circle-blur': 0.4 }
      });
      map.addLayer({
        id: DOT_LAYER, type: 'circle', source: SRC_ID,
        paint: { 'circle-radius': 5, 'circle-color': '#34CCFF', 'circle-stroke-width': 1.5, 'circle-stroke-color': '#ffffff' }
      });
      styleLoadedRef.current = true;

      const startedAt = performance.now();
      const tick = (now) => {
        const t = ((now - startedAt) % 1600) / 1600;
        const eased = 1 - Math.pow(1 - t, 3);
        if (mapRef.current?.getLayer(PULSE_LAYER)) {
          try {
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-radius', 6 + eased * 14);
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-opacity', 0.6 * (1 - t));
          } catch {}
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    });
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) requestAnimationFrame(() => { try { mapRef.current.resize(); } catch {} });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Push truck data
  useEffect(() => {
    if (!mapRef.current) return;
    const valid = (trucks || [])
      .map((t) => ({ ...t, _lat: t?.location?.lat, _lng: t?.location?.lng }))
      .filter((t) => typeof t._lat === 'number' && typeof t._lng === 'number'
        && !Number.isNaN(t._lat) && !Number.isNaN(t._lng) && t._lat !== 0 && t._lng !== 0);

    const features = valid.map((t) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [t._lng, t._lat] },
      properties: { unit: t.unit_number }
    }));

    const push = () => {
      const map = mapRef.current; if (!map) return;
      const src = map.getSource(SRC_ID); if (!src) return;
      src.setData({ type: 'FeatureCollection', features });
      if (!fittedOnceRef.current && features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((f) => bounds.extend(f.geometry.coordinates));
        map.fitBounds(bounds, { padding: 30, maxZoom: 9, duration: 0 });
        fittedOnceRef.current = true;
      }
    };
    if (styleLoadedRef.current) push();
    else mapRef.current.once('load', push);
  }, [trucks]);

  return (
    <div className="relative h-32 sm:h-36 border-t border-surface-tertiary">
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 px-5 py-10 text-center">
      <Truck className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
      <p className="text-body-sm text-text-secondary">No trucks yet</p>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="flex-1 px-5 py-10 text-center">
      <Pause className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
      <p className="text-body-sm text-text-secondary">Connect Motive to see live status</p>
      <p className="text-small text-text-tertiary mt-1">
        Without ELD, we can still show your trucks but not their live positions.
      </p>
    </div>
  );
}

export default FleetPanel;
