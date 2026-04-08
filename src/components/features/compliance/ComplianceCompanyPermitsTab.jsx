/**
 * ComplianceCompanyPermitsTab - FMCSA company permit checklist
 *
 * Each item shows: name, status toggle (compliant/non-compliant/N-A), expiry date, notes.
 * Save button persists changes via updateCompanyPermits.
 * Upload button allows attaching proof documents per permit.
 */

import { useState, useEffect } from 'react';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { PermitDocumentUploadModal } from './PermitDocumentUploadModal';
import {
  CheckCircle,
  XCircle,
  MinusCircle,
  Save,
  FileCheck,
  Paperclip,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  Trash2,
  FileText
} from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'compliant', label: 'Compliant', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
  { value: 'non_compliant', label: 'Non-Compliant', icon: XCircle, color: 'text-error', bg: 'bg-error/10' },
  { value: 'na', label: 'N/A', icon: MinusCircle, color: 'text-text-tertiary', bg: 'bg-surface-tertiary' }
];

export function ComplianceCompanyPermitsTab({
  permits: initialPermits,
  onSave,
  saving,
  loading,
  permitDocuments = {},
  onFetchDocuments,
  onUploadDocument,
  onDeleteDocument
}) {
  const [permits, setPermits] = useState([]);
  const [dirty, setDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [uploadModal, setUploadModal] = useState({ open: false, permitKey: null, permitLabel: '' });
  const [expandedPermits, setExpandedPermits] = useState({});
  const [deletingDocId, setDeletingDocId] = useState(null);

  useEffect(() => {
    if (initialPermits) {
      setPermits(initialPermits.map(p => ({ ...p })));
      setDirty(false);
    }
  }, [initialPermits]);

  const updatePermit = (key, field, value) => {
    setPermits(prev =>
      prev.map(p => p.key === key ? { ...p, [field]: value } : p)
    );
    setDirty(true);
    setSaveSuccess(false);
  };

  const cycleStatus = (key) => {
    const permit = permits.find(p => p.key === key);
    if (!permit) return;
    const order = ['non_compliant', 'compliant', 'na'];
    const nextIdx = (order.indexOf(permit.status) + 1) % order.length;
    updatePermit(key, 'status', order[nextIdx]);
  };

  const handleSave = async () => {
    try {
      await onSave(permits);
      setDirty(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      // Error handled by parent
    }
  };

  const toggleExpand = (permitKey) => {
    setExpandedPermits(prev => {
      const isExpanding = !prev[permitKey];
      // Fetch documents when expanding for the first time
      if (isExpanding && !permitDocuments[permitKey] && onFetchDocuments) {
        onFetchDocuments(permitKey);
      }
      return { ...prev, [permitKey]: isExpanding };
    });
  };

  const openUploadModal = (permitKey, permitLabel) => {
    setUploadModal({ open: true, permitKey, permitLabel });
  };

  const handleUpload = async (file, options, onProgress) => {
    if (!onUploadDocument || !uploadModal.permitKey) return;
    return await onUploadDocument(uploadModal.permitKey, file, options, onProgress);
  };

  const handleDeleteDocument = async (permitKey, documentId) => {
    if (!onDeleteDocument) return;
    setDeletingDocId(documentId);
    try {
      await onDeleteDocument(permitKey, documentId);
    } finally {
      setDeletingDocId(null);
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  const compliantCount = permits.filter(p => p.status === 'compliant').length;
  const naCount = permits.filter(p => p.status === 'na').length;
  const nonCompliantCount = permits.filter(p => p.status === 'non_compliant').length;

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-3">
        <Badge variant="green">
          <CheckCircle className="w-3 h-3" />
          {compliantCount} Compliant
        </Badge>
        <Badge variant="red">
          <XCircle className="w-3 h-3" />
          {nonCompliantCount} Non-Compliant
        </Badge>
        {naCount > 0 && (
          <Badge variant="gray">
            <MinusCircle className="w-3 h-3" />
            {naCount} N/A
          </Badge>
        )}

        <div className="flex-1" />

        {/* Save button */}
        <button
          onClick={handleSave}
          disabled={!dirty || saving}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-body-sm font-medium transition-colors ${
            dirty
              ? 'bg-accent text-white hover:bg-accent/90'
              : saveSuccess
                ? 'bg-success/10 text-success'
                : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
          }`}
        >
          {saving ? (
            <Spinner size="sm" />
          ) : saveSuccess ? (
            <CheckCircle className="w-4 h-4" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'Saving...' : saveSuccess ? 'Saved' : 'Save Changes'}
        </button>
      </div>

      {/* Permits list */}
      <Card padding="none">
        <div className="divide-y divide-border">
          {permits.map((permit) => {
            const statusConfig = STATUS_OPTIONS.find(s => s.value === permit.status) || STATUS_OPTIONS[1];
            const StatusIcon = statusConfig.icon;
            const docs = permitDocuments[permit.key] || [];
            const isExpanded = expandedPermits[permit.key];

            return (
              <div key={permit.key}>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-4 py-3">
                  {/* Status toggle + label */}
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => cycleStatus(permit.key)}
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors ${statusConfig.bg}`}
                      title={`Status: ${statusConfig.label} (click to cycle)`}
                    >
                      <StatusIcon className={`w-5 h-5 ${statusConfig.color}`} />
                    </button>
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary truncate">{permit.label}</p>
                      <p className="text-small text-text-tertiary">{permit.key.replace(/_/g, '-')}</p>
                    </div>
                  </div>

                  {/* Expiry date */}
                  <div className="flex items-center gap-2 sm:w-44">
                    <label className="text-small text-text-secondary shrink-0 sm:hidden">Expiry:</label>
                    <input
                      type="date"
                      value={permit.expiryDate || ''}
                      onChange={(e) => updatePermit(permit.key, 'expiryDate', e.target.value || null)}
                      className="w-full sm:w-40 px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border text-body-sm text-text-primary focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Expiry date"
                    />
                  </div>

                  {/* Notes */}
                  <div className="flex items-center gap-2 sm:w-56">
                    <label className="text-small text-text-secondary shrink-0 sm:hidden">Notes:</label>
                    <input
                      type="text"
                      value={permit.notes || ''}
                      onChange={(e) => updatePermit(permit.key, 'notes', e.target.value)}
                      className="w-full sm:w-52 px-2.5 py-1.5 rounded-lg bg-surface-secondary border border-border text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-1 focus:ring-accent"
                      placeholder="Notes..."
                    />
                  </div>

                  {/* Document actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Upload button */}
                    <button
                      onClick={() => openUploadModal(permit.key, permit.label)}
                      className="p-2 hover:bg-surface-secondary rounded-lg transition-colors text-text-tertiary hover:text-accent"
                      title="Upload document"
                    >
                      <Paperclip className="w-4 h-4" />
                    </button>

                    {/* Expand/collapse docs */}
                    <button
                      onClick={() => toggleExpand(permit.key)}
                      className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-small transition-colors ${
                        docs.length > 0
                          ? 'text-accent hover:bg-accent/10'
                          : 'text-text-tertiary hover:bg-surface-secondary'
                      }`}
                      title={docs.length > 0 ? `${docs.length} document(s)` : 'No documents'}
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {docs.length > 0 && (
                        <span className="font-medium">{docs.length}</span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded document list */}
                {isExpanded && (
                  <div className="px-4 pb-3">
                    <div className="ml-12 bg-surface-secondary rounded-lg">
                      {!permitDocuments[permit.key] ? (
                        <div className="flex items-center justify-center py-4">
                          <Spinner size="sm" />
                        </div>
                      ) : docs.length === 0 ? (
                        <div className="text-center py-4 text-small text-text-tertiary">
                          No documents uploaded yet
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {docs.map((doc) => (
                            <div
                              key={doc.id}
                              className="flex items-center gap-3 px-3 py-2.5"
                            >
                              <FileText className="w-4 h-4 text-text-tertiary shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-small font-medium text-text-primary truncate">
                                  {doc.file_name}
                                </p>
                                <p className="text-[11px] text-text-tertiary">
                                  {formatFileSize(doc.file_size)}
                                  {doc.uploadedBy && ` • ${doc.uploadedBy.first_name} ${doc.uploadedBy.last_name}`}
                                  {doc.created_at && ` • ${new Date(doc.created_at).toLocaleDateString()}`}
                                </p>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                {doc.viewUrl && (
                                  <a
                                    href={doc.viewUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-1.5 hover:bg-white rounded-lg transition-colors text-text-tertiary hover:text-accent"
                                    title="View document"
                                  >
                                    <ExternalLink className="w-3.5 h-3.5" />
                                  </a>
                                )}
                                <button
                                  onClick={() => handleDeleteDocument(permit.key, doc.id)}
                                  disabled={deletingDocId === doc.id}
                                  className="p-1.5 hover:bg-white rounded-lg transition-colors text-text-tertiary hover:text-error disabled:opacity-50"
                                  title="Delete document"
                                >
                                  {deletingDocId === doc.id ? (
                                    <Spinner size="xs" />
                                  ) : (
                                    <Trash2 className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Upload Modal */}
      <PermitDocumentUploadModal
        isOpen={uploadModal.open}
        onClose={() => setUploadModal({ open: false, permitKey: null, permitLabel: '' })}
        permitKey={uploadModal.permitKey}
        permitLabel={uploadModal.permitLabel}
        onUpload={handleUpload}
      />
    </div>
  );
}

export default ComplianceCompanyPermitsTab;
