import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import spottyApi from '../api/spotty.api';

const SpottyContext = createContext(null);

/**
 * SpottyProvider
 *
 * Wraps the in-ecosystem Spotty app. On mount it ensures the current
 * NextMS user is auto-linked to Spotty (server-to-server SSO), then
 * exposes the Spotty profile to children. Pages further down can use
 * useSpotty() to know the role (renter / host) and surface host-only nav.
 */
export function SpottyProvider({ children }) {
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null
  });
  const linked = useRef(false);

  const link = useCallback(async () => {
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const res = await spottyApi.autoLink();
      const profile = res?.data || null;
      setState({ loading: false, error: null, profile });
      return profile;
    } catch (err) {
      const message = extractError(err) || 'Could not connect to Spotty';
      setState({ loading: false, error: message, profile: null });
      throw err;
    }
  }, []);

  useEffect(() => {
    if (linked.current) return;
    linked.current = true;
    link();
  }, [link]);

  return (
    <SpottyContext.Provider value={{ ...state, relink: link }}>
      {children}
    </SpottyContext.Provider>
  );
}

export function useSpotty() {
  const ctx = useContext(SpottyContext);
  if (!ctx) throw new Error('useSpotty must be used inside <SpottyProvider>');
  return ctx;
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

export default SpottyContext;
