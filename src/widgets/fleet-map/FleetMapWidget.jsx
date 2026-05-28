import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Truck, Loader2, Settings, MapPin } from 'lucide-react';
import api from '../../api/client';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../../services/map/config';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Layer IDs — kept here so we can add/remove them deterministically
// on style swap and unmount.
const SRC_ID = 'fleet-trucks-src';
const PULSE_LAYER = 'fleet-trucks-pulse';
const DOT_LAYER = 'fleet-trucks-dot';

/**
 * FleetMapWidget — dashboard tile that paints every truck with a
 * known location on a dark Mapbox map. Lives inside the launcher's
 * WidgetGrid, so it must:
 *
 *   - call map.resize() whenever its container changes size
 *     (RGL resizes the wrapper but Mapbox doesn't observe DOM size)
 *   - re-fit-to-bounds on the first fetch only — never yank the map
 *     out from under the user on poll refreshes
 *   - poll every 30s for fresh positions
 *   - degrade gracefully when no Motive integration exists
 */
export function FleetMapWidget() {
  const { orgSlug } = useParams();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const animFrameRef = useRef(null);
  const fittedOnceRef = useRef(false);
  const styleLoadedRef = useRef(false);

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notConfigured, setNotConfigured] = useState(false);
  const [error, setError] = useState(null);

  // ── Init the Mapbox instance + the source/layers ─────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
      cooperativeGestures: true
    });
    mapRef.current = map;

    map.on('load', () => {
      // Native circle layers — drift-proof (they're part of the
      // WebGL canvas) and the pulse animates via GPU paint props.
      map.addSource(SRC_ID, {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] }
      });

      // Outer pulse ring (animated)
      map.addLayer({
        id: PULSE_LAYER,
        type: 'circle',
        source: SRC_ID,
        paint: {
          'circle-radius': 8,
          'circle-color': '#3b82f6',
          'circle-opacity': 0.55,
          'circle-blur': 0.4
        }
      });

      // Center solid dot — sits on top of the pulse, both at the
      // exact same coordinate, so the pulse is always concentric.
      map.addLayer({
        id: DOT_LAYER,
        type: 'circle',
        source: SRC_ID,
        paint: {
          'circle-radius': 6,
          'circle-color': '#3b82f6',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Hover cursor + click → popup
      map.on('mouseenter', DOT_LAYER, () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', DOT_LAYER, () => {
        map.getCanvas().style.cursor = '';
      });
      map.on('click', DOT_LAYER, (e) => {
        const f = e.features?.[0];
        if (!f) return;
        const p = f.properties || {};
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          offset: 14,
          closeButton: false,
          className: 'fleet-map-popup'
        })
          .setLngLat(f.geometry.coordinates)
          .setHTML(
            `<div style="font: 500 12px/1.4 system-ui; color:#0f172a; min-width:160px;">
               <div style="font-weight:600; font-size:13px;">Unit ${escapeHtml(p.unit_number || '—')}</div>
               ${p.driver_name ? `<div style="color:#475569;">${escapeHtml(p.driver_name)}</div>` : ''}
               ${p.place ? `<div style="color:#475569;">${escapeHtml(p.place)}</div>` : ''}
               ${p.speed_mph != null && Number(p.speed_mph) > 0 ? `<div style="color:#475569;">${Math.round(Number(p.speed_mph))} mph</div>` : ''}
             </div>`
          )
          .addTo(map);
      });

      styleLoadedRef.current = true;

      // Start the pulse animation
      const startedAt = performance.now();
      const tick = (now) => {
        const t = ((now - startedAt) % 1600) / 1600; // 0..1
        // ease-out cubic for a snappy expand, slow fade
        const eased = 1 - Math.pow(1 - t, 3);
        const radius = 8 + eased * 22;       // 8 → 30 px
        const opacity = 0.65 * (1 - t);      // 0.65 → 0
        if (mapRef.current && mapRef.current.getLayer(PULSE_LAYER)) {
          try {
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-radius', radius);
            mapRef.current.setPaintProperty(PULSE_LAYER, 'circle-opacity', opacity);
          } catch { /* style swap mid-frame — ignore */ }
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

  // ── Auto-resize when the widget's container changes size ────────
  // react-grid-layout resizes the parent via CSS transforms / width
  // changes; Mapbox needs an explicit resize() to re-render.
  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => {
      if (mapRef.current) {
        // Debounce-ish — schedule on next frame so we coalesce
        // rapid resize ticks from RGL's drag.
        requestAnimationFrame(() => {
          try { mapRef.current?.resize(); } catch { /* mid-teardown */ }
        });
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // ── Fetch + poll fleet locations ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const fetchLocations = async () => {
      try {
        const res = await api.get('/v1/ava/fleet-locations');
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        const list = payload?.trucks || [];
        setTrucks(list);
        setNotConfigured(false);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 404 || status === 400) {
          // Motive not configured yet.
          setNotConfigured(true);
        } else {
          setError(err.response?.data?.error?.message || err.message);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchLocations();
    const id = setInterval(fetchLocations, 30000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // ── Push truck data into the GeoJSON source whenever it changes ─
  useEffect(() => {
    if (!mapRef.current) return;

    const valid = trucks
      .map((t) => ({
        ...t,
        _lat: t?.location?.lat,
        _lng: t?.location?.lng
      }))
      .filter(
        (t) =>
          typeof t._lat === 'number' &&
          typeof t._lng === 'number' &&
          !Number.isNaN(t._lat) &&
          !Number.isNaN(t._lng) &&
          t._lat !== 0 &&
          t._lng !== 0
      );

    const features = valid.map((t) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [t._lng, t._lat] },
      properties: {
        unit_number: t.unit_number || '—',
        driver_name: t.driver
          ? [t.driver.first_name, t.driver.last_name].filter(Boolean).join(' ')
          : '',
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

      // First successful paint: fit the camera. After that, leave
      // the view alone so polls don't yank what the user is looking at.
      if (!fittedOnceRef.current && features.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        features.forEach((f) => bounds.extend(f.geometry.coordinates));
        map.fitBounds(bounds, { padding: 36, maxZoom: 11, duration: 0 });
        fittedOnceRef.current = true;
      }
    };

    if (styleLoadedRef.current) {
      push();
    } else {
      // First fetch landed before the style finished loading — wait.
      mapRef.current.once('load', push);
    }
  }, [trucks]);

  // Counts for the header chips — read from the nested driver.eld_status
  const stats = (() => {
    const out = { driving: 0, on_duty: 0, off_duty: 0, total: trucks.length };
    for (const t of trucks) {
      const s = t.driver?.eld_status;
      if (s === 'driving') out.driving += 1;
      else if (s === 'on_duty') out.on_duty += 1;
      else out.off_duty += 1;
    }
    return out;
  })();

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <header className="px-5 pt-5 pb-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
          <MapPin className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-semibold text-white truncate">Find my Truck</div>
          <div className="text-[11px] text-white/45 truncate">
            {stats.total} truck{stats.total === 1 ? '' : 's'}
            {stats.driving > 0 && ` · ${stats.driving} driving`}
          </div>
        </div>
        {!notConfigured && stats.total > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live
          </span>
        )}
      </header>

      {/* Subtle status line (no marker-color legend — every dot is
          blue + pulsing, so we just show counts here). */}
      {!notConfigured && stats.total > 0 && (
        <div className="px-5 pb-2 flex items-center gap-3 flex-shrink-0 text-[10px] uppercase tracking-wider text-white/45 font-medium">
          <span>Driving · {stats.driving}</span>
          <span className="text-white/20">·</span>
          <span>On duty · {stats.on_duty}</span>
          <span className="text-white/20">·</span>
          <span>Off · {stats.off_duty}</span>
        </div>
      )}

      {/* Map / states */}
      <div className="flex-1 relative min-h-0 rounded-b-[28px] overflow-hidden">
        <div ref={containerRef} className="absolute inset-0" />

        {/* Loading overlay (only on first paint) */}
        {loading && trucks.length === 0 && !notConfigured && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm pointer-events-none">
            <Loader2 className="w-5 h-5 text-white/60 animate-spin" />
          </div>
        )}

        {/* Not configured */}
        {notConfigured && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-950/70 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-white/[0.08] flex items-center justify-center mb-3">
              <Truck className="w-5 h-5 text-white/60" />
            </div>
            <div className="text-body-sm font-medium text-white">No ELD connected</div>
            <div className="text-[11px] text-white/50 mt-1 max-w-xs">
              Connect Motive to see real-time truck positions on the map.
            </div>
            <Link
              to={`/o/${orgSlug}/settings/integrations/motive`}
              className="inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-[11px] font-medium text-slate-900 bg-white hover:bg-white/90"
            >
              <Settings className="w-3 h-3" />
              Connect ELD
            </Link>
          </div>
        )}

        {/* Empty (configured but no trucks with coords) */}
        {!loading && !notConfigured && trucks.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 bg-slate-950/40 backdrop-blur-sm pointer-events-none">
            <Truck className="w-6 h-6 text-white/40 mb-2" />
            <div className="text-body-sm text-white/60">No trucks with locations yet.</div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute bottom-3 left-3 right-3 bg-rose-500/15 border border-rose-500/30 text-rose-200 text-[11px] rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </div>

      {/* Footer link */}
      <footer className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0 flex items-center justify-between">
        <Link
          to={`/o/${orgSlug}/tools/find-my-truck`}
          className="text-[11px] text-cyan-300 hover:text-cyan-200 inline-flex items-center gap-1"
        >
          Open full map →
        </Link>
        {!notConfigured && (
          <Link
            to={`/o/${orgSlug}/settings/integrations/motive`}
            className="text-[11px] text-white/40 hover:text-white/60 inline-flex items-center gap-1"
          >
            <Settings className="w-3 h-3" />
            ELD
          </Link>
        )}
      </footer>
    </div>
  );
}

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default FleetMapWidget;
