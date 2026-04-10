/**
 * SettlementFormPage - Create new, edit draft, or view approved/paid settlements
 *
 * Two modes:
 * - Create mode (/settlements/new): select driver, period dates, create
 * - View/Edit mode (/settlements/:settlementId): full settlement builder/viewer
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDriversList } from '../../hooks';
import settlementsApi from '../../api/settlements.api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Send,
  CheckCircle,
  DollarSign,
  XCircle,
  FileText
} from 'lucide-react';

// --- Helpers ---

const formatCurrency = (value) => {
  const num = parseFloat(value);
  if (isNaN(num)) return '$0.00';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatDate = (dateStr) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T12:00:00'));
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const STATUS_BADGE_VARIANT = {
  draft: 'gray',
  pending_review: 'yellow',
  approved: 'blue',
  paid: 'green',
  void: 'red',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  paid: 'Paid',
  void: 'Voided',
};

const ITEM_TYPE_BADGE = {
  load_pay: 'blue',
  deduction: 'red',
  addition: 'green',
  advance: 'orange',
  reimbursement: 'purple',
};

const ITEM_TYPE_LABELS = {
  load_pay: 'Load Pay',
  deduction: 'Deduction',
  addition: 'Addition',
  advance: 'Advance',
  reimbursement: 'Reimbursement',
};

const PAYMENT_METHODS = [
  { value: 'check', label: 'Check' },
  { value: 'ach', label: 'ACH' },
  { value: 'cash', label: 'Cash' },
  { value: 'wire', label: 'Wire' },
  { value: 'other', label: 'Other' },
];

const CUSTOM_ITEM_TYPES = [
  { value: 'deduction', label: 'Deduction' },
  { value: 'addition', label: 'Addition' },
  { value: 'advance', label: 'Advance' },
  { value: 'reimbursement', label: 'Reimbursement' },
];

// --- Component ---

export function SettlementFormPage() {
  const { settlementId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isCreateMode = !settlementId;

  // Shared state
  const { drivers, fetchDrivers } = useDriversList();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Create mode state
  const [createForm, setCreateForm] = useState({
    driver_id: '',
    period_start: '',
    period_end: '',
  });

  // View/Edit mode state
  const [settlement, setSettlement] = useState(null);
  const [availableLoads, setAvailableLoads] = useState([]);
  const [loadsLoading, setLoadsLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Custom item form
  const [showCustomItemForm, setShowCustomItemForm] = useState(false);
  const [customItem, setCustomItem] = useState({
    item_type: 'deduction',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  // Payment modal state
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    payment_method: 'check',
    payment_date: new Date().toISOString().split('T')[0],
    payment_reference: '',
  });

  // Fetch drivers on mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Fetch settlement in view/edit mode
  const fetchSettlement = useCallback(async () => {
    if (!settlementId) return;
    try {
      setLoading(true);
      const res = await settlementsApi.getSettlement(settlementId);
      const data = res?.data || res;
      setSettlement(data);
    } catch (err) {
      console.error('Failed to fetch settlement:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load settlement');
    } finally {
      setLoading(false);
    }
  }, [settlementId]);

  useEffect(() => {
    fetchSettlement();
  }, [fetchSettlement]);

  // Fetch available loads when we have a draft settlement with a driver
  const fetchAvailableLoads = useCallback(async (driverId) => {
    if (!driverId) return;
    try {
      setLoadsLoading(true);
      const res = await settlementsApi.getAvailableLoads(driverId);
      const data = res?.data || res;
      setAvailableLoads(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch available loads:', err);
      setAvailableLoads([]);
    } finally {
      setLoadsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (settlement?.status === 'draft' && settlement?.driver_id) {
      fetchAvailableLoads(settlement.driver_id);
    }
  }, [settlement?.status, settlement?.driver_id, fetchAvailableLoads]);

  // --- Handlers ---

  const handleBack = () => navigate(orgUrl('/settlements'));

  // Create mode
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.driver_id) {
      setError('Please select a driver');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const res = await settlementsApi.createSettlement(createForm);
      const data = res?.data || res;
      navigate(orgUrl(`/settlements/${data.id}`));
    } catch (err) {
      console.error('Failed to create settlement:', err);
      setError(err.response?.data?.message || err.message || 'Failed to create settlement');
    } finally {
      setLoading(false);
    }
  };

  // Add load to settlement
  const handleAddLoad = async (load) => {
    try {
      setActionLoading(true);
      const lane = [load.shipper_city, load.consignee_city].filter(Boolean).join(' → ');
      await settlementsApi.addItem(settlementId, {
        item_type: 'load_pay',
        load_id: load.id,
        description: `Load #${load.reference_number || load.id} - ${lane}`,
        amount: load.driver_pay,
        date: load.delivery_date,
      });
      await fetchSettlement();
      await fetchAvailableLoads(settlement.driver_id);
    } catch (err) {
      console.error('Failed to add load:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add load');
    } finally {
      setActionLoading(false);
    }
  };

  // Remove item
  const handleRemoveItem = async (itemId) => {
    try {
      setActionLoading(true);
      await settlementsApi.removeItem(settlementId, itemId);
      await fetchSettlement();
      if (settlement?.status === 'draft' && settlement?.driver_id) {
        await fetchAvailableLoads(settlement.driver_id);
      }
    } catch (err) {
      console.error('Failed to remove item:', err);
      setError(err.response?.data?.message || err.message || 'Failed to remove item');
    } finally {
      setActionLoading(false);
    }
  };

  // Add custom item
  const handleAddCustomItem = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await settlementsApi.addItem(settlementId, {
        ...customItem,
        amount: parseFloat(customItem.amount),
      });
      setCustomItem({ item_type: 'deduction', description: '', amount: '', date: new Date().toISOString().split('T')[0] });
      setShowCustomItemForm(false);
      await fetchSettlement();
    } catch (err) {
      console.error('Failed to add custom item:', err);
      setError(err.response?.data?.message || err.message || 'Failed to add item');
    } finally {
      setActionLoading(false);
    }
  };

  // Workflow actions
  const handleSubmitForReview = async () => {
    try {
      setActionLoading(true);
      await settlementsApi.submitForReview(settlementId);
      await fetchSettlement();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to submit');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    try {
      setActionLoading(true);
      await settlementsApi.approveSettlement(settlementId);
      await fetchSettlement();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkAsPaid = async (e) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await settlementsApi.paySettlement(settlementId, paymentForm);
      setShowPaymentModal(false);
      await fetchSettlement();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to mark as paid');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVoid = async () => {
    try {
      setActionLoading(true);
      await settlementsApi.voidSettlement(settlementId);
      await fetchSettlement();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to void');
    } finally {
      setActionLoading(false);
    }
  };

  // --- Driver options ---
  const driverOptions = (drivers || []).map((d) => ({
    id: d.id,
    label: `${d.first_name} ${d.last_name}`,
    sublabel: d.email || '',
  }));

  // --- Compute summary from items ---
  const items = settlement?.items || [];
  const totalLoadPay = items.filter((i) => i.item_type === 'load_pay').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalDeductions = items.filter((i) => i.item_type === 'deduction' || i.item_type === 'advance').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const totalAdditions = items.filter((i) => i.item_type === 'addition' || i.item_type === 'reimbursement').reduce((s, i) => s + parseFloat(i.amount || 0), 0);
  const netPay = settlement?.net_pay != null ? parseFloat(settlement.net_pay) : (totalLoadPay + totalAdditions - totalDeductions);

  const isDraft = settlement?.status === 'draft';
  const driverName = settlement?.driver
    ? `${settlement.driver.first_name} ${settlement.driver.last_name}`
    : '';

  // --- Loading state ---
  if (!isCreateMode && loading && !settlement) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // --- Create Mode ---
  if (isCreateMode) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settlements
        </Button>

        <div>
          <h1 className="text-title text-text-primary">New Settlement</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Create a new driver settlement
          </p>
        </div>

        {error && (
          <Card padding="default" className="bg-error/5 border border-error/20">
            <p className="text-body-sm text-error">{error}</p>
          </Card>
        )}

        <form onSubmit={handleCreateSubmit}>
          <Card>
            <CardHeader>
              <CardTitle>Settlement Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                    Driver <span className="text-error">*</span>
                  </label>
                  <SearchableSelect
                    value={createForm.driver_id}
                    onChange={(opt) => setCreateForm((prev) => ({ ...prev, driver_id: opt?.id || '' }))}
                    options={driverOptions}
                    placeholder="Select driver..."
                  />
                </div>
                <Input
                  label="Period Start"
                  name="period_start"
                  type="date"
                  value={createForm.period_start}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, period_start: e.target.value }))}
                />
                <Input
                  label="Period End"
                  name="period_end"
                  type="date"
                  value={createForm.period_end}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, period_end: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end mt-6">
            <Button type="submit" disabled={loading || !createForm.driver_id}>
              {loading ? <Spinner size="sm" className="mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Create Settlement
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // --- View/Edit Mode ---
  if (!settlement) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Settlements
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error || 'Settlement not found'}</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Settlements
      </Button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-title text-text-primary">
            Settlement #{settlement.settlement_number || settlement.id}
          </h1>
          <Badge variant={STATUS_BADGE_VARIANT[settlement.status] || 'gray'}>
            {STATUS_LABELS[settlement.status] || settlement.status}
          </Badge>
        </div>
        {driverName && (
          <p className="text-body text-text-secondary">{driverName}</p>
        )}
      </div>

      {/* Error */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
        </Card>
      )}

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Settlement Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-small text-text-tertiary">Total Load Pay</p>
              <p className="text-body font-semibold text-text-primary">{formatCurrency(totalLoadPay)}</p>
            </div>
            <div>
              <p className="text-small text-text-tertiary">Total Deductions</p>
              <p className="text-body font-semibold text-red-600">{formatCurrency(totalDeductions)}</p>
            </div>
            <div>
              <p className="text-small text-text-tertiary">Total Additions</p>
              <p className="text-body font-semibold text-green-600">{formatCurrency(totalAdditions)}</p>
            </div>
            <div>
              <p className="text-small text-text-tertiary">Net Pay</p>
              <p className="text-heading text-text-primary font-bold">{formatCurrency(netPay)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Available Loads (draft only) */}
      {isDraft && (
        <Card>
          <CardHeader>
            <CardTitle>Available Loads</CardTitle>
          </CardHeader>
          <CardContent>
            {loadsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : availableLoads.length === 0 ? (
              <p className="text-body-sm text-text-tertiary py-4">No available loads for this driver.</p>
            ) : (
              <div className="space-y-2">
                {availableLoads.map((load) => {
                  const lane = [load.shipper_city, load.consignee_city].filter(Boolean).join(' → ');
                  return (
                    <div
                      key={load.id}
                      className="flex items-center justify-between gap-4 p-3 rounded-lg bg-surface-secondary"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-body-sm font-medium text-text-primary">
                            #{load.reference_number || load.id}
                          </span>
                          {lane && (
                            <span className="text-small text-text-secondary truncate">{lane}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-0.5">
                          <span className="text-body-sm font-semibold text-text-primary">
                            {formatCurrency(load.driver_pay)}
                          </span>
                          {load.delivery_date && (
                            <span className="text-small text-text-tertiary">
                              {formatDate(load.delivery_date)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleAddLoad(load)}
                        disabled={actionLoading}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Add
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Settlement Items Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Settlement Items</CardTitle>
            {isDraft && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowCustomItemForm(!showCustomItemForm)}
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Custom Item
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Custom item form (inline) */}
          {showCustomItemForm && isDraft && (
            <form onSubmit={handleAddCustomItem} className="mb-4 p-4 rounded-lg bg-surface-secondary">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">Type</label>
                  <select
                    value={customItem.item_type}
                    onChange={(e) => setCustomItem((prev) => ({ ...prev, item_type: e.target.value }))}
                    className="w-full px-3 py-2 bg-white border-0 rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {CUSTOM_ITEM_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Description"
                  value={customItem.description}
                  onChange={(e) => setCustomItem((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Fuel advance"
                  required
                />
                <Input
                  label="Amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={customItem.amount}
                  onChange={(e) => setCustomItem((prev) => ({ ...prev, amount: e.target.value }))}
                  placeholder="0.00"
                  required
                />
                <Input
                  label="Date"
                  type="date"
                  value={customItem.date}
                  onChange={(e) => setCustomItem((prev) => ({ ...prev, date: e.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2 mt-3">
                <Button type="button" size="sm" variant="ghost" onClick={() => setShowCustomItemForm(false)}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={actionLoading}>
                  {actionLoading ? <Spinner size="sm" className="mr-1" /> : null}
                  Add Item
                </Button>
              </div>
            </form>
          )}

          {/* Items list */}
          {items.length === 0 ? (
            <p className="text-body-sm text-text-tertiary py-4">No items yet. Add loads or custom items above.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="text-left text-small font-medium text-text-tertiary py-2 pr-4">Description</th>
                    <th className="text-left text-small font-medium text-text-tertiary py-2 pr-4">Type</th>
                    <th className="text-right text-small font-medium text-text-tertiary py-2 pr-4">Amount</th>
                    <th className="text-left text-small font-medium text-text-tertiary py-2 pr-4">Date</th>
                    {isDraft && (
                      <th className="text-right text-small font-medium text-text-tertiary py-2"></th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className="border-b border-surface-tertiary last:border-0">
                      <td className="py-3 pr-4 text-body-sm text-text-primary">{item.description}</td>
                      <td className="py-3 pr-4">
                        <Badge variant={ITEM_TYPE_BADGE[item.item_type] || 'gray'}>
                          {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4 text-body-sm text-text-primary text-right font-medium">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="py-3 pr-4 text-body-sm text-text-secondary">
                        {formatDate(item.date)}
                      </td>
                      {isDraft && (
                        <td className="py-3 text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleRemoveItem(item.id)}
                            disabled={actionLoading}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Details (paid status) */}
      {settlement.status === 'paid' && (
        <Card>
          <CardHeader>
            <CardTitle>Payment Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-small text-text-tertiary">Payment Date</p>
                <p className="text-body-sm font-medium text-text-primary">
                  {formatDate(settlement.payment_date)}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Payment Method</p>
                <p className="text-body-sm font-medium text-text-primary capitalize">
                  {settlement.payment_method || '-'}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Reference #</p>
                <p className="text-body-sm font-medium text-text-primary">
                  {settlement.payment_reference || '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Modal (for Mark as Paid) */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <Card padding="default" className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle>Confirm Payment</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMarkAsPaid} className="space-y-4">
                <div>
                  <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                    Payment Method
                  </label>
                  <select
                    value={paymentForm.payment_method}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_method: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Payment Date"
                  type="date"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_date: e.target.value }))}
                  required
                />
                <Input
                  label="Reference #"
                  value={paymentForm.payment_reference}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, payment_reference: e.target.value }))}
                  placeholder="e.g., Check #1234"
                />
                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowPaymentModal(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={actionLoading}>
                    {actionLoading ? <Spinner size="sm" className="mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                    Confirm Payment
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        {settlement.status === 'draft' && (
          <Button onClick={handleSubmitForReview} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" className="mr-2" /> : <Send className="w-4 h-4 mr-2" />}
            Submit for Review
          </Button>
        )}

        {settlement.status === 'pending_review' && (
          <Button onClick={handleApprove} disabled={actionLoading}>
            {actionLoading ? <Spinner size="sm" className="mr-2" /> : <CheckCircle className="w-4 h-4 mr-2" />}
            Approve
          </Button>
        )}

        {settlement.status === 'approved' && (
          <Button onClick={() => setShowPaymentModal(true)} disabled={actionLoading}>
            <DollarSign className="w-4 h-4 mr-2" />
            Mark as Paid
          </Button>
        )}

        {settlement.status === 'void' && (
          <span className="text-body-sm text-text-tertiary font-medium">Voided</span>
        )}

        {settlement.status !== 'paid' && settlement.status !== 'void' && (
          <Button
            variant="secondary"
            onClick={handleVoid}
            disabled={actionLoading}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <XCircle className="w-4 h-4 mr-2" />
            Void
          </Button>
        )}
      </div>
    </div>
  );
}

export default SettlementFormPage;
