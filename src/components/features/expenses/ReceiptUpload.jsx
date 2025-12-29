/**
 * ReceiptUpload - AI receipt parsing component
 * Note: expensesApi.parseReceipt kept as exception (specialized AI operation)
 */

import { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  DollarSign,
  Calendar,
  Store,
  Tag
} from 'lucide-react';
import { ExpenseCategoryConfig } from '../../../config/status';
import expensesApi from '../../../api/expenses.api'; // Exception: AI parsing operation

// Build category labels from centralized config
const categoryLabels = Object.fromEntries(
  Object.entries(ExpenseCategoryConfig).map(([key, config]) => [key, config.label])
);

export function ReceiptUpload({ onDataExtracted, onClose }) {
  const [file, setFile] = useState(null);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError(null);
      setReviewData(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
      setError(null);
      setReviewData(null);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleParse = async () => {
    if (!file) return;

    setParsing(true);
    setError(null);

    try {
      const response = await expensesApi.parseReceipt(file);
      setReviewData(response.data);
    } catch (err) {
      console.error('Failed to parse receipt:', err);
      setError(
        err.response?.data?.error?.message ||
          'Failed to parse receipt. Please try again or enter details manually.'
      );
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!reviewData) return;

    onDataExtracted({
      formData: reviewData.formData,
      extracted: reviewData.extracted,
      file
    });
  };

  const handleRemoveFile = () => {
    setFile(null);
    setError(null);
    setReviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Render the review screen after parsing
  if (reviewData) {
    const { formData, extracted } = reviewData;

    return (
      <div className="bg-white rounded-xl border border-surface-tertiary overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-tertiary bg-success/5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-body font-medium text-text-primary">
              Receipt Analyzed
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="text-small text-text-tertiary hover:text-text-secondary"
          >
            Start Over
          </button>
        </div>

        {/* Extracted Data Preview */}
        <div className="p-4 space-y-4">
          {/* Main Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Vendor */}
            {formData.vendor && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Store className="w-4 h-4 text-accent" />
                  <span className="text-small text-text-tertiary">Vendor</span>
                </div>
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {formData.vendor}
                </p>
              </div>
            )}

            {/* Amount */}
            {formData.amount && (
              <div className="p-3 bg-success/5 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-success" />
                  <span className="text-small text-text-tertiary">Amount</span>
                </div>
                <p className="text-lg font-semibold text-success">
                  {formatCurrency(formData.amount)}
                </p>
              </div>
            )}

            {/* Date */}
            {formData.date && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-accent" />
                  <span className="text-small text-text-tertiary">Date</span>
                </div>
                <p className="text-body-sm font-medium text-text-primary">
                  {formData.date}
                </p>
              </div>
            )}

            {/* Category */}
            {formData.category && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Tag className="w-4 h-4 text-accent" />
                  <span className="text-small text-text-tertiary">Category</span>
                </div>
                <p className="text-body-sm font-medium text-text-primary">
                  {categoryLabels[formData.category] || formData.category}
                </p>
              </div>
            )}
          </div>

          {/* Description */}
          {formData.description && (
            <div className="p-3 bg-surface-secondary rounded-lg">
              <p className="text-small text-text-tertiary mb-1">Description</p>
              <p className="text-body-sm text-text-primary">{formData.description}</p>
            </div>
          )}

          {/* Line Items */}
          {extracted?.line_items?.length > 0 && (
            <div className="p-3 bg-surface-secondary rounded-lg">
              <p className="text-small text-text-tertiary mb-2">Line Items</p>
              <div className="space-y-1">
                {extracted.line_items.slice(0, 5).map((item, idx) => (
                  <div key={idx} className="flex justify-between text-small">
                    <span className="text-text-secondary truncate max-w-[200px]">
                      {item.description}
                    </span>
                    <span className="text-text-primary font-medium">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                ))}
                {extracted.line_items.length > 5 && (
                  <p className="text-small text-text-tertiary">
                    +{extracted.line_items.length - 5} more items
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Reference & Payment */}
          <div className="flex flex-wrap gap-3 text-small text-text-secondary">
            {formData.reference_number && (
              <span>Ref: {formData.reference_number}</span>
            )}
            {formData.payment_method && (
              <span>Paid: {formData.payment_method.replace('_', ' ')}</span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-surface-tertiary bg-surface-secondary/50">
          <div className="flex gap-3">
            <button
              onClick={handleRemoveFile}
              className="flex-1 py-2.5 px-4 rounded-lg border border-surface-tertiary text-body-sm font-medium text-text-secondary hover:bg-surface-secondary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 py-2.5 px-4 rounded-lg bg-accent text-white text-body-sm font-medium hover:bg-accent/90 transition-colors flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Use This Data
            </button>
          </div>
          <p className="text-center text-small text-text-tertiary mt-2">
            You can edit all fields after import
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-accent/5 to-accent/10 rounded-xl p-4 border border-accent/20">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-accent" />
          </div>
          <div>
            <p className="text-body-sm font-medium text-text-primary">AI Receipt Scanner</p>
            <p className="text-small text-text-tertiary">Upload to auto-fill expense details</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {!file ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          className="border-2 border-dashed border-accent/30 rounded-lg p-6 text-center cursor-pointer hover:border-accent/50 hover:bg-accent/5 transition-all"
        >
          <Upload className="w-8 h-8 text-accent/50 mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary mb-1">
            Drop receipt here
          </p>
          <p className="text-small text-text-tertiary">
            or click to browse (PDF, PNG, JPG)
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
          {/* File Preview */}
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-surface-tertiary">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
              <FileText className="w-5 h-5 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-body-sm font-medium text-text-primary truncate">
                {file.name}
              </p>
              <p className="text-small text-text-tertiary">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
            {!parsing && (
              <button
                onClick={handleRemoveFile}
                className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-error/10 rounded-lg">
              <AlertCircle className="w-4 h-4 text-error flex-shrink-0 mt-0.5" />
              <p className="text-small text-error">{error}</p>
            </div>
          )}

          {/* Parse Button */}
          <button
            onClick={handleParse}
            disabled={parsing}
            className={`
              w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium transition-all
              ${
                parsing
                  ? 'bg-accent/50 text-white cursor-not-allowed'
                  : 'bg-accent text-white hover:bg-accent/90'
              }
            `}
          >
            {parsing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analyzing receipt...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Expense Details
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default ReceiptUpload;
