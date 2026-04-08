/**
 * TruckDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useTruck hook
 * - Component focuses on rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTruck, useDriversList } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { EquipmentDocumentUploadModal } from '../../components/features/documents/EquipmentDocumentUploadModal';
import uploadsApi from '../../api/uploads.api';
import {
  ArrowLeft,
  Truck,
  User,
  Container,
  Calendar,
  Gauge,
  Fuel,
  Edit,
  Power,
  AlertTriangle,
  Shield,
  DollarSign,
  Wrench,
  X,
  CheckCircle,
  UserMinus,
  Upload,
  FileText,
  Eye,
  Trash2
} from 'lucide-react';

const statusVariants = {
  active: 'green',
  maintenance: 'yellow',
  inactive: 'gray'
};

const statusLabels = {
  active: 'Active',
  maintenance: 'Maintenance',
  inactive: 'Inactive'
};

const truckTypeLabels = {
  day_cab: 'Day Cab',
  sleeper: 'Sleeper',
  straight: 'Straight Truck',
  box: 'Box Truck'
};

const fuelTypeLabels = {
  diesel: 'Diesel',
  gasoline: 'Gasoline',
  natural_gas: 'Natural Gas',
  electric: 'Electric',
  hybrid: 'Hybrid'
};

const ownershipLabels = {
  owned: 'Company Owned',
  leased: 'Leased',
  owner_operator: 'Owner Operator',
  rental: 'Rental'
};

const equipDocTypeBadgeConfig = {
  REGISTRATION: { label: 'Registration', variant: 'blue' },
  INSURANCE: { label: 'Insurance', variant: 'green' },
  ANNUAL_INSPECTION: { label: 'Inspection', variant: 'purple' },
  TITLE: { label: 'Title', variant: 'gray' },
  LEASE: { label: 'Lease', variant: 'gray' },
  IRP_PERMIT: { label: 'IRP', variant: 'orange' },
  IFTA_PERMIT: { label: 'IFTA', variant: 'orange' },
  REPAIR_RECORD: { label: 'Repair', variant: 'yellow' },
  OTHER: { label: 'Other', variant: 'gray' }
};

export function TruckDetailPage() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const { truck, loading, error, isExpiringSoon, assignDriver, assigning } = useTruck(truckId);

  // Assign driver modal state
  const [showAssignDriver, setShowAssignDriver] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState('');
  const [assignError, setAssignError] = useState(null);
  const [assignSuccess, setAssignSuccess] = useState(false);

  // Document state
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const fetchDocuments = useCallback(async () => {
    if (!truckId) return;
    setDocumentsLoading(true);
    try {
      const res = await uploadsApi.getEquipmentDocuments('truck', truckId);
      setDocuments(res.data || []);
    } catch (err) {
      console.error('Failed to fetch truck documents:', err);
    } finally {
      setDocumentsLoading(false);
    }
  }, [truckId]);

  useEffect(() => {
    if (truck) fetchDocuments();
  }, [truck, fetchDocuments]);

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    setDeletingDocId(documentId);
    try {
      await uploadsApi.deleteEquipmentDocument('truck', truckId, documentId);
      setDocuments(prev => prev.filter(d => d.id !== documentId));
    } catch (err) {
      console.error('Failed to delete document:', err);
      alert('Failed to delete document');
    } finally {
      setDeletingDocId(null);
    }
  };

  const handleViewDocument = (doc) => {
    if (doc.viewUrl) {
      window.open(doc.viewUrl, '_blank');
    }
  };

  const isDocExpired = (expiryDate) => {
    if (!expiryDate) return false;
    return new Date(expiryDate) < new Date();
  };

  const isDocExpiringSoon = (expiryDate) => {
    if (!expiryDate) return false;
    const expiry = new Date(expiryDate);
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    return expiry <= thirtyDaysFromNow && expiry >= now;
  };

  // Fetch drivers when modal opens
  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();

  useEffect(() => {
    if (showAssignDriver) {
      fetchDrivers();
      setAssignDriverId('');
      setAssignError(null);
      setAssignSuccess(false);
    }
  }, [showAssignDriver]);

  const handleAssignDriver = async () => {
    if (!assignDriverId) {
      setAssignError('Please select a driver');
      return;
    }
    try {
      setAssignError(null);
      await assignDriver(assignDriverId);
      setAssignSuccess(true);
      setTimeout(() => setShowAssignDriver(false), 1200);
    } catch (err) {
      setAssignError(err.response?.data?.message || err.message || 'Failed to assign driver');
    }
  };

  const handleUnassignDriver = async () => {
    try {
      await assignDriver(null);
    } catch (err) {
      console.error('Failed to unassign driver:', err);
    }
  };

  const handleEdit = () => {
    navigate(orgUrl(`/assets/trucks/${truckId}/edit`));
  };

  const handleBack = () => {
    navigate(orgUrl('/assets/trucks'));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatNumber = (num) => {
    if (!num) return '-';
    return num.toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !truck) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trucks
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-body font-medium text-error mb-1">Truck Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {error || 'The truck you are looking for does not exist.'}
            </p>
            <Button onClick={handleBack}>Back to Trucks</Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Trucks
      </Button>

      {/* Truck Header */}
      <Card padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-20 h-20 bg-surface-secondary rounded-xl flex items-center justify-center flex-shrink-0">
            <Truck className="w-10 h-10 text-text-secondary" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title text-text-primary">
                Unit #{truck.unit_number}
              </h1>
              <Badge variant={statusVariants[truck.status] || 'gray'}>
                {truck.status === 'maintenance' && <Wrench className="w-3 h-3 mr-1" />}
                {statusLabels[truck.status] || truck.status}
              </Badge>
              {truck.is_power_only && (
                <Badge variant="blue">
                  <Power className="w-3 h-3 mr-1" />
                  Power Only
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-body-sm text-text-secondary">
                {truck.year} {truck.make} {truck.model}
              </span>
              {truck.truck_type && (
                <span className="text-body-sm text-text-tertiary">
                  {truckTypeLabels[truck.truck_type] || truck.truck_type}
                </span>
              )}
              {truck.color && (
                <span className="text-body-sm text-text-tertiary">
                  {truck.color}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-shrink-0">
            <Button variant="secondary" onClick={handleEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Vehicle Information */}
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">VIN</p>
                  <p className="text-body text-text-primary font-mono mt-1">
                    {truck.vin || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">License Plate</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {truck.license_plate || '-'} {truck.license_state && `(${truck.license_state})`}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Fuel Type</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Fuel className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {fuelTypeLabels[truck.fuel_type] || truck.fuel_type || '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Odometer</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Gauge className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {formatNumber(truck.odometer_miles)} miles
                    </p>
                  </div>
                </div>
                {truck.engine_make && (
                  <div>
                    <p className="text-small text-text-tertiary">Engine</p>
                    <p className="text-body text-text-primary mt-1">
                      {truck.engine_make} {truck.engine_model}
                    </p>
                  </div>
                )}
                {truck.horsepower && (
                  <div>
                    <p className="text-small text-text-tertiary">Horsepower</p>
                    <p className="text-body text-text-primary mt-1">
                      {truck.horsepower} HP
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Compliance & Inspections */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Registration Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(truck.registration_expiry) ? 'text-warning' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(truck.registration_expiry)}
                    </p>
                    {isExpiringSoon(truck.registration_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Annual Inspection Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(truck.annual_inspection_expiry) ? 'text-warning' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(truck.annual_inspection_expiry)}
                    </p>
                    {isExpiringSoon(truck.annual_inspection_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Insurance Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(truck.insurance_expiry) ? 'text-warning' : ''}`}>
                    <Shield className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(truck.insurance_expiry)}
                    </p>
                    {isExpiringSoon(truck.insurance_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Next Service Date</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(truck.next_service_date) ? 'text-warning' : ''}`}>
                    <Wrench className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(truck.next_service_date)}
                    </p>
                    {isExpiringSoon(truck.next_service_date) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Documents */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between w-full">
                <CardTitle>Documents</CardTitle>
                <Button
                  size="sm"
                  onClick={() => setShowUploadModal(true)}
                >
                  <Upload className="w-4 h-4 mr-1.5" />
                  Upload Document
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {documentsLoading ? (
                <div className="flex justify-center py-6">
                  <Spinner size="sm" />
                </div>
              ) : documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mb-3">
                    <FileText className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-secondary mb-1">No documents uploaded</p>
                  <p className="text-small text-text-tertiary">
                    Upload compliance documents like registration, insurance, inspections, etc.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-surface-tertiary">
                  {documents.map((doc) => {
                    const typeConfig = equipDocTypeBadgeConfig[doc.type] || equipDocTypeBadgeConfig.OTHER;
                    const expired = isDocExpired(doc.expiry_date);
                    const expiringSoon = isDocExpiringSoon(doc.expiry_date);

                    return (
                      <div key={doc.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {/* Type Badge */}
                        <Badge variant={typeConfig.variant} className="flex-shrink-0">
                          {typeConfig.label}
                        </Badge>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-body-sm font-medium text-text-primary truncate">
                            {doc.file_name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-small text-text-tertiary">
                              {formatDate(doc.created_at)}
                            </span>
                            {doc.expiry_date && (
                              <>
                                <span className="text-small text-text-tertiary">&middot;</span>
                                <span className={`text-small flex items-center gap-1 ${
                                  expired ? 'text-error font-medium' :
                                  expiringSoon ? 'text-warning font-medium' :
                                  'text-text-tertiary'
                                }`}>
                                  {(expired || expiringSoon) && (
                                    <AlertTriangle className="w-3 h-3" />
                                  )}
                                  {expired ? 'Expired' : expiringSoon ? 'Expiring soon' : 'Expires'} {formatDate(doc.expiry_date)}
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => handleViewDocument(doc)}
                            disabled={!doc.viewUrl}
                            className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors disabled:opacity-50"
                            title="View document"
                          >
                            <Eye className="w-4 h-4 text-text-secondary" />
                          </button>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            disabled={deletingDocId === doc.id}
                            className="p-1.5 hover:bg-error/10 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete document"
                          >
                            {deletingDocId === doc.id ? (
                              <Spinner size="xs" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-text-secondary hover:text-error" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Ownership & Financials */}
          <Card>
            <CardHeader>
              <CardTitle>Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Ownership Type</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {ownershipLabels[truck.ownership_type] || truck.ownership_type || '-'}
                  </p>
                </div>
                {truck.owner_name && (
                  <div>
                    <p className="text-small text-text-tertiary">Owner Name</p>
                    <p className="text-body text-text-primary mt-1">
                      {truck.owner_name}
                    </p>
                  </div>
                )}
                {truck.lease_company && (
                  <div>
                    <p className="text-small text-text-tertiary">Lease Company</p>
                    <p className="text-body text-text-primary mt-1">
                      {truck.lease_company}
                    </p>
                  </div>
                )}
                {truck.lease_end_date && (
                  <div>
                    <p className="text-small text-text-tertiary">Lease End Date</p>
                    <p className="text-body text-text-primary mt-1">
                      {formatDate(truck.lease_end_date)}
                    </p>
                  </div>
                )}
                {truck.purchase_date && (
                  <div>
                    <p className="text-small text-text-tertiary">Purchase Date</p>
                    <p className="text-body text-text-primary mt-1">
                      {formatDate(truck.purchase_date)}
                    </p>
                  </div>
                )}
                {truck.purchase_price && (
                  <div>
                    <p className="text-small text-text-tertiary">Purchase Price</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-text-tertiary" />
                      <p className="text-body text-text-primary">
                        {formatNumber(truck.purchase_price)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ELD Information */}
          {(truck.eld_provider || truck.eld_device_id) && (
            <Card>
              <CardHeader>
                <CardTitle>ELD Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {truck.eld_provider && (
                    <div>
                      <p className="text-small text-text-tertiary">ELD Provider</p>
                      <p className="text-body text-text-primary mt-1">
                        {truck.eld_provider}
                      </p>
                    </div>
                  )}
                  {truck.eld_device_id && (
                    <div>
                      <p className="text-small text-text-tertiary">Device ID</p>
                      <p className="text-body text-text-primary font-mono mt-1">
                        {truck.eld_device_id}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {truck.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {truck.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Assignments */}
        <div className="space-y-6">
          {/* Assigned Driver */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Driver</CardTitle>
            </CardHeader>
            <CardContent>
              {truck.currentDriver ? (
                <div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-body font-medium text-text-primary">
                        {truck.currentDriver.first_name} {truck.currentDriver.last_name}
                      </p>
                      <p className="text-small text-text-secondary">
                        {truck.currentDriver.status}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button variant="secondary" size="sm" onClick={() => setShowAssignDriver(true)}>
                      Change Driver
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleUnassignDriver} disabled={assigning}>
                      <UserMinus className="w-3.5 h-3.5 mr-1" />
                      Unassign
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-tertiary">No driver assigned</p>
                  <Button variant="secondary" size="sm" className="mt-3" onClick={() => setShowAssignDriver(true)}>
                    Assign Driver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Trailer */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Trailer</CardTitle>
            </CardHeader>
            <CardContent>
              {truck.currentTrailer ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <Container className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      Trailer #{truck.currentTrailer.unit_number}
                    </p>
                    <p className="text-small text-text-secondary">
                      {truck.currentTrailer.type} - {truck.currentTrailer.status}
                    </p>
                  </div>
                </div>
              ) : truck.is_power_only ? (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Power className="w-6 h-6 text-accent" />
                  </div>
                  <p className="text-body-sm text-text-secondary">Power Only</p>
                  <p className="text-small text-text-tertiary">No company trailer required</p>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Container className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-tertiary">No trailer assigned</p>
                  <Button variant="secondary" size="sm" className="mt-3">
                    Assign Trailer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* IRP/IFTA Info */}
          {(truck.irp_account || truck.ifta_account) && (
            <Card>
              <CardHeader>
                <CardTitle>IRP / IFTA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {truck.irp_account && (
                  <div>
                    <p className="text-small text-text-tertiary">IRP Account</p>
                    <p className="text-body text-text-primary mt-1">{truck.irp_account}</p>
                    {truck.irp_expiry && (
                      <p className={`text-small mt-0.5 ${isExpiringSoon(truck.irp_expiry) ? 'text-warning' : 'text-text-secondary'}`}>
                        Expires: {formatDate(truck.irp_expiry)}
                      </p>
                    )}
                  </div>
                )}
                {truck.ifta_account && (
                  <div>
                    <p className="text-small text-text-tertiary">IFTA Account</p>
                    <p className="text-body text-text-primary mt-1">{truck.ifta_account}</p>
                    {truck.ifta_expiry && (
                      <p className={`text-small mt-0.5 ${isExpiringSoon(truck.ifta_expiry) ? 'text-warning' : 'text-text-secondary'}`}>
                        Expires: {formatDate(truck.ifta_expiry)}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Sleeper Info */}
          {truck.truck_type === 'sleeper' && (truck.sleeper_type || truck.sleeper_size) && (
            <Card>
              <CardHeader>
                <CardTitle>Sleeper Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {truck.sleeper_type && (
                  <div>
                    <p className="text-small text-text-tertiary">Type</p>
                    <p className="text-body text-text-primary mt-1">{truck.sleeper_type}</p>
                  </div>
                )}
                {truck.sleeper_size && (
                  <div>
                    <p className="text-small text-text-tertiary">Size</p>
                    <p className="text-body text-text-primary mt-1">{truck.sleeper_size}"</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {truck.has_apu && <Badge variant="gray">APU</Badge>}
                  {truck.has_inverter && <Badge variant="gray">Inverter</Badge>}
                  {truck.has_fridge && <Badge variant="gray">Fridge</Badge>}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Equipment Document Upload Modal */}
      <EquipmentDocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        entityType="truck"
        entityId={truckId}
        onSuccess={() => fetchDocuments()}
      />

      {/* Assign Driver Modal */}
      {showAssignDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowAssignDriver(false)} />

          {/* Modal */}
          <div className="relative bg-white rounded-2xl shadow-modal max-w-md w-full animate-scale-in">
            {assignSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-xl font-semibold text-text-primary mb-2">Driver Assigned!</h2>
                <p className="text-body text-text-secondary">
                  Driver has been assigned to Unit #{truck.unit_number}
                </p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-surface-tertiary">
                  <div>
                    <h2 className="text-lg font-semibold text-text-primary">Assign Driver</h2>
                    <p className="text-body-sm text-text-secondary mt-0.5">
                      Unit #{truck.unit_number} &middot; {truck.year} {truck.make} {truck.model}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAssignDriver(false)}
                    className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-6">
                  {driversLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner size="lg" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="flex items-center gap-2 text-body-sm font-medium text-text-primary">
                        <User className="w-4 h-4 text-accent" />
                        Select Driver
                      </label>
                      <SearchableSelect
                        value={assignDriverId}
                        onChange={(option) => setAssignDriverId(option?.id || '')}
                        options={drivers
                          .filter((d) => d.status !== 'inactive')
                          .map((d) => ({
                            id: d.id,
                            label: `${d.first_name} ${d.last_name}`,
                            sublabel: d.phone || d.email || d.status,
                          }))}
                        placeholder="Search drivers..."
                      />
                    </div>
                  )}

                  {assignError && (
                    <div className="mt-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                      <p className="text-body-sm text-error">{assignError}</p>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-6 border-t border-surface-tertiary bg-surface-secondary">
                  <Button variant="ghost" onClick={() => setShowAssignDriver(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAssignDriver} disabled={assigning || !assignDriverId}>
                    {assigning ? (
                      <>
                        <Spinner size="sm" className="mr-2" />
                        Assigning...
                      </>
                    ) : (
                      'Assign Driver'
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default TruckDetailPage;
