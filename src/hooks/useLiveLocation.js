/**
 * Polls /loads/:id/live-location while a trip is active, surfacing the
 * most recent driver GPS ping to whatever component needs to render a
 * truck pin on a map.
 *
 * Polling — not WebSocket — by design: the web app has no realtime
 * client wired up yet, and one carrier user watching one load at 5s
 * cadence is cheap (12 reads/min). We can swap to WS later when more
 * surfaces want live data.
 */

import { useEffect, useRef, useState } from 'react';
import { getLoadLiveLocation } from '../api/loads.api';

const POLL_INTERVAL_MS = 5000;

const LIVE_STATUSES = new Set([
  'dispatched',   // truck assigned, may already be moving toward pickup
  'in_transit',
  'picked_up',
  'delayed'       // still moving, just behind schedule
]);

export function useLiveLocation(loadId, { enabled = true, currentStatus } = {}) {
  const [location, setLocation] = useState(null);
  const [loadStatus, setLoadStatus] = useState(currentStatus || null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled || !loadId) return undefined;
    // If the caller knows the load is already settled (delivered/cancelled),
    // skip the first probe too — saves a request per page open.
    if (currentStatus && !LIVE_STATUSES.has(String(currentStatus).toLowerCase())) {
      return undefined;
    }

    let cancelled = false;

    const tick = async () => {
      try {
        const data = await getLoadLiveLocation(loadId);
        if (cancelled) return;
        setLocation(data?.location || null);
        setLoadStatus(data?.load_status || null);
        // Stop polling once the trip ends — the pin no longer moves.
        if (data?.load_status && !LIVE_STATUSES.has(String(data.load_status).toLowerCase())) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
        }
      } catch {
        // Swallow — next tick will retry. A flaky network shouldn't
        // unmount the pin or spam the console.
      }
    };

    tick();
    timerRef.current = setInterval(tick, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      if (timerRef.current) clearInterval(timerRef.current);
      timerRef.current = null;
    };
  }, [loadId, enabled, currentStatus]);

  return { location, loadStatus };
}

export default useLiveLocation;
