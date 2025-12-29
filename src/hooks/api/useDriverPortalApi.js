/**
 * Driver Portal API Hooks
 *
 * Wraps driverPortal.api.js with React hooks for state management.
 * Philosophy: API hooks wrap API calls with loading/error state.
 */

import { useState, useCallback } from 'react';
import driverPortalApi from '../../api/driverPortal.api';

// ============================================
// PROFILES
// ============================================

/**
 * useDriverProfiles - Fetch driver profiles
 */
export function useDriverProfiles() {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchProfiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.getProfiles();
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
// DASHBOARD
// ============================================

/**
 * useDriverDashboard - Fetch dashboard data
 */
export function useDriverDashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasNoOrgs, setHasNoOrgs] = useState(false);

  const fetchDashboard = useCallback(async (organizationId = null) => {
    try {
      setLoading(true);
      setError(null);
      setHasNoOrgs(false);
      const response = await driverPortalApi.getDashboard(organizationId);
      setDashboard(response.data);

      // Check if user has no organizations
      if (!response.data?.profiles || response.data.profiles.length === 0) {
        setHasNoOrgs(true);
      }

      return response;
    } catch (err) {
      const errorMessage = err.response?.data?.error?.message || '';
      if (errorMessage.toLowerCase().includes('no organization') ||
          errorMessage.toLowerCase().includes('not a member') ||
          err.response?.status === 404) {
        setHasNoOrgs(true);
      } else {
        setError(errorMessage || 'Failed to load dashboard');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { dashboard, loading, error, hasNoOrgs, fetchDashboard, setDashboard, setHasNoOrgs };
}

// ============================================
// LOADS
// ============================================

/**
 * useDriverLoads - Fetch driver's loads list
 */
export function useDriverLoads() {
  const [loads, setLoads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoads = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.getLoads(filters);
      setLoads(response.data.loads || []);
      setTotal(response.data.total || 0);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loads, total, loading, error, fetchLoads, setLoads };
}

/**
 * useDriverLoad - Fetch single load detail
 */
export function useDriverLoad(loadId) {
  const [load, setLoad] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchLoad = useCallback(async () => {
    if (!loadId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.getLoad(loadId);
      setLoad(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  return { load, loading, error, fetchLoad, setLoad };
}

/**
 * useDriverLoadActions - Trip actions (start, complete)
 */
export function useDriverLoadActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const startTrip = useCallback(async (loadId) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.startTrip(loadId);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const completeTrip = useCallback(async (loadId, notes = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.completeTrip(loadId, notes);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateLoadStatus = useCallback(async (loadId, status, notes = null) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.updateLoadStatus(loadId, status, notes);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, startTrip, completeTrip, updateLoadStatus };
}

// ============================================
// EARNINGS
// ============================================

/**
 * useDriverEarnings - Fetch earnings summary and history
 */
export function useDriverEarnings() {
  const [earnings, setEarnings] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchEarnings = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const [earningsRes, historyRes] = await Promise.all([
        driverPortalApi.getEarnings(filters),
        driverPortalApi.getEarningsHistory(filters)
      ]);
      setEarnings(earningsRes.data);
      setHistory(historyRes.data.history || []);
      return { earnings: earningsRes.data, history: historyRes.data.history };
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { earnings, history, loading, error, fetchEarnings };
}

// ============================================
// EXPENSES
// ============================================

/**
 * useDriverExpenses - Fetch driver expenses list
 */
export function useDriverExpenses() {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpenses = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.getExpenses(filters);
      setExpenses(response.data?.expenses || []);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { expenses, loading, error, fetchExpenses, setExpenses };
}

/**
 * useDriverExpense - Fetch single expense detail
 */
export function useDriverExpense(expenseId) {
  const [expense, setExpense] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchExpense = useCallback(async () => {
    if (!expenseId) return;
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.getExpense(expenseId);
      setExpense(response.data);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [expenseId]);

  return { expense, loading, error, fetchExpense, setExpense };
}

/**
 * useDriverExpenseMutations - Submit/update expenses
 */
export function useDriverExpenseMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitExpense = useCallback(async (data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.submitExpense(data);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateExpense = useCallback(async (expenseId, data) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.updateExpense(expenseId, data);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, submitExpense, updateExpense };
}

// ============================================
// LOCATION
// ============================================

/**
 * useDriverLocation - Update driver location
 */
export function useDriverLocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const updateLocation = useCallback(async (locationData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await driverPortalApi.updateLocation(locationData);
      return response;
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, updateLocation };
}

// ============================================
// COMBINED API HOOK
// ============================================

/**
 * useDriverPortalApi - Combined access to all driver portal API hooks
 */
export function useDriverPortalApi() {
  return {
    useDriverProfiles,
    useDriverDashboard,
    useDriverLoads,
    useDriverLoad,
    useDriverLoadActions,
    useDriverEarnings,
    useDriverExpenses,
    useDriverExpense,
    useDriverExpenseMutations,
    useDriverLocation
  };
}

export default useDriverPortalApi;
