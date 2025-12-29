import { Check, Loader2 } from 'lucide-react';

export function PlanCard({
  plan,
  planId,
  billingPeriod,
  onSubscribe,
  subscribing,
  currentPlan,
  recommended,
  isContactUs
}) {
  if (!plan) return null;

  const price = billingPeriod === 'annual' ? plan.annual_price : plan.monthly_price;
  const monthlyEquivalent = billingPeriod === 'annual' ? Math.round(plan.annual_price / 12) : plan.monthly_price;
  const isCurrentPlan = currentPlan === planId;

  const handleClick = () => {
    if (isContactUs) {
      window.location.href = 'mailto:support@morpro.com?subject=Advanced Plan Inquiry';
      return;
    }
    onSubscribe(planId);
  };

  return (
    <div className={`
      relative bg-surface-primary border rounded-lg p-5 flex flex-col
      ${recommended ? 'border-accent ring-1 ring-accent/20' : 'border-surface-tertiary'}
    `}>
      {/* Recommended Badge */}
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-accent text-white text-body-xs font-medium px-3 py-1 rounded-full">
            Recommended
          </span>
        </div>
      )}

      {/* Plan Name */}
      <h3 className="text-subtitle text-text-primary font-semibold mb-2">
        {plan.name}
      </h3>

      {/* Price */}
      <div className="mb-4">
        {isContactUs ? (
          <p className="text-heading text-text-primary font-bold">
            Custom Pricing
          </p>
        ) : (
          <>
            <p className="text-heading text-text-primary font-bold">
              ${monthlyEquivalent}
              <span className="text-body-sm font-normal text-text-secondary">/mo</span>
            </p>
            {billingPeriod === 'annual' && (
              <p className="text-body-xs text-text-secondary">
                ${price} billed annually
              </p>
            )}
          </>
        )}
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-6 flex-grow">
        {plan.features?.map((feature, idx) => (
          <li key={idx} className="flex items-start gap-2 text-body-sm text-text-secondary">
            <Check className="w-4 h-4 text-success flex-shrink-0 mt-0.5" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* CTA Button */}
      <button
        onClick={handleClick}
        disabled={subscribing || isCurrentPlan}
        className={`
          w-full py-2.5 px-4 rounded-lg text-body-sm font-medium transition-colors
          flex items-center justify-center gap-2
          ${isCurrentPlan
            ? 'bg-surface-tertiary text-text-secondary cursor-not-allowed'
            : recommended
              ? 'bg-accent text-white hover:bg-accent/90'
              : 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary'
          }
          ${subscribing ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        {subscribing && <Loader2 className="w-4 h-4 animate-spin" />}
        {isCurrentPlan
          ? 'Current Plan'
          : isContactUs
            ? 'Contact Us'
            : 'Subscribe'
        }
      </button>
    </div>
  );
}

export default PlanCard;
