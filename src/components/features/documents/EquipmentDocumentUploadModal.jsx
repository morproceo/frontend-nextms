/**
 * EquipmentDocumentUploadModal
 * Modal for uploading compliance documents for trucks and trailers
 */

import { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { Button } from '../../ui/Button';
import { FileUpload } from '../../ui/FileUpload';
import uploadsApi from '../../../api/uploads.api';

const EQUIPMENT_DOCUMENT_TYPES = [
  { value: 'REGISTRATION', label: 'Vehicle Registration' },
  { value: 'INSURANCE', label: 'Insurance Certificate' },
  { value: 'ANNUAL_INSPECTION', label: 'Annual DOT Inspection' },
  { value: 'TITLE', label: 'Vehicle Title' },
  { value: 'LEASE', label: 'Lease Agreement' },
  { value: 'IRP_PERMIT', label: 'IRP Permit' },
  { value: 'IFTA_PERMIT', label: 'IFTA Permit' },
  { value: 'REPAIR_RECORD', label: 'Repair / Maintenance Record' },
  { value: 'OTHER', label: 'Other' }
];

export function EquipmentDocumentUploadModal({ isOpen, onClose, entityType, entityId, onSuccess }) {
  const [docType, setDocType] = useState('OTHER');
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);

  if (!isOpen) return null;

  const entityLabel = entityType === 'truck' ? 'truck' : 'trailer';

  const handleUpload = async (file, onProgress) => {
    setIsUploading(true);

    try {
      const result = await uploadsApi.uploadEquipmentDocument(entityType, entityId, file, {
        type: docType,
        expiryDate: expiryDate || undefined,
        notes: notes || undefined
      }, onProgress);

      setUploadComplete(true);
      onSuccess?.(result);

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
    setExpiryDate('');
    setNotes('');
    setIsUploading(false);
    setUploadComplete(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isUploading ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-modal w-full max-w-md animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-gray-900">Upload Document</h3>
              <p className="text-sm text-gray-500">Add a compliance document for this {entityLabel}</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Document Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Document Type
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
            >
              {EQUIPMENT_DOCUMENT_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Expiry Date (optional)
            </label>
            <input
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
              disabled={isUploading}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-50"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={isUploading}
              rows={2}
              placeholder="Add any notes about this document..."
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none disabled:opacity-50"
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
        <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t border-gray-200 rounded-b-2xl">
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

export default EquipmentDocumentUploadModal;
