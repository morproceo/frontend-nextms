import { MapPin, Calendar, FileText, Edit2 } from 'lucide-react';
import { Button } from '../../../../ui/Button';
import { Spinner } from '../../../../ui/Spinner';

export function ReviewStep({ formData, goToStep, onSubmit, onSaveAsDraft, saving, error }) {
  const formatDate = (dateStr) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (value) => {
    const num = parseFloat(value);
    if (isNaN(num)) return null;
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(num);
  };

  const formatLocation = (city, state) => {
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  };

  // 3-step wizard: 0=Basics (Load#+Route), 1=Details (Schedule+Financials+Broker), 2=Review
  const sections = [
    {
      id: 'basics',
      stepIndex: 0,
      icon: MapPin,
      title: 'Route',
      items: [
        { label: 'Load #', value: formData.reference_number },
        {
          label: 'Pickup',
          value: formData.shipper_name,
          sublabel: formatLocation(formData.shipper_city, formData.shipper_state),
          color: 'success',
        },
        {
          label: 'Delivery',
          value: formData.consignee_name,
          sublabel: formatLocation(formData.consignee_city, formData.consignee_state),
          color: 'error',
        },
      ].filter((i) => i.value),
    },
    {
      id: 'details',
      stepIndex: 1,
      icon: Calendar,
      title: 'Details',
      items: [
        { label: 'Pickup Date', value: formatDate(formData.pickup_date) },
        { label: 'Delivery Date', value: formatDate(formData.delivery_date) },
        { label: 'Rate', value: formatCurrency(formData.revenue), highlight: true },
        { label: 'Miles', value: formData.miles },
        { label: 'Broker', value: formData.broker_name },
        { label: 'Commodity', value: formData.commodity },
      ].filter((i) => i.value),
    },
  ].filter((s) => s.items.length > 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="space-y-4">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.id}
              className="p-4 bg-surface-secondary rounded-xl group"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4 text-accent" />
                  <span className="text-body-sm font-medium text-text-primary">
                    {section.title}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => goToStep(section.stepIndex)}
                  className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-small text-accent hover:underline transition-opacity"
                >
                  <Edit2 className="w-3 h-3" />
                  Edit
                </button>
              </div>
              <div className="space-y-2">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between">
                    <span className="text-small text-text-tertiary">{item.label}</span>
                    <div className="text-right">
                      <span
                        className={`text-body-sm ${
                          item.highlight
                            ? 'font-semibold text-success'
                            : item.color
                            ? `text-${item.color}`
                            : 'text-text-primary'
                        }`}
                      >
                        {item.value}
                      </span>
                      {item.sublabel && (
                        <p className="text-small text-text-tertiary">{item.sublabel}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Notes */}
      {formData.notes && (
        <div className="p-4 bg-surface-secondary rounded-xl">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-accent" />
            <span className="text-body-sm font-medium text-text-primary">Notes</span>
          </div>
          <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
            {formData.notes}
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl">
          <p className="text-body-sm text-error">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="pt-4 space-y-3">
        <Button
          type="button"
          onClick={onSubmit}
          disabled={saving}
          className="w-full py-4 text-body font-medium"
        >
          {saving ? (
            <>
              <Spinner size="sm" className="mr-2" />
              Creating Load...
            </>
          ) : (
            'Create Load'
          )}
        </Button>

        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => goToStep(0)}
            className="text-body-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Start Over
          </button>
          <span className="text-text-tertiary">|</span>
          <button
            type="button"
            onClick={onSaveAsDraft}
            disabled={saving}
            className="text-body-sm text-text-tertiary hover:text-text-secondary transition-colors"
          >
            Save as Draft
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReviewStep;
