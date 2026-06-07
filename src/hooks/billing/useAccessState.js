/**
 * useAccessState — wraps /v1/billing/access-state into a hook for the
 * SubscriptionGate. Polls every 30s while the tab is focused,
 * refetches on visibilitychange, and exposes a manual `refetch()` for
 * the post-checkout success page to call until the org flips to active.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import billingApi from '../../api/billing.api';

const POLL_INTERVAL_MS = 30_000;

export function useAccessState() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const aliveRef = useRef(true);

  const fetchState = useCallback(async () => {
    try {
      const data = await billingApi.getAccessState();
      if (!aliveRef.current) return;
      setState(data);
      setError(null);
    } catch (err) {
      if (!aliveRef.current) return;
      // 401 here means auth is broken; bubble up so callers don't show
      // the paywall when the real issue is unauthenticated.
      setError(err?.response?.status === 401 ? 'unauthenticated' : 'error');
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    aliveRef.current = true;
    fetchState();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') fetchState();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchState();
    };
    const onFocus = () => fetchState();

    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('focus', onFocus);

    return () => {
      aliveRef.current = false;
      clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchState]);

  return { state, loading, error, refetch: fetchState };
}

export default useAccessState;
