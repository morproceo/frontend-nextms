/**
 * ReturnFuelCardModal - Modal for returning (unassigning) a fuel card
 *
 * Shows read-only summary of current assignment, return date, and notes.
 * Validates return date >= assigned date. Calls fuelApi.returnFuelCard on submit.
 */

import { useState, useEffect } from 'react';
import fuelApi from '../../../api/fuel.api';
import { Card, CardHeader, CardTitle, CardContent } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { FuelCardProviderLabels } from '../../../enums/fuel';
import { X, CreditCard, RotateCcw } from 'lucide-react';

const maskCardNumber = (number) => {
  if (!number) return '****';
  const last4 = number.slice(-4);
  return `****${last4}`;
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function ReturnFuelCardModal({ isOpen, onClose, card, onReturned }) {
  const [returnedAt, setReturnedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const assignment = card?.current_assignment;

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setReturnedAt(new Date().toISOString().split('T')[0]);
      setNotes('');
      setError(null);
    }
  }, [isOpen]);

  const driverName = assignment?.driver
    ? `${assignment.driver.first_name || ''} ${assignment.driver.last_name || ''}`.trim()
    : 'Unknown Driver';

  const handleSubmit = async () => {
    setError(null);

    if (!returnedAt) {
      setError('Please select a return date');
      return;
    }

    // Validate return date >= assigned date
    if (assignment?.assigned_at) {
      const assignedDate = assignment.assigned_at.split('T')[0];
      if (returnedAt < assignedDate) {
        setError('Return date cannot be before the assigned date');
        return;
      }
    }

    try {
      setSubmitting(true);
      await fuelApi.returnFuelCard(card.id, {
        returned_at: returnedAt,
        notes: notes.trim() || null
      });
      onReturned();
      onClose();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to return fuel card');
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
            <CardTitle>Return Fuel Card</CardTitle>
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

          {/* Current Assignment Summary */}
          <div className="p-3 bg-accent/5 border border-accent/20 rounded-lg">
            <p className="text-body-sm text-text-primary">
              Currently assigned to <span className="font-medium">{driverName}</span>
              {assignment?.assigned_at && (
                <> since <span className="font-medium">{formatDate(assignment.assigned_at)}</span></>
              )}
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Return Date */}
          <Input
            label="Return Date"
            type="date"
            value={returnedAt}
            onChange={(e) => setReturnedAt(e.target.value)}
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
              <RotateCcw className="w-4 h-4 mr-2" />
              Return Card
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ReturnFuelCardModal;
