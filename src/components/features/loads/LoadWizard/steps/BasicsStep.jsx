import { useState } from 'react';
import { Package, MapPin, Plus } from 'lucide-react';
import { SearchableSelect } from '../../../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../../../customers/QuickAddFacilityModal';

export function BasicsStep({ formData, updateFormData, facilities, onFacilityAdded }) {
  const [facilityModal, setFacilityModal] = useState({ isOpen: false, type: 'shipper' });

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
    <div className="space-y-5">
      {/* Load Number */}
      <div>
        <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary mb-1.5">
          <Package className="w-4 h-4 text-accent" />
          Load #
        </label>
        <input
          type="text"
          name="reference_number"
          value={formData.reference_number}
          onChange={handleChange}
          placeholder="LD-1234"
          className="w-full px-3 py-2.5 bg-surface-secondary border-0 rounded-lg text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Route Section */}
      <div className="pt-2">
        <p className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-accent" />
          Route
        </p>

        <div className="space-y-3">
          {/* Pickup */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-success flex-shrink-0" />
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
                addNewLabel="Add New"
              />
            </div>
          </div>

          {/* Delivery */}
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-error flex-shrink-0" />
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
                addNewLabel="Add New"
              />
            </div>
          </div>
        </div>

        {/* Selected Route Preview */}
        {formData.shipper_name && formData.consignee_name && (
          <div className="mt-3 p-3 bg-surface-secondary rounded-lg">
            <div className="flex items-center gap-2 text-body-sm">
              <span className="text-text-primary font-medium">
                {formData.shipper_city || formData.shipper_name}
              </span>
              <span className="text-text-tertiary">→</span>
              <span className="text-text-primary font-medium">
                {formData.consignee_city || formData.consignee_name}
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
