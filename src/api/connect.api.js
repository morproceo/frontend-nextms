/**
 * MorPro Connect API (Phase 1).
 */

import api from './client';

export const getAvailability = async () => {
  const r = await api.get('/v1/connect/availability');
  return r.data;
};

export const setAvailability = async (patch) => {
  const r = await api.put('/v1/connect/availability', patch);
  return r.data;
};

export const getMyConnections = async () => {
  const r = await api.get('/v1/connect/my-connections');
  return r.data;
};

export const getOrgConnections = async () => {
  const r = await api.get('/v1/connect/org/connections');
  return r.data;
};

export const browseDrivers = async (params = {}) => {
  const r = await api.get('/v1/connect/org/drivers', { params });
  return r.data;
};

export const browseCarriers = async (params = {}) => {
  const r = await api.get('/v1/connect/carriers', { params });
  return r.data;
};

export const requestConnection = async (organizationId, message) => {
  const r = await api.post('/v1/connect/request', {
    organization_id: organizationId,
    message
  });
  return r.data;
};

export const inviteDriver = async (driverUserId, message) => {
  const r = await api.post('/v1/connect/org/invite', {
    driver_user_id: driverUserId,
    message
  });
  return r.data;
};

export const respondConnection = async (id, accept, asOrg = false) => {
  const path = asOrg
    ? `/v1/connect/org/connections/${id}/respond`
    : `/v1/connect/connections/${id}/respond`;
  const r = await api.post(path, { accept });
  return r.data;
};

const connBase = (asOrg) => (asOrg ? '/v1/connect/org/connections' : '/v1/connect/connections');

export const getCarrierProfile = async () => {
  const r = await api.get('/v1/connect/org/profile');
  return r.data;
};

export const updateCarrierProfile = async (patch) => {
  const r = await api.put('/v1/connect/org/profile', patch);
  return r.data;
};

export const getCandidates = async () => {
  const r = await api.get('/v1/connect/org/candidates');
  return r.data;
};

export const getDriverProfile = async (userId) => {
  const r = await api.get(`/v1/connect/org/drivers/${userId}`);
  return r.data;
};

export const saveDriver = async (userId) => {
  const r = await api.post(`/v1/connect/org/drivers/${userId}/save`);
  return r.data;
};

export const unsaveDriver = async (userId) => {
  const r = await api.delete(`/v1/connect/org/drivers/${userId}/save`);
  return r.data;
};

export const getOnboardings = async () => {
  const r = await api.get('/v1/connect/org/onboardings');
  return r.data;
};

export const getConnectionMessages = async (connectionId, asOrg = false) => {
  const r = await api.get(`${connBase(asOrg)}/${connectionId}/messages`);
  return r.data;
};

export const postConnectionMessage = async (connectionId, asOrg, body) => {
  const r = await api.post(`${connBase(asOrg)}/${connectionId}/messages`, { body });
  return r.data;
};

const onbBase = (asOrg) => (asOrg ? '/v1/connect/org/onboarding' : '/v1/connect/onboarding');

export const getOnboarding = async (id, asOrg = false) => {
  const r = await api.get(`${onbBase(asOrg)}/${id}`);
  return r.data;
};

export const requestDocs = async (id, items, note) => {
  const r = await api.post(`/v1/connect/org/onboarding/${id}/request-docs`, { items, note });
  return r.data;
};

export const reviewDoc = async (id, docId, accept, note) => {
  const r = await api.post(`/v1/connect/org/onboarding/${id}/docs/${docId}/review`, { accept, note });
  return r.data;
};

export const advanceOnboarding = async (id, status, note) => {
  const r = await api.post(`/v1/connect/org/onboarding/${id}/advance`, { status, note });
  return r.data;
};

export const uploadOnboardingDoc = async (id, docId, file) => {
  const fd = new FormData();
  fd.append('file', file);
  const r = await api.post(`/v1/connect/onboarding/${id}/docs/${docId}/upload`, fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return r.data;
};

export const getOnboardingDocUrl = async (id, docId, asOrg = false) => {
  const r = await api.get(`${onbBase(asOrg)}/${id}/docs/${docId}/url`);
  return r.data;
};

export default {
  getAvailability,
  setAvailability,
  getMyConnections,
  getOrgConnections,
  browseDrivers,
  browseCarriers,
  requestConnection,
  inviteDriver,
  getCarrierProfile,
  updateCarrierProfile,
  getCandidates,
  getDriverProfile,
  saveDriver,
  unsaveDriver,
  getOnboardings,
  respondConnection,
  getConnectionMessages,
  postConnectionMessage,
  getOnboarding,
  requestDocs,
  reviewDoc,
  advanceOnboarding,
  uploadOnboardingDoc,
  getOnboardingDocUrl
};
