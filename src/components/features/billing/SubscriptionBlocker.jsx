import { Link } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Lock, Zap, ArrowRight } from 'lucide-react';

export function SubscriptionBlocker() {
  const { organization, orgUrl } = useOrg();

  if (!organization) return null;

  const subscription = organization.subscription || {};
  const status = subscription.status;

  // Only show when subscription is expired
  if (status !== 'expired') return null;

  return (
    <div className="fixed inset-0 z-50 bg-surface-primary flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="mx-auto w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-error" />
        </div>

        {/* Title */}
        <h1 className="text-display text-text-primary mb-3">
          Your trial has expired
        </h1>

        {/* Description */}
        <p className="text-body text-text-secondary mb-8 max-w-sm mx-auto">
          Subscribe to a plan to continue using the TMS platform and access all your data.
        </p>

        {/* Features Reminder */}
        <div className="bg-surface-secondary rounded-lg p-4 mb-8 text-left">
          <p className="text-body-sm text-text-secondary mb-3">
            With a subscription, you get:
          </p>
          <ul className="space-y-2">
            {[
              'Full load management',
              'Driver and fleet tracking',
              'Customer management',
              'Document storage',
              'Invoicing & billing'
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-2 text-body-sm text-text-primary">
                <Zap className="w-4 h-4 text-accent flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        {/* CTA Button */}
        <Link
          to={orgUrl('/settings/billing')}
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-button font-medium hover:bg-accent/90 transition-colors"
        >
          View Plans & Subscribe
          <ArrowRight className="w-4 h-4" />
        </Link>

        {/* Contact Support */}
        <p className="text-body-xs text-text-tertiary mt-6">
          Need help?{' '}
          <a href="mailto:support@morpro.com" className="text-accent hover:underline">
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}

export default SubscriptionBlocker;
