import api from './client';

/**
 * Agent policies + task manifest API.
 *
 * Backs the Genie Suite settings page. Each function is a thin pass-
 * through to the existing /v1/agents/:slug/{policies,tasks} endpoints.
 */

export const getTasks = async (slug) => {
  const res = await api.get(`/v1/agents/${slug}/tasks`);
  return res.data?.data ?? res.data;
};

/**
 * Returns the merged-defaults-plus-overrides object for an agent.
 * Shape: { policy_key: policy_value, ... }
 */
export const getPolicies = async (slug) => {
  const res = await api.get(`/v1/agents/${slug}/policies`);
  return res.data?.data ?? res.data;
};

/**
 * Patch-style update. Body is { key: value, ... } — only changed
 * keys need to be sent.
 */
export const updatePolicies = async (slug, patch) => {
  const res = await api.put(`/v1/agents/${slug}/policies`, patch);
  return res.data?.data ?? res.data;
};

export default { getTasks, getPolicies, updatePolicies };
