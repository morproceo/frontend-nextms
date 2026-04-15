/**
 * Readiness API
 * Driver Readiness, Load Impact, Scoring Config endpoints (Phase 3 read-only).
 *
 * Maps to v1.2 §9.5 and UX/UI plan §16 Phase 3.
 */

import api from './client';

// --- Driver Readiness ---

export const getDriverReadiness = async (driverId) => {
  const response = await api.get(`/v1/drivers/${driverId}/readiness`);
  return response.data;
};

export const getDriverReadinessHistory = async (driverId, limit = 20) => {
  const response = await api.get(`/v1/drivers/${driverId}/readiness/history?limit=${limit}`);
  return response.data;
};

export const recomputeDriverReadiness = async (driverId) => {
  const response = await api.post(`/v1/drivers/${driverId}/readiness/recompute`);
  return response.data;
};

// --- Load Impact ---

export const getLoadImpact = async (loadId) => {
  const response = await api.get(`/v1/loads/${loadId}/impact`);
  return response.data;
};

export const recomputeLoadImpact = async (loadId) => {
  const response = await api.post(`/v1/loads/${loadId}/impact/recompute`);
  return response.data;
};

// --- Scoring Config ---

export const getActiveScoringConfig = async () => {
  const response = await api.get('/v1/scoring-configs');
  return response.data;
};

// --- Org-wide readiness summary (Phase 4 — for dropdown tier badges) ---

export const getDriverReadinessSummary = async () => {
  const response = await api.get('/v1/drivers/readiness-summary');
  return response.data;
};

// --- Phase 6: bulk recompute ---

export const recomputeAllDriverReadiness = async () => {
  const response = await api.post('/v1/drivers/readiness/recompute-all');
  return response.data;
};

// --- Phase 7: driver incidents ---

export const listDriverIncidents = async (driverId) => {
  const response = await api.get(`/v1/drivers/${driverId}/incidents`);
  return response.data;
};

export const createDriverIncident = async (driverId, data) => {
  const response = await api.post(`/v1/drivers/${driverId}/incidents`, data);
  return response.data;
};

export const updateDriverIncident = async (driverId, incidentId, patch) => {
  const response = await api.patch(`/v1/drivers/${driverId}/incidents/${incidentId}`, patch);
  return response.data;
};

export const deleteDriverIncident = async (driverId, incidentId) => {
  const response = await api.delete(`/v1/drivers/${driverId}/incidents/${incidentId}`);
  return response.data;
};

// --- Dispatch evaluate (Phase 4) ---

export const evaluateAssignment = async (loadId, driverId) => {
  const response = await api.post('/v1/dispatch/evaluate', {
    load_id: loadId,
    driver_id: driverId
  });
  return response.data;
};

// --- Evaluation lifecycle (Phase 5; Phase 7 adds pagination) ---

export const listEvaluations = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.manual_review_status) params.append('manual_review_status', filters.manual_review_status);
  if (filters.decision) params.append('decision', filters.decision);
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.load_id) params.append('load_id', filters.load_id);
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.offset) params.append('offset', String(filters.offset));
  const qs = params.toString();
  const response = await api.get(qs ? `/v1/dispatch/evaluations?${qs}` : '/v1/dispatch/evaluations');
  // Phase 7: backend now returns {items, total, limit, offset, has_more}.
  // Older callers that expected a bare array still get one through legacyArray getter.
  return response.data;
};

export const getEvaluation = async (id) => {
  const response = await api.get(`/v1/dispatch/evaluations/${id}`);
  return response.data;
};

export const approveEvaluation = async (id, note = null) => {
  const response = await api.post(`/v1/dispatch/evaluations/${id}/approve-review`, { note });
  return response.data;
};

export const rejectEvaluation = async (id, note = null) => {
  const response = await api.post(`/v1/dispatch/evaluations/${id}/reject-review`, { note });
  return response.data;
};

export const overrideEvaluation = async (id, reason) => {
  const response = await api.post(`/v1/dispatch/evaluations/${id}/override`, { reason });
  return response.data;
};

// --- Scoring config publish + flag (Phase 5) ---

export const publishScoringConfig = async (payload) => {
  const response = await api.post('/v1/scoring-configs', payload);
  return response.data;
};

export const getScoringConfigHistory = async () => {
  const response = await api.get('/v1/scoring-configs/history');
  return response.data;
};

export const getReadinessFeatureFlag = async () => {
  const response = await api.get('/v1/scoring-configs/feature-flag');
  return response.data;
};

export const updateReadinessFeatureFlag = async (flag) => {
  const response = await api.patch('/v1/scoring-configs/feature-flag', flag);
  return response.data;
};

export default {
  getDriverReadiness,
  getDriverReadinessHistory,
  recomputeDriverReadiness,
  getLoadImpact,
  recomputeLoadImpact,
  getActiveScoringConfig,
  getDriverReadinessSummary,
  recomputeAllDriverReadiness,
  evaluateAssignment,
  listEvaluations,
  getEvaluation,
  approveEvaluation,
  rejectEvaluation,
  overrideEvaluation,
  publishScoringConfig,
  getScoringConfigHistory,
  getReadinessFeatureFlag,
  updateReadinessFeatureFlag,
  listDriverIncidents,
  createDriverIncident,
  updateDriverIncident,
  deleteDriverIncident
};
