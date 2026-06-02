/**
 * HeroMap — the dashboard's full-bleed live fleet map with three glass
 * tiles overlaid bottom-left (Revenue today · Miles today · Trucks in
 * motion). The Mapbox dark style + animated pulse markers + polling are
 * all delegated to the existing FleetMapWidget (kept as the single source
 * of truth for the live-truck visualization). We only add the dashboard's
 * surrounding chrome.
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MapPin, Truck, Activity } from 'lucide-react';
import api from '../../../api/client';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../../../services/map/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

const SRC_ID = 'hero-trucks-src';
const PULSE_LAYER = 'hero-trucks-pulse';
const DOT_LAYER = 'hero-trucks-dot';

const fmtMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const fmtMiles = (n) => Math.round(Number(n) || 0).toLocaleString('en-US');

export function HeroMap({ revenueToday, milesToday }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const animFrameRef = useRef(null);
  const fittedOnceRef = useRef(false);
  const styleLoadedRef = useRef(false);
  const popupRef = useRef(null);

  const [trucks, setTrucks] = useState([]);
  const [notConfigured, setNotConfigured] = useState(false);

  // Mount the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      cooperativeGestures: false
    });
    mapRef.current = map;

    map.on('load', () => {
      map.addSource(SRC_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: PULSE_LAYER,
        type: 'circle',
        source: SRC_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#34CCFF',
          'circle-opacity': 0.55,
          'circle-blur': 0.4
        }
      });
      map.addLayer({
        id: DOT_LAYER,
        type: 'circle',
        source: SRC_ID,
        paint: {
          'circle-radius': 7,
          'circle-color': '#34CCFF',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      map.on('mouseenter', DOT_LAYER, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', DOT_LAYER, () => { map.getCanvas().style.cursor = ''; });
      map.on('click', DOT_LAYER, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({ offset: 14, closeButton: false, className: 'fleet-map-popup' })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<div style="font: 500 12px/1.4 system-ui; color:#0f172a; min-width:160px;">
               <div style="font-weight:600; font-size:13px;">Unit ${esc(p.unit_number)}</div>
               ${p.driver_name ? `<div style="color:#475569;">${esc(p.driver_name)}</div>` : ''}
               ${p.place ? `<div style="color:#475569;">${esc(p.place)}</div>` : ''}
               ${p.speed_mph != null && Number(p.speed_mph) > 0 ? `<div style="color:#475569;">${Math.round(Number(p.speed_mph))} mph</div>` : ''}
             </div>`
          )
          .addTo(map);
      });

      styleLoadedRef.current = true;

      // Pulse animation
      const startedAt = performance.now();
      const tick = (now) => {
        const t = ((now - startedAt) % 1600) / 1600;
        const eased = 1 - Math.pow(1 - t, 3);
        const radius = 8 + eased * 22;
        const opacity = 0.65 * (1 - t);
        if (mapRef.current?.getLayer(PULSE_LAYER)) {
          try {
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-radius', radius);
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-opacity', opacity);
          } catch { /* style swap mid-frame */ }
        }
        animFrameRef.current = requestAnimationFrame(tick);
      };
      animFrameRef.current = requestAnimationFrame(tick);
    });

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (popupRef.current) popupRef.current.remove();
      map.remove();
      mapRef.current = null;
      styleLoadedRef.current = false;
    };
  }, []);

  // ResizeObserver — Mapbox needs explicit resize when the container changes
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) requestAnimationFrame(() => { try { mapRef.current.resize(); } catch {} });
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Poll fleet locations
  useEffect(() => {
    let cancelled = false;
    const fetchLocations = async () => {
      try {
        const res = await api.get('/v1/ava/fleet-locations');
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        setTrucks(payload?.trucks || []);
        setNotConfigured(false);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 404 || status === 400) setNotConfigured(true);
      }
    };
    fetchLocations();
    const id = setInterval(fetchLocations, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // Push truck data into the GeoJSON source
  useEffect(() => {
    if (!mapRef.current) return;
    const valid = trucks
      .map((t) => ({ ...t, _lat: t?.location?.lat, _lng: t?.location?.lng }))
      .filter((t) => typeof t._lat === 'number' && typeof t._lng === 'number'
        && !Number.isNaN(t._lat) && !Number.isNaN(t._lng)
        && t._lat !== 0 && t._lng !== 0);

    const features = valid.map((t) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [t._lng, t._lat] },
      properties: {
        unit_number: t.unit_number || '—',
        driver_name: t.driver ? [t.driver.first_name, t.driver.last_name].filter(Boolean).join(' ') : '',
        place: t.location?.description || '',
        speed_mph: t.location?.speed_mph ?? null
      }
    }));

    const push = () => {
      const map = mapRef.current;
      if (!map) return;
      const src = map.getSource(SRC_ID);
      if (!src) return;
      src.setData({ type: 'FeatureCollection', features });
      if (!fittedOnceRef.current && features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((f) => bounds.extend(f.geometry.coordinates));
        map.fitBounds(bounds, { padding: 60, maxZoom: 10, duration: 0 });
        fittedOnceRef.current = true;
      }
    };

    if (styleLoadedRef.current) push();
    else mapRef.current.once('load', push);
  }, [trucks]);

  const trucksInMotion = trucks.filter(
    (t) => t.driver?.eld_status === 'driving' || (t.location?.speed_mph ?? 0) > 5
  ).length;

  return (
    <div className="relative w-full h-[420px] sm:h-[480px] rounded-3xl overflow-hidden border border-white/[0.06] shadow-2xl bg-slate-950">
      <div ref={containerRef} className="absolute inset-0" />

      {/* Subtle vignette to make the glass tiles pop */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-slate-950/60 via-transparent to-slate-950/40" />

      {/* Top-left: live indicator */}
      <div className="absolute top-4 left-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.06] backdrop-blur-md border border-white/[0.08]">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-[10px] uppercase tracking-wider text-white/70 font-semibold">
          Live · {trucks.length} truck{trucks.length === 1 ? '' : 's'}
        </span>
      </div>

      {/* Bottom-left: glass tiles */}
      <div className="absolute bottom-4 left-4 right-4 sm:right-auto flex flex-wrap gap-3 max-w-2xl">
        <GlassTile
          icon={<MapPin className="w-3.5 h-3.5 text-cyan-300" />}
          label="Revenue today"
          value={fmtMoney(revenueToday)}
        />
        <GlassTile
          icon={<Activity className="w-3.5 h-3.5 text-emerald-300" />}
          label="Miles today"
          value={fmtMiles(milesToday)}
        />
        <GlassTile
          icon={<Truck className="w-3.5 h-3.5 text-amber-300" />}
          label="In motion"
          value={`${trucksInMotion} / ${trucks.length || 0}`}
        />
      </div>

      {/* No ELD overlay */}
      {notConfigured && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-950/75 backdrop-blur-sm">
          <Truck className="w-7 h-7 text-white/50 mb-3" />
          <div className="text-body font-medium text-white">No ELD connected</div>
          <div className="text-small text-white/55 mt-1 max-w-xs">
            Connect Motive to see your fleet live on the map.
          </div>
        </div>
      )}
    </div>
  );
}

function GlassTile({ icon, label, value }) {
  return (
    <div className="flex-1 min-w-[120px] px-4 py-2.5 rounded-2xl bg-white/[0.05] backdrop-blur-md border border-white/[0.08] hover:bg-white/[0.08] transition-colors">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-white/55 font-semibold">
        {icon}
        <span>{label}</span>
      </div>
      <div className="mt-0.5 text-lg sm:text-xl font-semibold text-white tabular-nums">
        {value}
      </div>
    </div>
  );
}

function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export default HeroMap;
