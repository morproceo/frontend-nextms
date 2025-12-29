/**
 * DriverDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - Uses useDriver domain hook for data and mutations
 * - Centralized configs from config/status
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDriver } from '../../hooks';
import { DriverStatusConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Phone,
  Calendar,
  CreditCard,
  Send,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Edit,
  Copy,
  LogOut
} from 'lucide-react';

// Invite status display config (specific to this page's UI)
const inviteStatusConfig = {
  claimed: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Profile Claimed' },
  accepted: { icon: CheckCircle, color: 'text-success', bg: 'bg-success/10', label: 'Invite Accepted' },
  pending: { icon: Clock, color: 'text-warning', bg: 'bg-warning/10', label: 'Invite Pending' },
  expired: { icon: XCircle, color: 'text-error', bg: 'bg-error/10', label: 'Invite Expired' },
  not_invited: { icon: Mail, color: 'text-text-secondary', bg: 'bg-surface-secondary', label: 'Not Invited' },
  no_email: { icon: AlertCircle, color: 'text-text-tertiary', bg: 'bg-surface-secondary', label: 'No Email' },
  already_member: { icon: UserCheck, color: 'text-accent', bg: 'bg-accent/10', label: 'Already Member' },
  disconnected: { icon: LogOut, color: 'text-error', bg: 'bg-error/10', label: 'Disconnected' }
};

export function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { currentOrg, orgUrl } = useOrg();
  const [codeCopied, setCodeCopied] = useState(false);

  // Use domain hook for driver data and invite actions
  const {
    driver,
    loading,
    error,
    refetch,
    sendInvite,
    resendInvite,
    inviteStatus,
    inviteLoading
  } = useDriver(driverId);

  const handleInvite = async () => {
    try {
      await sendInvite();
    } catch (err) {
      console.error('Failed to send invite:', err);
      alert(err.response?.data?.message || 'Failed to send invitation');
    }
  };

  const handleResendInvite = async () => {
    try {
      await resendInvite();
    } catch (err) {
      console.error('Failed to resend invite:', err);
      alert(err.response?.data?.message || 'Failed to resend invitation');
    }
  };

  const handleEdit = () => {
    navigate(orgUrl(`/drivers/${driverId}/edit`));
  };

  const handleBack = () => {
    navigate(orgUrl('/drivers'));
  };

  const handleCopyCode = async () => {
    if (inviteStatus?.invite_code) {
      try {
        await navigator.clipboard.writeText(inviteStatus.invite_code);
        setCodeCopied(true);
        setTimeout(() => setCodeCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy:', err);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error || !driver) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={handleBack}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Drivers
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex flex-col items-center justify-center py-8">
            <div className="w-16 h-16 bg-error/10 rounded-full flex items-center justify-center mb-4">
              <UserX className="w-8 h-8 text-error" />
            </div>
            <h3 className="text-body font-medium text-error mb-1">Driver Not Found</h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {error || 'The driver you are looking for does not exist.'}
            </p>
            <Button onClick={handleBack}>Back to Drivers</Button>
          </div>
        </Card>
      </div>
    );
  }

  const inviteConfig = inviteStatusConfig[inviteStatus?.status] || inviteStatusConfig.not_invited;
  const InviteIcon = inviteConfig.icon;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={handleBack} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Drivers
      </Button>

      {/* Driver Header */}
      <Card padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          {/* Avatar */}
          <div className="w-20 h-20 bg-surface-secondary rounded-full flex items-center justify-center flex-shrink-0">
            {driver.user?.avatar_url ? (
              <img
                src={driver.user.avatar_url}
                alt={`${driver.first_name} ${driver.last_name}`}
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <span className="text-headline font-medium text-text-secondary">
                {driver.first_name?.[0]}{driver.last_name?.[0]}
              </span>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-title text-text-primary">
                {driver.first_name} {driver.last_name}
              </h1>
              <Badge variant={DriverStatusConfig[driver.status]?.variant || 'gray'}>
                {DriverStatusConfig[driver.status]?.label || driver.status}
              </Badge>
              {driver.user_id ? (
                <Badge variant="green">
                  <UserCheck className="w-3 h-3 mr-1" />
                  Claimed
                </Badge>
              ) : (
                <Badge variant="gray">
                  <UserX className="w-3 h-3 mr-1" />
                  Unclaimed
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              {driver.email && (
                <a
                  href={`mailto:${driver.email}`}
                  className="flex items-center gap-1 text-body-sm text-text-secondary hover:text-accent"
                >
                  <Mail className="w-4 h-4" />
                  {driver.email}
                </a>
              )}
              {driver.phone && (
                <a
                  href={`tel:${driver.phone}`}
                  className="flex items-center gap-1 text-body-sm text-text-secondary hover:text-accent"
                >
                  <Phone className="w-4 h-4" />
                  {driver.phone}
                </a>
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
          {/* License & Compliance */}
          <Card>
            <CardHeader>
              <CardTitle>License & Compliance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">License Number</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {driver.license_number || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">License State</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {driver.license_state || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">License Expiry</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary font-medium">
                      {formatDate(driver.license_expiry)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Medical Card Expiry</p>
                  <div className="flex items-center gap-2 mt-1">
                    <CreditCard className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary font-medium">
                      {formatDate(driver.medical_card_expiry)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Employment Info */}
          <Card>
            <CardHeader>
              <CardTitle>Employment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div>
                  <p className="text-small text-text-tertiary">Hire Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="w-4 h-4 text-text-tertiary" />
                    <p className="text-body text-text-primary font-medium">
                      {formatDate(driver.hire_date)}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Organization</p>
                  <p className="text-body text-text-primary font-medium mt-1">
                    {driver.organization?.name || currentOrg?.name || '-'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {driver.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body text-text-secondary whitespace-pre-wrap">
                  {driver.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Invite Status */}
        <div className="space-y-6">
          {/* Invite Status Card */}
          <Card>
            <CardHeader>
              <CardTitle>Account Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Current Status */}
              <div className={`flex items-center gap-3 p-4 rounded-card ${inviteConfig.bg}`}>
                <InviteIcon className={`w-6 h-6 ${inviteConfig.color}`} />
                <div>
                  <p className={`text-body font-medium ${inviteConfig.color}`}>
                    {inviteConfig.label}
                  </p>
                  {inviteStatus?.message && (
                    <p className="text-small text-text-secondary mt-0.5">
                      {inviteStatus.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Invite Details */}
              {inviteStatus?.invited_at && (
                <div>
                  <p className="text-small text-text-tertiary">Invited</p>
                  <p className="text-body-sm text-text-primary mt-0.5">
                    {formatDate(inviteStatus.invited_at)}
                  </p>
                </div>
              )}

              {inviteStatus?.expires_at && inviteStatus.status === 'pending' && (
                <div>
                  <p className="text-small text-text-tertiary">Expires</p>
                  <p className="text-body-sm text-text-primary mt-0.5">
                    {formatDate(inviteStatus.expires_at)}
                  </p>
                </div>
              )}

              {/* Invite Code - shown for pending invites */}
              {inviteStatus?.invite_code && inviteStatus.status === 'pending' && (
                <div className="p-3 bg-surface-secondary rounded-card">
                  <p className="text-small text-text-tertiary mb-1">Invite Code</p>
                  <div className="flex items-center gap-2">
                    <code className="text-body font-mono font-semibold text-accent tracking-widest">
                      {inviteStatus.invite_code}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleCopyCode}
                      className="p-1.5 h-auto"
                    >
                      {codeCopied ? (
                        <CheckCircle className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  <p className="text-small text-text-tertiary mt-2">
                    Share this code with the driver to accept in their settings.
                  </p>
                </div>
              )}

              {inviteStatus?.accepted_at && (
                <div>
                  <p className="text-small text-text-tertiary">Accepted</p>
                  <p className="text-body-sm text-text-primary mt-0.5">
                    {formatDate(inviteStatus.accepted_at)}
                  </p>
                </div>
              )}

              {inviteStatus?.claimed_at && (
                <div>
                  <p className="text-small text-text-tertiary">Claimed</p>
                  <p className="text-body-sm text-text-primary mt-0.5">
                    {formatDate(inviteStatus.claimed_at)}
                  </p>
                </div>
              )}

              {/* Disconnected info */}
              {inviteStatus?.status === 'disconnected' && inviteStatus?.left_at && (
                <div>
                  <p className="text-small text-text-tertiary">Left Organization</p>
                  <p className="text-body-sm text-text-primary mt-0.5">
                    {formatDate(inviteStatus.left_at)}
                  </p>
                </div>
              )}

              {/* Invite Actions */}
              {driver.email && (
                <div className="pt-2 border-t border-surface-tertiary">
                  {inviteStatus?.status === 'not_invited' ? (
                    <Button
                      onClick={handleInvite}
                      disabled={inviteLoading}
                      className="w-full"
                    >
                      {inviteLoading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Send Invitation
                    </Button>
                  ) : inviteStatus?.status === 'pending' || inviteStatus?.status === 'expired' ? (
                    <Button
                      onClick={handleResendInvite}
                      disabled={inviteLoading}
                      variant="secondary"
                      className="w-full"
                    >
                      {inviteLoading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Resend Invitation
                    </Button>
                  ) : inviteStatus?.status === 'disconnected' ? (
                    <Button
                      onClick={handleInvite}
                      disabled={inviteLoading}
                      className="w-full"
                    >
                      {inviteLoading ? (
                        <Spinner size="sm" className="mr-2" />
                      ) : (
                        <Send className="w-4 h-4 mr-2" />
                      )}
                      Re-invite Driver
                    </Button>
                  ) : null}
                </div>
              )}

              {!driver.email && (
                <div className="pt-2 border-t border-surface-tertiary">
                  <p className="text-small text-text-tertiary">
                    Add an email address to invite this driver to claim their profile.
                  </p>
                  <Button
                    onClick={handleEdit}
                    variant="secondary"
                    className="w-full mt-2"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Add Email
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Linked User Info */}
          {driver.user && (
            <Card>
              <CardHeader>
                <CardTitle>Linked Account</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-surface-secondary rounded-full flex items-center justify-center">
                    {driver.user.avatar_url ? (
                      <img
                        src={driver.user.avatar_url}
                        alt={`${driver.user.first_name} ${driver.user.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-body-sm font-medium text-text-secondary">
                        {driver.user.first_name?.[0]}{driver.user.last_name?.[0]}
                      </span>
                    )}
                  </div>
                  <div>
                    <p className="text-body-sm font-medium text-text-primary">
                      {driver.user.first_name} {driver.user.last_name}
                    </p>
                    <p className="text-small text-text-secondary">
                      {driver.user.email}
                    </p>
                  </div>
                </div>
                {driver.user.email_verified_at && (
                  <div className="flex items-center gap-2 text-small text-success">
                    <CheckCircle className="w-4 h-4" />
                    Email verified
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

export default DriverDetailPage;
