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
 * Paywall source of truth — single endpoint the SubscriptionGate polls.
 * Flips trialing → expired on read the moment the timer hits, so the
 * paywall appears the second after the trial ends without waiting for
 * any background job.
 */
export const getAccessState = async () => {
  const response = await api.get('/v1/billing/access-state');
  return response.data?.data ?? response.data;
};

/**
 * Plans + add-ons for the paywall multi-step UI.
 */
export const getPaywallCatalog = async () => {
  const response = await api.get('/v1/billing/catalog');
  return response.data?.data ?? response.data;
};

/**
 * Multi-line-item checkout — base plan + optional agent add-ons in a
 * single Stripe subscription.
 *
 *   mode='paid'    → charge immediately, no trial
 *   mode='trial'   → subscription is created with status='trialing'.
 *                    Stripe holds the card and auto-charges after the
 *                    trial ends. Backend picks the right trial anchor:
 *                    fresh 14d for new orgs, preserved trial_ends_at
 *                    for orgs already mid-trial.
 *   trial_period_days → explicit override (e.g. 14 for fresh signups
 *                       even when mode='paid' is omitted).
 *
 * Returns { url, session_id, skipped_addons, trial_mode }.
 */
export const createCheckoutWithAddons = async ({
  plan,
  billing_period,
  addon_slugs = [],
  mode = 'paid',
  trial_period_days
}) => {
  const response = await api.post('/v1/billing/checkout-with-addons', {
    plan,
    billing_period,
    addon_slugs,
    mode,
    ...(trial_period_days != null ? { trial_period_days } : {})
  });
  return response.data?.data ?? response.data;
};

/**
 * Get available subscription plans
 */
export const getPlans = async () => {
  const response = await api.get('/v1/billing/plans');
  return response.data;
};

/**
 * Reconcile a recent paid TMS checkout against Stripe. Flips the org
 * to 'active' even if the Stripe webhook never landed (local dev
 * without `stripe listen`, or transient delivery failure in prod).
 * Idempotent — safe to call repeatedly.
 */
export const verifyCheckout = async () => {
  const response = await api.post('/v1/billing/checkout/verify', {});
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
  getAccessState,
  getPaywallCatalog,
  createCheckoutWithAddons,
  verifyCheckout,
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
