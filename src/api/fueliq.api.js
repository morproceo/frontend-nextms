/**
 * FuelIQ API
 * Fuel intelligence: state prices, surcharge, trip planning
 */

import api from './client';

// ============================================
// DASHBOARD
// ============================================

export const getDashboard = async () => {
  const response = await api.get('/v1/fueliq/dashboard');
  return response.data;
};

// ============================================
// FUEL PRICES
// ============================================

export const getStatePrices = async (fuelType = 'diesel') => {
  const response = await api.get('/v1/fueliq/prices/states', {
    params: { fuel_type: fuelType }
  });
  return response.data;
};

export const getPriceHistory = async (stateCode, weeks = 12) => {
  const response = await api.get(`/v1/fueliq/prices/history/${stateCode}`, {
    params: { weeks }
  });
  return response.data;
};

export const getNationalAvg = async () => {
  const response = await api.get('/v1/fueliq/prices/national');
  return response.data;
};

export const refreshPrices = async () => {
  const response = await api.post('/v1/fueliq/prices/refresh');
  return response.data;
};

// ============================================
// FUEL SURCHARGE
// ============================================

export const calculateSurcharge = async (data) => {
  const response = await api.post('/v1/fueliq/surcharge/calculate', data);
  return response.data;
};

export const getSurchargeConfig = async () => {
  const response = await api.get('/v1/fueliq/surcharge/config');
  return response.data;
};

export const updateSurchargeConfig = async (data) => {
  const response = await api.put('/v1/fueliq/surcharge/config', data);
  return response.data;
};

export const getFscTable = async (params = {}) => {
  const response = await api.get('/v1/fueliq/surcharge/table', { params });
  return response.data;
};

// ============================================
// TRIP PLANNER
// ============================================

export const getTripForLoad = async (loadId, params = {}) => {
  const response = await api.get(`/v1/fueliq/trip/load/${loadId}`, { params });
  return response.data;
};

export const calculateTripCost = async (data) => {
  const response = await api.post('/v1/fueliq/trip/calculate', data);
  return response.data;
};

// ============================================
// TRUCK MPG
// ============================================

export const getTruckMpg = async (truckId) => {
  const response = await api.get(`/v1/fueliq/truck/${truckId}/mpg`);
  return response.data;
};

export const updateTruckMpg = async (truckId, mpgEstimate) => {
  const response = await api.put(`/v1/fueliq/truck/${truckId}/mpg`, {
    mpg_estimate: mpgEstimate
  });
  return response.data;
};

export default {
  getDashboard,
  getStatePrices,
  getPriceHistory,
  getNationalAvg,
  refreshPrices,
  calculateSurcharge,
  getSurchargeConfig,
  updateSurchargeConfig,
  getFscTable,
  getTripForLoad,
  calculateTripCost,
  getTruckMpg,
  updateTruckMpg
};
