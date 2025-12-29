/**
 * DriverExpenseFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - Uses hooks for API operations
 * - Centralized status configs from config/status
 * - Component focuses on rendering
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useDriverExpense,
  useDriverExpenseMutations,
  useDriverProfiles
} from '../../hooks';
import { ExpenseCategoryConfig } from '../../config/status';
import expensesApi from '../../api/expenses.api';
import uploadsApi from '../../api/uploads.api';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Send,
  Sparkles,
  X,
  Upload,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'debit_card', label: 'Debit Card' },
  { value: 'fuel_card', label: 'Fuel Card' },
  { value: 'comcheck', label: 'Comcheck' },
  { value: 'efs', label: 'EFS' },
  { value: 'other', label: 'Other' }
];

export function DriverExpenseFormPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(expenseId);
  const fileInputRef = useRef(null);

  // Hooks for data and mutations
  const { expense, loading: detailLoading, fetchExpense } = useDriverExpense(expenseId);
  const { profiles, fetchProfiles } = useDriverProfiles();
  const { submitExpense, updateExpense, loading: mutationLoading } = useDriverExpenseMutations();

  // Local state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [receiptFile, setReceiptFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState(null);

  const [formData, setFormData] = useState({
    organization_id: '',
    vendor: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'fuel',
    description: '',
    reference_number: '',
    payment_method: '',
    notes: ''
  });

  // Fetch profiles on mount
  useEffect(() => {
    fetchProfiles();
    if (isEditing) {
      fetchExpense();
    }
  }, [expenseId]);

  // Set default org and populate form on expense load
  useEffect(() => {
    if (profiles?.length === 1 && !formData.organization_id) {
      setFormData(prev => ({ ...prev, organization_id: profiles[0].organization_id }));
    }
  }, [profiles]);

  useEffect(() => {
    if (isEditing && expense) {
      setFormData({
        organization_id: expense.organization_id || '',
        vendor: expense.vendor || '',
        amount: expense.amount || '',
        date: expense.date ? expense.date.split('T')[0] : '',
        category: expense.category || 'fuel',
        description: expense.description || '',
        reference_number: expense.reference_number || '',
        payment_method: expense.payment_method || '',
        notes: expense.notes || ''
      });
    }
  }, [expense, isEditing]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setReceiptFile(selectedFile);
      setParseError(null);
    }
  };

  const handleParseReceipt = async () => {
    if (!receiptFile) return;

    setParsing(true);
    setParseError(null);

    try {
      const response = await expensesApi.parseReceipt(receiptFile);
      const { formData: extractedData } = response.data;

      // Update form with extracted data
      setFormData(prev => ({
        ...prev,
        vendor: extractedData.vendor || prev.vendor,
        amount: extractedData.amount || prev.amount,
        date: extractedData.date || prev.date,
        category: extractedData.category || prev.category,
        description: extractedData.description || prev.description,
        reference_number: extractedData.reference_number || prev.reference_number,
        payment_method: extractedData.payment_method || prev.payment_method
      }));
    } catch (err) {
      console.error('Failed to parse receipt:', err);
      setParseError('Failed to analyze receipt. Please enter details manually.');
    } finally {
      setParsing(false);
    }
  };

  const handleRemoveReceipt = () => {
    setReceiptFile(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.organization_id) {
      setError('Please select an organization');
      return;
    }

    if (!formData.amount || !formData.date) {
      setError('Amount and date are required');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Upload receipt if present
      let receiptData = null;
      if (receiptFile) {
        try {
          receiptData = await uploadsApi.uploadDocument(receiptFile, {
            context: 'expense_receipt',
            docType: 'receipt'
          });
        } catch (err) {
          setError('Failed to upload receipt. Please try again.');
          return;
        }
      }

      const data = {
        organization_id: formData.organization_id,
        vendor: formData.vendor || null,
        amount: parseFloat(formData.amount) || 0,
        date: formData.date,
        category: formData.category,
        description: formData.description || null,
        reference_number: formData.reference_number || null,
        payment_method: formData.payment_method || null,
        notes: formData.notes || null
      };

      if (receiptData) {
        data.receipt_storage_path = receiptData.key;
        data.receipt_file_name = receiptFile.name;
        data.receipt_mime_type = receiptFile.type;
      }

      if (isEditing) {
        data.resubmit = true;
        await updateExpense(expenseId, data);
      } else {
        await submitExpense(data);
      }

      navigate('/driver/expenses');
    } catch (err) {
      console.error('Failed to submit expense:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit expense');
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

  // Get category options from centralized config
  const categoryOptions = Object.entries(ExpenseCategoryConfig).map(([value, config]) => ({
    value,
    label: config.label
  }));

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate('/driver/expenses')} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Expenses
      </Button>

      {/* Header */}
      <div>
        <h1 className="text-title text-text-primary">
          {isEditing ? 'Edit Expense' : 'Submit Expense'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          {isEditing ? 'Update and resubmit for approval' : 'Submit for reimbursement'}
        </p>
      </div>

      {/* Error */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Organization Selection (if multiple) */}
        {profiles.length > 1 && (
          <Card>
            <CardContent>
              <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                Organization
              </label>
              <select
                name="organization_id"
                value={formData.organization_id}
                onChange={handleChange}
                required
                className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Select organization...</option>
                {profiles.map(p => (
                  <option key={p.organization_id} value={p.organization_id}>
                    {p.organization?.name}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>
        )}

        {/* Receipt Upload */}
        <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
          <CardContent>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-accent" />
              <span className="text-body-sm font-medium text-text-primary">
                Scan Receipt (Optional)
              </span>
            </div>

            {!receiptFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-accent/30 rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
              >
                <Upload className="w-8 h-8 text-accent/50 mx-auto mb-2" />
                <p className="text-body-sm text-text-secondary">
                  Tap to upload receipt
                </p>
                <p className="text-small text-text-tertiary mt-1">
                  PDF, PNG, or JPG
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-surface-tertiary">
                  <FileText className="w-5 h-5 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">
                      {receiptFile.name}
                    </p>
                  </div>
                  {!parsing && (
                    <button
                      type="button"
                      onClick={handleRemoveReceipt}
                      className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {parseError && (
                  <div className="flex items-start gap-2 p-2 bg-error/10 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-error flex-shrink-0" />
                    <p className="text-small text-error">{parseError}</p>
                  </div>
                )}

                <Button
                  type="button"
                  onClick={handleParseReceipt}
                  disabled={parsing}
                  className="w-full"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract Details
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Main Form */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Vendor/Merchant"
              name="vendor"
              value={formData.vendor}
              onChange={handleChange}
              placeholder="e.g., Pilot, Love's"
            />

            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.amount}
                onChange={handleChange}
                required
                placeholder="0.00"
              />
              <Input
                label="Date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                Category
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                {categoryOptions.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-1.5">
                Payment Method
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value="">Select...</option>
                {paymentMethods.map(pm => (
                  <option key={pm.value} value={pm.value}>{pm.label}</option>
                ))}
              </select>
            </div>

            <Input
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description"
            />

            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={2}
              placeholder="Additional notes..."
              className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-input text-body text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </CardContent>
        </Card>

        {/* Receipt Attached Indicator */}
        {receiptFile && (
          <Card className="bg-success/5 border border-success/20">
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <span className="text-body-sm text-success font-medium">
                  Receipt attached
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={saving}
          className="w-full"
          size="lg"
        >
          {saving ? (
            <Spinner size="sm" className="mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isEditing ? 'Resubmit for Approval' : 'Submit for Approval'}
        </Button>
      </form>
    </div>
  );
}

export default DriverExpenseFormPage;
