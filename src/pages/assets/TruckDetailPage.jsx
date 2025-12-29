/**
 * TruckDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useTruck hook
 * - Component focuses on rendering
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTruck } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
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
  Wrench
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

export function TruckDetailPage() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const { truck, loading, error, isExpiringSoon } = useTruck(truckId);

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
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      {truck.currentDriver.first_name} {truck.currentDriver.last_name}
                    </p>
                    <p className="text-small text-text-secondary">
                      {truck.currentDriver.status}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-tertiary">No driver assigned</p>
                  <Button variant="secondary" size="sm" className="mt-3">
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
    </div>
  );
}

export default TruckDetailPage;
