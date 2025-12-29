/**
 * RateConUpload - AI document parsing component
 * Note: loadsApi.parseRateCon kept as exception (specialized AI operation)
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
  Building2,
  MapPin,
  AlertTriangle,
} from 'lucide-react';
import loadsApi from '../../../../api/loads.api'; // Exception: AI parsing operation

export function RateConUpload({ onDataExtracted, onClose }) {
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
      const response = await loadsApi.parseRateCon(file);
      setReviewData(response.data);
    } catch (err) {
      console.error('Failed to parse rate con:', err);
      setError(
        err.response?.data?.error?.message ||
          'Failed to parse document. Please try again or enter details manually.'
      );
    } finally {
      setParsing(false);
    }
  };

  const handleConfirm = () => {
    if (!reviewData) return;

    // Pass the form data, action flags, and the original file to parent
    onDataExtracted({
      formData: reviewData.formData,
      actions: reviewData.actions,
      extracted: reviewData.extracted,
      rateConFile: file, // Include the file for later upload
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

  // Render the review screen after parsing
  if (reviewData) {
    return (
      <div className="bg-white rounded-xl border border-surface-tertiary overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-tertiary bg-success/5">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-body font-medium text-text-primary">
              Rate Con Analyzed
            </span>
          </div>
          <button
            onClick={handleRemoveFile}
            className="text-small text-text-tertiary hover:text-text-secondary"
          >
            Start Over
          </button>
        </div>

        {/* Alerts for new entities */}
        {(reviewData.actions.createBroker ||
          reviewData.actions.createShipper ||
          reviewData.actions.createConsignee) && (
          <div className="p-3 bg-warning/10 border-b border-warning/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0 mt-0.5" />
              <div className="text-small">
                <p className="font-medium text-warning">New records will be created:</p>
                <ul className="mt-1 text-text-secondary space-y-0.5">
                  {reviewData.actions.createBroker && (
                    <li>
                      Broker: <strong>{reviewData.extracted.broker?.name}</strong>
                      {reviewData.extracted.broker?.mc_number &&
                        ` (MC# ${reviewData.extracted.broker.mc_number})`}
                    </li>
                  )}
                  {reviewData.actions.createShipper && (
                    <li>
                      Shipper: <strong>{reviewData.extracted.shipper?.name}</strong>
                      {reviewData.extracted.shipper?.city &&
                        `, ${reviewData.extracted.shipper.city}`}
                    </li>
                  )}
                  {reviewData.actions.createConsignee && (
                    <li>
                      Consignee: <strong>{reviewData.extracted.consignee?.name}</strong>
                      {reviewData.extracted.consignee?.city &&
                        `, ${reviewData.extracted.consignee.city}`}
                    </li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Extracted Data Preview */}
        <div className="p-4 space-y-4">
          {/* Route */}
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
            <MapPin className="w-5 h-5 text-accent flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-body-sm">
                <span className="font-medium text-text-primary truncate">
                  {reviewData.formData.shipper_city || reviewData.formData.shipper_name || 'Pickup'}
                  {reviewData.formData.shipper_state && `, ${reviewData.formData.shipper_state}`}
                </span>
                <span className="text-text-tertiary">→</span>
                <span className="font-medium text-text-primary truncate">
                  {reviewData.formData.consignee_city || reviewData.formData.consignee_name || 'Delivery'}
                  {reviewData.formData.consignee_state && `, ${reviewData.formData.consignee_state}`}
                </span>
              </div>
              <p className="text-small text-text-tertiary mt-0.5">
                {reviewData.formData.pickup_date && `Pickup: ${reviewData.formData.pickup_date}`}
                {reviewData.formData.pickup_date && reviewData.formData.delivery_date && ' • '}
                {reviewData.formData.delivery_date && `Delivery: ${reviewData.formData.delivery_date}`}
              </p>
            </div>
          </div>

          {/* Broker & Rate */}
          <div className="grid grid-cols-2 gap-3">
            {reviewData.formData.broker_name && (
              <div className="p-3 bg-surface-secondary rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-accent" />
                  <span className="text-small text-text-tertiary">Broker</span>
                </div>
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {reviewData.formData.broker_name}
                </p>
                {reviewData.formData.broker_mc && (
                  <p className="text-small text-text-tertiary">
                    MC# {reviewData.formData.broker_mc}
                  </p>
                )}
              </div>
            )}
            {reviewData.formData.revenue && (
              <div className="p-3 bg-success/5 rounded-lg">
                <span className="text-small text-text-tertiary">Rate</span>
                <p className="text-lg font-semibold text-success">
                  ${Number(reviewData.formData.revenue).toLocaleString()}
                </p>
                {reviewData.formData.miles && (
                  <p className="text-small text-text-tertiary">
                    {reviewData.formData.miles} miles
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Additional Info */}
          {(reviewData.formData.commodity || reviewData.formData.weight_lbs) && (
            <div className="text-small text-text-secondary">
              {reviewData.formData.commodity && (
                <span>{reviewData.formData.commodity}</span>
              )}
              {reviewData.formData.commodity && reviewData.formData.weight_lbs && ' • '}
              {reviewData.formData.weight_lbs && (
                <span>{Number(reviewData.formData.weight_lbs).toLocaleString()} lbs</span>
              )}
            </div>
          )}
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
            <p className="text-body-sm font-medium text-text-primary">AI Rate Con Import</p>
            <p className="text-small text-text-tertiary">Upload to auto-fill load details</p>
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
            Drop rate confirmation here
          </p>
          <p className="text-small text-text-tertiary">
            or click to browse (PDF, PNG, JPG)
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
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
                Analyzing document...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Extract Load Details
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}

export default RateConUpload;
