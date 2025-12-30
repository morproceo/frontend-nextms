/**
 * StopsEditor - Simplified stops editor for Load creation wizard
 *
 * A lightweight component for adding intermediate stops during load creation.
 * Unlike StopsManager (used on load detail page), this doesn't need a load ID
 * and works with local state only.
 *
 * Supports multiple pickups and deliveries - not just intermediate stops.
 */

import { useState } from 'react';
import { MapPin, Plus, X, ArrowUpFromLine, ArrowDownToLine, CircleDot } from 'lucide-react';
import { SearchableSelect } from '../../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../../customers/QuickAddFacilityModal';

const stopTypes = [
  { value: 'pickup', label: 'Pickup', icon: ArrowUpFromLine, color: 'success' },
  { value: 'delivery', label: 'Delivery', icon: ArrowDownToLine, color: 'error' },
  { value: 'stop', label: 'Stop', icon: CircleDot, color: 'accent' }
];

const getStopStyle = (type) => {
  switch (type) {
    case 'pickup':
      return { bg: 'bg-success/10', text: 'text-success', border: 'border-success/20', dot: 'bg-success' };
    case 'delivery':
      return { bg: 'bg-error/10', text: 'text-error', border: 'border-error/20', dot: 'bg-error' };
    default:
      return { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20', dot: 'bg-accent' };
  }
};

export function StopsEditor({ stops = [], onChange, facilities = [], onFacilityAdded }) {
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(null);

  const addStop = (type = 'stop') => {
    const newStop = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      facility_id: '',
      facility_name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      scheduled_date: '',
      type: type
    };
    onChange([...stops, newStop]);
  };

  const removeStop = (index) => {
    const newStops = stops.filter((_, i) => i !== index);
    onChange(newStops);
  };

  const updateStop = (index, updates) => {
    const newStops = stops.map((stop, i) =>
      i === index ? { ...stop, ...updates } : stop
    );
    onChange(newStops);
  };

  const handleFacilitySelect = (index, option) => {
    if (option) {
      const facility = facilities.find(f => f.id === option.id);
      if (facility) {
        updateStop(index, {
          facility_id: facility.id,
          facility_name: facility.company_name || '',
          address: facility.address?.line1 || '',
          city: facility.address?.city || '',
          state: facility.address?.state || '',
          zip: facility.address?.zip || ''
        });
      }
    } else {
      updateStop(index, {
        facility_id: '',
        facility_name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      });
    }
  };

  const handleFacilityCreated = (newFacility) => {
    onFacilityAdded?.(newFacility);
    if (activeStopIndex !== null) {
      updateStop(activeStopIndex, {
        facility_id: newFacility.id,
        facility_name: newFacility.company_name || '',
        address: newFacility.address?.line1 || '',
        city: newFacility.address?.city || '',
        state: newFacility.address?.state || '',
        zip: newFacility.address?.zip || ''
      });
    }
    setActiveStopIndex(null);
  };

  const openFacilityModal = (index) => {
    setActiveStopIndex(index);
    setShowFacilityModal(true);
  };

  return (
    <div className="space-y-3">
      {stops.length === 0 ? (
        <p className="text-small text-text-tertiary text-center py-4">
          No additional stops added. Add pickups, deliveries, or intermediate stops below.
        </p>
      ) : (
        <div className="space-y-3">
          {stops.map((stop, index) => {
            const style = getStopStyle(stop.type);
            const typeConfig = stopTypes.find(t => t.value === stop.type) || stopTypes[2];
            const TypeIcon = typeConfig.icon;

            return (
              <div
                key={stop.id || index}
                className={`p-4 rounded-xl border ${style.border} ${style.bg}`}
              >
                {/* Stop header with type selector */}
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-3 h-3 rounded-full ${style.dot} flex-shrink-0`} />

                  {/* Type selector buttons */}
                  <div className="flex gap-1 flex-1">
                    {stopTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = stop.type === type.value;
                      const typeStyle = getStopStyle(type.value);
                      return (
                        <button
                          key={type.value}
                          type="button"
                          onClick={() => updateStop(index, { type: type.value })}
                          className={`
                            flex items-center gap-1 px-2.5 py-1 rounded-lg text-small font-medium transition-all
                            ${isSelected
                              ? `${typeStyle.bg} ${typeStyle.text} border ${typeStyle.border}`
                              : 'text-text-tertiary hover:text-text-secondary hover:bg-surface-secondary'
                            }
                          `}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {type.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeStop(index)}
                    className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Stop details */}
                <div className="space-y-3">
                  {/* Facility selector */}
                  <SearchableSelect
                    value={stop.facility_id}
                    onChange={(option) => handleFacilitySelect(index, option)}
                    options={facilities.map((f) => ({
                      id: f.id,
                      label: f.company_name,
                      sublabel: f.address ? `${f.address.city}, ${f.address.state}` : null
                    }))}
                    placeholder="Select facility or type below..."
                    onAddNew={() => openFacilityModal(index)}
                    addNewLabel="Add New Facility"
                  />

                  {/* Manual address entry (shown if no facility selected) */}
                  {!stop.facility_id && (
                    <>
                      <input
                        type="text"
                        value={stop.facility_name || ''}
                        onChange={(e) => updateStop(index, { facility_name: e.target.value })}
                        placeholder="Facility name"
                        className="w-full px-4 py-2.5 bg-white border-0 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                      <input
                        type="text"
                        value={stop.address || ''}
                        onChange={(e) => updateStop(index, { address: e.target.value })}
                        placeholder="Street address"
                        className="w-full px-4 py-2.5 bg-white border-0 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                      />
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={stop.city || ''}
                          onChange={(e) => updateStop(index, { city: e.target.value })}
                          placeholder="City"
                          className="flex-1 px-4 py-2.5 bg-white border-0 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <input
                          type="text"
                          value={stop.state || ''}
                          onChange={(e) => updateStop(index, { state: e.target.value.toUpperCase() })}
                          placeholder="State"
                          maxLength={2}
                          className="w-20 px-4 py-2.5 bg-white border-0 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 uppercase"
                        />
                        <input
                          type="text"
                          value={stop.zip || ''}
                          onChange={(e) => updateStop(index, { zip: e.target.value })}
                          placeholder="ZIP"
                          className="w-24 px-4 py-2.5 bg-white border-0 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                      </div>
                    </>
                  )}

                  {/* Show selected facility info */}
                  {stop.facility_id && stop.city && (
                    <p className="text-body-sm text-text-secondary flex items-center gap-1.5">
                      <MapPin className="w-4 h-4" />
                      {stop.facility_name && <span className="font-medium">{stop.facility_name} -</span>}
                      {stop.city}, {stop.state}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add stop buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addStop('pickup')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-success/30 rounded-xl text-small text-success hover:bg-success/5 hover:border-success/50 transition-colors"
        >
          <ArrowUpFromLine className="w-4 h-4" />
          Add Pickup
        </button>
        <button
          type="button"
          onClick={() => addStop('delivery')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-error/30 rounded-xl text-small text-error hover:bg-error/5 hover:border-error/50 transition-colors"
        >
          <ArrowDownToLine className="w-4 h-4" />
          Add Delivery
        </button>
        <button
          type="button"
          onClick={() => addStop('stop')}
          className="flex-1 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-accent/30 rounded-xl text-small text-accent hover:bg-accent/5 hover:border-accent/50 transition-colors"
        >
          <CircleDot className="w-4 h-4" />
          Add Stop
        </button>
      </div>

      {/* Quick Add Facility Modal */}
      <QuickAddFacilityModal
        isOpen={showFacilityModal}
        onClose={() => {
          setShowFacilityModal(false);
          setActiveStopIndex(null);
        }}
        onCreated={handleFacilityCreated}
      />
    </div>
  );
}

export default StopsEditor;
