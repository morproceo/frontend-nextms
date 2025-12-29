/**
 * AuthContext - Core authentication state provider
 *
 * Note: Uses authApi directly (not hooks) because:
 * 1. This context PROVIDES the useAuth hook - can't use hooks inside a hook provider
 * 2. This is the foundational layer that all other hooks build upon
 * 3. Authentication state must exist before other hooks can function
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import authApi from '../api/auth.api'; // Exception: Foundational context
import { TokenManager } from '../api/client';
import { Roles } from '@/enums';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [organizations, setOrganizations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check auth status on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = TokenManager.getAccessToken();

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.getMe();
      if (response.success) {
        setUser(response.data.user);
        setOrganizations(response.data.organizations);
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      TokenManager.clearTokens();
    } finally {
      setLoading(false);
    }
  };

  const requestOTP = useCallback(async (email, isSignup = false) => {
    setError(null);
    try {
      const response = isSignup
        ? await authApi.signup(email)
        : await authApi.login(email);
      return response;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Failed to send code';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const verifyOTP = useCallback(async (email, code) => {
    setError(null);
    try {
      const response = await authApi.verify(email, code);
      if (response.success) {
        setUser(response.data.user);
        setOrganizations(response.data.organizations);
      }
      return response;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Invalid code';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const loginWithPassword = useCallback(async (email, password) => {
    setError(null);
    try {
      const response = await authApi.loginWithPassword(email, password);
      if (response.success) {
        setUser(response.data.user);
        setOrganizations(response.data.organizations);
      }
      return response;
    } catch (err) {
      const message = err.response?.data?.error?.message || 'Invalid email or password';
      setError(message);
      throw new Error(message);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setOrganizations([]);
    }
  }, []);

  const updateProfile = useCallback(async (data) => {
    const response = await authApi.updateProfile(data);
    if (response.success) {
      setUser(prev => ({ ...prev, ...response.data }));
    }
    return response;
  }, []);

  const refreshOrganizations = useCallback(async () => {
    try {
      const response = await authApi.getMe();
      if (response.success) {
        setOrganizations(response.data.organizations);
      }
    } catch (err) {
      console.error('Failed to refresh organizations:', err);
    }
  }, []);

  // Check if user is driver-only (all org memberships are driver role)
  const isDriverOnly = useMemo(() => {
    if (!user || organizations.length === 0) return false;
    return organizations.every(org => org.role === Roles.DRIVER);
  }, [user, organizations]);

  // Check if user has any driver role (for showing driver portal access)
  const hasDriverRole = useMemo(() => {
    if (!user || organizations.length === 0) return false;
    return organizations.some(org => org.role === Roles.DRIVER);
  }, [user, organizations]);

  // Check if user has admin access (any non-driver role)
  const hasAdminAccess = useMemo(() => {
    if (!user || organizations.length === 0) return false;
    return organizations.some(org => org.role !== Roles.DRIVER);
  }, [user, organizations]);

  const value = {
    user,
    organizations,
    loading,
    error,
    isAuthenticated: !!user,
    isDriverOnly,
    hasDriverRole,
    hasAdminAccess,
    requestOTP,
    verifyOTP,
    loginWithPassword,
    logout,
    updateProfile,
    refreshOrganizations,
    clearError: () => setError(null),
    setUser,
    setOrganizations
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
