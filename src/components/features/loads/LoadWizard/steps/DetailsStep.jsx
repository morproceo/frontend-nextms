import { useState } from 'react';
import { Calendar, DollarSign, Building2, RotateCw, MapPin, ChevronDown, ChevronUp } from 'lucide-react';
import { SearchableSelect } from '../../../../ui/SearchableSelect';
import { QuickAddBrokerModal } from '../../../customers/QuickAddBrokerModal';
import { StopsEditor } from '../StopsEditor';

export function DetailsStep({
  formData,
  updateFormData,
  brokers,
  onBrokerAdded,
  onCalculateMiles,
  isCalculatingMiles,
  facilities,
  onFacilityAdded
}) {
  const [showBrokerModal, setShowBrokerModal] = useState(false);
  const [showStops, setShowStops] = useState(formData.stops?.length > 0);

  const handleChange = (e) => {
    const { name, value } = e.target;
    // If user manually edits miles, mark as manual
    if (name === 'miles') {
      updateFormData({ [name]: value, miles_source: 'manual' });
    } else {
      updateFormData({ [name]: value });
    }
  };

  const handleStopsChange = (stops) => {
    updateFormData({ stops });
    // Trigger recalculation when stops change
    if (onCalculateMiles) {
      setTimeout(() => onCalculateMiles(), 100);
    }
  };

  const handleBrokerSelect = (option) => {
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

  const handleBrokerCreated = (newBroker) => {
    // Add to brokers list
    onBrokerAdded?.(newBroker);
    // Select the new broker
    updateFormData({
      broker_id: newBroker.id,
      broker_name: newBroker.name,
      broker_mc: newBroker.mc_number || '',
    });
  };

  // Calculate rate per mile
  const ratePerMile = (() => {
    const revenue = parseFloat(formData.revenue) || 0;
    const miles = parseInt(formData.miles) || 0;
    if (revenue > 0 && miles > 0) {
      return (revenue / miles).toFixed(2);
    }
    return null;
  })();

  return (
    <div className="space-y-5">
      {/* Dates Row */}
      <div>
        <p className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-accent" />
          Schedule
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-small text-text-secondary mb-1">Pickup Date</label>
            <input
              type="date"
              name="pickup_date"
              value={formData.pickup_date}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <label className="block text-small text-text-secondary mb-1">Delivery Date</label>
            <input
              type="date"
              name="delivery_date"
              value={formData.delivery_date}
              onChange={handleChange}
              className="w-full px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      {/* Rate and Miles */}
      <div>
        <p className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-success" />
          Financials
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-small text-text-secondary mb-1">Rate</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary">$</span>
              <input
                type="number"
                name="revenue"
                value={formData.revenue}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                className="w-full pl-7 pr-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>
          <div>
            <label className="block text-small text-text-secondary mb-1">
              Miles
              {formData.miles_source === 'manual' && (
                <span className="ml-2 text-xs text-text-tertiary">(manual)</span>
              )}
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="miles"
                value={formData.miles}
                onChange={handleChange}
                placeholder="0"
                className="flex-1 px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={onCalculateMiles}
                disabled={isCalculatingMiles}
                className="px-3 py-2.5 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                title="Calculate miles from route"
              >
                <RotateCw className={`w-4 h-4 ${isCalculatingMiles ? 'animate-spin' : ''}`} />
                <span className="text-small hidden sm:inline">
                  {isCalculatingMiles ? 'Calculating...' : 'Calculate'}
                </span>
              </button>
            </div>
          </div>
        </div>
        {ratePerMile && (
          <p className="mt-2 text-small text-success font-medium">
            💰 ${ratePerMile}/mile
          </p>
        )}
      </div>

      {/* Intermediate Stops (Optional) */}
      <div className="border border-surface-tertiary rounded-lg overflow-hidden">
        <button
          type="button"
          onClick={() => setShowStops(!showStops)}
          className="w-full flex items-center justify-between px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary transition-colors"
        >
          <span className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
            <MapPin className="w-4 h-4 text-accent" />
            Add Intermediate Stops
            <span className="text-text-tertiary font-normal">(Optional)</span>
            {formData.stops?.length > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-accent/10 text-accent text-xs rounded-full">
                {formData.stops.length}
              </span>
            )}
          </span>
          {showStops ? (
            <ChevronUp className="w-4 h-4 text-text-tertiary" />
          ) : (
            <ChevronDown className="w-4 h-4 text-text-tertiary" />
          )}
        </button>
        {showStops && (
          <div className="p-4 border-t border-surface-tertiary">
            <StopsEditor
              stops={formData.stops || []}
              onChange={handleStopsChange}
              facilities={facilities}
              onFacilityAdded={onFacilityAdded}
            />
          </div>
        )}
      </div>

      {/* Broker (Optional) */}
      <div>
        <p className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-accent" />
          Broker
          <span className="text-text-tertiary font-normal">(Optional)</span>
        </p>
        <SearchableSelect
          value={formData.broker_id}
          onChange={handleBrokerSelect}
          options={brokers.map((b) => ({
            id: b.id,
            label: b.name,
            sublabel: b.mc_number ? `MC# ${b.mc_number}` : null,
          }))}
          placeholder="Select broker..."
          onAddNew={() => setShowBrokerModal(true)}
          addNewLabel="Add New Broker"
        />
      </div>

      {/* Cargo (Optional Collapsible) */}
      <div>
        <p className="text-body-sm font-medium text-text-primary mb-3">
          Cargo
          <span className="text-text-tertiary font-normal ml-2">(Optional)</span>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <input
              type="text"
              name="commodity"
              value={formData.commodity}
              onChange={handleChange}
              placeholder="Commodity"
              className="w-full px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <div>
            <input
              type="number"
              name="weight_lbs"
              value={formData.weight_lbs}
              onChange={handleChange}
              placeholder="Weight (lbs)"
              className="w-full px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      {/* Quick Add Broker Modal */}
      <QuickAddBrokerModal
        isOpen={showBrokerModal}
        onClose={() => setShowBrokerModal(false)}
        onCreated={handleBrokerCreated}
      />
    </div>
  );
}

export default DetailsStep;
