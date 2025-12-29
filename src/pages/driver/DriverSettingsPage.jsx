/**
 * DriverSettingsPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalSettings hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useDriverPortalSettings } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import {
  Building2,
  LogOut,
  Check,
  X,
  Clock,
  History,
  ArrowRightLeft,
  CheckCircle
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function DriverSettingsPage() {
  // All data and logic from the hook
  const {
    activeOrgs,
    leftOrgs,
    pendingInvites,
    history,
    loading,
    acceptInviteByCode,
    acceptInvite,
    declineInvite,
    disconnectFromOrg,
    disconnecting,
    inviteLoading,
    inviteError,
    inviteSuccess,
    clearInviteMessages
  } = useDriverPortalSettings();

  // Local state for invite code input
  const [inviteCode, setInviteCode] = useState('');

  const handleAcceptInviteByCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      await acceptInviteByCode(inviteCode.trim());
      setInviteCode('');
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleCodeChange = (e) => {
    setInviteCode(e.target.value.toUpperCase());
    clearInviteMessages();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline text-text-primary">Settings</h1>
        <p className="text-body text-text-secondary mt-1">
          Manage your organizations and account
        </p>
      </div>

      {/* My Organizations */}
      <section>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          My Organizations
        </h2>

        {activeOrgs.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-body text-text-secondary">
              You're not connected to any organizations yet.
            </p>
            <p className="text-body-sm text-text-tertiary mt-2">
              Enter an invite code below to join an organization.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {activeOrgs.map((org) => (
              <Card key={org.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="text-body font-medium text-text-primary">
                        {org.name}
                      </h3>
                      <p className="text-small text-text-secondary">
                        {org.role} · Member since {formatDate(org.joined_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => disconnectFromOrg(org.id, org.name)}
                    loading={disconnecting === org.id}
                    className="text-error hover:bg-error/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Pending Invitations */}
      {pendingInvites.length > 0 && (
        <section>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Invitations
          </h2>

          <div className="space-y-3">
            {pendingInvites.map((invite) => (
              <Card key={invite.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-warning" />
                    </div>
                    <div>
                      <h3 className="text-body font-medium text-text-primary">
                        {invite.organization?.name}
                      </h3>
                      <p className="text-small text-text-secondary">
                        Invited {formatDate(invite.invited_at)}
                        {invite.invited_by?.name && ` by ${invite.invited_by.name}`}
                      </p>
                      {invite.is_expired && (
                        <p className="text-small text-error">Invitation expired</p>
                      )}
                    </div>
                  </div>
                  {!invite.is_expired && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => declineInvite(invite.id)}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => acceptInvite(invite.id)}
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                      </Button>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Enter Invite Code */}
      <section>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5" />
          Enter Invite Code
        </h2>

        <Card className="p-6">
          <form onSubmit={handleAcceptInviteByCode} className="space-y-4">
            <div>
              <p className="text-body text-text-secondary mb-4">
                Enter the 8-character code from your invite email to join an organization.
              </p>
              <div className="flex gap-3">
                <Input
                  value={inviteCode}
                  onChange={handleCodeChange}
                  placeholder="Enter code (e.g., DRV7X2K9)"
                  maxLength={8}
                  className="font-mono text-lg tracking-widest uppercase"
                />
                <Button type="submit" loading={inviteLoading} disabled={inviteCode.length !== 8}>
                  Join
                </Button>
              </div>
            </div>

            {inviteError && (
              <p className="text-body-sm text-error flex items-center gap-2">
                <X className="w-4 h-4" />
                {inviteError}
              </p>
            )}

            {inviteSuccess && (
              <p className="text-body-sm text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {inviteSuccess}
              </p>
            )}
          </form>
        </Card>
      </section>

      {/* Organization History */}
      {history.length > 0 && (
        <section>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            History
          </h2>

          <Card className="p-4">
            <div className="space-y-4">
              {history.map((event, index) => (
                <div key={index} className="flex items-start gap-4">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    event.type === 'joined' ? 'bg-success/10' :
                    event.type === 'left' ? 'bg-error/10' :
                    'bg-warning/10'
                  }`}>
                    {event.type === 'joined' && <Check className="w-4 h-4 text-success" />}
                    {event.type === 'left' && <LogOut className="w-4 h-4 text-error" />}
                    {event.type === 'invited' && <Clock className="w-4 h-4 text-warning" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body text-text-primary">
                      {event.type === 'joined' && `Joined ${event.organization?.name}`}
                      {event.type === 'left' && `Left ${event.organization?.name}`}
                      {event.type === 'invited' && `Invited to ${event.organization?.name}`}
                    </p>
                    <p className="text-small text-text-tertiary">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>
      )}

      {/* Previous Organizations (Read-only) */}
      {leftOrgs.length > 0 && (
        <section>
          <h2 className="text-title text-text-secondary mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Previous Organizations
          </h2>

          <div className="space-y-3">
            {leftOrgs.map((org) => (
              <Card key={org.id} className="p-4 opacity-75">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-surface-tertiary flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-medium text-text-secondary">
                        {org.name}
                      </h3>
                      <span className="text-xs bg-surface-tertiary text-text-tertiary px-2 py-0.5 rounded-full">
                        Read-only
                      </span>
                    </div>
                    <p className="text-small text-text-tertiary">
                      {formatDate(org.joined_at)} - {formatDate(org.left_at)}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

export default DriverSettingsPage;
