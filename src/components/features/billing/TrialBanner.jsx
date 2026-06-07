import { Link } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Zap, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function TrialBanner({ onSubscribe }) {
  const { organization, currentOrg, orgUrl } = useOrg();
  const [dismissed, setDismissed] = useState(false);

  // Grandfathered orgs = trialing with no Stripe subscription on file.
  // For them the CTA opens the multi-step trial flow (add a card,
  // Stripe holds it through the trial). For orgs already on Stripe
  // trial we fall back to the billing settings link so they can
  // cancel/update without spinning up a second checkout session.
  const org = organization || currentOrg || {};
  const hasStripeSub = !!org.stripe_subscription_id;
  const showTrialCheckoutCta = !hasStripeSub && typeof onSubscribe === 'function';

  const Cta = ({ children, className }) =>
    showTrialCheckoutCta ? (
      <button type="button" onClick={onSubscribe} className={className}>
        {children}
      </button>
    ) : (
      <Link to={orgUrl('/settings/billing')} className={className}>
        {children}
      </Link>
    );

  if (!organization || dismissed) return null;

  // Admin-comped orgs get full access with no Stripe — suppress the
  // trial/subscribe nudge entirely.
  if (organization.feature_flags?.freeAccess === true) return null;

  const subscription = organization.subscription || {};
  const status = subscription.status;

  // Only show for trialing or expired
  if (status !== 'trialing' && status !== 'expired') return null;

  // Calculate days remaining
  let daysRemaining = 0;
  if (subscription.trial_ends_at) {
    const now = new Date();
    const trialEnd = new Date(subscription.trial_ends_at);
    daysRemaining = Math.max(0, Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)));
  }

  const isExpired = status === 'expired' || daysRemaining <= 0;
  const isUrgent = daysRemaining <= 3 && !isExpired;

  if (isExpired) {
    return (
      <div className="bg-error text-white px-4 py-2 flex items-center justify-center gap-3">
        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
        <span className="text-body-sm font-medium">
          Your trial has expired.
        </span>
        <Cta className="text-body-sm font-semibold underline hover:no-underline">
          Subscribe now to continue
        </Cta>
      </div>
    );
  }

  const noCard = !hasStripeSub;

  return (
    <div className="bg-accent text-white px-4 py-2 flex items-center justify-center gap-3 relative">
      <Zap className="w-4 h-4 flex-shrink-0" />
      <span className="text-body-sm">
        {isUrgent ? (
          <span className="font-medium">
            Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial!
          </span>
        ) : noCard ? (
          <>
            <span className="font-medium">{daysRemaining} days left.</span>{' '}
            Add a card to keep access after your trial.
          </>
        ) : (
          <>
            You have <span className="font-medium">{daysRemaining} days</span> left in your free trial.
          </>
        )}
      </span>
      <Cta className="text-body-sm font-semibold underline hover:no-underline">
        {noCard ? 'Add a card' : 'Manage subscription'}
      </Cta>
      {!isUrgent && !noCard && (
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 p-1 hover:bg-white/10 rounded transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

export default TrialBanner;
