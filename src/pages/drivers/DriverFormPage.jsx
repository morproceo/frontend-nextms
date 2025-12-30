/**
 * DriverFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - Uses useDriver domain hook for editing
 * - Uses useDrivers domain hook for creating
 * - Centralized configs from config/status
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDriver, useDrivers } from '../../hooks';
import { DriverStatusConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, Save } from 'lucide-react';

export function DriverFormPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEdit = Boolean(driverId);

  // Hooks for data and mutations
  const { driver, loading: detailLoading, updateFields, mutating: updating } = useDriver(driverId, { autoFetch: isEdit });
  const { createDriver, mutating: creating } = useDrivers({ autoFetch: false });

  const [errors, setErrors] = useState({});
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
    medical_card_expiry: '',
    hire_date: '',
    status: 'available',
    notes: ''
  });

  // Populate form when driver data loads (for editing)
  useEffect(() => {
    if (isEdit && driver) {
      setFormData({
        first_name: driver.first_name || '',
        last_name: driver.last_name || '',
        email: driver.email || '',
        phone: driver.phone || '',
        license_number: driver.license_number || '',
        license_state: driver.license_state || '',
        license_expiry: driver.license_expiry ? driver.license_expiry.split('T')[0] : '',
        medical_card_expiry: driver.medical_card_expiry ? driver.medical_card_expiry.split('T')[0] : '',
        hire_date: driver.hire_date ? driver.hire_date.split('T')[0] : '',
        status: driver.status || 'available',
        notes: driver.notes || ''
      });
    }
  }, [isEdit, driver]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) {
      newErrors.first_name = 'First name is required';
    }
    if (!formData.last_name.trim()) {
      newErrors.last_name = 'Last name is required';
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    try {
      // Clean up empty date fields
      const data = { ...formData };
      if (!data.license_expiry) delete data.license_expiry;
      if (!data.medical_card_expiry) delete data.medical_card_expiry;
      if (!data.hire_date) delete data.hire_date;

      if (isEdit) {
        await updateFields(data);
        navigate(orgUrl(`/drivers/${driverId}`));
      } else {
        const newDriver = await createDriver(data);
        navigate(orgUrl(`/drivers/${newDriver.id}`));
      }
    } catch (err) {
      console.error('Failed to save driver:', err);
      const message = err.response?.data?.message || 'Failed to save driver';
      setErrors({ submit: message });
    }
  };

  const handleBack = () => {
    if (isEdit) {
      navigate(orgUrl(`/drivers/${driverId}`));
    } else {
      navigate(orgUrl('/drivers'));
    }
  };

  const saving = updating || creating;

  if (isEdit && detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        {isEdit ? 'Back to Driver' : 'Back to Drivers'}
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-title text-text-primary">
          {isEdit ? 'Edit Driver' : 'Add Driver'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {isEdit
            ? 'Update the driver profile information'
            : 'Create a new driver profile for your organization'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="first_name"
                name="first_name"
                label="First Name *"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="John"
                error={errors.first_name}
              />
              <Input
                id="last_name"
                name="last_name"
                label="Last Name *"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="Doe"
                error={errors.last_name}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="email"
                name="email"
                type="email"
                label="Email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                error={errors.email}
              />
              <Input
                id="phone"
                name="phone"
                type="tel"
                label="Phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">Status</label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {Object.entries(DriverStatusConfig).map(([value, config]) => (
                  <option key={value} value={value}>{config.label}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        {/* License & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>License & Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="license_number"
                name="license_number"
                label="License Number"
                value={formData.license_number}
                onChange={handleChange}
                placeholder="DL12345678"
              />
              <Input
                id="license_state"
                name="license_state"
                label="License State"
                value={formData.license_state}
                onChange={handleChange}
                placeholder="CA"
                maxLength={2}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="license_expiry"
                name="license_expiry"
                type="date"
                label="License Expiry"
                value={formData.license_expiry}
                onChange={handleChange}
              />
              <Input
                id="medical_card_expiry"
                name="medical_card_expiry"
                type="date"
                label="Medical Card Expiry"
                value={formData.medical_card_expiry}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle>Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="hire_date"
              name="hire_date"
              type="date"
              label="Hire Date"
              value={formData.hire_date}
              onChange={handleChange}
            />

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">Notes</label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional notes about this driver..."
                rows={4}
                className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-input text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Error Message */}
        {errors.submit && (
          <Card padding="default" className="bg-error/5 border border-error/20">
            <p className="text-body-sm text-error">{errors.submit}</p>
          </Card>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEdit ? 'Save Changes' : 'Create Driver'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default DriverFormPage;
