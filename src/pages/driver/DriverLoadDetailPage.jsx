/**
 * DriverLoadDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalLoad hook
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDriverPortalLoad } from '../../hooks';
import uploadsApi from '../../api/uploads.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { DocumentUploadModal } from '../../components/features/documents/DocumentUploadModal';
import {
  Package,
  MapPin,
  Calendar,
  FileText,
  ArrowLeft,
  Play,
  CheckCircle,
  Truck,
  Upload,
  ExternalLink,
  Image,
  Plus
} from 'lucide-react';
import { formatDate, formatCurrency } from '../../lib/utils';

export function DriverLoadDetailPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();

  // All data and logic from the hook
  const {
    load,
    loading,
    error,
    actionLoading,
    refetch,
    startTrip,
    completeTrip,
    getStatusColor
  } = useDriverPortalLoad(loadId);

  // Documents state (still using uploads API directly for now)
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);

  useEffect(() => {
    if (loadId) {
      fetchDocuments();
    }
  }, [loadId]);

  const fetchDocuments = async () => {
    try {
      const response = await uploadsApi.getLoadDocuments(loadId);
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  const handleDocumentUploadSuccess = () => {
    fetchDocuments();
  };

  const handleViewDocument = (doc) => {
    if (doc.viewUrl) {
      window.open(doc.viewUrl, '_blank');
    }
  };

  const handleStartTrip = async () => {
    try {
      await startTrip();
    } catch (err) {
      console.error('Failed to start trip:', err);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      await completeTrip();
    } catch (err) {
      console.error('Failed to complete trip:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !load) {
    return (
      <div className="text-center py-12">
        <p className="text-body text-error">{error || 'Load not found'}</p>
        <Button variant="secondary" className="mt-4" onClick={() => navigate('/driver/loads')}>
          Back to Loads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/driver/loads')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-headline text-text-primary">{load.reference_number}</h1>
            <span className={`text-small font-medium px-2 py-1 rounded-chip ${getStatusColor(load.status)}`}>
              {load.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>
          <p className="text-body text-text-secondary">{load.organization?.name}</p>
        </div>
      </div>

      {/* Action Buttons */}
      {(load.status === 'dispatched' || load.status === 'in_transit') && (
        <Card className="p-4">
          <div className="flex gap-3">
            {load.status === 'dispatched' && (
              <Button onClick={handleStartTrip} loading={actionLoading} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Start Trip
              </Button>
            )}
            {load.status === 'in_transit' && (
              <Button onClick={handleCompleteTrip} loading={actionLoading} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Delivered
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Route Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pickup */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-success" />
            </div>
            <h2 className="text-title text-text-primary">Pickup</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-body font-medium text-text-primary">
                {load.shipper?.name}
              </p>
              <p className="text-body-sm text-text-secondary">
                {load.shipper?.address}
              </p>
              <p className="text-body-sm text-text-secondary">
                {load.shipper?.city}, {load.shipper?.state} {load.shipper?.zip}
              </p>
            </div>

            <div className="flex items-center gap-2 text-body-sm">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <span>{formatDate(load.schedule?.pickup_date)}</span>
              {load.schedule?.pickup_time_start && (
                <span className="text-text-tertiary">
                  @ {load.schedule.pickup_time_start}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Delivery */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-error" />
            </div>
            <h2 className="text-title text-text-primary">Delivery</h2>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-body font-medium text-text-primary">
                {load.consignee?.name}
              </p>
              <p className="text-body-sm text-text-secondary">
                {load.consignee?.address}
              </p>
              <p className="text-body-sm text-text-secondary">
                {load.consignee?.city}, {load.consignee?.state} {load.consignee?.zip}
              </p>
            </div>

            <div className="flex items-center gap-2 text-body-sm">
              <Calendar className="w-4 h-4 text-text-tertiary" />
              <span>{formatDate(load.schedule?.delivery_date)}</span>
              {load.schedule?.delivery_time_start && (
                <span className="text-text-tertiary">
                  @ {load.schedule.delivery_time_start}
                </span>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Load Details */}
      <Card className="p-6">
        <h2 className="text-title text-text-primary mb-4">Load Details</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <p className="text-small text-text-tertiary">Commodity</p>
            <p className="text-body font-medium text-text-primary">
              {load.cargo?.commodity || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-small text-text-tertiary">Weight</p>
            <p className="text-body font-medium text-text-primary">
              {load.cargo?.weight_lbs ? `${load.cargo.weight_lbs.toLocaleString()} lbs` : 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-small text-text-tertiary">Miles</p>
            <p className="text-body font-medium text-text-primary">
              {load.financials?.miles || 'N/A'}
            </p>
          </div>
          <div>
            <p className="text-small text-text-tertiary">Driver Pay</p>
            <p className="text-body font-medium text-success">
              {load.financials?.driver_pay ? formatCurrency(load.financials.driver_pay) : 'N/A'}
            </p>
          </div>
        </div>

        {load.notes && (
          <div className="mt-4 pt-4 border-t border-surface-tertiary">
            <p className="text-small text-text-tertiary mb-1">Notes</p>
            <p className="text-body text-text-primary whitespace-pre-wrap">
              {load.notes}
            </p>
          </div>
        )}
      </Card>

      {/* Equipment */}
      {(load.truck || load.trailer) && (
        <Card className="p-6">
          <h2 className="text-title text-text-primary mb-4">Assigned Equipment</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {load.truck && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                  <Truck className="w-5 h-5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-body font-medium text-text-primary">
                    Truck: {load.truck.unit_number}
                  </p>
                  <p className="text-small text-text-secondary">
                    {load.truck.make} {load.truck.model} ({load.truck.year})
                  </p>
                </div>
              </div>
            )}

            {load.trailer && (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                  <Package className="w-5 h-5 text-text-tertiary" />
                </div>
                <div>
                  <p className="text-body font-medium text-text-primary">
                    Trailer: {load.trailer.unit_number}
                  </p>
                  <p className="text-small text-text-secondary">
                    {load.trailer.type} - {load.trailer.length_ft}ft
                  </p>
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Documents */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-title text-text-primary">Documents</h2>
          {load.status !== 'delivered' && (
            <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(true)}>
              <Plus className="w-4 h-4 mr-1" />
              Upload
            </Button>
          )}
        </div>

        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => handleViewDocument(doc)}
                className="flex items-center justify-between p-3 bg-surface-secondary rounded-card cursor-pointer hover:bg-surface-tertiary transition-colors group"
              >
                <div className="flex items-center gap-3">
                  {doc.mime_type?.startsWith('image/') ? (
                    <Image className="w-5 h-5 text-text-tertiary" />
                  ) : (
                    <FileText className="w-5 h-5 text-text-tertiary" />
                  )}
                  <div>
                    <p className="text-body-sm font-medium text-text-primary">
                      {doc.file_name}
                    </p>
                    <p className="text-small text-text-tertiary">
                      {doc.type?.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-body-sm text-text-secondary mb-3">No documents yet</p>
            {load.status !== 'delivered' && (
              <Button variant="secondary" size="sm" onClick={() => setShowUploadModal(true)}>
                <Upload className="w-4 h-4 mr-1" />
                Upload Document
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        loadId={loadId}
        onSuccess={handleDocumentUploadSuccess}
      />
    </div>
  );
}

export default DriverLoadDetailPage;
