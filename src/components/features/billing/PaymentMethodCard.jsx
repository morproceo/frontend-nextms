import { CreditCard, Plus, ExternalLink } from 'lucide-react';

const CARD_ICONS = {
  visa: '💳',
  mastercard: '💳',
  amex: '💳',
  discover: '💳',
  default: '💳'
};

export function PaymentMethodCard({ methods, onManage, showManageButton }) {
  const defaultMethod = methods?.find(m => m.is_default) || methods?.[0];

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-lg p-5">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-accent" />
          <h3 className="text-subtitle text-text-primary">Payment Method</h3>
        </div>
        {showManageButton && (
          <button
            onClick={onManage}
            className="text-body-sm text-accent hover:text-accent/80 flex items-center gap-1"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Manage
          </button>
        )}
      </div>

      {defaultMethod ? (
        <div className="space-y-3">
          {/* Card Display */}
          <div className="flex items-center gap-3 bg-surface-secondary rounded-lg p-3">
            <div className="w-10 h-7 bg-surface-tertiary rounded flex items-center justify-center text-lg">
              {CARD_ICONS[defaultMethod.card?.brand?.toLowerCase()] || CARD_ICONS.default}
            </div>
            <div>
              <p className="text-body-sm text-text-primary font-medium capitalize">
                {defaultMethod.card?.brand || 'Card'} •••• {defaultMethod.card?.last4}
              </p>
              <p className="text-body-xs text-text-secondary">
                Expires {defaultMethod.card?.exp_month}/{defaultMethod.card?.exp_year}
              </p>
            </div>
            {defaultMethod.is_default && (
              <span className="ml-auto text-body-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
                Default
              </span>
            )}
          </div>

          {/* Additional Methods Count */}
          {methods?.length > 1 && (
            <p className="text-body-xs text-text-secondary">
              +{methods.length - 1} other payment method{methods.length > 2 ? 's' : ''}
            </p>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-3">
            <CreditCard className="w-6 h-6 text-text-tertiary" />
          </div>
          <p className="text-body-sm text-text-secondary mb-3">
            No payment method added
          </p>
          {showManageButton && (
            <button
              onClick={onManage}
              className="inline-flex items-center gap-2 text-body-sm text-accent hover:text-accent/80"
            >
              <Plus className="w-4 h-4" />
              Add Payment Method
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default PaymentMethodCard;
