/**
 * useAtlas - Domain hook for ATLAS freight intelligence
 *
 * Composes API hooks and adds business logic:
 * - Filtering & sorting
 * - Statistics
 * - Search
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useAtlasDashboard,
  useAtlasOpportunities,
  useAtlasMutations,
  useAtlasConnections,
  useAtlasEmails
} from '../api/useAtlasApi';

const STATUS_FILTERS = ['all', 'new', 'reviewed', 'accepted', 'rejected', 'converted'];

export function useAtlas(options = {}) {
  const { autoFetch = true } = options;

  // API hooks
  const dashboard = useAtlasDashboard();
  const { opportunities: rawOpportunities, loading: oppsLoading, error: oppsError, fetch: fetchOpps, refetch: refetchOpps } = useAtlasOpportunities();
  const mutations = useAtlasMutations();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(1);

  // Auto-fetch on mount
  useEffect(() => {
    if (autoFetch) {
      dashboard.fetch();
      fetchOpps({ status: statusFilter === 'all' ? undefined : statusFilter, page });
    }
  }, [autoFetch]);

  // Refetch when filters change
  useEffect(() => {
    fetchOpps({
      status: statusFilter === 'all' ? undefined : statusFilter,
      search: searchQuery || undefined,
      page
    });
  }, [statusFilter, searchQuery, page]);

  // Filtered opportunities (client-side additional filtering if needed)
  const filteredOpportunities = useMemo(() => {
    let result = Array.isArray(rawOpportunities) ? rawOpportunities : [];

    if (searchQuery && result.length > 0) {
      const query = searchQuery.toLowerCase();
      result = result.filter(opp =>
        opp.reference_number?.toLowerCase().includes(query) ||
        opp.broker?.name?.toLowerCase().includes(query) ||
        opp.origin?.city?.toLowerCase().includes(query) ||
        opp.destination?.city?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [rawOpportunities, searchQuery]);

  // Stats from dashboard
  const stats = useMemo(() => {
    return dashboard.dashboard?.stats || {
      total_emails: 0,
      freight_emails: 0,
      total_opportunities: 0,
      pending_review: 0,
      accepted: 0,
      converted: 0,
      active_connections: 0
    };
  }, [dashboard.dashboard]);

  // Handlers
  const handleAccept = useCallback(async (id) => {
    const result = await mutations.acceptOpportunity(id);
    await refetchOpps();
    await dashboard.refetch();
    return result;
  }, [mutations, refetchOpps, dashboard]);

  const handleReject = useCallback(async (id, reason) => {
    const result = await mutations.rejectOpportunity(id, reason);
    await refetchOpps();
    await dashboard.refetch();
    return result;
  }, [mutations, refetchOpps, dashboard]);

  const resetFilters = useCallback(() => {
    setSearchQuery('');
    setStatusFilter('all');
    setPage(1);
  }, []);

  const refetch = useCallback(() => {
    dashboard.refetch();
    refetchOpps();
  }, [dashboard, refetchOpps]);

  return {
    // Data
    opportunities: filteredOpportunities,
    recentOpportunities: dashboard.dashboard?.recent_opportunities || [],
    stats,

    // State
    loading: dashboard.loading || oppsLoading,
    error: oppsError,

    // Filters
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    statusFilters: STATUS_FILTERS,
    page,
    setPage,

    // Actions
    acceptOpportunity: handleAccept,
    rejectOpportunity: handleReject,
    resetFilters,
    refetch,

    // Mutation state
    mutating: mutations.loading
  };
}

export default useAtlas;
