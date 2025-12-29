import { useState, useEffect, useRef } from 'react';
import { MapPin, ArrowDown, Plus } from 'lucide-react';
import { SearchableSelect } from '../../../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../../../customers/QuickAddFacilityModal';

export function RouteStep({ formData, updateFormData, onComplete, isValid, facilities }) {
  const [facilityModal, setFacilityModal] = useState({ isOpen: false, type: 'shipper' });
  const [hasInteracted, setHasInteracted] = useState(false);
  const prevValidRef = useRef(isValid);

  // Filter facilities by type
  const shipperFacilities = facilities.filter(
    (f) => f.facility_type === 'shipper' || f.facility_type === 'both'
  );
  const consigneeFacilities = facilities.filter(
    (f) => f.facility_type === 'receiver' || f.facility_type === 'both'
  );

  // Auto-advance only after user interaction and step becomes valid
  useEffect(() => {
    // Only auto-advance if validity changed from false to true after interaction
    if (hasInteracted && isValid && !prevValidRef.current) {
      const timer = setTimeout(onComplete, 500);
      return () => clearTimeout(timer);
    }
    prevValidRef.current = isValid;
  }, [hasInteracted, isValid, onComplete]);

  const handleShipperSelect = (option) => {
    setHasInteracted(true);
    if (option) {
      const facility = facilities.find((f) => f.id === option.id);
      if (facility) {
        updateFormData({
          shipper_facility_id: facility.id,
          shipper_name: facility.company_name || '',
          shipper_address: facility.address?.line1 || '',
          shipper_city: facility.address?.city || '',
          shipper_state: facility.address?.state || '',
          shipper_zip: facility.address?.zip || '',
        });
      }
    } else {
      updateFormData({
        shipper_facility_id: '',
        shipper_name: '',
        shipper_address: '',
        shipper_city: '',
        shipper_state: '',
        shipper_zip: '',
      });
    }
  };

  const handleConsigneeSelect = (option) => {
    setHasInteracted(true);
    if (option) {
      const facility = facilities.find((f) => f.id === option.id);
      if (facility) {
        updateFormData({
          consignee_facility_id: facility.id,
          consignee_name: facility.company_name || '',
          consignee_address: facility.address?.line1 || '',
          consignee_city: facility.address?.city || '',
          consignee_state: facility.address?.state || '',
          consignee_zip: facility.address?.zip || '',
        });
      }
    } else {
      updateFormData({
        consignee_facility_id: '',
        consignee_name: '',
        consignee_address: '',
        consignee_city: '',
        consignee_state: '',
        consignee_zip: '',
      });
    }
  };

  const handleFacilityCreated = (newFacility) => {
    if (facilityModal.type === 'shipper') {
      updateFormData({
        shipper_facility_id: newFacility.id,
        shipper_name: newFacility.company_name || '',
        shipper_address: newFacility.address?.line1 || '',
        shipper_city: newFacility.address?.city || '',
        shipper_state: newFacility.address?.state || '',
        shipper_zip: newFacility.address?.zip || '',
      });
    } else {
      updateFormData({
        consignee_facility_id: newFacility.id,
        consignee_name: newFacility.company_name || '',
        consignee_address: newFacility.address?.line1 || '',
        consignee_city: newFacility.address?.city || '',
        consignee_state: newFacility.address?.state || '',
        consignee_zip: newFacility.address?.zip || '',
      });
    }
  };

  const formatLocation = (city, state) => {
    if (city && state) return `${city}, ${state}`;
    return city || state || '';
  };

  return (
    <div className="space-y-6">
      {/* Visual Route Display */}
      <div className="relative py-4">
        {/* Pickup */}
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-success" />
              </div>
              <div className="w-0.5 h-16 bg-surface-tertiary mt-2" />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-small font-medium text-success uppercase tracking-wide mb-2">
                Pickup
              </p>
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
              {formData.shipper_name && (
                <div className="mt-3 p-3 bg-surface-secondary rounded-lg">
                  <p className="text-body font-medium text-text-primary">
                    {formData.shipper_name}
                  </p>
                  {formData.shipper_address && (
                    <p className="text-small text-text-secondary mt-1">
                      {formData.shipper_address}
                    </p>
                  )}
                  <p className="text-small text-text-tertiary">
                    {formatLocation(formData.shipper_city, formData.shipper_state)}
                    {formData.shipper_zip && ` ${formData.shipper_zip}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Delivery */}
        <div className="relative z-10">
          <div className="flex items-start gap-4">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center">
                <MapPin className="w-5 h-5 text-error" />
              </div>
            </div>
            <div className="flex-1 pt-1">
              <p className="text-small font-medium text-error uppercase tracking-wide mb-2">
                Delivery
              </p>
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
              {formData.consignee_name && (
                <div className="mt-3 p-3 bg-surface-secondary rounded-lg">
                  <p className="text-body font-medium text-text-primary">
                    {formData.consignee_name}
                  </p>
                  {formData.consignee_address && (
                    <p className="text-small text-text-secondary mt-1">
                      {formData.consignee_address}
                    </p>
                  )}
                  <p className="text-small text-text-tertiary">
                    {formatLocation(formData.consignee_city, formData.consignee_state)}
                    {formData.consignee_zip && ` ${formData.consignee_zip}`}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Helpful tip */}
      {!formData.shipper_facility_id && !formData.consignee_facility_id && (
        <div className="p-4 bg-accent/5 border border-accent/10 rounded-xl">
          <p className="text-body-sm text-text-secondary">
            <span className="font-medium text-accent">Tip:</span> Select from saved locations or add new ones.
            They'll be saved for future loads.
          </p>
        </div>
      )}

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

export default RouteStep;
