/**
 * Inbox API — thin aggregator over existing agent endpoints.
 *
 * The Genie Inbox is a unified view of everything the AI team has
 * done (or is doing) for this org. It joins three sources:
 *
 *   1. agent_jobs            — every per-agent task invocation
 *   2. agent_conversations   — Genie chat threads
 *   3. agent_actions         — best-effort enrichment (not always needed)
 *
 * No new backend route — we just stitch on the client.
 */

import client from './client';
import agentJobsApi from './agentJobs.api';
import genieApi from './genie.api';

/**
 * Fetch all agent jobs across every agent in the org (no agent filter).
 * Backend returns up to `limit` rows from the last `minutes`.
 */
export const fetchAllJobs = async ({ minutes = 60 * 24 * 14, limit = 150 } = {}) => {
  const result = await agentJobsApi.listJobs({ minutes, limit });
  return result?.jobs || [];
};

/**
 * Fetch Genie conversation threads for the current user.
 */
export const fetchGenieThreads = async () => {
  const res = await genieApi.listGenieConversations();
  // The endpoint may return { data: { conversations: [...] } } or a
  // bare array depending on shape — normalize.
  const payload = res?.data ?? res;
  return payload?.conversations ?? payload ?? [];
};

/**
 * Fetch a single Genie thread with its messages.
 */
export const fetchGenieThread = async (conversationId) => {
  const res = await genieApi.getGenieConversation(conversationId);
  const payload = res?.data ?? res;
  return payload?.conversation ?? payload;
};

/**
 * Send a "new email" → starts a fresh Genie conversation.
 * Returns { conversation_id, reply }.
 */
export const composeNew = async (body) => {
  const res = await genieApi.sendGenieMessage(body);
  return res?.data ?? res;
};

/**
 * Reply to an existing Genie thread.
 */
export const replyToThread = async (conversationId, body) => {
  const res = await genieApi.sendGenieMessage(body, conversationId);
  return res?.data ?? res;
};

/**
 * Rerun an Alex check_load_completeness job.
 */
export const rerunAlexCheck = async (loadId) => {
  const res = await client.post(`/v1/agents/alex/check-load/${loadId}`, { sync: false });
  return res.data?.data ?? res.data;
};

/**
 * Approve a drafted broker notification.
 */
export const approveNotification = async (jobId) => {
  const res = await client.post(`/v1/agents/alex/notification/${jobId}/approve`);
  return res.data?.data ?? res.data;
};

/**
 * Discard a drafted broker notification.
 */
export const discardNotification = async (jobId) => {
  const res = await client.post(`/v1/agents/alex/notification/${jobId}/discard`);
  return res.data?.data ?? res.data;
};

export default {
  fetchAllJobs,
  fetchGenieThreads,
  fetchGenieThread,
  composeNew,
  replyToThread,
  rerunAlexCheck,
  approveNotification,
  discardNotification
};
