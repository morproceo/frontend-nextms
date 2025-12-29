/**
 * BillingPage - Subscription and payment management
 *
 * Note: Uses billingApi directly because:
 * 1. Billing is a specialized domain with Stripe integration
 * 2. No billing hooks exist (would be overkill for single-page usage)
 * 3. All billing operations redirect to Stripe or are one-time fetches
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import * as billingApi from '../../api/billing.api'; // Exception: Specialized billing domain
import { CurrentPlan } from '../../components/features/billing/CurrentPlan';
import { PlanCard } from '../../components/features/billing/PlanCard';
import { PaymentMethodCard } from '../../components/features/billing/PaymentMethodCard';
import { PaymentHistory } from '../../components/features/billing/PaymentHistory';
import { Loader2, CheckCircle, XCircle, CreditCard, ExternalLink } from 'lucide-react';

export function BillingPage() {
  const { organization, refreshOrganization } = useOrg();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [overview, setOverview] = useState(null);
  const [plans, setPlans] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [payments, setPayments] = useState([]);
  const [subscribing, setSubscribing] = useState(false);

  // Check for success/cancel from Stripe redirect
  const checkoutSuccess = searchParams.get('success') === 'true';
  const checkoutCancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    loadBillingData();
  }, []);

  useEffect(() => {
    if (checkoutSuccess) {
      // Refresh org data after successful checkout
      refreshOrganization?.();
    }
  }, [checkoutSuccess]);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const [overviewRes, plansRes, methodsRes, paymentsRes] = await Promise.all([
        billingApi.getBillingOverview(),
        billingApi.getPlans(),
        billingApi.getPaymentMethods(),
        billingApi.getPayments()
      ]);

      // Extract .data from API responses (format: { success: true, data: ... })
      setOverview(overviewRes.data);
      setPlans(plansRes.data);
      setPaymentMethods(methodsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (err) {
      console.error('Failed to load billing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId) => {
    try {
      setSubscribing(true);
      const response = await billingApi.subscribe(planId, billingPeriod);
      const { url } = response.data;

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error('Failed to create checkout session:', err);
      alert('Failed to start checkout. Please try again.');
    } finally {
      setSubscribing(false);
    }
  };

  const handleManageSubscription = async () => {
    try {
      const response = await billingApi.createPortalSession();
      const { url } = response.data;
      window.location.href = url;
    } catch (err) {
      console.error('Failed to open customer portal:', err);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  const subscription = overview?.subscription || {};
  const trial = overview?.trial;
  const isTrialing = subscription.status === 'trialing';
  const isActive = subscription.status === 'active';
  const isExpired = subscription.status === 'expired';

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-title text-text-primary">Billing</h1>
        {(isActive || subscription.status === 'past_due') && (
          <button
            onClick={handleManageSubscription}
            className="flex items-center gap-2 text-body-sm text-accent hover:text-accent/80"
          >
            <ExternalLink className="w-4 h-4" />
            Manage Subscription
          </button>
        )}
      </div>

      {/* Success/Cancel Messages */}
      {checkoutSuccess && (
        <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-success flex-shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-text-primary">
              Payment successful!
            </p>
            <p className="text-body-sm text-text-secondary">
              Your subscription is now active. Thank you for subscribing!
            </p>
          </div>
        </div>
      )}

      {checkoutCancelled && (
        <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-center gap-3">
          <XCircle className="w-5 h-5 text-warning flex-shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-text-primary">
              Checkout cancelled
            </p>
            <p className="text-body-sm text-text-secondary">
              Your checkout session was cancelled. You can try again anytime.
            </p>
          </div>
        </div>
      )}

      {/* Current Plan & Payment Method Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <CurrentPlan
          subscription={subscription}
          trial={trial}
          organization={organization}
        />

        <PaymentMethodCard
          methods={paymentMethods}
          onManage={handleManageSubscription}
          showManageButton={isActive}
        />
      </div>

      {/* Plan Selection (show if trialing or expired) */}
      {(isTrialing || isExpired || !subscription.plan || subscription.plan === 'trial') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-subtitle text-text-primary">Choose a Plan</h2>

            {/* Billing Period Toggle */}
            <div className="flex items-center gap-2 bg-surface-secondary rounded-lg p-1">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-3 py-1.5 text-body-sm rounded-md transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-surface-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('annual')}
                className={`px-3 py-1.5 text-body-sm rounded-md transition-colors ${
                  billingPeriod === 'annual'
                    ? 'bg-surface-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Annual
                <span className="ml-1 text-success text-body-xs">Save 20%</span>
              </button>
            </div>
          </div>

          {/* Plan Cards */}
          {plans && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <PlanCard
                plan={plans.basic}
                planId="basic"
                billingPeriod={billingPeriod}
                onSubscribe={handleSubscribe}
                subscribing={subscribing}
                currentPlan={subscription.plan}
              />
              <PlanCard
                plan={plans.standard}
                planId="standard"
                billingPeriod={billingPeriod}
                onSubscribe={handleSubscribe}
                subscribing={subscribing}
                currentPlan={subscription.plan}
                recommended
              />
              <PlanCard
                plan={plans.advanced}
                planId="advanced"
                billingPeriod={billingPeriod}
                onSubscribe={handleSubscribe}
                subscribing={subscribing}
                currentPlan={subscription.plan}
                isContactUs
              />
            </div>
          )}
        </div>
      )}

      {/* Payment History */}
      {payments.length > 0 && (
        <PaymentHistory payments={payments} />
      )}
    </div>
  );
}

export default BillingPage;
