import { useState, useEffect, useMemo, useRef } from 'react';
import { DollarSign, Route, Building2, Check } from 'lucide-react';
import { SearchableSelect } from '../../../../ui/SearchableSelect';

export function FinancialsStep({ formData, updateFormData, onComplete, isValid, brokers }) {
  const [hasInteracted, setHasInteracted] = useState(false);
  const prevValidRef = useRef(isValid);

  // Auto-advance only after user interaction and step becomes valid
  useEffect(() => {
    if (hasInteracted && isValid && !prevValidRef.current) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
    prevValidRef.current = isValid;
  }, [hasInteracted, isValid, onComplete]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setHasInteracted(true);
    updateFormData({ [name]: value });
  };

  const handleBrokerSelect = (option) => {
    setHasInteracted(true);
    if (option) {
      const broker = brokers.find((b) => b.id === option.id);
      if (broker) {
        updateFormData({
          broker_id: broker.id,
          broker_name: broker.name,
          broker_mc: broker.mc_number || '',
        });
      }
    } else {
      updateFormData({
        broker_id: '',
        broker_name: '',
        broker_mc: '',
      });
    }
  };

  // Calculate rate per mile
  const ratePerMile = useMemo(() => {
    const revenue = parseFloat(formData.revenue) || 0;
    const miles = parseInt(formData.miles) || 0;
    if (revenue > 0 && miles > 0) {
      return (revenue / miles).toFixed(2);
    }
    return null;
  }, [formData.revenue, formData.miles]);

  return (
    <div className="space-y-8">
      {/* Revenue - Primary Field */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-body font-medium text-text-primary">
          <DollarSign className="w-4 h-4 text-success" />
          Rate / Revenue
        </label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl text-text-tertiary">
            $
          </span>
          <input
            type="number"
            name="revenue"
            value={formData.revenue}
            onChange={handleChange}
            placeholder="0.00"
            step="0.01"
            className={`
              w-full pl-10 pr-4 py-5 text-2xl font-medium bg-surface-secondary border-0 rounded-xl
              text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-accent/20
              transition-all
            `}
          />
          {isValid && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
                <Check className="w-4 h-4 text-success" />
              </div>
            </div>
          )}
        </div>
        <p className="text-small text-text-tertiary">
          Total revenue for this load
        </p>
      </div>

      {/* Miles and Rate Per Mile */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-body-sm text-text-secondary">
            <Route className="w-4 h-4" />
            Miles
          </label>
          <input
            type="number"
            name="miles"
            value={formData.miles}
            onChange={handleChange}
            placeholder="0"
            className="
              w-full px-4 py-3 bg-surface-secondary border-0 rounded-lg
              text-text-primary placeholder:text-text-tertiary
              focus:outline-none focus:ring-2 focus:ring-accent/20
            "
          />
        </div>

        {ratePerMile && (
          <div className="space-y-2">
            <label className="text-body-sm text-text-secondary">Rate Per Mile</label>
            <div className="px-4 py-3 bg-success/5 border border-success/20 rounded-lg">
              <span className="text-lg font-semibold text-success">${ratePerMile}</span>
              <span className="text-small text-text-tertiary ml-1">/mi</span>
            </div>
          </div>
        )}
      </div>

      {/* Driver Pay (Optional) */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary">
            Driver Pay
            <span className="text-text-tertiary ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
            <input
              type="number"
              name="driver_pay"
              value={formData.driver_pay}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="
                w-full pl-8 pr-4 py-3 bg-surface-secondary border-0 rounded-lg
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent/20
              "
            />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-body-sm text-text-secondary">
            Carrier Cost
            <span className="text-text-tertiary ml-1">(Optional)</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
            <input
              type="number"
              name="carrier_cost"
              value={formData.carrier_cost}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              className="
                w-full pl-8 pr-4 py-3 bg-surface-secondary border-0 rounded-lg
                text-text-primary placeholder:text-text-tertiary
                focus:outline-none focus:ring-2 focus:ring-accent/20
              "
            />
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-surface-tertiary" />

      {/* Broker */}
      <div className="space-y-4">
        <h3 className="text-body font-medium text-text-primary flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          Broker / Customer
          <span className="text-small text-text-tertiary font-normal">(Optional)</span>
        </h3>

        <SearchableSelect
          value={formData.broker_id}
          onChange={handleBrokerSelect}
          options={brokers.map((b) => ({
            id: b.id,
            label: b.name,
            sublabel: b.mc_number ? `MC# ${b.mc_number}` : null,
          }))}
          placeholder="Select broker..."
          addNewLabel="Add New Broker"
        />

        {formData.broker_name && (
          <div className="p-3 bg-surface-secondary rounded-lg">
            <p className="text-body font-medium text-text-primary">
              {formData.broker_name}
            </p>
            {formData.broker_mc && (
              <p className="text-small text-text-secondary">MC# {formData.broker_mc}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FinancialsStep;
