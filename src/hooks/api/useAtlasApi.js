/**
 * ATLAS API Hooks
 * Wraps ATLAS API with loading/error state management
 */

import { useCallback, useEffect, useRef } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import * as atlasApi from '../../api/atlas.api';

/**
 * Hook for ATLAS dashboard stats
 */
export function useAtlasDashboard() {
  const { data: dashboard, loading, error, fetch, refetch } = useApiState(
    () => atlasApi.getDashboard()
  );
  return { dashboard, loading, error, fetch, refetch };
}

/**
 * Hook for ATLAS processing status (polling)
 */
export function useAtlasProcessingStatus({ interval = 5000, enabled = true } = {}) {
  const { data: status, loading, error, fetch, refetch } = useApiState(
    () => atlasApi.getProcessingStatus()
  );

  const timerRef = useRef(null);

  useEffect(() => {
    if (!enabled) return;
    fetch();
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !status?.in_progress) {
      clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      refetch();
    }, interval);

    return () => clearInterval(timerRef.current);
  }, [enabled, status?.in_progress, interval]);

  return { status, loading, error, fetch, refetch };
}

/**
 * Hook for ATLAS email connections
 */
export function useAtlasConnections() {
  const { data: connections, loading, error, fetch, refetch } = useApiState(
    () => atlasApi.getConnections()
  );
  const { mutate, loading: mutating } = useMutation();

  const connectGmail = useCallback(async () => {
    return mutate(() => atlasApi.getOAuthUrl('gmail'));
  }, [mutate]);

  const connectOutlook = useCallback(async () => {
    return mutate(() => atlasApi.getOAuthUrl('outlook'));
  }, [mutate]);

  const updateConnection = useCallback(async (id, data) => {
    const result = await mutate(() => atlasApi.updateConnection(id, data));
    await refetch();
    return result;
  }, [mutate, refetch]);

  const deleteConnection = useCallback(async (id) => {
    await mutate(() => atlasApi.deleteConnection(id));
    await refetch();
  }, [mutate, refetch]);

  const syncConnection = useCallback(async (id) => {
    return mutate(() => atlasApi.syncConnection(id));
  }, [mutate]);

  return {
    connections: connections || [],
    loading,
    error,
    fetch,
    refetch,
    connectGmail,
    connectOutlook,
    updateConnection,
    deleteConnection,
    syncConnection,
    mutating
  };
}

/**
 * Hook for ATLAS emails list
 */
export function useAtlasEmails() {
  const { data, loading, error, fetch, refetch } = useApiState(
    (filters) => atlasApi.getEmails(filters)
  );
  const { mutate, loading: mutating } = useMutation();

  const submitManual = useCallback(async (emailData) => {
    const result = await mutate(() => atlasApi.submitManualEmail(emailData));
    await refetch();
    return result;
  }, [mutate, refetch]);

  const reprocess = useCallback(async (id) => {
    const result = await mutate(() => atlasApi.reprocessEmail(id));
    await refetch();
    return result;
  }, [mutate, refetch]);

  return {
    emails: data || [],
    loading,
    error,
    fetch,
    refetch,
    submitManual,
    reprocess,
    mutating
  };
}

/**
 * Hook for ATLAS opportunities list
 */
export function useAtlasOpportunities() {
  const { data, loading, error, fetch, refetch, setData } = useApiState(
    (filters) => atlasApi.getOpportunities(filters)
  );

  return {
    opportunities: data || [],
    loading,
    error,
    fetch,
    refetch,
    setData
  };
}

/**
 * Hook for single ATLAS opportunity detail
 */
export function useAtlasOpportunityDetail(id) {
  const { data: opportunity, loading, error, fetch, refetch } = useApiState(
    () => atlasApi.getOpportunity(id)
  );
  return { opportunity, loading, error, fetch, refetch };
}

/**
 * Hook for ATLAS mutations (accept, reject, update)
 */
export function useAtlasMutations() {
  const { mutate, loading, error } = useMutation();

  const acceptOpportunity = useCallback(async (id) => {
    return mutate(() => atlasApi.acceptOpportunity(id));
  }, [mutate]);

  const rejectOpportunity = useCallback(async (id, reason) => {
    return mutate(() => atlasApi.rejectOpportunity(id, reason));
  }, [mutate]);

  const updateOpportunity = useCallback(async (id, data) => {
    return mutate(() => atlasApi.updateOpportunity(id, data));
  }, [mutate]);

  const updateSettings = useCallback(async (data) => {
    return mutate(() => atlasApi.updateSettings(data));
  }, [mutate]);

  return {
    acceptOpportunity,
    rejectOpportunity,
    updateOpportunity,
    updateSettings,
    loading,
    error
  };
}

/**
 * Hook for ATLAS settings
 */
export function useAtlasSettings() {
  const { data: settings, loading, error, fetch, refetch } = useApiState(
    () => atlasApi.getSettings()
  );
  return { settings, loading, error, fetch, refetch };
}
