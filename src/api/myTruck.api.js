/**
 * My Truck API — driver-facing AI Mechanic.
 */

import api from './client';

export const getMyTruck = async () => {
  const r = await api.get('/v1/driver-portal/my-truck');
  return r.data;
};

export const analyzeCode = async (code) => {
  const r = await api.post('/v1/driver-portal/my-truck/analyze', { code });
  return r.data;
};

export const askMyTruck = async (messages) => {
  const r = await api.post('/v1/driver-portal/my-truck/chat', { messages });
  return r.data;
};

export const getMotiveStatus = async () => {
  const r = await api.get('/v1/driver-portal/my-truck/motive');
  return r.data;
};

export const connectMotive = async (apiKey) => {
  const r = await api.post('/v1/driver-portal/my-truck/motive', { api_key: apiKey });
  return r.data;
};

export const listMotiveVehicles = async () => {
  const r = await api.get('/v1/driver-portal/my-truck/motive/vehicles');
  return r.data;
};

export const selectMotiveVehicle = async (vehicleId) => {
  const r = await api.post('/v1/driver-portal/my-truck/motive/select', {
    vehicle_id: vehicleId
  });
  return r.data;
};

export default {
  getMyTruck,
  analyzeCode,
  askMyTruck,
  getMotiveStatus,
  connectMotive,
  listMotiveVehicles,
  selectMotiveVehicle
};
