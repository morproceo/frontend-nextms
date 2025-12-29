/**
 * FacilityDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Centralized status configs from config/status
 * - Business logic delegated to useFacility hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFacility } from '../../hooks';
import { FacilityType, FacilityTypeConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Warehouse,
  Mail,
  Phone,
  MapPin,
  Edit,
  Trash2
} from 'lucide-react';

export function FacilityDetailPage() {
  const { facilityId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const [deleting, setDeleting] = useState(false);

  // All data and logic from the hook
  const {
    facility,
    loading,
    error,
    deleteFacility,
    mutating
  } = useFacility(facilityId);

  const handleEdit = () => {
    navigate(orgUrl(`/customers/facilities/${facilityId}/edit`));
  };

  const handleBack = () => {
    navigate(orgUrl('/customers?tab=facilities'));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this facility?')) return;

    try {
      setDeleting(true);
      await deleteFacility();
      navigate(orgUrl('/customers?tab=facilities'));
    } catch (err) {
      console.error('Failed to delete facility:', err);
      alert(err.response?.data?.error?.message || 'Failed to delete facility');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !facility) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Facilities
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <Warehouse className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-body font-medium text-error mb-1">Facility Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {error || 'The facility you are looking for does not exist.'}
            </p>
            <Button onClick={handleBack}>Back to Facilities</Button>
          </div>
        </Card>
      </div>
    );
  }

  // Get type config from centralized config (already enriched by hook, but fallback for safety)
  const typeConfig = facility.typeConfig || FacilityTypeConfig[facility.facility_type] || FacilityTypeConfig[FacilityType.BOTH];
  const TypeIcon = typeConfig.icon;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Facilities
      </Button>

      {/* Facility Header */}
      <Card padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Warehouse className="w-8 h-8 text-text-tertiary" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title text-text-primary">{facility.company_name}</h1>
              <Badge variant={facility.is_active ? 'green' : 'gray'}>
                {facility.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant={typeConfig.variant} size="sm">
                <TypeIcon className="w-3 h-3 mr-1" />
                {typeConfig.label}
              </Badge>
              {(facility.address?.city || facility.address?.state) && (
                <span className="text-body-sm text-text-secondary">
                  {[facility.address.city, facility.address.state].filter(Boolean).join(', ')}
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
            <Button
              variant="ghost"
              onClick={handleDelete}
              loading={deleting}
              className="text-error hover:bg-error/10"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {facility.contact?.name && (
                  <div>
                    <p className="text-small text-text-tertiary">Contact Name</p>
                    <p className="text-body text-text-primary font-medium mt-1">
                      {facility.contact.name}
                    </p>
                  </div>
                )}
                {facility.contact?.email && (
                  <div>
                    <p className="text-small text-text-tertiary">Email</p>
                    <a
                      href={`mailto:${facility.contact.email}`}
                      className="flex items-center gap-2 text-body text-accent hover:underline mt-1"
                    >
                      <Mail className="w-4 h-4" />
                      {facility.contact.email}
                    </a>
                  </div>
                )}
                {facility.contact?.phone && (
                  <div>
                    <p className="text-small text-text-tertiary">Phone</p>
                    <a
                      href={`tel:${facility.contact.phone}`}
                      className="flex items-center gap-2 text-body text-accent hover:underline mt-1"
                    >
                      <Phone className="w-4 h-4" />
                      {facility.contact.phone}
                    </a>
                  </div>
                )}
              </div>
              {!facility.contact?.name && !facility.contact?.email && !facility.contact?.phone && (
                <p className="text-body-sm text-text-tertiary">No contact information available</p>
              )}
            </CardContent>
          </Card>

          {/* Address */}
          <Card>
            <CardHeader>
              <CardTitle>Address</CardTitle>
            </CardHeader>
            <CardContent>
              {(facility.address?.line1 || facility.address?.city) ? (
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-text-tertiary mt-0.5" />
                  <div className="text-body text-text-primary">
                    {facility.address.line1 && <p>{facility.address.line1}</p>}
                    {facility.address.line2 && <p>{facility.address.line2}</p>}
                    {(facility.address.city || facility.address.state || facility.address.zip) && (
                      <p>
                        {[facility.address.city, facility.address.state].filter(Boolean).join(', ')}
                        {facility.address.zip && ` ${facility.address.zip}`}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-body-sm text-text-tertiary">No address available</p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {facility.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {facility.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Type & Stats */}
        <div className="space-y-6">
          {/* Facility Type */}
          <Card>
            <CardHeader>
              <CardTitle>Facility Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3 p-4 bg-surface-secondary rounded-lg">
                <TypeIcon className="w-6 h-6 text-text-secondary" />
                <div>
                  <p className="text-body font-medium text-text-primary">{typeConfig.label}</p>
                  <p className="text-small text-text-tertiary">{typeConfig.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats - placeholder for future loads integration */}
          <Card>
            <CardHeader>
              <CardTitle>Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-small text-text-tertiary">
                  Load statistics coming soon
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FacilityDetailPage;
