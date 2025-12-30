import { useState } from 'react';
import { Package, MapPin, Plus, Pencil, ArrowUpFromLine, ArrowDownToLine, ArrowLeftRight } from 'lucide-react';
import { SearchableSelect } from '../../../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../../../customers/QuickAddFacilityModal';

const facilityTypes = [
  { value: 'shipper', label: 'Shipper', icon: ArrowUpFromLine },
  { value: 'receiver', label: 'Receiver', icon: ArrowDownToLine },
  { value: 'both', label: 'Both', icon: ArrowLeftRight }
];

export function BasicsStep({ formData, updateFormData, facilities, onFacilityAdded }) {
  const [facilityModal, setFacilityModal] = useState({ isOpen: false, type: 'shipper' });
  // Default to manual entry mode - user can switch to facility select if needed
  const [manualPickup, setManualPickup] = useState(true);
  const [manualDelivery, setManualDelivery] = useState(true);

  const shipperFacilities = facilities.filter(
    (f) => f.facility_type === 'shipper' || f.facility_type === 'both'
  );
  const consigneeFacilities = facilities.filter(
    (f) => f.facility_type === 'receiver' || f.facility_type === 'both'
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    updateFormData({ [name]: value });
  };

  const handleShipperSelect = (option) => {
    if (option) {
      const facility = facilities.find((f) => f.id === option.id);
      if (facility) {
        updateFormData({
          shipper_facility_id: facility.id,
          shipper_name: facility.company_name || '',
          shipper_city: facility.address?.city || '',
          shipper_state: facility.address?.state || '',
        });
      }
    } else {
      updateFormData({
        shipper_facility_id: '',
        shipper_name: '',
        shipper_city: '',
        shipper_state: '',
      });
    }
  };

  const handleConsigneeSelect = (option) => {
    if (option) {
      const facility = facilities.find((f) => f.id === option.id);
      if (facility) {
        updateFormData({
          consignee_facility_id: facility.id,
          consignee_name: facility.company_name || '',
          consignee_city: facility.address?.city || '',
          consignee_state: facility.address?.state || '',
        });
      }
    } else {
      updateFormData({
        consignee_facility_id: '',
        consignee_name: '',
        consignee_city: '',
        consignee_state: '',
      });
    }
  };

  const handleFacilityCreated = (newFacility) => {
    // Add to facilities list so it appears in dropdown
    onFacilityAdded?.(newFacility);

    // Select it for the appropriate field
    if (facilityModal.type === 'shipper') {
      updateFormData({
        shipper_facility_id: newFacility.id,
        shipper_name: newFacility.company_name || '',
        shipper_city: newFacility.address?.city || '',
        shipper_state: newFacility.address?.state || '',
      });
    } else {
      updateFormData({
        consignee_facility_id: newFacility.id,
        consignee_name: newFacility.company_name || '',
        consignee_city: newFacility.address?.city || '',
        consignee_state: newFacility.address?.state || '',
      });
    }
  };

  const formatLocation = (city, state) => {
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  };

  return (
    <div className="space-y-6">
      {/* Load Number */}
      <div>
        <label className="flex items-center gap-2 text-body font-medium text-text-primary mb-2">
          <Package className="w-4 h-4 text-accent" />
          Load #
        </label>
        <input
          type="text"
          name="reference_number"
          value={formData.reference_number}
          onChange={handleChange}
          placeholder="LD-1234"
          className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Route Section */}
      <div className="pt-2">
        <p className="text-body font-medium text-text-primary mb-4 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          Route
        </p>

        <div className="space-y-5">
          {/* Pickup */}
          <div className="p-4 bg-surface-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-success flex-shrink-0" />
              <span className="text-body-sm font-semibold text-success uppercase tracking-wide">Pickup</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => {
                  if (manualPickup) {
                    // Switching to select mode - keep data
                  } else {
                    // Switching to manual mode - clear facility selection
                    updateFormData({ shipper_facility_id: '' });
                  }
                  setManualPickup(!manualPickup);
                }}
                className="text-body-sm text-text-tertiary hover:text-accent flex items-center gap-1.5 transition-colors"
              >
                {manualPickup ? (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    Select from saved
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Type manually
                  </>
                )}
              </button>
            </div>

            {manualPickup ? (
              // Manual entry mode
              <div className="space-y-3">
                {/* Facility Type Radio */}
                <div className="flex gap-2">
                  {facilityTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = (formData.shipper_facility_type || 'shipper') === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData({ shipper_facility_type: type.value })}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border transition-all text-small
                          ${isSelected
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-surface-tertiary text-text-secondary hover:border-accent/30'
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="shipper_name"
                  value={formData.shipper_name}
                  onChange={handleChange}
                  placeholder="Facility name"
                  className="w-full px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="text"
                  name="shipper_address"
                  value={formData.shipper_address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="shipper_city"
                    value={formData.shipper_city}
                    onChange={handleChange}
                    placeholder="City"
                    className="flex-1 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="text"
                    name="shipper_state"
                    value={formData.shipper_state}
                    onChange={(e) => updateFormData({ shipper_state: e.target.value.toUpperCase() })}
                    placeholder="State"
                    maxLength={2}
                    className="w-20 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 uppercase"
                  />
                  <input
                    type="text"
                    name="shipper_zip"
                    value={formData.shipper_zip}
                    onChange={handleChange}
                    placeholder="ZIP"
                    className="w-24 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            ) : (
              // Facility select mode
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchableSelect
                    value={formData.shipper_facility_id}
                    onChange={handleShipperSelect}
                    options={shipperFacilities.map((f) => ({
                      id: f.id,
                      label: f.company_name,
                      sublabel: formatLocation(f.address?.city, f.address?.state),
                    }))}
                    placeholder="Select pickup location..."
                    onAddNew={() => setFacilityModal({ isOpen: true, type: 'shipper' })}
                    addNewLabel="Add New Shipper"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFacilityModal({ isOpen: true, type: 'shipper' })}
                  className="p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors flex-shrink-0"
                  title="Quick add shipper"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Delivery */}
          <div className="p-4 bg-surface-secondary/50 rounded-xl space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error flex-shrink-0" />
              <span className="text-body-sm font-semibold text-error uppercase tracking-wide">Delivery</span>
              <div className="flex-1" />
              <button
                type="button"
                onClick={() => {
                  if (manualDelivery) {
                    // Switching to select mode - keep data
                  } else {
                    // Switching to manual mode - clear facility selection
                    updateFormData({ consignee_facility_id: '' });
                  }
                  setManualDelivery(!manualDelivery);
                }}
                className="text-body-sm text-text-tertiary hover:text-accent flex items-center gap-1.5 transition-colors"
              >
                {manualDelivery ? (
                  <>
                    <MapPin className="w-3.5 h-3.5" />
                    Select from saved
                  </>
                ) : (
                  <>
                    <Pencil className="w-3.5 h-3.5" />
                    Type manually
                  </>
                )}
              </button>
            </div>

            {manualDelivery ? (
              // Manual entry mode
              <div className="space-y-3">
                {/* Facility Type Radio */}
                <div className="flex gap-2">
                  {facilityTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = (formData.consignee_facility_type || 'receiver') === type.value;
                    return (
                      <button
                        key={type.value}
                        type="button"
                        onClick={() => updateFormData({ consignee_facility_type: type.value })}
                        className={`
                          flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border transition-all text-small
                          ${isSelected
                            ? 'border-accent bg-accent/10 text-accent font-medium'
                            : 'border-surface-tertiary text-text-secondary hover:border-accent/30'
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {type.label}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  name="consignee_name"
                  value={formData.consignee_name}
                  onChange={handleChange}
                  placeholder="Facility name"
                  className="w-full px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <input
                  type="text"
                  name="consignee_address"
                  value={formData.consignee_address}
                  onChange={handleChange}
                  placeholder="Street address"
                  className="w-full px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    name="consignee_city"
                    value={formData.consignee_city}
                    onChange={handleChange}
                    placeholder="City"
                    className="flex-1 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                  <input
                    type="text"
                    name="consignee_state"
                    value={formData.consignee_state}
                    onChange={(e) => updateFormData({ consignee_state: e.target.value.toUpperCase() })}
                    placeholder="State"
                    maxLength={2}
                    className="w-20 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 uppercase"
                  />
                  <input
                    type="text"
                    name="consignee_zip"
                    value={formData.consignee_zip}
                    onChange={handleChange}
                    placeholder="ZIP"
                    className="w-24 px-4 py-3 bg-white border-0 rounded-xl text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            ) : (
              // Facility select mode
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <SearchableSelect
                    value={formData.consignee_facility_id}
                    onChange={handleConsigneeSelect}
                    options={consigneeFacilities.map((f) => ({
                      id: f.id,
                      label: f.company_name,
                      sublabel: formatLocation(f.address?.city, f.address?.state),
                    }))}
                    placeholder="Select delivery location..."
                    onAddNew={() => setFacilityModal({ isOpen: true, type: 'receiver' })}
                    addNewLabel="Add New Receiver"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setFacilityModal({ isOpen: true, type: 'receiver' })}
                  className="p-3 bg-accent/10 text-accent rounded-xl hover:bg-accent/20 transition-colors flex-shrink-0"
                  title="Quick add receiver"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Selected Route Preview */}
        {(formData.shipper_city || formData.shipper_name) && (formData.consignee_city || formData.consignee_name) && (
          <div className="mt-4 p-4 bg-accent/5 border border-accent/10 rounded-xl">
            <div className="flex items-center gap-3 text-body">
              <span className="text-text-primary font-medium">
                {formData.shipper_city && formData.shipper_state
                  ? `${formData.shipper_city}, ${formData.shipper_state}`
                  : formData.shipper_name}
              </span>
              <span className="text-accent font-bold">→</span>
              <span className="text-text-primary font-medium">
                {formData.consignee_city && formData.consignee_state
                  ? `${formData.consignee_city}, ${formData.consignee_state}`
                  : formData.consignee_name}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Quick Add Modal */}
      <QuickAddFacilityModal
        isOpen={facilityModal.isOpen}
        onClose={() => setFacilityModal({ isOpen: false, type: 'shipper' })}
        onCreated={handleFacilityCreated}
        defaultType={facilityModal.type}
      />
    </div>
  );
}

export default BasicsStep;
