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

// --- Dispatch evaluate (Phase 4) ---

export const evaluateAssignment = async (loadId, driverId) => {
  const response = await api.post('/v1/dispatch/evaluate', {
    load_id: loadId,
    driver_id: driverId
  });
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
  evaluateAssignment
};
