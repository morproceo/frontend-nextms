/**
 * Spotty Integration API
 *
 * Calls into NextMS's `/v1/integrations/spotty/*` proxy. The Spotty token
 * lives server-side; the frontend never sees it directly.
 */

import api from './client';

export async function getStatus() {
  const res = await api.get('/v1/integrations/spotty/status');
  return res.data;
}

/**
 * Server-to-server SSO link to Spotty. Idempotent — call on Spotty app
 * mount; refreshes the stored Spotty session if it expired.
 */
export async function autoLink() {
  const res = await api.post('/v1/integrations/spotty/auto-link');
  return res.data;
}

export async function connect({ email, password }) {
  const res = await api.post('/v1/integrations/spotty/connect', { email, password });
  return res.data;
}

export async function disconnect() {
  const res = await api.delete('/v1/integrations/spotty/connect');
  return res.data;
}

export async function getMe() {
  const res = await api.get('/v1/integrations/spotty/me');
  return res.data;
}

export async function getBookings() {
  const res = await api.get('/v1/integrations/spotty/bookings');
  return res.data;
}

export async function getHostBookings() {
  const res = await api.get('/v1/integrations/spotty/bookings/host');
  return res.data;
}

export async function getPayments() {
  const res = await api.get('/v1/integrations/spotty/payments');
  return res.data;
}

export async function getTransactions() {
  const res = await api.get('/v1/integrations/spotty/transactions');
  return res.data;
}

export async function getEarnings() {
  const res = await api.get('/v1/integrations/spotty/earnings');
  return res.data;
}

// --- Listings ---

export async function searchListings(params = {}) {
  const res = await api.get('/v1/integrations/spotty/listings/search', { params });
  return res.data;
}

export async function getActiveListings() {
  const res = await api.get('/v1/integrations/spotty/listings/active');
  return res.data;
}

export async function getListing(id) {
  const res = await api.get(`/v1/integrations/spotty/listings/${id}`);
  return res.data;
}

export async function getListingAvailability(id) {
  const res = await api.get(`/v1/integrations/spotty/listings/${id}/availability`);
  return res.data;
}

// --- Bookings ---

export async function createBooking(payload) {
  const res = await api.post('/v1/integrations/spotty/bookings', payload);
  return res.data;
}

export default {
  getStatus,
  autoLink,
  connect,
  disconnect,
  getMe,
  getBookings,
  getHostBookings,
  getPayments,
  getTransactions,
  getEarnings,
  searchListings,
  getActiveListings,
  getListing,
  getListingAvailability,
  createBooking
};
