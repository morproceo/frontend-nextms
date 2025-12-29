/**
 * AssignDriverModal - Refactored to use hooks architecture
 */

import { useState, useEffect } from 'react';
import { X, Truck, User, Container, CheckCircle, ArrowRight } from 'lucide-react';
import {
  useDriversList,
  useTrucksList,
  useTrailersList,
  useLoadMutations
} from '../../../hooks';
import { Button } from '../../ui/Button';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { Spinner } from '../../ui/Spinner';

export function AssignDriverModal({ isOpen, onClose, load, onAssigned }) {
  // Use hooks for data fetching
  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucksList();
  const { trailers, loading: trailersLoading, fetchTrailers } = useTrailersList();
  const { updateLoad, loading: saving } = useLoadMutations();

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    driver_id: '',
    truck_id: '',
    trailer_id: '',
  });

  const loading = driversLoading || trucksLoading || trailersLoading;

  // Fetch reference data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchDrivers({ status: 'active' });
      fetchTrucks({ is_active: true });
      fetchTrailers({ is_active: true });
    }
  }, [isOpen]);

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({ driver_id: '', truck_id: '', trailer_id: '' });
      setSuccess(false);
      setError(null);
    }
  }, [isOpen]);

  const handleDriverSelect = (option) => {
    const driver = option ? drivers.find((d) => d.id === option.id) : null;
    setFormData((prev) => ({
      ...prev,
      driver_id: driver?.id || '',
      // Auto-select driver's default truck if available
      truck_id: driver?.truck_id || prev.truck_id,
      trailer_id: driver?.trailer_id || prev.trailer_id,
    }));
  };

  const handleTruckSelect = (option) => {
    setFormData((prev) => ({ ...prev, truck_id: option?.id || '' }));
  };

  const handleTrailerSelect = (option) => {
    setFormData((prev) => ({ ...prev, trailer_id: option?.id || '' }));
  };

  const handleSubmit = async () => {
    if (!formData.driver_id) {
      setError('Please select a driver');
      return;
    }

    try {
      setError(null);

      await updateLoad(load.id, {
        driver_id: formData.driver_id,
        truck_id: formData.truck_id || null,
        trailer_id: formData.trailer_id || null,
        status: 'booked',
      });

      setSuccess(true);

      // Wait a moment to show success, then notify parent
      setTimeout(() => {
        onAssigned?.({
          driver: drivers.find((d) => d.id === formData.driver_id),
          truck: trucks.find((t) => t.id === formData.truck_id),
          trailer: trailers.find((t) => t.id === formData.trailer_id),
        });
      }, 1500);
    } catch (err) {
      console.error('Failed to assign driver:', err);
      setError(err.response?.data?.message || 'Failed to assign driver');
    }
  };

  if (!isOpen) return null;

  const selectedDriver = drivers.find((d) => d.id === formData.driver_id);

  // Success State
  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full mx-4 p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="w-8 h-8 text-success" />
          </div>
          <h2 className="text-xl font-semibold text-text-primary mb-2">Driver Assigned!</h2>
          <p className="text-body text-text-secondary">
            {selectedDriver?.first_name} {selectedDriver?.last_name} will pick up load{' '}
            {load?.reference_number}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-surface-tertiary">
          <div>
            <h2 className="text-lg font-semibold text-text-primary">Assign Driver</h2>
            <p className="text-body-sm text-text-secondary">
              Load {load?.reference_number}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="lg" />
            </div>
          ) : (
            <>
              {/* Load Summary */}
              {load && (
                <div className="p-3 bg-surface-secondary rounded-lg">
                  <div className="flex items-center gap-2 text-body-sm">
                    <span className="text-text-secondary">{load.shipper?.city || 'Origin'}</span>
                    <ArrowRight className="w-3 h-3 text-text-tertiary" />
                    <span className="text-text-secondary">
                      {load.consignee?.city || 'Destination'}
                    </span>
                  </div>
                </div>
              )}

              {/* Driver Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                  <User className="w-4 h-4 text-accent" />
                  Driver
                </label>
                <SearchableSelect
                  value={formData.driver_id}
                  onChange={handleDriverSelect}
                  options={drivers.map((d) => ({
                    id: d.id,
                    label: `${d.first_name} ${d.last_name}`,
                    sublabel: d.phone,
                  }))}
                  placeholder="Select driver..."
                />
              </div>

              {/* Truck Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                  <Truck className="w-4 h-4 text-text-tertiary" />
                  Truck
                  <span className="text-small text-text-tertiary font-normal">(Optional)</span>
                </label>
                <SearchableSelect
                  value={formData.truck_id}
                  onChange={handleTruckSelect}
                  options={trucks.map((t) => ({
                    id: t.id,
                    label: t.unit_number || t.vin,
                    sublabel: `${t.year || ''} ${t.make || ''} ${t.model || ''}`.trim(),
                  }))}
                  placeholder="Select truck..."
                />
              </div>

              {/* Trailer Select */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                  <Container className="w-4 h-4 text-text-tertiary" />
                  Trailer
                  <span className="text-small text-text-tertiary font-normal">(Optional)</span>
                </label>
                <SearchableSelect
                  value={formData.trailer_id}
                  onChange={handleTrailerSelect}
                  options={trailers.map((t) => ({
                    id: t.id,
                    label: t.unit_number || t.vin,
                    sublabel: t.trailer_type,
                  }))}
                  placeholder="Select trailer..."
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-body-sm text-error">{error}</p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-tertiary bg-surface-secondary/50">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !formData.driver_id}>
            {saving ? (
              <>
                <Spinner size="sm" className="mr-2" />
                Assigning...
              </>
            ) : (
              'Assign Driver'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default AssignDriverModal;
