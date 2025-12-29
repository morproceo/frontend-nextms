/**
 * FacilityFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Centralized status configs from config/status
 * - Business logic delegated to useFacility/useFacilities hooks
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFacility, useFacilities } from '../../hooks';
import { FacilityType, FacilityTypeConfig } from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft } from 'lucide-react';

// Get facility types as an array for the form selector
const facilityTypes = Object.entries(FacilityTypeConfig).map(([value, config]) => ({
  value,
  label: config.label,
  icon: config.icon,
  description: config.description
}));

export function FacilityFormPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEdit = Boolean(facilityId);

  // Hooks for API operations
  const {
    facility,
    loading: detailLoading,
    updateFacility,
    mutating: updateMutating
  } = useFacility(facilityId, { autoFetch: isEdit });

  const {
    createFacility,
    mutating: createMutating
  } = useFacilities({ autoFetch: false });

  // Local state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    company_name: '',
    facility_type: FacilityType.BOTH,
    contact_name: '',
    email: '',
    phone: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    is_active: true,
    notes: ''
  });

  // Populate form when facility data loads (edit mode)
  useEffect(() => {
    if (isEdit && facility) {
      setFormData({
        company_name: facility.company_name || '',
        facility_type: facility.facility_type || FacilityType.BOTH,
        contact_name: facility.contact?.name || '',
        email: facility.contact?.email || '',
        phone: facility.contact?.phone || '',
        address_line1: facility.address?.line1 || '',
        address_line2: facility.address?.line2 || '',
        city: facility.address?.city || '',
        state: facility.address?.state || '',
        zip: facility.address?.zip || '',
        is_active: facility.is_active !== false,
        notes: facility.notes || ''
      });
    }
  }, [isEdit, facility]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.company_name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await updateFacility(formData);
      } else {
        await createFacility(formData);
      }
      navigate(orgUrl('/customers?tab=facilities'));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save facility');
    } finally {
      setSaving(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(orgUrl('/customers?tab=facilities'))}
          className="text-text-tertiary hover:text-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-title text-text-primary">
          {isEdit ? 'Edit Facility' : 'Add Facility'}
        </h1>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card padding="default" className="space-y-6">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Facility Type */}
          <div className="space-y-3">
            <h3 className="text-body font-medium text-text-primary">Facility Type</h3>
            <div className="grid grid-cols-3 gap-3">
              {facilityTypes.map((type) => {
                const Icon = type.icon;
                const isSelected = formData.facility_type === type.value;
                return (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, facility_type: type.value }))}
                    className={`
                      p-4 rounded-lg border-2 text-left transition-all
                      ${isSelected
                        ? 'border-accent bg-accent/5'
                        : 'border-surface-tertiary hover:border-surface-tertiary/70'
                      }
                    `}
                  >
                    <Icon className={`w-5 h-5 mb-2 ${isSelected ? 'text-accent' : 'text-text-tertiary'}`} />
                    <p className={`text-body-sm font-medium ${isSelected ? 'text-accent' : 'text-text-primary'}`}>
                      {type.label}
                    </p>
                    <p className="text-small text-text-tertiary">{type.description}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Basic Information</h3>
            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                Company Name *
              </label>
              <input
                type="text"
                name="company_name"
                value={formData.company_name}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                required
              />
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
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
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-text-secondary mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-small font-medium text-text-secondary mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Status</h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/20"
              />
              <span className="text-body-sm text-text-primary">Active</span>
            </label>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-tertiary">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(orgUrl('/customers?tab=facilities'))}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save Changes' : 'Add Facility'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default FacilityFormPage;
