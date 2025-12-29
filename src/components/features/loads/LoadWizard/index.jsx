/**
 * LoadWizard - Refactored to use hooks architecture
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { useOrg } from '../../../../contexts/OrgContext';
import {
  useLoadDetail,
  useLoadMutations,
  useBrokersList,
  useBrokerMutations,
  useFacilitiesList,
  useFacilityMutations
} from '../../../../hooks';
import * as mapApi from '../../../../api/map.api';
import * as uploadsApi from '../../../../api/uploads.api';
import { WizardProgress } from './WizardProgress';
import { RateConUpload } from './RateConUpload';
import { BasicsStep } from './steps/BasicsStep';
import { DetailsStep } from './steps/DetailsStep';
import { ReviewStep } from './steps/ReviewStep';
import { LoadCreatedSuccess } from './LoadCreatedSuccess';

const STEPS = [
  { id: 'basics', label: 'Basics', title: 'Create a Load' },
  { id: 'details', label: 'Details', title: 'Add Details' },
  { id: 'review', label: 'Review', title: 'Review & Create' },
];

const generateLoadNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  return `LD-${timestamp.slice(-4)}`;
};

export function LoadWizard({ loadId = null, isModal = false, onClose = null, onSuccess = null, initialMode = null }) {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEdit = Boolean(loadId);

  // Hooks for data and mutations
  const loadDetail = useLoadDetail(loadId);
  const loadMutations = useLoadMutations();
  const { brokers, fetchBrokers, setBrokers } = useBrokersList();
  const brokerMutations = useBrokerMutations();
  const { facilities, fetchFacilities, setFacilities } = useFacilitiesList();
  const facilityMutations = useFacilityMutations();

  const [currentStep, setCurrentStep] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [createdLoad, setCreatedLoad] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showRateConUpload, setShowRateConUpload] = useState(initialMode === 'ai');
  const [isCalculatingMiles, setIsCalculatingMiles] = useState(false);
  const [rateConFile, setRateConFile] = useState(null); // Store rate con file for upload after load creation
  const lastCalculatedLocations = useRef(null);

  // Form data consolidated
  const [formData, setFormData] = useState({
    // Basics
    reference_number: generateLoadNumber(),
    customer_load_number: '',
    status: 'new',
    // Route
    shipper_facility_id: '',
    shipper_name: '',
    shipper_address: '',
    shipper_city: '',
    shipper_state: '',
    shipper_zip: '',
    consignee_facility_id: '',
    consignee_name: '',
    consignee_address: '',
    consignee_city: '',
    consignee_state: '',
    consignee_zip: '',
    // Details
    pickup_date: '',
    delivery_date: '',
    commodity: '',
    weight_lbs: '',
    revenue: '',
    miles: '',
    broker_id: '',
    broker_name: '',
    broker_mc: '',
    notes: '',
    // Stops and miles tracking
    stops: [],
    miles_source: 'calculated', // 'calculated' or 'manual'
  });

  // Load reference data on mount
  useEffect(() => {
    fetchBrokers({ is_active: true });
    fetchFacilities({ is_active: true });
  }, []);

  // Load existing load data if editing
  useEffect(() => {
    if (isEdit && loadId) {
      loadDetail.fetchLoad().then(() => {
        const load = loadDetail.load;
        if (load) {
          setFormData({
            reference_number: load.reference_number || '',
            customer_load_number: load.customer_load_number || '',
            status: load.status || 'new',
            shipper_facility_id: load.shipper_facility_id || '',
            shipper_name: load.shipper?.name || '',
            shipper_address: load.shipper?.address || '',
            shipper_city: load.shipper?.city || '',
            shipper_state: load.shipper?.state || '',
            shipper_zip: load.shipper?.zip || '',
            consignee_facility_id: load.consignee_facility_id || '',
            consignee_name: load.consignee?.name || '',
            consignee_address: load.consignee?.address || '',
            consignee_city: load.consignee?.city || '',
            consignee_state: load.consignee?.state || '',
            consignee_zip: load.consignee?.zip || '',
            pickup_date: load.schedule?.pickup_date || '',
            delivery_date: load.schedule?.delivery_date || '',
            commodity: load.cargo?.commodity || '',
            weight_lbs: load.cargo?.weight_lbs || '',
            revenue: load.financials?.revenue || '',
            miles: load.financials?.miles || '',
            broker_id: load.broker_id || '',
            broker_name: load.broker?.name || '',
            broker_mc: load.broker?.mc || '',
            notes: load.notes || '',
          });
        }
      }).catch(err => {
        console.error('Failed to fetch load:', err);
        navigate(orgUrl('/loads'));
      });
    }
  }, [loadId, isEdit, navigate, orgUrl]);

  const updateFormData = useCallback((updates) => {
    setFormData((prev) => ({ ...prev, ...updates }));
  }, []);

  // Calculate miles from origin/destination/stops
  const calculateMiles = useCallback(async () => {
    // Get origin address
    const origin = formData.shipper_facility_id
      ? facilities.find(f => f.id === formData.shipper_facility_id)?.address || {}
      : { city: formData.shipper_city, state: formData.shipper_state, address: formData.shipper_address, zip: formData.shipper_zip };

    // Get destination address
    const destination = formData.consignee_facility_id
      ? facilities.find(f => f.id === formData.consignee_facility_id)?.address || {}
      : { city: formData.consignee_city, state: formData.consignee_state, address: formData.consignee_address, zip: formData.consignee_zip };

    // Check if we have valid origin and destination
    if (!origin.city || !origin.state || !destination.city || !destination.state) {
      return;
    }

    // Check if locations have changed since last calculation
    const locationKey = JSON.stringify({ origin, destination, stops: formData.stops });
    if (locationKey === lastCalculatedLocations.current) {
      return;
    }

    setIsCalculatingMiles(true);
    try {
      const result = await mapApi.calculateMiles(origin, destination, formData.stops || []);
      if (result.success) {
        setFormData(prev => ({
          ...prev,
          miles: result.distanceMiles.toString(),
          miles_source: 'calculated'
        }));
        lastCalculatedLocations.current = locationKey;
      }
    } catch (err) {
      console.error('Failed to calculate miles:', err);
    } finally {
      setIsCalculatingMiles(false);
    }
  }, [formData.shipper_facility_id, formData.shipper_city, formData.shipper_state, formData.shipper_address, formData.shipper_zip,
      formData.consignee_facility_id, formData.consignee_city, formData.consignee_state, formData.consignee_address, formData.consignee_zip,
      formData.stops, facilities]);

  // Auto-calculate miles when origin/destination changes (only if not manually set)
  useEffect(() => {
    if (formData.miles_source !== 'manual') {
      const hasOrigin = formData.shipper_facility_id || (formData.shipper_city && formData.shipper_state);
      const hasDestination = formData.consignee_facility_id || (formData.consignee_city && formData.consignee_state);

      if (hasOrigin && hasDestination) {
        // Debounce the calculation
        const timer = setTimeout(() => {
          calculateMiles();
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [formData.shipper_facility_id, formData.shipper_city, formData.shipper_state,
      formData.consignee_facility_id, formData.consignee_city, formData.consignee_state,
      formData.stops, formData.miles_source, calculateMiles]);

  // Handle data extracted from rate con
  const handleRateConData = useCallback(async ({ formData: extractedFormData, actions, extracted, rateConFile: file }) => {
    // Store the rate con file for upload after load creation
    if (file) {
      setRateConFile(file);
    }
    // Auto-create broker if needed
    if (actions?.createBroker && extracted?.broker?.name) {
      try {
        const newBroker = await brokerMutations.createBroker({
          name: extracted.broker.name,
          mc_number: extracted.broker.mc_number || '',
          dot_number: extracted.broker.dot_number || '',
          phone: extracted.broker.phone || '',
          email: extracted.broker.email || '',
          address_line1: extracted.broker.address || '',
          city: extracted.broker.city || '',
          state: extracted.broker.state || '',
          zip: extracted.broker.zip || '',
        });
        setBrokers((prev) => [newBroker, ...prev]);
        extractedFormData.broker_id = newBroker.id;
        extractedFormData.broker_name = newBroker.name;
        extractedFormData.broker_mc = newBroker.mc_number || '';
      } catch (err) {
        console.error('Failed to create broker:', err);
      }
    }

    // Auto-create shipper facility if needed
    if (actions?.createShipper && extracted?.shipper?.name) {
      try {
        const newFacility = await facilityMutations.createFacility({
          company_name: extracted.shipper.name,
          facility_type: 'shipper',
          address_line1: extracted.shipper.address || '',
          city: extracted.shipper.city || '',
          state: extracted.shipper.state || '',
          zip: extracted.shipper.zip || '',
          contact_name: extracted.shipper.contact || '',
          phone: extracted.shipper.phone || '',
        });
        setFacilities((prev) => [newFacility, ...prev]);
        extractedFormData.shipper_facility_id = newFacility.id;
      } catch (err) {
        console.error('Failed to create shipper facility:', err);
      }
    }

    // Auto-create consignee facility if needed
    if (actions?.createConsignee && extracted?.consignee?.name) {
      try {
        const newFacility = await facilityMutations.createFacility({
          company_name: extracted.consignee.name,
          facility_type: 'receiver',
          address_line1: extracted.consignee.address || '',
          city: extracted.consignee.city || '',
          state: extracted.consignee.state || '',
          zip: extracted.consignee.zip || '',
          contact_name: extracted.consignee.contact || '',
          phone: extracted.consignee.phone || '',
        });
        setFacilities((prev) => [newFacility, ...prev]);
        extractedFormData.consignee_facility_id = newFacility.id;
      } catch (err) {
        console.error('Failed to create consignee facility:', err);
      }
    }

    // Update form data
    setFormData((prev) => ({
      ...prev,
      ...extractedFormData,
      // Keep the generated load number if no extraction
      reference_number: extractedFormData.reference_number || prev.reference_number,
    }));
    setShowRateConUpload(false);
  }, [brokerMutations, facilityMutations, setBrokers, setFacilities]);

  // Add newly created facility to local list
  const handleFacilityAdded = useCallback((newFacility) => {
    setFacilities((prev) => [newFacility, ...prev]);
  }, []);

  // Add newly created broker to local list
  const handleBrokerAdded = useCallback((newBroker) => {
    setBrokers((prev) => [newBroker, ...prev]);
  }, []);

  // Step validation
  const isStepValid = useCallback((stepIndex) => {
    switch (stepIndex) {
      case 0: // Basics - need load # and at least origin/destination names
        return (
          formData.reference_number.trim().length > 0 &&
          (formData.shipper_facility_id || formData.shipper_name.trim()) &&
          (formData.consignee_facility_id || formData.consignee_name.trim())
        );
      case 1: // Details - need dates and rate
        return formData.pickup_date && formData.delivery_date && formData.revenue;
      case 2: // Review
        return true;
      default:
        return false;
    }
  }, [formData]);

  const goToStep = (stepIndex) => {
    if (stepIndex >= 0 && stepIndex < STEPS.length) {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentStep(stepIndex);
        setIsTransitioning(false);
      }, 200);
    }
  };

  const goBack = () => {
    if (currentStep > 0) {
      goToStep(currentStep - 1);
    } else if (isModal && onClose) {
      onClose();
    } else {
      navigate(orgUrl('/loads'));
    }
  };

  const goNext = () => {
    if (currentStep < STEPS.length - 1 && isStepValid(currentStep)) {
      goToStep(currentStep + 1);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setSaving(true);

    try {
      const data = {
        reference_number: formData.reference_number,
        customer_load_number: formData.customer_load_number || null,
        status: formData.status,
        shipper_facility_id: formData.shipper_facility_id || null,
        shipper_name: formData.shipper_name || null,
        shipper_address: formData.shipper_address || null,
        shipper_city: formData.shipper_city || null,
        shipper_state: formData.shipper_state || null,
        shipper_zip: formData.shipper_zip || null,
        consignee_facility_id: formData.consignee_facility_id || null,
        consignee_name: formData.consignee_name || null,
        consignee_address: formData.consignee_address || null,
        consignee_city: formData.consignee_city || null,
        consignee_state: formData.consignee_state || null,
        consignee_zip: formData.consignee_zip || null,
        pickup_date: formData.pickup_date || null,
        delivery_date: formData.delivery_date || null,
        commodity: formData.commodity || null,
        weight_lbs: formData.weight_lbs ? parseInt(formData.weight_lbs) : null,
        revenue: formData.revenue ? parseFloat(formData.revenue) : null,
        miles: formData.miles ? parseInt(formData.miles) : null,
        broker_id: formData.broker_id || null,
        broker_name: formData.broker_name || null,
        broker_mc: formData.broker_mc || null,
        notes: formData.notes || null,
        // Include stops for creation
        stops: formData.stops?.length > 0 ? formData.stops.map((stop, index) => ({
          facility_id: stop.facility_id || null,
          facility_name: stop.facility_name || null,
          address: stop.address || null,
          city: stop.city || null,
          state: stop.state || null,
          zip: stop.zip || null,
          scheduled_date: stop.scheduled_date || null,
          stop_number: index + 1,
          type: 'stop'
        })) : null,
      };

      let result;
      if (isEdit) {
        result = await loadMutations.updateLoad(loadId, data);
        if (isModal && onSuccess) {
          onSuccess(result);
        } else {
          navigate(orgUrl(`/loads/${loadId}`));
        }
      } else {
        result = await loadMutations.createLoad(data);

        // Upload rate con file if we have one from AI import
        if (rateConFile && result?.id) {
          try {
            await uploadsApi.uploadDocument(rateConFile, {
              context: 'load_document',
              loadId: result.id,
              docType: 'rate_con',
              notes: 'Uploaded via AI Import'
            });
          } catch (uploadErr) {
            console.error('Failed to upload rate con:', uploadErr);
            // Don't fail the load creation if upload fails
          }
        }

        setCreatedLoad(result);
        if (isModal && onSuccess) {
          onSuccess(result);
        } else {
          setShowSuccess(true);
        }
      }
    } catch (err) {
      console.error('Failed to save load:', err);
      setError(err.response?.data?.message || 'Failed to save load');
    } finally {
      setSaving(false);
    }
  };

  const renderStep = () => {
    const commonProps = {
      formData,
      updateFormData,
      isValid: isStepValid(currentStep),
      brokers,
      facilities,
      onFacilityAdded: handleFacilityAdded,
      onBrokerAdded: handleBrokerAdded,
    };

    switch (currentStep) {
      case 0:
        return <BasicsStep {...commonProps} />;
      case 1:
        return (
          <DetailsStep
            {...commonProps}
            onCalculateMiles={calculateMiles}
            isCalculatingMiles={isCalculatingMiles}
          />
        );
      case 2:
        return (
          <ReviewStep
            {...commonProps}
            onSubmit={handleSubmit}
            onSaveAsDraft={() => {
              updateFormData({ status: 'draft' });
              handleSubmit();
            }}
            saving={saving}
            error={error}
            goToStep={goToStep}
          />
        );
      default:
        return null;
    }
  };

  if (showSuccess && createdLoad) {
    return (
      <LoadCreatedSuccess
        load={createdLoad}
        formData={formData}
        onAssignDriver={() => navigate(orgUrl(`/loads/${createdLoad.id}?assign=true`))}
        onCreateAnother={() => {
          setShowSuccess(false);
          setCreatedLoad(null);
          setCurrentStep(0);
          setRateConFile(null); // Clear rate con file for new load
          setFormData({
            ...formData,
            reference_number: generateLoadNumber(),
            customer_load_number: '',
            shipper_facility_id: '',
            shipper_name: '',
            consignee_facility_id: '',
            consignee_name: '',
            pickup_date: '',
            delivery_date: '',
            revenue: '',
            miles: '',
            stops: [],
            miles_source: 'calculated',
          });
        }}
        onViewDetails={() => navigate(orgUrl(`/loads/${createdLoad.id}`))}
      />
    );
  }

  return (
    <div className={isModal ? "max-w-xl mx-auto" : "max-w-xl mx-auto py-6 px-4"}>
      {/* Progress Bar */}
      <WizardProgress
        steps={STEPS}
        currentStep={currentStep}
        onStepClick={goToStep}
        isStepComplete={(i) => i < currentStep || (i === currentStep && isStepValid(i))}
      />

      {/* AI Rate Con Upload - only show on first step for new loads */}
      {!isEdit && currentStep === 0 && (
        <div className="mt-6">
          {showRateConUpload ? (
            <RateConUpload
              onDataExtracted={handleRateConData}
              onClose={() => setShowRateConUpload(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setShowRateConUpload(true)}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl border-2 border-dashed border-accent/30 text-accent hover:border-accent/50 hover:bg-accent/5 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              <span className="text-body-sm font-medium">Upload Rate Con for AI Import</span>
            </button>
          )}
        </div>
      )}

      {/* Step Content */}
      <div
        className={`mt-8 transition-all duration-200 ${
          isTransitioning ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
        }`}
      >
        {/* Step Component */}
        {renderStep()}

        {/* Navigation */}
        {currentStep < STEPS.length - 1 && (
          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goBack}
              className="text-body-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              {currentStep === 0 ? 'Cancel' : 'Back'}
            </button>

            <button
              type="button"
              onClick={goNext}
              disabled={!isStepValid(currentStep)}
              className={`
                px-6 py-2.5 rounded-lg text-body font-medium transition-all
                ${
                  isStepValid(currentStep)
                    ? 'bg-accent text-white hover:bg-accent/90'
                    : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                }
              `}
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoadWizard;
