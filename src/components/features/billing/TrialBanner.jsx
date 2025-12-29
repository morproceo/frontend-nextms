import { Link } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Zap, AlertTriangle, X } from 'lucide-react';
import { useState } from 'react';

export function TrialBanner() {
  const { organization, orgUrl } = useOrg();
  const [dismissed, setDismissed] = useState(false);

  if (!organization || dismissed) return null;

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
        <Link
          to={orgUrl('/settings/billing')}
          className="text-body-sm font-semibold underline hover:no-underline"
        >
          Subscribe now to continue
        </Link>
      </div>
    );
  }

  return (
    <div className={`
      ${isUrgent ? 'bg-warning' : 'bg-accent'}
      text-white px-4 py-2 flex items-center justify-center gap-3 relative
    `}>
      <Zap className="w-4 h-4 flex-shrink-0" />
      <span className="text-body-sm">
        {isUrgent ? (
          <span className="font-medium">
            Only {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} left in your trial!
          </span>
        ) : (
          <>
            You have <span className="font-medium">{daysRemaining} days</span> left in your free trial.
          </>
        )}
      </span>
      <Link
        to={orgUrl('/settings/billing')}
        className="text-body-sm font-semibold underline hover:no-underline"
      >
        Subscribe now
      </Link>
      {!isUrgent && (
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
