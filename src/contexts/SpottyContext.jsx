import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import spottyApi from '../api/spotty.api';
import { useOrg } from './OrgContext';

const SpottyContext = createContext(null);

/**
 * SpottyProvider
 *
 * Wraps the in-ecosystem Spotty app. On mount (and every time the active
 * org changes) it links/refreshes the per-(user, org) Spotty profile, so
 * switching orgs gives the user a fresh Spotty world matching the rest of
 * the ecosystem.
 */
export function SpottyProvider({ children }) {
  const { currentOrg } = useOrg();
  const [state, setState] = useState({
    loading: true,
    error: null,
    profile: null
  });

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

  // Re-link any time the active org changes — Spotty identity is
  // per-(user, org) so switching orgs must refetch the profile.
  useEffect(() => {
    if (!currentOrg?.id) return;
    link();
  }, [currentOrg?.id, link]);

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
