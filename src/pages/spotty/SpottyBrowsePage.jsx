import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  Search,
  MapPin,
  Loader2,
  AlertCircle,
  Truck,
  RefreshCw,
  List,
  Map as MapIcon
} from 'lucide-react';
import spottyApi from '../../api/spotty.api';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MAPBOX_TOKEN } from '../../services/map/config';
import { cn } from '../../lib/utils';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function SpottyBrowsePage() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [highlightId, setHighlightId] = useState(null);
  const [mobileView, setMobileView] = useState('list'); // 'list' | 'map' (only used below lg)

  const mapContainer = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);

  const load = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const res = await spottyApi.searchListings({ limit: 100, ...params });
      setListings(normalize(res?.data));
    } catch (err) {
      setError(extractError(err) || 'Could not load listings');
      setListings([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load + reload on filter change (debounced for search)
  useEffect(() => {
    const handle = setTimeout(() => {
      load({ search, state: stateFilter });
    }, search ? 350 : 0);
    return () => clearTimeout(handle);
  }, [search, stateFilter]);

  // Map init
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;
    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [-95.7, 37.0], // continental US
      zoom: 3.4
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  // Mapbox needs a resize() when its container's visibility flips on mobile
  // (display:none -> block leaves the canvas with stale dimensions).
  useEffect(() => {
    if (!mapRef.current) return;
    const t = setTimeout(() => mapRef.current?.resize(), 50);
    return () => clearTimeout(t);
  }, [mobileView]);

  // Re-render markers whenever listings change
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    const withCoords = listings.filter(
      (l) => Number.isFinite(Number(l.latitude)) && Number.isFinite(Number(l.longitude))
    );

    withCoords.forEach((l) => {
      const el = document.createElement('button');
      el.className = 'spotty-marker';
      el.type = 'button';
      el.innerHTML = `<span>$${Math.round(l.daily_price ?? 0)}</span>`;
      el.style.cssText =
        'background: linear-gradient(135deg, #22d3ee, #2563eb); color:white;'
        + 'border:2px solid white; border-radius:9999px; padding:4px 10px; font-size:12px;'
        + 'font-weight:600; cursor:pointer; box-shadow:0 4px 14px rgba(37,99,235,0.45);'
        + 'transform: translateY(0); transition: transform 0.15s;';
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'translateY(-2px) scale(1.05)';
        setHighlightId(l.id);
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'translateY(0)';
      });
      el.addEventListener('click', () => {
        navigate(`/o/${orgSlug}/spotty/listings/${l.id}`);
      });

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([Number(l.longitude), Number(l.latitude)])
        .addTo(map);
      markersRef.current.push(marker);
    });

    // Fit bounds when results change
    if (withCoords.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      withCoords.forEach((l) =>
        bounds.extend([Number(l.longitude), Number(l.latitude)])
      );
      map.fitBounds(bounds, { padding: 60, maxZoom: 7, duration: 600 });
    } else if (withCoords.length === 1) {
      map.flyTo({
        center: [Number(withCoords[0].longitude), Number(withCoords[0].latitude)],
        zoom: 9,
        duration: 600
      });
    }
  }, [listings, navigate, orgSlug]);

  const focusListing = (l) => {
    setHighlightId(l.id);
    if (mapRef.current && l.latitude && l.longitude) {
      mapRef.current.flyTo({
        center: [Number(l.longitude), Number(l.latitude)],
        zoom: 11,
        duration: 600
      });
    }
  };

  const stateOptions = useMemo(() => {
    const set = new Set();
    listings.forEach((l) => l.state && set.add(l.state));
    return Array.from(set).sort();
  }, [listings]);

  return (
    <div className="h-full flex flex-col">
      {/* Filter strip */}
      <div className="border-b border-surface-tertiary bg-white px-4 sm:px-6 py-3 sm:py-4 flex flex-wrap gap-2 sm:gap-3 items-center">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[240px] sm:max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" />
          <Input
            placeholder="Search city, address, name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="!pl-9"
          />
        </div>
        <select
          value={stateFilter}
          onChange={(e) => setStateFilter(e.target.value)}
          className="px-3 py-2 rounded-button border border-surface-tertiary bg-white text-body-sm text-text-primary"
        >
          <option value="">All states</option>
          {stateOptions.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <button
          onClick={() => load({ search, state: stateFilter })}
          disabled={loading}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-button text-body-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50 sm:ml-auto"
          aria-label="Refresh"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          <span className="hidden sm:inline">Refresh</span>
        </button>
        <span className="text-small text-text-tertiary w-full sm:w-auto">
          {loading ? 'Loading…' : `${listings.length} spot${listings.length === 1 ? '' : 's'}`}
        </span>
      </div>

      {/* Mobile-only view toggle (List / Map) */}
      <div className="lg:hidden border-b border-surface-tertiary bg-white px-4 py-2 flex gap-2">
        <button
          onClick={() => setMobileView('list')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-button text-body-sm font-medium transition-colors',
            mobileView === 'list'
              ? 'bg-text-primary text-white'
              : 'bg-surface-secondary text-text-secondary'
          )}
        >
          <List className="w-4 h-4" /> List
        </button>
        <button
          onClick={() => setMobileView('map')}
          className={cn(
            'flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-button text-body-sm font-medium transition-colors',
            mobileView === 'map'
              ? 'bg-text-primary text-white'
              : 'bg-surface-secondary text-text-secondary'
          )}
        >
          <MapIcon className="w-4 h-4" /> Map
        </button>
      </div>

      {/* Body: list + map. On lg+ both side-by-side. On mobile, one at a time
          driven by the view toggle above. */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[400px_1fr] min-h-0">
        {/* List */}
        <div
          className={cn(
            'lg:border-r border-surface-tertiary bg-surface-secondary overflow-y-auto',
            mobileView === 'list' ? 'block' : 'hidden lg:block'
          )}
        >
          {error && (
            <div className="m-4">
              <Card className="bg-error-muted border border-error/20">
                <div className="flex items-start gap-3 text-error">
                  <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <div className="text-body-sm">{error}</div>
                </div>
              </Card>
            </div>
          )}

          {loading && listings.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
            </div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6 text-text-tertiary" />
              </div>
              <h3 className="text-body font-medium text-text-primary">No spots found</h3>
              <p className="text-body-sm text-text-secondary mt-1">
                Try a different search or clear the state filter.
              </p>
            </div>
          ) : (
            <div className="p-3 space-y-3">
              {listings.map((l) => (
                <ListingCard
                  key={l.id}
                  listing={l}
                  highlight={highlightId === l.id}
                  onHover={() => focusListing(l)}
                  onClick={() => navigate(`/o/${orgSlug}/spotty/listings/${l.id}`)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Map — fixed-position absolute on lg+, full-screen visible on mobile when toggled */}
        <div
          className={cn(
            'relative bg-[#0e1422] min-h-[400px]',
            mobileView === 'map' ? 'block' : 'hidden lg:block'
          )}
        >
          <div ref={mapContainer} className="absolute inset-0" />
        </div>
      </div>
    </div>
  );
}

function ListingCard({ listing, highlight, onHover, onClick }) {
  return (
    <div
      onMouseEnter={onHover}
      onClick={onClick}
      className={cn(
        'cursor-pointer rounded-card bg-white p-4 transition-all duration-150',
        'shadow-card hover:shadow-card-hover border-2',
        highlight ? 'border-accent ring-2 ring-accent/20' : 'border-transparent'
      )}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-button bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium text-text-primary truncate">
            {listing.title}
          </div>
          <div className="flex items-center gap-1.5 mt-0.5 text-small text-text-tertiary">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">
              {[listing.city, listing.state].filter(Boolean).join(', ')}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-body-sm font-semibold text-text-primary">
              ${Number(listing.daily_price).toFixed(0)}
              <span className="font-normal text-text-tertiary text-small">
                /day
              </span>
            </span>
            <span className="text-text-tertiary text-small">·</span>
            <span className="text-small text-text-secondary">
              {listing.spots_available ?? listing.spots} of {listing.spots} open
            </span>
          </div>
          {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <div className="flex items-center gap-1 mt-2 flex-wrap">
              {listing.amenities.slice(0, 3).map((a) => (
                <Badge key={a} variant="gray" className="!text-[10px] !py-0 capitalize">
                  {String(a).replace(/_/g, ' ')}
                </Badge>
              ))}
              {listing.amenities.length > 3 && (
                <span className="text-small text-text-tertiary">
                  +{listing.amenities.length - 3} more
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalize(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.listings)) return data.listings;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.rows)) return data.rows;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function extractError(err) {
  if (!err) return null;
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message
  );
}
