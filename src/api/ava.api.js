/**
 * AVA AI Mechanic API
 * Handles fleet health, diagnostics, and AI analysis
 */

import api from './client';

/**
 * Get fleet health overview
 */
export const getFleetHealth = async () => {
  const response = await api.get('/v1/ava/fleet');
  return response.data;
};

/**
 * Get single truck diagnostics
 */
export const getTruckDiagnostics = async (truckId, includeResolved = false) => {
  const response = await api.get(`/v1/ava/trucks/${truckId}`, {
    params: { includeResolved }
  });
  return response.data;
};

/**
 * Get diagnostic history for a truck
 */
export const getDiagnosticHistory = async (truckId, limit = 50) => {
  const response = await api.get(`/v1/ava/trucks/${truckId}/history`, {
    params: { limit }
  });
  return response.data;
};

/**
 * Link truck to Motive vehicle
 */
export const linkTruck = async (truckId, motiveVehicleId) => {
  const response = await api.post(`/v1/ava/trucks/${truckId}/link`, {
    motiveVehicleId
  });
  return response.data;
};

/**
 * Analyze a diagnostic code with AI
 */
export const analyzeCode = async (code, vehicleInfo = {}, diagnosticId = null) => {
  const response = await api.post('/v1/ava/analyze', {
    code,
    vehicleInfo,
    diagnosticId
  });
  return response.data;
};

/**
 * Analyze multiple codes together
 */
export const analyzeMultipleCodes = async (codes, vehicleInfo = {}) => {
  const response = await api.post('/v1/ava/analyze-multiple', {
    codes,
    vehicleInfo
  });
  return response.data;
};

/**
 * Chat with AI Mechanic
 */
export const chat = async (messages, truckId = null) => {
  const response = await api.post('/v1/ava/chat', {
    messages,
    truckId
  });
  return response.data;
};

/**
 * Sync diagnostics from Motive
 */
export const syncDiagnostics = async () => {
  const response = await api.post('/v1/ava/sync');
  return response.data;
};

/**
 * Mark diagnostic as resolved
 */
export const resolveDiagnostic = async (diagnosticId) => {
  const response = await api.post(`/v1/ava/diagnostics/${diagnosticId}/resolve`);
  return response.data;
};

/**
 * Get Motive integration settings
 */
export const getSettings = async () => {
  const response = await api.get('/v1/ava/settings');
  return response.data;
};

/**
 * Save Motive integration settings
 */
export const saveSettings = async (apiKey) => {
  const response = await api.post('/v1/ava/settings', { apiKey });
  return response.data;
};

/**
 * Test Motive connection
 */
export const testConnection = async (apiKey = null) => {
  const response = await api.post('/v1/ava/settings/test', { apiKey });
  return response.data;
};

/**
 * Get Motive vehicles
 */
export const getMotiveVehicles = async () => {
  const response = await api.get('/v1/ava/motive/vehicles');
  return response.data;
};

export default {
  getFleetHealth,
  getTruckDiagnostics,
  getDiagnosticHistory,
  linkTruck,
  analyzeCode,
  analyzeMultipleCodes,
  chat,
  syncDiagnostics,
  resolveDiagnostic,
  getSettings,
  saveSettings,
  testConnection,
  getMotiveVehicles
};
