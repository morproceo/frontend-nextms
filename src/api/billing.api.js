/**
 * Billing API
 * Handles subscription and billing operations
 */

import api from './client';

/**
 * Get billing overview for the current organization
 */
export const getBillingOverview = async () => {
  const response = await api.get('/v1/billing');
  return response.data;
};

/**
 * Get available subscription plans
 */
export const getPlans = async () => {
  const response = await api.get('/v1/billing/plans');
  return response.data;
};

/**
 * Create a checkout session to subscribe to a plan
 */
export const subscribe = async (plan, billingPeriod) => {
  const response = await api.post('/v1/billing/subscribe', {
    plan,
    billing_period: billingPeriod
  });
  return response.data;
};

/**
 * Create a customer portal session
 */
export const createPortalSession = async () => {
  const response = await api.post('/v1/billing/portal');
  return response.data;
};

/**
 * Get payment methods
 */
export const getPaymentMethods = async () => {
  const response = await api.get('/v1/billing/payment-methods');
  return response.data;
};

/**
 * Add a payment method
 */
export const addPaymentMethod = async (paymentMethodId) => {
  const response = await api.post('/v1/billing/payment-methods', {
    payment_method_id: paymentMethodId
  });
  return response.data;
};

/**
 * Remove a payment method
 */
export const removePaymentMethod = async (paymentMethodId) => {
  const response = await api.delete(`/v1/billing/payment-methods/${paymentMethodId}`);
  return response.data;
};

/**
 * Set default payment method
 */
export const setDefaultPaymentMethod = async (paymentMethodId) => {
  const response = await api.post(`/v1/billing/payment-methods/${paymentMethodId}/default`);
  return response.data;
};

/**
 * Get payment history
 */
export const getPayments = async (limit = 20) => {
  const response = await api.get(`/v1/billing/payments?limit=${limit}`);
  return response.data;
};

/**
 * Cancel subscription
 */
export const cancelSubscription = async () => {
  const response = await api.post('/v1/billing/cancel');
  return response.data;
};

/**
 * Sync payment methods from Stripe
 */
export const syncPaymentMethods = async () => {
  const response = await api.post('/v1/billing/sync-payment-methods');
  return response.data;
};

export default {
  getBillingOverview,
  getPlans,
  subscribe,
  createPortalSession,
  getPaymentMethods,
  addPaymentMethod,
  removePaymentMethod,
  setDefaultPaymentMethod,
  getPayments,
  cancelSubscription,
  syncPaymentMethods
};
