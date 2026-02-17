/**
 * Agents API Hooks
 * Wraps agents API with loading/error state management
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import * as agentsApi from '../../api/agents.api';

/**
 * Hook for fetching agent catalog
 */
export function useAgentCatalog() {
  const { data: catalog, loading, error, fetch, refetch } = useApiState(
    () => agentsApi.getCatalog()
  );
  return { catalog: catalog || [], loading, error, fetch, refetch };
}

/**
 * Hook for fetching org's active agents
 */
export function useActiveAgents() {
  const { data: agents, loading, error, fetch, refetch } = useApiState(
    () => agentsApi.getActiveAgents()
  );
  return { agents: agents || [], loading, error, fetch, refetch };
}

/**
 * Hook for agent mutations (subscribe, cancel)
 */
export function useAgentMutations() {
  const { mutate, loading, error } = useMutation();

  const subscribe = useCallback(async (slug, data) => {
    return mutate(() => agentsApi.subscribeAgent(slug, data));
  }, [mutate]);

  const cancel = useCallback(async (slug) => {
    return mutate(() => agentsApi.cancelAgent(slug));
  }, [mutate]);

  return {
    subscribe,
    cancel,
    loading,
    error
  };
}

/**
 * Combined agents API hook
 */
export function useAgentsApi() {
  const catalog = useAgentCatalog();
  const active = useActiveAgents();
  const mutations = useAgentMutations();

  return {
    ...catalog,
    activeAgents: active.agents,
    activeLoading: active.loading,
    fetchActive: active.fetch,
    refetchActive: active.refetch,
    ...mutations
  };
}
