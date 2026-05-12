/**
 * MorPro Direct (network) API client.
 *
 * Phase 1 endpoints. Mirrors the structure of pnl.api.js / loads.api.js etc.
 */

import api from './client';

// ── Carrier-side: my profile ─────────────────────────────────────────
export const getMyProfile = async () => {
  const res = await api.get('/v1/network/me/profile');
  return res.data?.data ?? res.data;
};

export const upsertMyProfile = async (payload) => {
  const res = await api.put('/v1/network/me/profile', payload);
  return res.data?.data ?? res.data;
};

export const submitProfile = async () => {
  const res = await api.post('/v1/network/me/profile/submit');
  return res.data?.data ?? res.data;
};

export const recordProfileDocument = async (payload) => {
  const res = await api.post('/v1/network/me/profile/documents', payload);
  return res.data?.data ?? res.data;
};

// ── Super-admin verification ─────────────────────────────────────────
export const listAdminProfiles = async (status = 'pending') => {
  const res = await api.get(`/v1/network/admin/profiles?status=${encodeURIComponent(status)}`);
  return res.data?.data ?? res.data;
};

export const getAdminProfile = async (orgId) => {
  const res = await api.get(`/v1/network/admin/profiles/${orgId}`);
  return res.data?.data ?? res.data;
};

export const approveProfile = async (orgId) => {
  const res = await api.post(`/v1/network/admin/profiles/${orgId}/approve`);
  return res.data?.data ?? res.data;
};

export const rejectProfile = async (orgId, reason) => {
  const res = await api.post(`/v1/network/admin/profiles/${orgId}/reject`, { reason });
  return res.data?.data ?? res.data;
};

// ── Public directory ─────────────────────────────────────────────────
export const listCarriers = async (filters = {}) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && v !== '') params.append(k, v);
  }
  const qs = params.toString();
  const res = await api.get(`/v1/network/carriers${qs ? `?${qs}` : ''}`);
  return res.data?.data ?? res.data;
};

export const getCarrier = async (orgSlug) => {
  const res = await api.get(`/v1/network/carriers/${encodeURIComponent(orgSlug)}`);
  return res.data?.data ?? res.data;
};

// ── Phase 2 — loads (shipper-side) ───────────────────────────────────
export const createLoad = async (payload, { publish = false } = {}) => {
  const url = publish ? '/v1/network/loads?publish=true' : '/v1/network/loads';
  const res = await api.post(url, payload);
  return res.data?.data ?? res.data;
};

export const listMyLoads = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/loads${qs}`);
  return res.data?.data ?? res.data;
};

export const getMyLoad = async (id) => {
  const res = await api.get(`/v1/network/loads/${id}`);
  return res.data?.data ?? res.data;
};

export const updateLoad = async (id, payload) => {
  const res = await api.patch(`/v1/network/loads/${id}`, payload);
  return res.data?.data ?? res.data;
};

export const publishLoad = async (id) => {
  const res = await api.post(`/v1/network/loads/${id}/publish`);
  return res.data?.data ?? res.data;
};

export const cancelLoad = async (id, reason) => {
  const res = await api.post(`/v1/network/loads/${id}/cancel`, { reason });
  return res.data?.data ?? res.data;
};

// ── Phase 2 — loads (carrier-side) ───────────────────────────────────
export const listAvailableLoads = async (filters = {}) => {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(filters)) {
    if (v != null && v !== '') params.append(k, v);
  }
  const qs = params.toString();
  const res = await api.get(`/v1/network/loads/available${qs ? `?${qs}` : ''}`);
  return res.data?.data ?? res.data;
};

export const getLoadForCarrier = async (id) => {
  const res = await api.get(`/v1/network/loads/${id}/view`);
  return res.data?.data ?? res.data;
};

// Lookup network linkage by internal load id (404 if not linked).
export const getNetworkLinkageByInternalLoadId = async (internalLoadId) => {
  try {
    const res = await api.get(`/v1/network/loads/by-internal/${internalLoadId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};

// ── Phase 2 — bids ────────────────────────────────────────────────────
export const placeBid = async (loadId, payload) => {
  const res = await api.post(`/v1/network/loads/${loadId}/bids`, payload);
  return res.data?.data ?? res.data;
};

export const withdrawBid = async (bidId) => {
  const res = await api.post(`/v1/network/bids/${bidId}/withdraw`);
  return res.data?.data ?? res.data;
};

