/**
 * TrailerFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Uses useTrailer for editing, useTrailers for creation
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrailer, useTrailers } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, Save, Snowflake } from 'lucide-react';

export function TrailerFormPage() {
  const { trailerId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEditing = Boolean(trailerId);

  // Hooks for data and mutations
  const { trailer, loading: detailLoading, updateTrailer, mutating: updating } = useTrailer(trailerId, { autoFetch: isEditing });
  const { createTrailer, mutating: creating } = useTrailers({ autoFetch: false });

  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    unit_number: '',
    type: 'dry_van',
    status: 'active',
    vin: '',
    make: '',
    model: '',
    year: '',
    color: '',
    length_ft: '',
    width_inches: '',
    height_inches: '',
    door_type: '',
    axle_count: '',
    gvwr_lbs: '',
    empty_weight_lbs: '',
    max_payload_lbs: '',
    reefer_make: '',
    reefer_model: '',
    reefer_year: '',
    reefer_serial: '',
    reefer_hours: '',
    min_temp_f: '',
    has_multi_temp: false,
    license_plate: '',
    license_state: '',
    license_expiry: '',
    registration_expiry: '',
    annual_inspection_date: '',
    annual_inspection_expiry: '',
    last_service_date: '',
    next_service_date: '',
    ownership_type: 'owned',
    owner_name: '',
    lease_company: '',
    lease_end_date: '',
    purchase_date: '',
    purchase_price: '',
    irp_account: '',
    irp_expiry: '',
    insurance_policy: '',
    insurance_expiry: '',
    has_liftgate: false,
    has_pallet_jack: false,
    has_e_track: false,
    has_load_bars: false,
    has_straps: false,
    has_vents: false,
    floor_type: '',
    notes: ''
  });

  // Format date for input fields
  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toISOString().split('T')[0];
  };

  // Populate form when trailer data loads
  useEffect(() => {
    if (isEditing && trailer) {
      setFormData({
        unit_number: trailer.unit_number || '',
        type: trailer.type || 'dry_van',
        status: trailer.status || 'active',
        vin: trailer.vin || '',
        make: trailer.make || '',
        model: trailer.model || '',
        year: trailer.year || '',
        color: trailer.color || '',
        length_ft: trailer.length_ft || '',
        width_inches: trailer.width_inches || '',
        height_inches: trailer.height_inches || '',
        door_type: trailer.door_type || '',
        axle_count: trailer.axle_count || '',
        gvwr_lbs: trailer.gvwr_lbs || '',
        empty_weight_lbs: trailer.empty_weight_lbs || '',
        max_payload_lbs: trailer.max_payload_lbs || '',
        reefer_make: trailer.reefer_make || '',
        reefer_model: trailer.reefer_model || '',
        reefer_year: trailer.reefer_year || '',
        reefer_serial: trailer.reefer_serial || '',
        reefer_hours: trailer.reefer_hours || '',
        min_temp_f: trailer.min_temp_f !== null && trailer.min_temp_f !== undefined ? trailer.min_temp_f : '',
        has_multi_temp: trailer.has_multi_temp || false,
        license_plate: trailer.license_plate || '',
        license_state: trailer.license_state || '',
        license_expiry: formatDateForInput(trailer.license_expiry),
        registration_expiry: formatDateForInput(trailer.registration_expiry),
        annual_inspection_date: formatDateForInput(trailer.annual_inspection_date),
        annual_inspection_expiry: formatDateForInput(trailer.annual_inspection_expiry),
        last_service_date: formatDateForInput(trailer.last_service_date),
        next_service_date: formatDateForInput(trailer.next_service_date),
        ownership_type: trailer.ownership_type || 'owned',
        owner_name: trailer.owner_name || '',
        lease_company: trailer.lease_company || '',
        lease_end_date: formatDateForInput(trailer.lease_end_date),
        purchase_date: formatDateForInput(trailer.purchase_date),
        purchase_price: trailer.purchase_price || '',
        irp_account: trailer.irp_account || '',
        irp_expiry: formatDateForInput(trailer.irp_expiry),
        insurance_policy: trailer.insurance_policy || '',
        insurance_expiry: formatDateForInput(trailer.insurance_expiry),
        has_liftgate: trailer.has_liftgate || false,
        has_pallet_jack: trailer.has_pallet_jack || false,
        has_e_track: trailer.has_e_track || false,
        has_load_bars: trailer.has_load_bars || false,
        has_straps: trailer.has_straps || false,
        has_vents: trailer.has_vents || false,
        floor_type: trailer.floor_type || '',
        notes: trailer.notes || ''
      });
    }
  }, [isEditing, trailer]);

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

      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([, v]) => v !== '' && v !== null)
      );

      if (isEditing) {
        await updateTrailer(cleanData);
      } else {
        await createTrailer(cleanData);
      }

      navigate(orgUrl('/assets/trailers'));
    } catch (err) {
      console.error('Failed to save trailer:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save trailer');
    }
  };

  const handleBack = () => {
    navigate(orgUrl('/assets/trailers'));
  };

  const isReefer = formData.type === 'reefer';
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
        Back to Trailers
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">
          {isEditing ? 'Edit Trailer' : 'Add New Trailer'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {isEditing ? 'Update trailer information' : 'Add a new trailer to your fleet'}
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
                placeholder="e.g., T101"
              />
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                  Trailer Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                >
                  <option value="dry_van">Dry Van</option>
                  <option value="reefer">Reefer</option>
                  <option value="flatbed">Flatbed</option>
                  <option value="step_deck">Step Deck</option>
                  <option value="lowboy">Lowboy</option>
                  <option value="tanker">Tanker</option>
                  <option value="hopper">Hopper</option>
                  <option value="livestock">Livestock</option>
                  <option value="auto_carrier">Auto Carrier</option>
                  <option value="intermodal">Intermodal</option>
                  <option value="other">Other</option>
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
            </div>
          </CardContent>
        </Card>

        {/* Vehicle Details */}
        <Card>
          <CardHeader>
            <CardTitle>Trailer Details</CardTitle>
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
                placeholder="e.g., Great Dane"
              />
              <Input
                label="Model"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="e.g., Champion"
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
              <Input
                label="Door Type"
                name="door_type"
                value={formData.door_type}
                onChange={handleChange}
                placeholder="e.g., Swing, Roll-up"
              />
              <Input
                label="Floor Type"
                name="floor_type"
                value={formData.floor_type}
                onChange={handleChange}
                placeholder="e.g., Wood, Aluminum"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dimensions */}
        <Card>
          <CardHeader>
            <CardTitle>Dimensions & Capacity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <Input
                label="Length (ft)"
                name="length_ft"
                type="number"
                value={formData.length_ft}
                onChange={handleChange}
                placeholder="e.g., 53"
              />
              <Input
                label="Width (inches)"
                name="width_inches"
                type="number"
                value={formData.width_inches}
                onChange={handleChange}
                placeholder="e.g., 102"
              />
              <Input
                label="Height (inches)"
                name="height_inches"
                type="number"
                value={formData.height_inches}
                onChange={handleChange}
                placeholder="e.g., 110"
              />
              <Input
                label="Axle Count"
                name="axle_count"
                type="number"
                value={formData.axle_count}
                onChange={handleChange}
                placeholder="e.g., 2"
                min={1}
                max={10}
              />
              <Input
                label="GVWR (lbs)"
                name="gvwr_lbs"
                type="number"
                value={formData.gvwr_lbs}
                onChange={handleChange}
                placeholder="e.g., 80000"
              />
              <Input
                label="Empty Weight (lbs)"
                name="empty_weight_lbs"
                type="number"
                value={formData.empty_weight_lbs}
                onChange={handleChange}
                placeholder="e.g., 15000"
              />
              <Input
                label="Max Payload (lbs)"
                name="max_payload_lbs"
                type="number"
                value={formData.max_payload_lbs}
                onChange={handleChange}
                placeholder="e.g., 45000"
              />
            </div>
          </CardContent>
        </Card>

        {/* Reefer Information (conditional) */}
        {isReefer && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Snowflake className="w-5 h-5 text-blue-500" />
                Reefer Unit Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <Input
                  label="Reefer Make"
                  name="reefer_make"
                  value={formData.reefer_make}
                  onChange={handleChange}
                  placeholder="e.g., Carrier, Thermo King"
                />
                <Input
                  label="Reefer Model"
                  name="reefer_model"
                  value={formData.reefer_model}
                  onChange={handleChange}
                  placeholder="e.g., X4 7500"
                />
                <Input
                  label="Reefer Year"
                  name="reefer_year"
                  type="number"
                  value={formData.reefer_year}
                  onChange={handleChange}
                  placeholder="e.g., 2023"
                />
                <Input
                  label="Reefer Serial"
                  name="reefer_serial"
                  value={formData.reefer_serial}
                  onChange={handleChange}
                  placeholder="Serial number"
                />
                <Input
                  label="Reefer Hours"
                  name="reefer_hours"
                  type="number"
                  value={formData.reefer_hours}
                  onChange={handleChange}
                  placeholder="e.g., 5000"
                />
                <Input
                  label="Min Temperature (°F)"
                  name="min_temp_f"
                  type="number"
                  value={formData.min_temp_f}
                  onChange={handleChange}
                  placeholder="e.g., -20"
                />
              </div>
              <div className="mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="has_multi_temp"
                    checked={formData.has_multi_temp}
                    onChange={handleChange}
                    className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                  />
                  <span className="text-body-sm text-text-primary">Multi-Temperature Zones</span>
                </label>
              </div>
            </CardContent>
          </Card>
        )}

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
                label="License Expiry"
                name="license_expiry"
                type="date"
                value={formData.license_expiry}
                onChange={handleChange}
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

        {/* Service */}
        <Card>
          <CardHeader>
            <CardTitle>Service & Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  <option value="customer">Customer Trailer</option>
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
                placeholder="For leased trailers"
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
                placeholder="e.g., 50000"
              />
            </div>
          </CardContent>
        </Card>

        {/* IRP */}
        <Card>
          <CardHeader>
            <CardTitle>IRP Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            </div>
          </CardContent>
        </Card>

        {/* Features & Equipment */}
        <Card>
          <CardHeader>
            <CardTitle>Features & Equipment</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_liftgate"
                  checked={formData.has_liftgate}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">Liftgate</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_pallet_jack"
                  checked={formData.has_pallet_jack}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">Pallet Jack</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_e_track"
                  checked={formData.has_e_track}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">E-Track</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_load_bars"
                  checked={formData.has_load_bars}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">Load Bars</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_straps"
                  checked={formData.has_straps}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">Straps</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="has_vents"
                  checked={formData.has_vents}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-gray-300 text-accent focus:ring-accent"
                />
                <span className="text-body-sm text-text-primary">Vents</span>
              </label>
            </div>
          </CardContent>
        </Card>

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
              placeholder="Additional notes about this trailer..."
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
            {isEditing ? 'Save Changes' : 'Add Trailer'}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default TrailerFormPage;
