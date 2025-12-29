/**
 * QuickAddFacilityModal - Refactored to use hooks architecture
 */

import { useState, useEffect } from 'react';
import { useFacilityMutations } from '../../../hooks';
import { Button } from '../../ui/Button';
import {
  X,
  ArrowUpFromLine,
  ArrowDownToLine,
  ArrowLeftRight
} from 'lucide-react';

const facilityTypes = [
  { value: 'shipper', label: 'Shipper', icon: ArrowUpFromLine },
  { value: 'receiver', label: 'Receiver', icon: ArrowDownToLine },
  { value: 'both', label: 'Both', icon: ArrowLeftRight }
];

const getInitialFormData = (type) => ({
  company_name: '',
  facility_type: type,
  contact_name: '',
  phone: '',
  email: '',
  address_line1: '',
  city: '',
  state: '',
  zip: ''
});

export function QuickAddFacilityModal({ isOpen, onClose, onCreated, defaultType = 'both' }) {
  const { createFacility, loading: saving } = useFacilityMutations();
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState(getInitialFormData(defaultType));

  // Reset form when modal opens with new type
  useEffect(() => {
    if (isOpen) {
      setFormData(getInitialFormData(defaultType));
      setError(null);
    }
  }, [isOpen, defaultType]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      const result = await createFacility(formData);
      onCreated(result);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create facility');
    }
  };

  const handleClose = () => {
    setFormData({
      company_name: '',
      facility_type: defaultType,
      contact_name: '',
      phone: '',
      email: '',
      address_line1: '',
      city: '',
      state: '',
      zip: ''
    });
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-elevated w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-tertiary">
          <h2 className="text-body font-semibold text-text-primary">Add New Facility</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Facility Type */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-2">
              Type
            </label>
            <div className="flex gap-2">
              {facilityTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.facility_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, facility_type: type.value }))}
                    className={`
                      flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border-2 transition-all
                      ${isSelected
                        ? 'border-accent bg-accent/5 text-accent'
                        : 'border-surface-tertiary text-text-secondary hover:border-surface-tertiary/70'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="text-body-sm font-medium">{type.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Company Name */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              placeholder="ABC Warehouse"
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              autoFocus
            />
          </div>

          {/* Address */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Address
            </label>
            <input
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="123 Main St"
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="block text-small font-medium text-text-secondary mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Los Angeles"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-small font-medium text-text-secondary mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="CA"
                maxLength={2}
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-small font-medium text-text-secondary mb-1">
                ZIP
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                placeholder="90001"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                Contact Name
              </label>
              <input
                type="text"
                name="contact_name"
                value={formData.contact_name}
                onChange={handleChange}
                placeholder="John Smith"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add Facility
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAddFacilityModal;