export const carrierAcceptCounter = async (bidId) => {
  const res = await api.post(`/v1/network/bids/${bidId}/accept-counter`);
  return res.data?.data ?? res.data;
};

export const listMyBids = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/bids/mine${qs}`);
  return res.data?.data ?? res.data;
};

export const shipperAcceptBid = async (bidId) => {
  const res = await api.post(`/v1/network/bids/${bidId}/accept`);
  return res.data?.data ?? res.data;
};

export const shipperRejectBid = async (bidId, reason) => {
  const res = await api.post(`/v1/network/bids/${bidId}/reject`, { reason });
  return res.data?.data ?? res.data;
};

export const shipperCounterBid = async (bidId, counter_amount) => {
  const res = await api.post(`/v1/network/bids/${bidId}/counter`, { counter_amount });
  return res.data?.data ?? res.data;
};

// ── Phase 3 — direct requests ─────────────────────────────────────────
export const sendDirectRequest = async (carrierOrgId, payload) => {
  const res = await api.post(`/v1/network/carriers/${carrierOrgId}/request`, payload);
  return res.data?.data ?? res.data;
};

export const listOutgoingRequests = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/requests/outgoing${qs}`);
  return res.data?.data ?? res.data;
};

export const listIncomingRequests = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/requests/incoming${qs}`);
  return res.data?.data ?? res.data;
};

export const getRequest = async (id) => {
  const res = await api.get(`/v1/network/requests/${id}`);
  return res.data?.data ?? res.data;
};

export const acceptRequest = async (id) => {
  const res = await api.post(`/v1/network/requests/${id}/accept`);
  return res.data?.data ?? res.data;
};

export const rejectRequest = async (id, reason) => {
  const res = await api.post(`/v1/network/requests/${id}/reject`, { reason });
  return res.data?.data ?? res.data;
};

export const counterRequest = async (id, counter_amount) => {
  const res = await api.post(`/v1/network/requests/${id}/counter`, { counter_amount });
  return res.data?.data ?? res.data;
};

export const cancelRequest = async (id) => {
  const res = await api.post(`/v1/network/requests/${id}/cancel`);
  return res.data?.data ?? res.data;
};

export const shipperAcceptCounter = async (id) => {
  const res = await api.post(`/v1/network/requests/${id}/accept-counter`);
  return res.data?.data ?? res.data;
};

// ── Phase 4 — command center ──────────────────────────────────────────
export const getCommandCenter = async (loadId) => {
  const res = await api.get(`/v1/network/cc/${loadId}`);
  return res.data?.data ?? res.data;
};

export const listCommandCenterMessages = async (ccId) => {
  const res = await api.get(`/v1/network/cc/${ccId}/messages`);
  return res.data?.data ?? res.data;
};

export const postCommandCenterMessage = async (ccId, payload) => {
  const res = await api.post(`/v1/network/cc/${ccId}/messages`, payload);
  return res.data?.data ?? res.data;
};

export const attachCommandCenterDocument = async (ccId, loadId, payload) => {
  const res = await api.post(`/v1/network/cc/${ccId}/loads/${loadId}/documents`, payload);
  return res.data?.data ?? res.data;
};

// ── Phase 5 — onboarding ─────────────────────────────────────────────
export const getOnboarding = async () => {
  const res = await api.get('/v1/network/onboarding');
  return res.data?.data ?? res.data;
};
export const startIdentity = async () => {
  const res = await api.post('/v1/network/onboarding/identity/start');
  return res.data?.data ?? res.data;
};
export const stubVerifyIdentity = async () => {
  const res = await api.post('/v1/network/onboarding/identity/stub-verify');
  return res.data?.data ?? res.data;
};
export const provisionConnect = async () => {
  const res = await api.post('/v1/network/onboarding/connect/provision');
  return res.data?.data ?? res.data;
};
export const stubActivateConnect = async () => {
  const res = await api.post('/v1/network/onboarding/connect/stub-activate');
  return res.data?.data ?? res.data;
};

// ── Phase 5 — payments ───────────────────────────────────────────────
export const getPaymentMethod = async () => {
  const res = await api.get('/v1/network/payments/method');
  return res.data?.data ?? res.data;
};
export const setPaymentMethod = async (paymentMethodId) => {
  const res = await api.put('/v1/network/payments/method', { payment_method_id: paymentMethodId });
  return res.data?.data ?? res.data;
};
export const getLoadPayment = async (loadId) => {
  try {
    const res = await api.get(`/v1/network/payments/loads/${loadId}`);
    return res.data?.data ?? res.data;
  } catch (err) {
    if (err.response?.status === 404) return null;
    throw err;
  }
};
export const approveLoadPod = async (loadId) => {
  const res = await api.post(`/v1/network/payments/loads/${loadId}/approve-pod`);
  return res.data?.data ?? res.data;
};
export const listMyPayouts = async () => {
  const res = await api.get('/v1/network/payments/payouts');
  return res.data?.data ?? res.data;
};
export const triggerPaymentSweep = async () => {
  const res = await api.post('/v1/network/admin/payment-sweep');
  return res.data?.data ?? res.data;
};

// ── Phase 5 — disputes ───────────────────────────────────────────────
export const openDispute = async (loadId, payload) => {
  const res = await api.post(`/v1/network/loads/${loadId}/disputes`, payload);
  return res.data?.data ?? res.data;
};
export const listMyDisputes = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/disputes${qs}`);
  return res.data?.data ?? res.data;
};
export const listAdminDisputes = async (status) => {
  const qs = status ? `?status=${encodeURIComponent(status)}` : '';
  const res = await api.get(`/v1/network/admin/disputes${qs}`);
  return res.data?.data ?? res.data;
};
export const getDispute = async (id) => {
  const res = await api.get(`/v1/network/disputes/${id}`);
  return res.data?.data ?? res.data;
};
export const resolveDispute = async (id, payload) => {
  const res = await api.post(`/v1/network/admin/disputes/${id}/resolve`, payload);
  return res.data?.data ?? res.data;
};

