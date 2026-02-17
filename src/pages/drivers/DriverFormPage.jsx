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
import { DriverStatusConfig, DriverTypeConfig, PayTypeConfig, TaxClassificationConfig } from '../../config/status';
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
    notes: '',
    // Org-owned fields
    driver_type: '',
    pay_type: '',
    pay_rate: '',
    employee_number: '',
    tax_classification: '',
    termination_date: '',
    home_terminal: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    emergency_contact_relationship: '',
    fuel_card_number: '',
    eld_provider: '',
    eld_serial: '',
    drug_test_date: '',
    drug_test_expiry: '',
    mvr_date: '',
    mvr_expiry: '',
    endorsements: ''
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
        notes: driver.notes || '',
        // Org-owned fields
        driver_type: driver.driver_type || '',
        pay_type: driver.pay_type || '',
        pay_rate: driver.pay_rate || '',
        employee_number: driver.employee_number || '',
        tax_classification: driver.tax_classification || '',
        termination_date: driver.termination_date ? driver.termination_date.split('T')[0] : '',
        home_terminal: driver.home_terminal || '',
        emergency_contact_name: driver.emergency_contact_name || '',
        emergency_contact_phone: driver.emergency_contact_phone || '',
        emergency_contact_relationship: driver.emergency_contact_relationship || '',
        fuel_card_number: driver.fuel_card_number || '',
        eld_provider: driver.eld_provider || '',
        eld_serial: driver.eld_serial || '',
        drug_test_date: driver.drug_test_date ? driver.drug_test_date.split('T')[0] : '',
        drug_test_expiry: driver.drug_test_expiry ? driver.drug_test_expiry.split('T')[0] : '',
        mvr_date: driver.mvr_date ? driver.mvr_date.split('T')[0] : '',
        mvr_expiry: driver.mvr_expiry ? driver.mvr_expiry.split('T')[0] : '',
        endorsements: driver.endorsements || ''
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
      // Clean up empty date fields and optional fields
      const data = { ...formData };
      if (!data.license_expiry) delete data.license_expiry;
      if (!data.medical_card_expiry) delete data.medical_card_expiry;
      if (!data.hire_date) delete data.hire_date;
      if (!data.termination_date) delete data.termination_date;
      if (!data.drug_test_date) delete data.drug_test_date;
      if (!data.drug_test_expiry) delete data.drug_test_expiry;
      if (!data.mvr_date) delete data.mvr_date;
      if (!data.mvr_expiry) delete data.mvr_expiry;
      // Clean up empty enum/string fields
      if (!data.driver_type) delete data.driver_type;
      if (!data.pay_type) delete data.pay_type;
      if (!data.pay_rate) delete data.pay_rate;
      if (!data.tax_classification) delete data.tax_classification;

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

        {/* Pay & Classification */}
        <Card>
          <CardHeader>
            <CardTitle>Pay & Classification</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">Driver Type</label>
                <select
                  id="driver_type"
                  name="driver_type"
                  value={formData.driver_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select type...</option>
                  {Object.entries(DriverTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">Tax Classification</label>
                <select
                  id="tax_classification"
                  name="tax_classification"
                  value={formData.tax_classification}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select classification...</option>
                  {Object.entries(TaxClassificationConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">Pay Type</label>
                <select
                  id="pay_type"
                  name="pay_type"
                  value={formData.pay_type}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="">Select pay type...</option>
                  {Object.entries(PayTypeConfig).map(([value, config]) => (
                    <option key={value} value={value}>{config.label}</option>
                  ))}
                </select>
              </div>
              <Input
                id="pay_rate"
                name="pay_rate"
                type="number"
                label="Pay Rate"
                value={formData.pay_rate}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
            </div>

            <Input
              id="employee_number"
              name="employee_number"
              label="Employee Number"
              value={formData.employee_number}
              onChange={handleChange}
              placeholder="EMP-001"
            />
          </CardContent>
        </Card>

        {/* Employment */}
        <Card>
          <CardHeader>
            <CardTitle>Employment</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="hire_date"
                name="hire_date"
                type="date"
                label="Hire Date"
                value={formData.hire_date}
                onChange={handleChange}
              />
              <Input
                id="termination_date"
                name="termination_date"
                type="date"
                label="Termination Date"
                value={formData.termination_date}
                onChange={handleChange}
              />
            </div>

            <Input
              id="home_terminal"
              name="home_terminal"
              label="Home Terminal"
              value={formData.home_terminal}
              onChange={handleChange}
              placeholder="Dallas, TX"
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

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="emergency_contact_name"
                name="emergency_contact_name"
                label="Contact Name"
                value={formData.emergency_contact_name}
                onChange={handleChange}
                placeholder="Jane Doe"
              />
              <Input
                id="emergency_contact_phone"
                name="emergency_contact_phone"
                type="tel"
                label="Contact Phone"
                value={formData.emergency_contact_phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
              />
            </div>
            <Input
              id="emergency_contact_relationship"
              name="emergency_contact_relationship"
              label="Relationship"
              value={formData.emergency_contact_relationship}
              onChange={handleChange}
              placeholder="Spouse, Parent, etc."
            />
          </CardContent>
        </Card>

        {/* Equipment & Operations */}
        <Card>
          <CardHeader>
            <CardTitle>Equipment & Operations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              id="fuel_card_number"
              name="fuel_card_number"
              label="Fuel Card Number"
              value={formData.fuel_card_number}
              onChange={handleChange}
              placeholder="FC-123456"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="eld_provider"
                name="eld_provider"
                label="ELD Provider"
                value={formData.eld_provider}
                onChange={handleChange}
                placeholder="KeepTruckin, Samsara, etc."
              />
              <Input
                id="eld_serial"
                name="eld_serial"
                label="ELD Serial Number"
                value={formData.eld_serial}
                onChange={handleChange}
                placeholder="SN-12345"
              />
            </div>
          </CardContent>
        </Card>

        {/* Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="drug_test_date"
                name="drug_test_date"
                type="date"
                label="Last Drug Test"
                value={formData.drug_test_date}
                onChange={handleChange}
              />
              <Input
                id="drug_test_expiry"
                name="drug_test_expiry"
                type="date"
                label="Drug Test Expiry"
                value={formData.drug_test_expiry}
                onChange={handleChange}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                id="mvr_date"
                name="mvr_date"
                type="date"
                label="Last MVR Pull"
                value={formData.mvr_date}
                onChange={handleChange}
              />
              <Input
                id="mvr_expiry"
                name="mvr_expiry"
                type="date"
                label="MVR Expiry"
                value={formData.mvr_expiry}
                onChange={handleChange}
              />
            </div>
            <Input
              id="endorsements"
              name="endorsements"
              label="Endorsements"
              value={formData.endorsements}
              onChange={handleChange}
              placeholder="H, N, T, X, etc."
            />
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
