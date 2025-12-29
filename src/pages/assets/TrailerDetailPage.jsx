/**
 * TrailerDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useTrailer hook
 * - Component focuses on rendering
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrailer } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Container,
  Truck,
  Calendar,
  Edit,
  AlertTriangle,
  Shield,
  DollarSign,
  Wrench,
  Snowflake,
  Ruler,
  Weight,
  Package
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

const trailerTypeLabels = {
  dry_van: 'Dry Van',
  reefer: 'Reefer',
  flatbed: 'Flatbed',
  step_deck: 'Step Deck',
  lowboy: 'Lowboy',
  tanker: 'Tanker',
  hopper: 'Hopper',
  livestock: 'Livestock',
  auto_carrier: 'Auto Carrier',
  intermodal: 'Intermodal',
  other: 'Other'
};

const ownershipLabels = {
  owned: 'Company Owned',
  leased: 'Leased',
  owner_operator: 'Owner Operator',
  rental: 'Rental',
  customer: 'Customer Trailer'
};

export function TrailerDetailPage() {
  const { trailerId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const { trailer, loading, error, isExpiringSoon } = useTrailer(trailerId);

  const handleEdit = () => {
    navigate(orgUrl(`/assets/trailers/${trailerId}/edit`));
  };

  const handleBack = () => {
    navigate(orgUrl('/assets/trailers'));
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

  if (error || !trailer) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Trailers
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <Container className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-body font-medium text-error mb-1">Trailer Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {error || 'The trailer you are looking for does not exist.'}
            </p>
            <Button onClick={handleBack}>Back to Trailers</Button>
          </div>
        </Card>
      </div>
    );
  }

  const isReefer = trailer.type === 'reefer';

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Trailers
      </Button>

      {/* Trailer Header */}
      <Card padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-20 h-20 bg-surface-secondary rounded-xl flex items-center justify-center flex-shrink-0">
            {isReefer ? (
              <Snowflake className="w-10 h-10 text-blue-500" />
            ) : (
              <Container className="w-10 h-10 text-text-secondary" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title text-text-primary">
                Trailer #{trailer.unit_number}
              </h1>
              <Badge variant={statusVariants[trailer.status] || 'gray'}>
                {trailer.status === 'maintenance' && <Wrench className="w-3 h-3 mr-1" />}
                {statusLabels[trailer.status] || trailer.status}
              </Badge>
              <Badge variant={isReefer ? 'blue' : 'gray'}>
                {isReefer && <Snowflake className="w-3 h-3 mr-1" />}
                {trailerTypeLabels[trailer.type] || trailer.type}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="text-body-sm text-text-secondary">
                {trailer.year} {trailer.make} {trailer.model}
              </span>
              {trailer.length_ft && (
                <span className="text-body-sm text-text-tertiary">
                  {trailer.length_ft}' long
                </span>
              )}
              {trailer.color && (
                <span className="text-body-sm text-text-tertiary">
                  {trailer.color}
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
              <CardTitle>Trailer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">VIN</p>
                  <p className="text-body text-text-primary font-mono mt-1">
                    {trailer.vin || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">License Plate</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {trailer.license_plate || '-'} {trailer.license_state && `(${trailer.license_state})`}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Door Type</p>
                  <p className="text-body text-text-primary mt-1">
                    {trailer.door_type || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Floor Type</p>
                  <p className="text-body text-text-primary mt-1">
                    {trailer.floor_type || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dimensions & Capacity */}
          <Card>
            <CardHeader>
              <CardTitle>Dimensions & Capacity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Length</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Ruler className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {trailer.length_ft ? `${trailer.length_ft} ft` : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Width</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Ruler className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {trailer.width_inches ? `${trailer.width_inches}"` : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Height</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Ruler className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {trailer.height_inches ? `${trailer.height_inches}"` : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Axle Count</p>
                  <p className="text-body text-text-primary mt-1">
                    {trailer.axle_count || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">GVWR</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Weight className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {trailer.gvwr_lbs ? `${formatNumber(trailer.gvwr_lbs)} lbs` : '-'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Max Payload</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Package className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary">
                      {trailer.max_payload_lbs ? `${formatNumber(trailer.max_payload_lbs)} lbs` : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reefer Information */}
          {isReefer && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Snowflake className="w-5 h-5 text-blue-500" />
                  Reefer Unit Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-small text-text-tertiary">Reefer Make</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.reefer_make || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Reefer Model</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.reefer_model || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Reefer Year</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.reefer_year || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Reefer Serial</p>
                    <p className="text-body text-text-primary font-mono mt-1">
                      {trailer.reefer_serial || '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Reefer Hours</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.reefer_hours ? formatNumber(trailer.reefer_hours) : '-'}
                    </p>
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Min Temp</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.min_temp_f !== null && trailer.min_temp_f !== undefined ? `${trailer.min_temp_f}°F` : '-'}
                    </p>
                  </div>
                  {trailer.has_multi_temp && (
                    <div className="sm:col-span-2 lg:col-span-3">
                      <Badge variant="blue">Multi-Temperature Zones</Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Compliance & Inspections */}
          <Card>
            <CardHeader>
              <CardTitle>Compliance & Inspections</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Registration Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(trailer.registration_expiry) ? 'text-warning' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(trailer.registration_expiry)}
                    </p>
                    {isExpiringSoon(trailer.registration_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Annual Inspection Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(trailer.annual_inspection_expiry) ? 'text-warning' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(trailer.annual_inspection_expiry)}
                    </p>
                    {isExpiringSoon(trailer.annual_inspection_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Insurance Expiry</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(trailer.insurance_expiry) ? 'text-warning' : ''}`}>
                    <Shield className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(trailer.insurance_expiry)}
                    </p>
                    {isExpiringSoon(trailer.insurance_expiry) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Next Service Date</p>
                  <div className={`flex items-center gap-2 mt-1 ${isExpiringSoon(trailer.next_service_date) ? 'text-warning' : ''}`}>
                    <Wrench className="w-4 h-4" />
                    <p className="text-body font-medium">
                      {formatDate(trailer.next_service_date)}
                    </p>
                    {isExpiringSoon(trailer.next_service_date) && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ownership */}
          <Card>
            <CardHeader>
              <CardTitle>Ownership</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Ownership Type</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {ownershipLabels[trailer.ownership_type] || trailer.ownership_type || '-'}
                  </p>
                </div>
                {trailer.owner_name && (
                  <div>
                    <p className="text-small text-text-tertiary">Owner Name</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.owner_name}
                    </p>
                  </div>
                )}
                {trailer.lease_company && (
                  <div>
                    <p className="text-small text-text-tertiary">Lease Company</p>
                    <p className="text-body text-text-primary mt-1">
                      {trailer.lease_company}
                    </p>
                  </div>
                )}
                {trailer.lease_end_date && (
                  <div>
                    <p className="text-small text-text-tertiary">Lease End Date</p>
                    <p className="text-body text-text-primary mt-1">
                      {formatDate(trailer.lease_end_date)}
                    </p>
                  </div>
                )}
                {trailer.purchase_date && (
                  <div>
                    <p className="text-small text-text-tertiary">Purchase Date</p>
                    <p className="text-body text-text-primary mt-1">
                      {formatDate(trailer.purchase_date)}
                    </p>
                  </div>
                )}
                {trailer.purchase_price && (
                  <div>
                    <p className="text-small text-text-tertiary">Purchase Price</p>
                    <div className="flex items-center gap-2 mt-1">
                      <DollarSign className="w-4 h-4 text-text-tertiary" />
                      <p className="text-body text-text-primary">
                        {formatNumber(trailer.purchase_price)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {trailer.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {trailer.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Assigned Truck */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned Truck</CardTitle>
            </CardHeader>
            <CardContent>
              {trailer.currentTruck ? (
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <Truck className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      Unit #{trailer.currentTruck.unit_number}
                    </p>
                    <p className="text-small text-text-secondary">
                      {trailer.currentTruck.make} {trailer.currentTruck.model}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Truck className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-tertiary">Not assigned to a truck</p>
                  <Button variant="secondary" size="sm" className="mt-3">
                    Assign to Truck
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Features & Equipment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {trailer.has_liftgate && <Badge variant="gray">Liftgate</Badge>}
                {trailer.has_pallet_jack && <Badge variant="gray">Pallet Jack</Badge>}
                {trailer.has_e_track && <Badge variant="gray">E-Track</Badge>}
                {trailer.has_load_bars && <Badge variant="gray">Load Bars</Badge>}
                {trailer.has_straps && <Badge variant="gray">Straps</Badge>}
                {trailer.has_vents && <Badge variant="gray">Vents</Badge>}
                {!trailer.has_liftgate && !trailer.has_pallet_jack && !trailer.has_e_track &&
                 !trailer.has_load_bars && !trailer.has_straps && !trailer.has_vents && (
                  <p className="text-small text-text-tertiary">No features listed</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* IRP Info */}
          {trailer.irp_account && (
            <Card>
              <CardHeader>
                <CardTitle>IRP Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-small text-text-tertiary">IRP Account</p>
                  <p className="text-body text-text-primary mt-1">{trailer.irp_account}</p>
                </div>
                {trailer.irp_expiry && (
                  <div>
                    <p className="text-small text-text-tertiary">Expiry</p>
                    <p className={`text-body mt-0.5 ${isExpiringSoon(trailer.irp_expiry) ? 'text-warning' : 'text-text-primary'}`}>
                      {formatDate(trailer.irp_expiry)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrailerDetailPage;