// ── Phase 6 — reviews + matching ─────────────────────────────────────
export const postLoadReview = async (loadId, payload) => {
  const res = await api.post(`/v1/network/loads/${loadId}/reviews`, payload);
  return res.data?.data ?? res.data;
};
export const listOrgReviews = async (orgId, type) => {
  const qs = type ? `?type=${encodeURIComponent(type)}` : '';
  const res = await api.get(`/v1/network/orgs/${orgId}/reviews${qs}`);
  return res.data?.data ?? res.data;
};
export const getMyReviewState = async (loadId) => {
  const res = await api.get(`/v1/network/loads/${loadId}/my-review-state`);
  return res.data?.data ?? res.data;
};
export const getRecommendedCarriers = async (loadId, limit = 5) => {
  const res = await api.get(`/v1/network/loads/${loadId}/recommended-carriers?limit=${limit}`);
  return res.data?.data ?? res.data;
};

export default {
  getMyProfile,
  upsertMyProfile,
  submitProfile,
  recordProfileDocument,
  listAdminProfiles,
  getAdminProfile,
  approveProfile,
  rejectProfile,
  listCarriers,
  getCarrier,
  // Phase 2 — loads
  createLoad,
  listMyLoads,
  getMyLoad,
  updateLoad,
  publishLoad,
  cancelLoad,
  listAvailableLoads,
  getLoadForCarrier,
  // Phase 2 — bids
  placeBid,
  withdrawBid,
  carrierAcceptCounter,
  listMyBids,
  shipperAcceptBid,
  shipperRejectBid,
  shipperCounterBid,
  // Phase 3 — direct requests
  sendDirectRequest,
  listOutgoingRequests,
  listIncomingRequests,
  getRequest,
  acceptRequest,
  rejectRequest,
  counterRequest,
  cancelRequest,
  shipperAcceptCounter,
  // Phase 4 — command center
  getCommandCenter,
  listCommandCenterMessages,
  postCommandCenterMessage,
  attachCommandCenterDocument,
  // Phase 3 — NextMS banner lookup (internal load → network linkage)
  getNetworkLinkageByInternalLoadId,
  // Phase 5 — onboarding
  getOnboarding,
  startIdentity,
  stubVerifyIdentity,
  provisionConnect,
  stubActivateConnect,
  // Phase 5 — payments
  getPaymentMethod,
  setPaymentMethod,
  getLoadPayment,
  approveLoadPod,
  listMyPayouts,
  triggerPaymentSweep,
  // Phase 5 — disputes
  openDispute,
  listMyDisputes,
  listAdminDisputes,
  getDispute,
  resolveDispute,
  // Phase 6 — reviews + matching
  postLoadReview,
  listOrgReviews,
  getMyReviewState,
  getRecommendedCarriers
};
