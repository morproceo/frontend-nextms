/**
 * AssignFuelCardModal - Modal for assigning a fuel card to a driver
 *
 * Shows card info at top, driver/truck selectors, date, and notes.
 * Calls fuelApi.assignFuelCard on submit.
 */

import { useState, useEffect } from 'react';
import { useDriversList, useTrucksList } from '../../../hooks';
import fuelApi from '../../../api/fuel.api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { SearchableSelect } from '../../../components/ui/SearchableSelect';
import { FuelCardProviderLabels } from '../../../enums/fuel';
import { X, CreditCard, UserPlus } from 'lucide-react';

const maskCardNumber = (number) => {
  if (!number) return '****';
  const last4 = number.slice(-4);
  return `****${last4}`;
};

export function AssignFuelCardModal({ isOpen, onClose, card, onAssigned }) {
  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucksList();

  const [driverId, setDriverId] = useState('');
  const [truckId, setTruckId] = useState('');
  const [assignedAt, setAssignedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // Fetch drivers and trucks when modal opens
  useEffect(() => {
    if (isOpen) {
      if (!drivers || drivers.length === 0) fetchDrivers();
      if (!trucks || trucks.length === 0) fetchTrucks();
      // Reset form
      setDriverId('');
      setTruckId('');
      setAssignedAt(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const driverOptions = (drivers || []).map(d => ({
    id: d.id,
    label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email || 'Unknown',
    sublabel: d.phone || d.email || ''
  }));

  const truckOptions = (trucks || []).map(t => ({
    id: t.id,
    label: t.unit_number || `Truck ${t.id?.slice(0, 8)}`,
    sublabel: `${t.year || ''} ${t.make || ''} ${t.model || ''}`.trim()
  }));

  const handleSubmit = async () => {
    setError(null);

    if (!driverId) {
      setError('Please select a driver');
      return;
    }
    if (!assignedAt) {
      setError('Please select an assigned date');
      return;
    }

    try {
      setSubmitting(true);
      await fuelApi.assignFuelCard(card.id, {
        driver_id: driverId,
        truck_id: truckId || null,
        assigned_at: assignedAt,
        notes: notes.trim() || null
      });
      onAssigned();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to assign fuel card');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <Card className="relative z-10 w-full max-w-lg shadow-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Assign Fuel Card</CardTitle>
            <button
              onClick={onClose}
              className="p-1 hover:bg-surface-secondary rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Card Info */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
            <CreditCard className="w-5 h-5 text-text-secondary" />
            <div>
              <p className="text-body-sm font-mono text-text-primary">
                {maskCardNumber(card?.card_number)}
              </p>
              <p className="text-small text-text-tertiary">
                {FuelCardProviderLabels[card?.card_provider] || card?.card_provider || 'Unknown Provider'}
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Driver */}
          <div className="space-y-2">
            <label className="block text-body-sm font-medium text-text-primary">
              Driver <span className="text-error">*</span>
            </label>
            <SearchableSelect
              value={driverId}
              onChange={(option) => setDriverId(option?.id || '')}
              options={driverOptions}
              placeholder="Select driver..."
              loading={driversLoading}
            />
          </div>

          {/* Truck */}
          <div className="space-y-2">
            <label className="block text-body-sm font-medium text-text-primary">
              Truck
            </label>
            <SearchableSelect
              value={truckId}
              onChange={(option) => setTruckId(option?.id || '')}
              options={truckOptions}
              placeholder="Select truck (optional)..."
              loading={trucksLoading}
            />
          </div>

          {/* Assigned Date */}
          <Input
            label="Assigned Date"
            type="date"
            value={assignedAt}
            onChange={(e) => setAssignedAt(e.target.value)}
            required
          />

          {/* Notes */}
          <div className="space-y-2">
            <label className="block text-body-sm font-medium text-text-primary">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes..."
              rows={2}
              className="w-full px-4 py-3 bg-surface-secondary text-text-primary border border-transparent rounded-input placeholder:text-text-tertiary focus:bg-white focus:border-accent focus:shadow-input-focus focus:outline-none transition-all duration-200 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="secondary" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={submitting}>
              <UserPlus className="w-4 h-4 mr-2" />
              Assign Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AssignFuelCardModal;
