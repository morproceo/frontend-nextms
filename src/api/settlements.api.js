/**
 * Settlements API
 * Driver settlement management
 */

import api from './client';

export const getSettlements = async (filters = {}) => {
  const params = new URLSearchParams();
  if (filters.driver_id) params.append('driver_id', filters.driver_id);
  if (filters.status) params.append('status', filters.status);
  if (filters.date_from) params.append('date_from', filters.date_from);
  if (filters.date_to) params.append('date_to', filters.date_to);
  const qs = params.toString();
  const response = await api.get(qs ? `/v1/settlements?${qs}` : '/v1/settlements');
  return response.data;
};

export const getSettlement = async (id) => {
  const response = await api.get(`/v1/settlements/${id}`);
  return response.data;
};

export const createSettlement = async (data) => {
  const response = await api.post('/v1/settlements', data);
  return response.data;
};

export const updateSettlement = async (id, data) => {
  const response = await api.patch(`/v1/settlements/${id}`, data);
  return response.data;
};

export const deleteSettlement = async (id) => {
  const response = await api.delete(`/v1/settlements/${id}`);
  return response.data;
};

// Items
export const addItem = async (settlementId, data) => {
  const response = await api.post(`/v1/settlements/${settlementId}/items`, data);
  return response.data;
};

export const updateItem = async (settlementId, itemId, data) => {
  const response = await api.patch(`/v1/settlements/${settlementId}/items/${itemId}`, data);
  return response.data;
};

export const removeItem = async (settlementId, itemId) => {
  const response = await api.delete(`/v1/settlements/${settlementId}/items/${itemId}`);
  return response.data;
};

// Workflow
export const submitForReview = async (id) => {
  const response = await api.post(`/v1/settlements/${id}/submit`);
  return response.data;
};

export const approveSettlement = async (id) => {
  const response = await api.post(`/v1/settlements/${id}/approve`);
  return response.data;
};

export const paySettlement = async (id, paymentInfo) => {
  const response = await api.post(`/v1/settlements/${id}/pay`, paymentInfo);
  return response.data;
};

export const voidSettlement = async (id) => {
  const response = await api.post(`/v1/settlements/${id}/void`);
  return response.data;
};

// Available loads & expenses
export const getAvailableLoads = async (driverId) => {
  const response = await api.get(`/v1/settlements/driver/${driverId}/available-loads`);
  return response.data;
};

export const getAvailableExpenses = async (driverId) => {
  const response = await api.get(`/v1/settlements/driver/${driverId}/available-expenses`);
  return response.data;
};

export default {
  getSettlements, getSettlement, createSettlement, updateSettlement, deleteSettlement,
  addItem, updateItem, removeItem,
  submitForReview, approveSettlement, paySettlement, voidSettlement,
  getAvailableLoads, getAvailableExpenses
};
