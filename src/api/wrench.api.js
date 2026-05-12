import api from './client';

const root = '/v1/wrench';

export async function getDashboard() {
  const { data } = await api.get(`${root}/dashboard`);
  return data?.data;
}

export async function listTrucks() {
  const { data } = await api.get(`${root}/trucks`);
  return data?.data;
}

export async function getTruck(id) {
  const { data } = await api.get(`${root}/trucks/${id}`);
  return data?.data;
}

export async function analyzeDiagnostic(id) {
  const { data } = await api.post(`${root}/diagnostics/${id}/analyze`);
  return data?.data;
}

export async function markDiagnosticReviewed(id) {
  const { data } = await api.patch(`${root}/diagnostics/${id}/review`);
  return data?.data;
}

export async function listMaintenance({ truckId, status } = {}) {
  const { data } = await api.get(`${root}/maintenance`, {
    params: { truck_id: truckId, status }
  });
  return data?.data;
}

export async function listMaintenanceForTruck(truckId) {
  const { data } = await api.get(`${root}/trucks/${truckId}/maintenance`);
  return data?.data;
}

export async function getMaintenance(id) {
  const { data } = await api.get(`${root}/maintenance/${id}`);
  return data?.data;
}

export async function createMaintenance(payload) {
  const { data } = await api.post(`${root}/maintenance`, payload);
  return data?.data;
}

export async function updateMaintenance(id, payload) {
  const { data } = await api.patch(`${root}/maintenance/${id}`, payload);
  return data?.data;
}

export async function deleteMaintenance(id) {
  const { data } = await api.delete(`${root}/maintenance/${id}`);
  return data?.data;
}

export async function listConnections() {
  const { data } = await api.get(`${root}/connections`);
  return data?.data;
}

export async function saveConnection(provider, payload) {
  const { data } = await api.post(`${root}/connections/${provider}`, payload);
  return data?.data;
}

export async function testConnection(provider) {
  const { data } = await api.post(`${root}/connections/${provider}/test`);
  return data?.data;
}

export async function syncConnection(provider) {
  const { data } = await api.post(`${root}/connections/${provider}/sync`);
  return data?.data;
}

export default {
  getDashboard, listTrucks, getTruck,
  analyzeDiagnostic, markDiagnosticReviewed,
  listMaintenance, listMaintenanceForTruck, getMaintenance,
  createMaintenance, updateMaintenance, deleteMaintenance,
  listConnections, saveConnection, testConnection, syncConnection
};
