import { CheckCircle, Truck, Plus, Eye, ArrowRight } from 'lucide-react';
import { Button } from '../../../ui/Button';

export function LoadCreatedSuccess({
  load,
  formData,
  onAssignDriver,
  onCreateAnother,
  onViewDetails,
}) {
  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const formatLocation = (name, city, state) => {
    const location = [city, state].filter(Boolean).join(', ');
    if (name && location) return `${name} (${location})`;
    return name || location || 'Unknown';
  };

  const origin = formatLocation(
    formData.shipper_name,
    formData.shipper_city,
    formData.shipper_state
  );
  const destination = formatLocation(
    formData.consignee_name,
    formData.consignee_city,
    formData.consignee_state
  );

  return (
    <div className="max-w-lg mx-auto py-16 px-4 text-center">
      {/* Success Icon */}
      <div className="mb-6">
        <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-success" />
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl font-semibold text-text-primary mb-2">
        Load {formData.reference_number} Created!
      </h1>

      {/* Summary */}
      <div className="mt-6 p-6 bg-surface-secondary rounded-2xl text-left">
        {/* Route */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1">
            <p className="text-small text-text-tertiary">From</p>
            <p className="text-body font-medium text-text-primary">{origin}</p>
          </div>
          <ArrowRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <div className="flex-1 text-right">
            <p className="text-small text-text-tertiary">To</p>
            <p className="text-body font-medium text-text-primary">{destination}</p>
          </div>
        </div>

        {/* Details */}
        <div className="flex items-center justify-between pt-4 border-t border-surface-tertiary">
          <div>
            <p className="text-small text-text-tertiary">Dates</p>
            <p className="text-body-sm text-text-primary">
              {formatDate(formData.pickup_date)} → {formatDate(formData.delivery_date)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-small text-text-tertiary">Rate</p>
            <p className="text-body font-semibold text-success">
              {formatCurrency(formData.revenue)}
            </p>
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="mt-8">
        <p className="text-body-sm text-text-secondary mb-4">What would you like to do next?</p>

        <div className="space-y-3">
          {/* Primary: Assign Driver */}
          <Button
            onClick={onAssignDriver}
            className="w-full py-4 text-body font-medium"
          >
            <Truck className="w-5 h-5 mr-2" />
            Assign a Driver
          </Button>

          {/* Secondary Actions */}
          <div className="grid grid-cols-2 gap-3">
            <Button variant="secondary" onClick={onCreateAnother} className="py-3">
              <Plus className="w-4 h-4 mr-2" />
              Create Another
            </Button>
            <Button variant="ghost" onClick={onViewDetails} className="py-3">
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </div>

      {/* Subtle tip */}
      <p className="mt-8 text-small text-text-tertiary">
        Assign a driver to dispatch this load and notify them automatically.
      </p>
    </div>
  );
}

export default LoadCreatedSuccess;
