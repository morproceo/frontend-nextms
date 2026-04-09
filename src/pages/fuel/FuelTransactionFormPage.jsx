/**
 * FuelTransactionFormPage - Create/Edit fuel transaction
 *
 * Uses hooks architecture:
 * - useFuelTransaction for edit mode
 * - useFuelTransactionMutations for save
 * - SearchableSelect for assignment fields
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import {
  useFuelTransaction,
  useFuelTransactionMutations,
  useFuelCardsList,
  useDriversList,
  useTrucksList
} from '../../hooks';
import { FuelType, FuelTypeLabels } from '../../enums/fuel';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import {
  ArrowLeft,
  Save,
  Send,
  ChevronDown,
  ChevronRight
} from 'lucide-react';

export function FuelTransactionFormPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEditing = Boolean(transactionId);

  // Hooks
  const {
    transaction,
    loading: detailLoading,
    submitForVerification
  } = useFuelTransaction(transactionId, { autoFetch: isEditing });

  const { createTransaction, updateTransaction, loading: mutating } = useFuelTransactionMutations();

  // Entity lists for assignment
  const { cards: fuelCards, fetchCards } = useFuelCardsList();
  const { drivers, fetchDrivers } = useDriversList();
  const { trucks, fetchTrucks } = useTrucksList();

  // Local state
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showDef, setShowDef] = useState(false);
  const [showAdditional, setShowAdditional] = useState(false);

  const [formData, setFormData] = useState({
    // Transaction Info
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_time: '',
    reference_number: '',
    invoice_number: '',
    // Location
    merchant_name: '',
    city: '',
    state: '',
    zip: '',
    // Fuel Details
    fuel_type: 'diesel',
    gallons: '',
    price_per_gallon: '',
    fuel_amount: '',
    // DEF
    def_gallons: '',
    def_price_per_gallon: '',
    def_amount: '',
    // Additional Charges
    reefer_gallons: '',
    reefer_amount: '',
    merchandise_amount: '',
    cash_advance_amount: '',
    // Totals
    subtotal: '',
    tax_amount: '',
    discount_amount: '',
    total_amount: '',
    fees_amount: '',
    // Assignment
    fuel_card_id: '',
    driver_id: '',
    truck_id: '',
    // Vehicle
    odometer: '',
    miles_since_last_fill: '',
    mpg: '',
    // Notes
    notes: ''
  });

  // Fetch entity lists on mount
  useEffect(() => {
    fetchCards({ status: 'active' });
    fetchDrivers();
    fetchTrucks({ status: 'active' });
  }, []);

  // Populate form when transaction loads (edit mode)
  useEffect(() => {
    if (isEditing && transaction) {
      setFormData({
        transaction_date: transaction.transaction_date ? transaction.transaction_date.split('T')[0] : '',
        transaction_time: transaction.transaction_time || '',
        reference_number: transaction.reference_number || '',
        invoice_number: transaction.invoice_number || '',
        merchant_name: transaction.merchant_name || '',
        city: transaction.city || '',
        state: transaction.state || '',
        zip: transaction.zip || '',
        fuel_type: transaction.fuel_type || 'diesel',
        gallons: transaction.gallons ?? '',
        price_per_gallon: transaction.price_per_gallon ?? '',
        fuel_amount: transaction.fuel_amount ?? '',
        def_gallons: transaction.def_gallons ?? '',
        def_price_per_gallon: transaction.def_price_per_gallon ?? '',
        def_amount: transaction.def_amount ?? '',
        reefer_gallons: transaction.reefer_gallons ?? '',
        reefer_amount: transaction.reefer_amount ?? '',
        merchandise_amount: transaction.merchandise_amount ?? '',
        cash_advance_amount: transaction.cash_advance_amount ?? '',
        subtotal: transaction.subtotal ?? '',
        tax_amount: transaction.tax_amount ?? '',
        discount_amount: transaction.discount_amount ?? '',
        total_amount: transaction.total_amount ?? '',
        fees_amount: transaction.fees_amount ?? '',
        fuel_card_id: transaction.fuel_card_id || '',
        driver_id: transaction.driver_id || '',
        truck_id: transaction.truck_id || '',
        odometer: transaction.odometer ?? '',
        miles_since_last_fill: transaction.miles_since_last_fill ?? '',
        mpg: transaction.mpg ?? '',
        notes: transaction.notes || ''
      });
      // Show collapsible sections if they have data
      if (transaction.def_gallons || transaction.def_amount) setShowDef(true);
      if (transaction.reefer_amount || transaction.merchandise_amount || transaction.cash_advance_amount) setShowAdditional(true);
    }
  }, [isEditing, transaction]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => {
      const updated = { ...prev, [name]: value };

      // Auto-calc fuel_amount from gallons * PPG
      if (name === 'gallons' || name === 'price_per_gallon') {
        const gallons = parseFloat(name === 'gallons' ? value : prev.gallons);
        const ppg = parseFloat(name === 'price_per_gallon' ? value : prev.price_per_gallon);
        if (!isNaN(gallons) && !isNaN(ppg)) {
          updated.fuel_amount = (gallons * ppg).toFixed(2);
        }
      }

      // Auto-calc DEF amount
      if (name === 'def_gallons' || name === 'def_price_per_gallon') {
        const defGal = parseFloat(name === 'def_gallons' ? value : prev.def_gallons);
        const defPpg = parseFloat(name === 'def_price_per_gallon' ? value : prev.def_price_per_gallon);
        if (!isNaN(defGal) && !isNaN(defPpg)) {
          updated.def_amount = (defGal * defPpg).toFixed(2);
        }
      }

      // Auto-sum total_amount
      const fuelAmt = parseFloat(updated.fuel_amount) || 0;
      const defAmt = parseFloat(updated.def_amount) || 0;
      const reeferAmt = parseFloat(updated.reefer_amount) || 0;
      const merchAmt = parseFloat(updated.merchandise_amount) || 0;
      const cashAdv = parseFloat(updated.cash_advance_amount) || 0;
      const taxAmt = parseFloat(updated.tax_amount) || 0;
      const discountAmt = parseFloat(updated.discount_amount) || 0;
      const feesAmt = parseFloat(updated.fees_amount) || 0;

      const computedSubtotal = fuelAmt + defAmt + reeferAmt + merchAmt + cashAdv;
      updated.subtotal = computedSubtotal ? computedSubtotal.toFixed(2) : prev.subtotal;

      const computedTotal = computedSubtotal + taxAmt + feesAmt - discountAmt;
      if (
        name === 'fuel_amount' || name === 'gallons' || name === 'price_per_gallon' ||
        name === 'def_amount' || name === 'def_gallons' || name === 'def_price_per_gallon' ||
        name === 'reefer_amount' || name === 'merchandise_amount' || name === 'cash_advance_amount' ||
        name === 'tax_amount' || name === 'discount_amount' || name === 'fees_amount'
      ) {
        updated.total_amount = computedTotal ? computedTotal.toFixed(2) : '';
      }

      return updated;
    });
  };

  const handleSelectChange = (field, option) => {
    setFormData(prev => ({ ...prev, [field]: option?.id || '' }));
  };

  const handleSubmit = async (e, shouldSubmitForVerification = false) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError(null);

      const data = {};
      // Only include non-empty fields, parse numbers
      const numberFields = [
        'gallons', 'price_per_gallon', 'fuel_amount',
        'def_gallons', 'def_price_per_gallon', 'def_amount',
        'reefer_gallons', 'reefer_amount', 'merchandise_amount', 'cash_advance_amount',
        'subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'fees_amount',
        'odometer', 'miles_since_last_fill', 'mpg'
      ];

      Object.entries(formData).forEach(([key, val]) => {
        if (val === '' || val === null || val === undefined) {
          data[key] = null;
        } else if (numberFields.includes(key)) {
          data[key] = parseFloat(val) || null;
        } else {
          data[key] = val;
        }
      });

      let result;
      if (isEditing) {
        result = await updateTransaction(transactionId, data);
        if (shouldSubmitForVerification) {
          await submitForVerification();
        }
      } else {
        result = await createTransaction(data);
        if (shouldSubmitForVerification && result?.data?.id) {
          // The workflow hook would need the ID, handled by page navigation
        }
      }

      navigate(orgUrl('/fuel/transactions'));
    } catch (err) {
      console.error('Failed to save transaction:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save transaction');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => navigate(orgUrl('/fuel/transactions'));

  // Build options for SearchableSelect
  const fuelCardOptions = (fuelCards || []).map(c => ({
    id: c.id,
    label: `${c.card_number_last4 ? `****${c.card_number_last4}` : c.card_number || 'Card'}`,
    sublabel: c.card_provider || ''
  }));

  const driverOptions = (drivers || []).map(d => ({
    id: d.id,
    label: `${d.first_name} ${d.last_name}`,
    sublabel: d.email || ''
  }));

  const truckOptions = (trucks || []).map(t => ({
    id: t.id,
    label: `#${t.unit_number}`,
    sublabel: `${t.make || ''} ${t.model || ''}`.trim()
  }));

  // Check editability
  if (isEditing && transaction && !transaction.is_editable) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
        </Button>
        <Card padding="default" className="bg-warning/5 border border-warning/20">
          <p className="text-body-sm text-warning">This transaction cannot be edited in its current status.</p>
        </Card>
      </div>
    );
  }

  if (isEditing && detailLoading) {
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
        Back to Transactions
      </Button>

      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">
          {isEditing ? 'Edit Fuel Transaction' : 'Add Fuel Transaction'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {isEditing ? 'Update transaction details' : 'Record a new fuel purchase'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
        </Card>
      )}

      <form onSubmit={(e) => handleSubmit(e, false)}>
        <div className="space-y-6">
          {/* 1. Transaction Info */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Info</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Transaction Date"
                  name="transaction_date"
                  type="date"
                  value={formData.transaction_date}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Transaction Time"
                  name="transaction_time"
                  type="time"
                  value={formData.transaction_time}
                  onChange={handleChange}
                />
                <Input
                  label="Reference Number"
                  name="reference_number"
                  value={formData.reference_number}
                  onChange={handleChange}
                  placeholder="e.g., TXN-12345"
                />
                <Input
                  label="Invoice Number"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleChange}
                  placeholder="e.g., INV-001"
                />
              </div>
            </CardContent>
          </Card>

          {/* 2. Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="sm:col-span-2">
                  <Input
                    label="Merchant Name"
                    name="merchant_name"
                    value={formData.merchant_name}
                    onChange={handleChange}
                    placeholder="e.g., Pilot Flying J"
                  />
                </div>
                <Input
                  label="City"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                />
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    label="State"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    placeholder="ST"
                    maxLength={2}
                  />
                  <Input
                    label="ZIP"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    placeholder="ZIP"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 3. Fuel Details */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    {Object.entries(FuelTypeLabels).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Gallons"
                  name="gallons"
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.gallons}
                  onChange={handleChange}
                  placeholder="0.000"
                />
                <Input
                  label="Price Per Gallon"
                  name="price_per_gallon"
                  type="number"
                  step="0.0001"
                  min="0"
                  value={formData.price_per_gallon}
                  onChange={handleChange}
                  placeholder="0.0000"
                />
                <Input
                  label="Fuel Amount"
                  name="fuel_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fuel_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* 4. DEF (Collapsible) */}
          <Card>
            <button
              type="button"
              onClick={() => setShowDef(prev => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <span className="text-body font-semibold text-text-primary">DEF</span>
              {showDef ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
            </button>
            {showDef && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="DEF Gallons"
                    name="def_gallons"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.def_gallons}
                    onChange={handleChange}
                    placeholder="0.000"
                  />
                  <Input
                    label="DEF Price Per Gallon"
                    name="def_price_per_gallon"
                    type="number"
                    step="0.0001"
                    min="0"
                    value={formData.def_price_per_gallon}
                    onChange={handleChange}
                    placeholder="0.0000"
                  />
                  <Input
                    label="DEF Amount"
                    name="def_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.def_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 5. Additional Charges (Collapsible) */}
          <Card>
            <button
              type="button"
              onClick={() => setShowAdditional(prev => !prev)}
              className="w-full px-6 py-4 flex items-center justify-between text-left"
            >
              <span className="text-body font-semibold text-text-primary">Additional Charges</span>
              {showAdditional ? <ChevronDown className="w-4 h-4 text-text-secondary" /> : <ChevronRight className="w-4 h-4 text-text-secondary" />}
            </button>
            {showAdditional && (
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Input
                    label="Reefer Gallons"
                    name="reefer_gallons"
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.reefer_gallons}
                    onChange={handleChange}
                    placeholder="0.000"
                  />
                  <Input
                    label="Reefer Amount"
                    name="reefer_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.reefer_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <Input
                    label="Merchandise Amount"
                    name="merchandise_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.merchandise_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                  <Input
                    label="Cash Advance Amount"
                    name="cash_advance_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.cash_advance_amount}
                    onChange={handleChange}
                    placeholder="0.00"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* 6. Totals */}
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  label="Subtotal"
                  name="subtotal"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.subtotal}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <Input
                  label="Tax Amount"
                  name="tax_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <Input
                  label="Discount Amount"
                  name="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
                <Input
                  label="Total Amount"
                  name="total_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total_amount}
                  onChange={handleChange}
                  required
                  placeholder="0.00"
                />
                <Input
                  label="Fees Amount"
                  name="fees_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.fees_amount}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* 7. Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                    Fuel Card
                  </label>
                  <SearchableSelect
                    value={formData.fuel_card_id}
                    onChange={(opt) => handleSelectChange('fuel_card_id', opt)}
                    options={fuelCardOptions}
                    placeholder="Select fuel card..."
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                    Driver
                  </label>
                  <SearchableSelect
                    value={formData.driver_id}
                    onChange={(opt) => handleSelectChange('driver_id', opt)}
                    options={driverOptions}
                    placeholder="Select driver..."
                  />
                </div>
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                    Truck
                  </label>
                  <SearchableSelect
                    value={formData.truck_id}
                    onChange={(opt) => handleSelectChange('truck_id', opt)}
                    options={truckOptions}
                    placeholder="Select truck..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 8. Vehicle */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Input
                  label="Odometer"
                  name="odometer"
                  type="number"
                  step="1"
                  min="0"
                  value={formData.odometer}
                  onChange={handleChange}
                  placeholder="e.g., 125000"
                />
                <Input
                  label="Miles Since Last Fill"
                  name="miles_since_last_fill"
                  type="number"
                  step="0.1"
                  min="0"
                  value={formData.miles_since_last_fill}
                  onChange={handleChange}
                  placeholder="0"
                />
                <Input
                  label="MPG"
                  name="mpg"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.mpg}
                  onChange={handleChange}
                  placeholder="0.00"
                />
              </div>
            </CardContent>
          </Card>

          {/* 9. Notes */}
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={3}
                className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
                placeholder="Additional notes..."
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={handleBack}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              disabled={saving}
            >
              {saving ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save as Draft
            </Button>
            <Button
              type="button"
              onClick={(e) => handleSubmit(e, true)}
              disabled={saving}
            >
              {saving ? (
                <Spinner size="sm" className="mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Save & Submit for Verification
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default FuelTransactionFormPage;
