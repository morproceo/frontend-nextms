/**
 * BrokerDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useBroker hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useBroker } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  MapPin,
  Star,
  Edit,
  Trash2,
  CreditCard,
  FileText,
  Clock
} from 'lucide-react';

export function BrokerDetailPage() {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const [deleting, setDeleting] = useState(false);

  // All data and logic from the hook
  const {
    broker,
    loading,
    error,
    deleteBroker,
    mutating
  } = useBroker(brokerId);

  const handleEdit = () => {
    navigate(orgUrl(`/customers/brokers/${brokerId}/edit`));
  };

  const handleBack = () => {
    navigate(orgUrl('/customers?tab=brokers'));
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this broker?')) return;

    try {
      setDeleting(true);
      await deleteBroker();
      navigate(orgUrl('/customers?tab=brokers'));
    } catch (err) {
      console.error('Failed to delete broker:', err);
      alert(err.response?.data?.error?.message || 'Failed to delete broker');
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

  if (error || !broker) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Brokers
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <Building2 className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-body font-medium text-error mb-1">Broker Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {error || 'The broker you are looking for does not exist.'}
            </p>
            <Button onClick={handleBack}>Back to Brokers</Button>
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
        Back to Brokers
      </Button>

      {/* Broker Header */}
      <Card padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Icon */}
          <div className="w-16 h-16 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
            <Building2 className="w-8 h-8 text-text-tertiary" />
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title text-text-primary">{broker.name}</h1>
              {broker.is_preferred && (
                <Star className="w-5 h-5 text-warning fill-warning" />
              )}
              <Badge variant={broker.is_active ? 'green' : 'gray'}>
                {broker.is_active ? 'Active' : 'Inactive'}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap text-body-sm text-text-secondary">
              {broker.mc_number && (
                <span>MC# {broker.mc_number}</span>
              )}
              {broker.dot_number && (
                <span>DOT# {broker.dot_number}</span>
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
                {broker.contact?.name && (
                  <div>
                    <p className="text-small text-text-tertiary">Contact Name</p>
                    <p className="text-body text-text-primary font-medium mt-1">
                      {broker.contact.name}
                    </p>
                  </div>
                )}
                {broker.contact?.email && (
                  <div>
                    <p className="text-small text-text-tertiary">Email</p>
                    <a
                      href={`mailto:${broker.contact.email}`}
                      className="flex items-center gap-2 text-body text-accent hover:underline mt-1"
                    >
                      <Mail className="w-4 h-4" />
                      {broker.contact.email}
                    </a>
                  </div>
                )}
                {broker.contact?.phone && (
                  <div>
                    <p className="text-small text-text-tertiary">Phone</p>
                    <a
                      href={`tel:${broker.contact.phone}`}
                      className="flex items-center gap-2 text-body text-accent hover:underline mt-1"
                    >
                      <Phone className="w-4 h-4" />
                      {broker.contact.phone}
                    </a>
                  </div>
                )}
                {broker.contact?.fax && (
                  <div>
                    <p className="text-small text-text-tertiary">Fax</p>
                    <p className="text-body text-text-primary mt-1">
                      {broker.contact.fax}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Address */}
          {(broker.address?.line1 || broker.address?.city) && (
            <Card>
              <CardHeader>
                <CardTitle>Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-text-tertiary mt-0.5" />
                  <div className="text-body text-text-primary">
                    {broker.address.line1 && <p>{broker.address.line1}</p>}
                    {broker.address.line2 && <p>{broker.address.line2}</p>}
                    {(broker.address.city || broker.address.state || broker.address.zip) && (
                      <p>
                        {[broker.address.city, broker.address.state].filter(Boolean).join(', ')}
                        {broker.address.zip && ` ${broker.address.zip}`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {broker.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {broker.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Billing & Stats */}
        <div className="space-y-6">
          {/* Billing Info */}
          <Card>
            <CardHeader>
              <CardTitle>Billing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-small text-text-tertiary">Payment Terms</p>
                <div className="flex items-center gap-2 mt-1">
                  <Clock className="w-4 h-4 text-text-tertiary" />
                  <p className="text-body text-text-primary font-medium">
                    {broker.billing?.payment_terms || 30} days
                  </p>
                </div>
              </div>

              {broker.billing?.credit_limit && (
                <div>
                  <p className="text-small text-text-tertiary">Credit Limit</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary font-medium">
                      ${parseFloat(broker.billing.credit_limit).toLocaleString()}
                    </p>
                  </div>
                </div>
              )}

              {broker.billing?.factoring_company && (
                <div>
                  <p className="text-small text-text-tertiary">Factoring Company</p>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary font-medium">
                      {broker.billing.factoring_company}
                    </p>
                  </div>
                </div>
              )}
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

export default BrokerDetailPage;
