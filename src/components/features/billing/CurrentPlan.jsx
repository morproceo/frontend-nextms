import { Crown, Clock, AlertTriangle, CheckCircle } from 'lucide-react';

const STATUS_LABELS = {
  trialing: 'Trial',
  active: 'Active',
  past_due: 'Past Due',
  cancelled: 'Cancelled',
  expired: 'Expired'
};

const STATUS_COLORS = {
  trialing: 'text-accent bg-accent/10',
  active: 'text-success bg-success/10',
  past_due: 'text-warning bg-warning/10',
  cancelled: 'text-text-secondary bg-surface-tertiary',
  expired: 'text-error bg-error/10'
};

const PLAN_LABELS = {
  trial: 'Free Trial',
  basic: 'Basic',
  standard: 'Standard',
  advanced: 'Advanced'
};

export function CurrentPlan({ subscription, trial, organization }) {
  const status = subscription?.status || 'trialing';
  const plan = subscription?.plan || 'trial';

  const formatDate = (date) => {
    if (!date) return null;
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-accent" />
          <h3 className="text-subtitle text-text-primary">Current Plan</h3>
        </div>
        <span className={`px-2 py-1 text-body-xs font-medium rounded-full ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <div className="space-y-4">
        {/* Plan Name */}
        <div>
          <p className="text-heading text-text-primary font-semibold">
            {PLAN_LABELS[plan] || plan}
          </p>
          {subscription?.billing_period && plan !== 'trial' && (
            <p className="text-body-sm text-text-secondary">
              Billed {subscription.billing_period}
            </p>
          )}
        </div>

        {/* Trial Info */}
        {status === 'trialing' && trial && (
          <div className={`flex items-center gap-2 text-body-sm ${
            trial.days_remaining <= 3 ? 'text-warning' : 'text-text-secondary'
          }`}>
            <Clock className="w-4 h-4" />
            <span>
              {trial.days_remaining} day{trial.days_remaining !== 1 ? 's' : ''} left in trial
            </span>
          </div>
        )}

        {/* Expired Warning */}
        {status === 'expired' && (
          <div className="flex items-center gap-2 text-body-sm text-error">
            <AlertTriangle className="w-4 h-4" />
            <span>Trial expired - Subscribe to continue</span>
          </div>
        )}

        {/* Past Due Warning */}
        {status === 'past_due' && (
          <div className="flex items-center gap-2 text-body-sm text-warning">
            <AlertTriangle className="w-4 h-4" />
            <span>Payment failed - Please update payment method</span>
          </div>
        )}

        {/* Usage Stats */}
        <div className="pt-3 border-t border-surface-tertiary space-y-2">
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-text-secondary">Users</span>
            <span className="text-text-primary">
              {subscription?.max_users === -1 ? 'Unlimited' : `Up to ${subscription?.max_users || 1}`}
            </span>
          </div>
          <div className="flex items-center justify-between text-body-sm">
            <span className="text-text-secondary">Trucks</span>
            <span className="text-text-primary">
              {subscription?.max_trucks === -1 ? 'Unlimited' : `Up to ${subscription?.max_trucks || 15}`}
            </span>
          </div>
        </div>

        {/* Renewal Info */}
        {status === 'active' && subscription?.subscription_ends_at && (
          <div className="flex items-center gap-2 text-body-sm text-text-secondary pt-2">
            <CheckCircle className="w-4 h-4 text-success" />
            <span>Renews on {formatDate(subscription.subscription_ends_at)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CurrentPlan;
