/**
 * TruckFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Uses useTruck for editing, useTrucks for creation
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTruck, useTrucks } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, Save } from 'lucide-react';

export function TruckFormPage() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEditing = Boolean(truckId);

  // Hooks for data and mutations
  const { truck, loading: detailLoading, updateTruck, mutating: updating } = useTruck(truckId, { autoFetch: isEditing });
  const { createTruck, mutating: creating } = useTrucks({ autoFetch: false });

  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    unit_number: '',
    truck_type: 'sleeper',
    is_power_only: false,
    status: 'active',
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    fuel_type: 'diesel',
    engine_make: '',
    engine_model: '',
    horsepower: '',
    license_plate: '',
    license_state: '',
    registration_expiry: '',
    annual_inspection_date: '',
    annual_inspection_expiry: '',
    odometer_miles: '',
    last_service_date: '',
    next_service_date: '',
    next_service_miles: '',
    eld_provider: '',
    eld_device_id: '',
    ownership_type: 'owned',
    owner_name: '',
    lease_company: '',
    lease_end_date: '',
    purchase_date: '',
    purchase_price: '',
    irp_account: '',
    irp_expiry: '',
    ifta_account: '',
    ifta_expiry: '',
    insurance_policy: '',
    insurance_expiry: '',
    sleeper_type: '',
    sleeper_size: '',
    has_apu: false,
    has_inverter: false,
    has_fridge: false,
    notes: ''
  });

  // Format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Populate form when truck data loads
  useEffect(() => {
    if (isEditing && truck) {
      setFormData({
        unit_number: truck.unit_number || '',
        truck_type: truck.truck_type || 'sleeper',
        is_power_only: truck.is_power_only || false,
        status: truck.status || 'active',
        vin: truck.vin || '',
        make: truck.make || '',
        model: truck.model || '',
        year: truck.year || '',
        color: truck.color || '',
        fuel_type: truck.fuel_type || 'diesel',
        engine_make: truck.engine_make || '',
        engine_model: truck.engine_model || '',
        horsepower: truck.horsepower || '',
        license_plate: truck.license_plate || '',
        license_state: truck.license_state || '',
        registration_expiry: formatDateForInput(truck.registration_expiry),
        annual_inspection_date: formatDateForInput(truck.annual_inspection_date),
        annual_inspection_expiry: formatDateForInput(truck.annual_inspection_expiry),
        odometer_miles: truck.odometer_miles || '',
        last_service_date: formatDateForInput(truck.last_service_date),
        next_service_date: formatDateForInput(truck.next_service_date),
        next_service_miles: truck.next_service_miles || '',
        eld_provider: truck.eld_provider || '',
        eld_device_id: truck.eld_device_id || '',
        ownership_type: truck.ownership_type || 'owned',
        owner_name: truck.owner_name || '',
        lease_company: truck.lease_company || '',
        lease_end_date: formatDateForInput(truck.lease_end_date),
        purchase_date: formatDateForInput(truck.purchase_date),
        purchase_price: truck.purchase_price || '',
        irp_account: truck.irp_account || '',
        irp_expiry: formatDateForInput(truck.irp_expiry),
        ifta_account: truck.ifta_account || '',
        ifta_expiry: formatDateForInput(truck.ifta_expiry),
        insurance_policy: truck.insurance_policy || '',
        insurance_expiry: formatDateForInput(truck.insurance_expiry),
        sleeper_type: truck.sleeper_type || '',
        sleeper_size: truck.sleeper_size || '',
        has_apu: truck.has_apu || false,
        has_inverter: truck.has_inverter || false,
        has_fridge: truck.has_fridge || false,
        notes: truck.notes || ''
      });
    }
  }, [isEditing, truck]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setError(null);

      // Clean up empty values
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '' && v !== null)
      );

      if (isEditing) {
        await updateTruck(cleanData);
      } else {
        await createTruck(cleanData);
      }

      navigate(orgUrl('/assets/trucks'));
    } catch (err) {
      console.error('Failed to save truck:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save truck');
    }
  };

  const handleBack = () => {
    navigate(orgUrl('/assets/trucks'));
  };

  const saving = updating || creating;

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Trucks
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">
          {isEditing ? 'Edit Truck' : 'Add New Truck'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {isEditing ? 'Update truck information' : 'Add a new truck to your fleet'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Unit Number"
                name="unit_number"
                value={formData.unit_number}
                onChange={handleChange}
                required
                placeholder="e.g., 101"
              />
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Truck Type
                </label>
                <select
                  name="truck_type"
                  value={formData.truck_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="day_cab">Day Cab</option>
                  <option value="sleeper">Sleeper</option>
                  <option value="straight">Straight Truck</option>
                  <option value="box">Box Truck</option>
                </select>
              </div>
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Status
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="active">Active</option>
                  <option value="maintenance">Maintenance</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  name="is_power_only"
                  checked={formData.is_power_only}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <label className="text-body-sm text-text-primary">
                  Power Only (no company trailer)
                </label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="VIN"
                name="vin"
                value={formData.vin}
                onChange={handleChange}
                placeholder="17 characters"
                maxLength={17}
              />
              <Input
                label="Make"
                name="make"
                value={formData.make}
                onChange={handleChange}
                placeholder="e.g., Freightliner"
              />
              <Input
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., Cascadia"
              />
              <Input
                label="Year"
                name="year"
                type="number"
                value={formData.year}
                onChange={handleChange}
                placeholder="e.g., 2023"
                min={1980}
                max={new Date().getFullYear() + 2}
              />
              <Input
                label="Color"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="e.g., White"
              />
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Fuel Type
                </label>
                <select
                  name="fuel_type"
                  value={formData.fuel_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="diesel">Diesel</option>
                  <option value="gasoline">Gasoline</option>
                  <option value="natural_gas">Natural Gas</option>
                  <option value="electric">Electric</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Engine Information */}
        <Card>
          <CardHeader>
            <CardTitle>Engine Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Engine Make"
                name="engine_make"
                value={formData.engine_make}
                onChange={handleChange}
                placeholder="e.g., Cummins"
              />
              <Input
                label="Engine Model"
                name="engine_model"
                value={formData.engine_model}
                onChange={handleChange}
                placeholder="e.g., X15"
              />
              <Input
                label="Horsepower"
                name="horsepower"
                type="number"
                value={formData.horsepower}
                onChange={handleChange}
                placeholder="e.g., 500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Registration & Compliance */}
        <Card>
          <CardHeader>
            <CardTitle>Registration & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="License Plate"
                name="license_plate"
                value={formData.license_plate}
                onChange={handleChange}
                placeholder="e.g., ABC1234"
              />
              <Input
                label="License State"
                name="license_state"
                value={formData.license_state}
                onChange={handleChange}
                placeholder="e.g., TX"
                maxLength={2}
              />
              <Input
                label="Registration Expiry"
                name="registration_expiry"
                type="date"
                value={formData.registration_expiry}
                onChange={handleChange}
              />
              <Input
                label="Annual Inspection Date"
                name="annual_inspection_date"
                type="date"
                value={formData.annual_inspection_date}
                onChange={handleChange}
              />
              <Input
                label="Annual Inspection Expiry"
                name="annual_inspection_expiry"
                type="date"
                value={formData.annual_inspection_expiry}
                onChange={handleChange}
              />
              <Input
                label="Insurance Policy"
                name="insurance_policy"
                value={formData.insurance_policy}
                onChange={handleChange}
                placeholder="Policy number"
              />
              <Input
                label="Insurance Expiry"
                name="insurance_expiry"
                type="date"
                value={formData.insurance_expiry}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Service & Maintenance */}
        <Card>
          <CardHeader>
            <CardTitle>Service & Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Current Odometer (miles)"
                name="odometer_miles"
                type="number"
                value={formData.odometer_miles}
                onChange={handleChange}
                placeholder="e.g., 450000"
              />
              <Input
                label="Last Service Date"
                name="last_service_date"
                type="date"
                value={formData.last_service_date}
                onChange={handleChange}
              />
              <Input
                label="Next Service Date"
                name="next_service_date"
                type="date"
                value={formData.next_service_date}
                onChange={handleChange}
              />
              <Input
                label="Next Service Miles"
                name="next_service_miles"
                type="number"
                value={formData.next_service_miles}
                onChange={handleChange}
                placeholder="e.g., 475000"
              />
            </div>
          </CardContent>
        </Card>

        {/* ELD Information */}
        <Card>
          <CardHeader>
            <CardTitle>ELD Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="ELD Provider"
                name="eld_provider"
                value={formData.eld_provider}
                onChange={handleChange}
                placeholder="e.g., KeepTruckin"
              />
              <Input
                label="ELD Device ID"
                name="eld_device_id"
                value={formData.eld_device_id}
                onChange={handleChange}
                placeholder="Device serial/ID"
              />
            </div>
          </CardContent>
        </Card>

        {/* Ownership */}
        <Card>
          <CardHeader>
            <CardTitle>Ownership</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Ownership Type
                </label>
                <select
                  name="ownership_type"
                  value={formData.ownership_type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="owned">Company Owned</option>
                  <option value="leased">Leased</option>
                  <option value="owner_operator">Owner Operator</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
              <Input
                label="Owner Name"
                name="owner_name"
                value={formData.owner_name}
                onChange={handleChange}
                placeholder="For owner operators"
              />
              <Input
                label="Lease Company"
                name="lease_company"
                value={formData.lease_company}
                onChange={handleChange}
                placeholder="For leased trucks"
              />
              <Input
                label="Lease End Date"
                name="lease_end_date"
                type="date"
                value={formData.lease_end_date}
                onChange={handleChange}
              />
              <Input
                label="Purchase Date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date}
                onChange={handleChange}
              />
              <Input
                label="Purchase Price"
                name="purchase_price"
                type="number"
                value={formData.purchase_price}
                onChange={handleChange}
                placeholder="e.g., 150000"
              />
            </div>
          </CardContent>
        </Card>

        {/* IRP/IFTA */}
        <Card>
          <CardHeader>
            <CardTitle>IRP / IFTA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Input
                label="IRP Account"
                name="irp_account"
                value={formData.irp_account}
                onChange={handleChange}
              />
              <Input
                label="IRP Expiry"
                name="irp_expiry"
                type="date"
                value={formData.irp_expiry}
                onChange={handleChange}
              />
              <Input
                label="IFTA Account"
                name="ifta_account"
                value={formData.ifta_account}
                onChange={handleChange}
              />
              <Input
                label="IFTA Expiry"
                name="ifta_expiry"
                type="date"
                value={formData.ifta_expiry}
                onChange={handleChange}
              />
            </div>
          </CardContent>
        </Card>

        {/* Sleeper Details (conditional) */}
        {formData.truck_type === 'sleeper' && (
          <Card>
            <CardHeader>
              <CardTitle>Sleeper Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Sleeper Type"
                  name="sleeper_type"
                  value={formData.sleeper_type}
                  onChange={handleChange}
                  placeholder="e.g., Mid-roof, High-roof"
                />
                <Input
                  label="Sleeper Size (inches)"
                  name="sleeper_size"
                  type="number"
                  value={formData.sleeper_size}
                  onChange={handleChange}
                  placeholder="e.g., 70"
                />
              </div>
              <div className="flex flex-wrap gap-6 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_apu"
                    checked={formData.has_apu}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-body-sm text-text-primary">APU</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_inverter"
                    checked={formData.has_inverter}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-body-sm text-text-primary">Inverter</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_fridge"
                    checked={formData.has_fridge}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-body-sm text-text-primary">Refrigerator</span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              placeholder="Additional notes about this truck..."
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={handleBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {isEditing ? 'Save Changes' : 'Add Truck'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TruckFormPage;
