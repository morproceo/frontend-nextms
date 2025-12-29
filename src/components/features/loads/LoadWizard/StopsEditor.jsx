/**
 * StopsEditor - Simplified stops editor for Load creation wizard
 *
 * A lightweight component for adding intermediate stops during load creation.
 * Unlike StopsManager (used on load detail page), this doesn't need a load ID
 * and works with local state only.
 */

import { useState } from 'react';
import { MapPin, Plus, X, Building2 } from 'lucide-react';
import { SearchableSelect } from '../../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../../customers/QuickAddFacilityModal';

export function StopsEditor({ stops = [], onChange, facilities = [], onFacilityAdded }) {
  const [showFacilityModal, setShowFacilityModal] = useState(false);
  const [activeStopIndex, setActiveStopIndex] = useState(null);

  const addStop = () => {
    const newStop = {
      id: `temp-${Date.now()}`, // Temporary ID for local state
      facility_id: '',
      facility_name: '',
      address: '',
      city: '',
      state: '',
      zip: '',
      scheduled_date: '',
      type: 'stop'
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
        <p className="text-small text-text-tertiary text-center py-2">
          No intermediate stops added
        </p>
      ) : (
        <div className="space-y-3">
          {stops.map((stop, index) => (
            <div
              key={stop.id || index}
              className="flex items-start gap-3 p-3 bg-surface-primary border border-surface-tertiary rounded-lg"
            >
              {/* Stop number indicator */}
              <div className="flex-shrink-0 w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-medium">
                {index + 1}
              </div>

              {/* Stop details */}
              <div className="flex-1 space-y-2">
                {/* Facility selector */}
                <SearchableSelect
                  value={stop.facility_id}
                  onChange={(option) => handleFacilitySelect(index, option)}
                  options={facilities.map((f) => ({
                    id: f.id,
                    label: f.company_name,
                    sublabel: f.address ? `${f.address.city}, ${f.address.state}` : null
                  }))}
                  placeholder="Select or search facility..."
                  onAddNew={() => openFacilityModal(index)}
                  addNewLabel="Add New Facility"
                />

                {/* Manual address entry (shown if no facility selected) */}
                {!stop.facility_id && (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={stop.city}
                      onChange={(e) => updateStop(index, { city: e.target.value })}
                      placeholder="City"
                      className="px-3 py-2 bg-surface-secondary border-0 rounded-lg text-small text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                    />
                    <input
                      type="text"
                      value={stop.state}
                      onChange={(e) => updateStop(index, { state: e.target.value })}
                      placeholder="State"
                      maxLength={2}
                      className="px-3 py-2 bg-surface-secondary border-0 rounded-lg text-small text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 uppercase"
                    />
                  </div>
                )}

                {/* Show selected facility info */}
                {stop.facility_id && stop.city && (
                  <p className="text-small text-text-secondary flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {stop.city}, {stop.state}
                  </p>
                )}
              </div>

              {/* Remove button */}
              <button
                type="button"
                onClick={() => removeStop(index)}
                className="flex-shrink-0 p-1.5 text-text-tertiary hover:text-error hover:bg-error/10 rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add stop button */}
      <button
        type="button"
        onClick={addStop}
        className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-surface-tertiary rounded-lg text-small text-text-secondary hover:text-accent hover:border-accent/30 transition-colors"
      >
        <Plus className="w-4 h-4" />
        Add Stop
      </button>

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
