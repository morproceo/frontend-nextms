// Lightweight Mapbox forward-geocoding for city + state strings.
//
// We avoid a server round-trip and stay client-only. Results are cached
// in-memory for the session so a board with 200 rows pointing to 30
// distinct cities only fires 30 geocode calls.

import { MAPBOX_TOKEN } from '../../../services/map/config';

const cache = new Map();
const inflight = new Map();

function key(city, state) {
  return `${(city || '').toLowerCase().trim()}|${(state || '').toLowerCase().trim()}`;
}

export function getCachedCoords(city, state) {
  return cache.get(key(city, state)) || null;
}

export async function geocodeCityState(city, state) {
  if (!city) return null;
  const k = key(city, state);
  if (cache.has(k)) return cache.get(k);
  if (inflight.has(k)) return inflight.get(k);

  const q = encodeURIComponent(`${city}${state ? `, ${state}` : ''}, USA`);
  const url =
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${q}.json` +
    `?access_token=${MAPBOX_TOKEN}&country=us&types=place&limit=1`;
  const p = fetch(url)
    .then((r) => (r.ok ? r.json() : null))
    .then((data) => {
      const feat = data?.features?.[0];
      if (!feat) {
        cache.set(k, null);
        return null;
      }
      const [lng, lat] = feat.center;
      const coords = { lng, lat };
      cache.set(k, coords);
      return coords;
    })
    .catch(() => {
      cache.set(k, null);
      return null;
    })
    .finally(() => {
      inflight.delete(k);
    });

  inflight.set(k, p);
  return p;
}

export async function geocodeLoadEndpoints(load) {
  const [pickup, delivery] = await Promise.all([
    geocodeCityState(load.pickup?.city, load.pickup?.state),
    geocodeCityState(load.delivery?.city, load.delivery?.state)
  ]);
  return { pickup, delivery };
}
