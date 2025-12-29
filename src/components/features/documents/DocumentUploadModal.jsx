/**
 * DocumentUploadModal
 * Modal for uploading documents to a load
 * Note: uploadsApi kept as exception (simple one-time upload operation)
 */

import { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import uploadsApi from '../../../api/uploads.api'; // Exception: Simple upload operation

const DOCUMENT_TYPES = [
  { value: 'BOL', label: 'Bill of Lading (BOL)' },
  { value: 'POD', label: 'Proof of Delivery (POD)' },
  { value: 'RATE_CON', label: 'Rate Confirmation' },
  { value: 'INVOICE', label: 'Invoice' },
  { value: 'LUMPER', label: 'Lumper Receipt' },
  { value: 'SCALE_TICKET', label: 'Scale Ticket' },
  { value: 'OTHER', label: 'Other' }
];

export function DocumentUploadModal({ isOpen, onClose, loadId, onSuccess }) {
  const [docType, setDocType] = useState('OTHER');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  if (!isOpen) return null;

  const handleUpload = async (file, onProgress) => {
    setIsUploading(true);

    try {
      const result = await uploadsApi.uploadDocument(file, {
        context: 'load_document',
        loadId,
        docType,
        notes
      }, onProgress);

      setUploadComplete(true);
      onSuccess?.(result);

      // Close after a brief delay to show success state
      setTimeout(() => {
        handleClose();
      }, 1500);

      return result;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const handleClose = () => {
    setDocType('OTHER');
    setNotes('');
    setIsUploading(false);
    setUploadComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isUploading ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-surface-primary rounded-xl shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-body font-semibold text-text-primary">Upload Document</h3>
              <p className="text-small text-text-secondary">Add a document to this load</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-text-tertiary" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Document Type */}
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={isUploading}
              className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
            >
              {DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUploading}
              rows={2}
              placeholder="Add any notes about this document..."
              className="w-full px-4 py-2.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none disabled:opacity-50"
            />
          </div>

          {/* File Upload */}
          <FileUpload
            accept="image/jpeg,image/png,image/webp,application/pdf"
            maxSize={10 * 1024 * 1024}
            onUpload={handleUpload}
            onError={(error) => console.error('Upload error:', error)}
            disabled={isUploading || uploadComplete}
            label="Drop your file here, or click to browse"
            hint="PDF, PNG, JPG up to 10MB"
          />
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-4 border-t border-surface-tertiary">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isUploading}
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DocumentUploadModal;
