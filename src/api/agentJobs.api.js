import api from './client';

/**
 * Agent jobs API — the queue.
 *
 * Used by the Genie Suite UI to render the live job queue for Alex
 * (and every other agent later). Polls every few seconds while a page
 * with a queue panel is open.
 */

export const listJobs = async ({ status, agent, minutes, limit } = {}) => {
  const params = new URLSearchParams();
  if (status) params.set('status', Array.isArray(status) ? status.join(',') : status);
  if (agent)  params.set('agent', Array.isArray(agent) ? agent.join(',') : agent);
  if (minutes) params.set('minutes', String(minutes));
  if (limit) params.set('limit', String(limit));
  const qs = params.toString();
  const res = await api.get(`/v1/agents/jobs${qs ? `?${qs}` : ''}`);
  return res.data?.data ?? res.data;
};

export const getJob = async (id) => {
  const res = await api.get(`/v1/agents/jobs/${id}`);
  return res.data?.data ?? res.data;
};

export default { listJobs, getJob };
