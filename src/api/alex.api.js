import api from './client';

/**
 * Alex API.
 *
 * Thin wrappers over /v1/agents/alex/* for the load review surface.
 *
 *   getLatestCheck(loadId)    — fetch the most recent completed check
 *                                without re-running. Tells the UI if a
 *                                fresh check is currently in flight.
 *
 *   checkLoad(loadId, opts)   — trigger a fresh check.
 *                                opts.sync = true  → run inline, full result back
 *                                opts.sync = false → enqueue, returns job ID
 *                                opts.forceRescan  → bypass rate-con extraction cache
 *
 *   applyFix(loadId, fixes)   — apply user-approved patches.
 *                                Each fix: { field, suggested_value, overwrite? }
 *                                Conflicts ride in with overwrite=true.
 */

export const getLatestCheck = async (loadId) => {
  const res = await api.get(`/v1/agents/alex/latest-check/${loadId}`);
  return res.data?.data ?? res.data;
};

export const checkLoad = async (loadId, { sync = true, forceRescan = false } = {}) => {
  const qs = [];
  if (sync) qs.push('sync=true');
  if (forceRescan) qs.push('rescan=true');
  const url = `/v1/agents/alex/check-load/${loadId}${qs.length ? `?${qs.join('&')}` : ''}`;
  const res = await api.post(url, { sync, forceRescan });
  return res.data?.data ?? res.data;
};

export const applyFix = async (loadId, fixes) => {
  const res = await api.post('/v1/agents/alex/apply-fix', {
    load_id: loadId,
    fixes
  });
  return res.data?.data ?? res.data;
};

/**
 * Approve a previously-drafted broker notification job. Sends the
 * email using the cached draft (no re-composition).
 */
export const approveNotification = async (jobId) => {
  const res = await api.post(`/v1/agents/alex/notification/${jobId}/approve`);
  return res.data?.data ?? res.data;
};

/**
 * Discard a drafted broker notification — no send. Row moves to Clean.
 */
export const discardNotification = async (jobId) => {
  const res = await api.post(`/v1/agents/alex/notification/${jobId}/discard`);
  return res.data?.data ?? res.data;
};

export default { getLatestCheck, checkLoad, applyFix, approveNotification, discardNotification };
