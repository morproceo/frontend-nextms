/**
 * Agents API
 * Handles agent catalog and subscription operations
 */

import api from './client';

export const getCatalog = async () => {
  const response = await api.get('/v1/agents/catalog');
  return response.data;
};

export const getActiveAgents = async () => {
  const response = await api.get('/v1/agents/active');
  return response.data;
};

export const subscribeAgent = async (slug, data = {}) => {
  const response = await api.post(`/v1/agents/${slug}/subscribe`, data);
  return response.data;
};

export const cancelAgent = async (slug) => {
  const response = await api.post(`/v1/agents/${slug}/cancel`);
  return response.data;
};

export const getAgentPolicies = async (slug) => {
  const response = await api.get(`/v1/agents/${slug}/policies`);
  return response.data;
};

export const updateAgentPolicies = async (slug, policies) => {
  const response = await api.put(`/v1/agents/${slug}/policies`, policies);
  return response.data;
};

export const getAgentActivity = async (slug, filters = {}) => {
  const params = new URLSearchParams();
  if (filters.page) params.append('page', filters.page);
  if (filters.limit) params.append('limit', filters.limit);

  const queryString = params.toString();
  const url = queryString ? `/v1/agents/${slug}/activity?${queryString}` : `/v1/agents/${slug}/activity`;

  const response = await api.get(url);
  return response.data;
};

export default {
  getCatalog,
  getActiveAgents,
  subscribeAgent,
  cancelAgent,
  getAgentPolicies,
  updateAgentPolicies,
  getAgentActivity
};
