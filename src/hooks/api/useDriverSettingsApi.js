/**
 * Driver Settings API Hooks
 *
 * Wraps driverSettings.api.js with React hooks for state management.
 * Philosophy: API hooks wrap API calls with loading/error state.
 */

import { useState, useCallback } from 'react';
import driverSettingsApi from '../../api/driverSettings.api';

// ============================================
// ORGANIZATIONS
// ============================================

/**
 * useDriverOrganizations - Fetch organizations and settings data
 */
export function useDriverOrganizations() {
  const [organizations, setOrganizations] = useState([]);
  const [pendingInvites, setPendingInvites] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAll = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [orgsRes, invitesRes, historyRes] = await Promise.all([
        driverSettingsApi.getOrganizations(),
        driverSettingsApi.getPendingInvites(),
        driverSettingsApi.getHistory()
      ]);
      setOrganizations(orgsRes.data || []);
      setPendingInvites(invitesRes.data || []);
      setHistory(historyRes.data || []);
      return { organizations: orgsRes.data, invites: invitesRes.data, history: historyRes.data };
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverSettingsApi.getOrganizations();
      setOrganizations(response.data || []);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    organizations,
    pendingInvites,
    history,
    loading,
    error,
    fetchAll,
    fetchOrganizations,
    setOrganizations,
    setPendingInvites,
    setHistory
  };
}

// ============================================
// INVITES
// ============================================

/**
 * useDriverInvites - Handle invite operations
 */
export function useDriverInvites() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const acceptInviteByCode = useCallback(async (code) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);
      const response = await driverSettingsApi.acceptInviteByCode(code);
      setSuccess(`Successfully joined ${response.data?.organization?.name || 'organization'}!`);
      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || 'Invalid invite code';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const acceptInvite = useCallback(async (inviteId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverSettingsApi.acceptInvite(inviteId);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const declineInvite = useCallback(async (inviteId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverSettingsApi.declineInvite(inviteId);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  return {
    loading,
    error,
    success,
    acceptInviteByCode,
    acceptInvite,
    declineInvite,
    clearMessages
  };
}

// ============================================
// DISCONNECT
// ============================================

/**
 * useDriverDisconnect - Disconnect from organizations
 */
export function useDriverDisconnect() {
  const [loading, setLoading] = useState(false);
  const [disconnectingOrgId, setDisconnectingOrgId] = useState(null);
  const [error, setError] = useState(null);

  const disconnectFromOrg = useCallback(async (orgId) => {
    try {
      setLoading(true);
      setDisconnectingOrgId(orgId);
      setError(null);
      const response = await driverSettingsApi.disconnectFromOrg(orgId);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
      setDisconnectingOrgId(null);
    }
  }, []);

  return { loading, disconnectingOrgId, error, disconnectFromOrg };
}

// ============================================
// PROFILES
// ============================================

/**
 * useDriverSettingsProfiles - Get driver profiles from settings API
 */
export function useDriverSettingsProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverSettingsApi.getProfiles();
      setProfiles(response.data || []);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { profiles, loading, error, fetchProfiles, setProfiles };
}

// ============================================
// COMBINED API HOOK
// ============================================

/**
 * useDriverSettingsApi - Combined access to all driver settings API hooks
 */
export function useDriverSettingsApi() {
  return {
    useDriverOrganizations,
    useDriverInvites,
    useDriverDisconnect,
    useDriverSettingsProfiles
  };
}

export default useDriverSettingsApi;
