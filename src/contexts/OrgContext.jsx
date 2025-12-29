/**
 * OrgContext - Core organization state provider
 *
 * Note: Uses organizationsApi directly (not hooks) because:
 * 1. This context PROVIDES the useOrg hook - can't use hooks inside a hook provider
 * 2. This is the foundational layer for organization-scoped operations
 * 3. Organization state must exist before domain hooks can function
 */

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import organizationsApi from '../api/organizations.api'; // Exception: Foundational context
import { getOrgSlug } from '../lib/utils';
import { RolePermissions } from '@/enums';

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const { organizations, isAuthenticated, refreshOrganizations } = useAuth();
  const [currentOrg, setCurrentOrg] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Resolve org from URL on mount and when auth changes
  useEffect(() => {
    if (!isAuthenticated) {
      setCurrentOrg(null);
      setLoading(false);
      return;
    }

    resolveOrgFromUrl();
  }, [isAuthenticated, organizations]);

  const resolveOrgFromUrl = async () => {
    const slug = getOrgSlug();

    if (slug) {
      // Try to find in user's orgs
      const org = organizations.find(o => o.slug === slug);

      if (org) {
        setCurrentOrg(org);
        await loadMembers(org.id);
      } else {
        // Org not in user's list - might need to fetch
        try {
          const response = await organizationsApi.resolve(slug);
          if (response.success) {
            setCurrentOrg(response.data);
          }
        } catch (err) {
          console.error('Failed to resolve org:', err);
        }
      }
    } else if (organizations.length > 0) {
      // No slug in URL - default to first org
      setCurrentOrg(organizations[0]);
    }

    setLoading(false);
  };

  const loadMembers = async (orgId) => {
    try {
      const response = await organizationsApi.getMembers(orgId);
      if (response.success) {
        setMembers(response.data);
      }
    } catch (err) {
      console.error('Failed to load members:', err);
    }
  };

  const switchOrg = useCallback((org) => {
    setCurrentOrg(org);
    // Update URL to reflect org switch
    const newPath = `/o/${org.slug}/dashboard`;
    window.history.pushState(null, '', newPath);
    loadMembers(org.id);
  }, []);

  const createOrg = useCallback(async (data) => {
    const response = await organizationsApi.create(data);
    if (response.success) {
      await refreshOrganizations();
      setCurrentOrg(response.data);
      return response.data;
    }
    throw new Error('Failed to create organization');
  }, [refreshOrganizations]);

  const updateOrg = useCallback(async (data) => {
    if (!currentOrg) throw new Error('No organization selected');

    const response = await organizationsApi.update(currentOrg.id, data);
    if (response.success) {
      setCurrentOrg(response.data);
      await refreshOrganizations();
      return response.data;
    }
    throw new Error('Failed to update organization');
  }, [currentOrg, refreshOrganizations]);

  const inviteMember = useCallback(async (data) => {
    if (!currentOrg) throw new Error('No organization selected');

    const response = await organizationsApi.inviteMember(currentOrg.id, data);
    if (response.success) {
      await loadMembers(currentOrg.id);
      return response.data;
    }
    throw new Error('Failed to invite member');
  }, [currentOrg]);

  // Refresh current organization data (useful after billing changes)
  const refreshOrganization = useCallback(async () => {
    if (!currentOrg) return;

    try {
      const response = await organizationsApi.resolve(currentOrg.slug);
      if (response.success) {
        setCurrentOrg(response.data);
        await refreshOrganizations();
      }
    } catch (err) {
      console.error('Failed to refresh organization:', err);
    }
  }, [currentOrg, refreshOrganizations]);

  // Helper to generate org-scoped URLs
  const orgUrl = useCallback((path) => {
    if (!currentOrg) return path;
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `/o/${currentOrg.slug}${cleanPath}`;
  }, [currentOrg]);

  // Get current user's role in this organization
  const currentRole = useMemo(() => {
    return currentOrg?.role || currentOrg?.membership?.role || null;
  }, [currentOrg]);

  // Check if current user has a specific permission
  const hasPermission = useCallback((permission) => {
    if (!currentRole) return false;
    const rolePermissions = RolePermissions[currentRole] || [];
    return rolePermissions.includes(permission);
  }, [currentRole]);

  const value = {
    currentOrg,
    organization: currentOrg, // Alias for convenience
    members,
    loading,
    hasOrg: !!currentOrg,
    currentRole,
    hasPermission,
    switchOrg,
    createOrg,
    updateOrg,
    inviteMember,
    refreshMembers: () => currentOrg && loadMembers(currentOrg.id),
    refreshOrganization,
    orgUrl
  };

  return (
    <OrgContext.Provider value={value}>
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error('useOrg must be used within an OrgProvider');
  }
  return context;
}

export default OrgContext;
