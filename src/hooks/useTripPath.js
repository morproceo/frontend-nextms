/**
 * Polls /loads/:id/trip-path to render the actual driven polyline on
 * top of the planned highway route.
 *
 * Active trips → polled every 30s (the path grows slowly; 5s is overkill
 * and re-runs Douglas-Peucker on the server for each call).
 * Delivered trips → fetched once. `route_traveled` is frozen.
 *
 * Returns `{ path, live }` where path is a GeoJSON LineString or null.
 */

import { useEffect, useRef, useState } from 'react';
import { getLoadTripPath } from '../api/loads.api';

const ACTIVE_POLL_MS = 30_000;

const ACTIVE_STATUSES = new Set([
  'dispatched', 'picked_up', 'in_transit', 'delayed'
]);

export function useTripPath(loadId, { enabled = true, currentStatus } = {}) {
  const [path, setPath] = useState(null);
  const [live, setLive] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !loadId) return undefined;
    const status = String(currentStatus || '').toLowerCase();
    const isActive = ACTIVE_STATUSES.has(status);
    const isDelivered = status === 'delivered';
    if (!isActive && !isDelivered) return undefined;

    let cancelled = false;

    const tick = async () => {
      try {
        const data = await getLoadTripPath(loadId);
        if (cancelled) return;
        setPath(data?.path || null);
        setLive(!!data?.live);
        // Past delivery the polyline is frozen — stop polling.
        if (!data?.live && timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        /* swallow — next tick will retry. */
      }
    };

    tick();
    if (isActive) {
      timerRef.current = setInterval(tick, ACTIVE_POLL_MS);
    }
    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [loadId, enabled, currentStatus]);

  return { path, live };
}

export default useTripPath;
