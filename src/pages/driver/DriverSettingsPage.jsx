/**
 * DriverSettingsPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalSettings hook
 * - Component focuses on rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { useDriverPortalSettings } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';
import authApi from '../../api/auth.api';
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
  CheckCircle,
  Search,
  Send,
  XCircle,
  Link as LinkIcon,
  Mail,
  Globe,
  AtSign,
  Eye,
  MapPin,
  Truck
} from 'lucide-react';
import driverConnectionApi from '../../api/driverConnection.api';
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

  const { user } = useAuth();

  // Username edit state
  const [username, setUsername] = useState(user?.username || '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  useEffect(() => {
    if (user?.username) setUsername(user.username);
  }, [user?.username]);

  const handleSaveUsername = async () => {
    setUsernameSaving(true);
    setUsernameError(null);
    setUsernameSuccess(false);
    try {
      await authApi.updateProfile({ username: username || null });
      setUsernameSuccess(true);
      setTimeout(() => setUsernameSuccess(false), 3000);
    } catch (err) {
      setUsernameError(err.response?.data?.message || 'Failed to update username');
    } finally {
      setUsernameSaving(false);
    }
  };

  // Org directory search state
  const [orgDirQuery, setOrgDirQuery] = useState('');
  const [orgDirResults, setOrgDirResults] = useState([]);
  const [orgDirSearching, setOrgDirSearching] = useState(false);
  const [orgDirError, setOrgDirError] = useState(null);
  const [selectedOrgProfile, setSelectedOrgProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  const handleOrgDirSearch = async () => {
    if (!orgDirQuery.trim() || orgDirQuery.trim().length < 2) return;
    setOrgDirSearching(true);
    setOrgDirError(null);
    setSelectedOrgProfile(null);
    try {
      const response = await driverConnectionApi.searchOrgDirectory(orgDirQuery.trim());
      setOrgDirResults(response.data || []);
    } catch (err) {
      setOrgDirError(err.response?.data?.message || 'Search failed');
    } finally {
      setOrgDirSearching(false);
    }
  };

  const handleViewOrgProfile = async (slug) => {
    setLoadingProfile(true);
    try {
      const response = await driverConnectionApi.getOrgPublicProfile(slug);
      setSelectedOrgProfile(response.data);
    } catch (err) {
      console.error('Failed to load profile:', err);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleConnectFromDirectory = async (orgCode) => {
    try {
      await driverConnectionApi.requestConnection(orgCode);
      setSelectedOrgProfile(null);
      setOrgDirResults([]);
      setOrgDirQuery('');
      // Refresh pending requests
      const res = await driverConnectionApi.getMyRequests();
      setPendingConnectionRequests(res.data || []);
    } catch (err) {
      console.error('Failed to request connection:', err);
    }
  };

  // Local state for invite code input
  const [inviteCode, setInviteCode] = useState('');

  // Org code connection state
  const [orgCode, setOrgCode] = useState('');
  const [orgPreview, setOrgPreview] = useState(null);
  const [searchingOrg, setSearchingOrg] = useState(false);
  const [orgSearchError, setOrgSearchError] = useState(null);
  const [connectionRequesting, setConnectionRequesting] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(null);
  const [connectionError, setConnectionError] = useState(null);
  const [pendingConnectionRequests, setPendingConnectionRequests] = useState([]);

  // Load pending connection requests
  useState(() => {
    driverConnectionApi.getMyRequests()
      .then(res => setPendingConnectionRequests(res.data || []))
      .catch(() => {});
  });

  const handleSearchOrg = async () => {
    if (!orgCode.trim()) return;
    setSearchingOrg(true);
    setOrgSearchError(null);
    setOrgPreview(null);
    setConnectionSuccess(null);
    setConnectionError(null);

    try {
      const response = await driverConnectionApi.findOrg(orgCode.trim());
      setOrgPreview(response.data);
    } catch (err) {
      setOrgSearchError(err.response?.data?.message || 'Organization not found');
    } finally {
      setSearchingOrg(false);
    }
  };

  const handleRequestConnection = async () => {
    setConnectionRequesting(true);
    setConnectionError(null);
    try {
      await driverConnectionApi.requestConnection(orgCode.trim());
      setConnectionSuccess('Connection request sent!');
      setOrgPreview(null);
      setOrgCode('');
      // Refresh pending requests
      const res = await driverConnectionApi.getMyRequests();
      setPendingConnectionRequests(res.data || []);
    } catch (err) {
      setConnectionError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setConnectionRequesting(false);
    }
  };

  const handleCancelConnectionRequest = async (requestId) => {
    try {
      await driverConnectionApi.cancelRequest(requestId);
      setPendingConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  // Incoming org-initiated invites
  const [incomingOrgInvites, setIncomingOrgInvites] = useState([]);
  const [loadingOrgInvites, setLoadingOrgInvites] = useState(true);
  const [processingOrgInviteId, setProcessingOrgInviteId] = useState(null);

  useEffect(() => {
    driverConnectionApi.getIncomingInvites()
      .then(res => setIncomingOrgInvites(res.data || []))
      .catch(() => {})
      .finally(() => setLoadingOrgInvites(false));
  }, []);

  const handleAcceptOrgInvite = useCallback(async (inviteId) => {
    setProcessingOrgInviteId(inviteId);
    try {
      await driverConnectionApi.acceptOrgInvite(inviteId);
      window.location.reload();
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setProcessingOrgInviteId(null);
    }
  }, []);

  const handleRejectOrgInvite = useCallback(async (inviteId) => {
    setProcessingOrgInviteId(inviteId);
    try {
      await driverConnectionApi.rejectOrgInvite(inviteId);
      setIncomingOrgInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error('Failed to reject invite:', err);
    } finally {
      setProcessingOrgInviteId(null);
    }
  }, []);

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

      {/* Username */}
      <section>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <AtSign className="w-5 h-5" />
          Username
        </h2>
        <Card className="p-6">
          <p className="text-body text-text-secondary mb-4">
            Your public username lets organizations find you in the driver network.
          </p>
          <div className="flex gap-3">
            <Input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''));
                setUsernameError(null);
                setUsernameSuccess(false);
              }}
              placeholder="e.g., mike_trucker"
              maxLength={30}
            />
            <Button
              onClick={handleSaveUsername}
              loading={usernameSaving}
              disabled={username === (user?.username || '')}
            >
              Save
            </Button>
          </div>
          {usernameError && (
            <p className="mt-2 text-body-sm text-error flex items-center gap-2">
              <X className="w-4 h-4" />{usernameError}
            </p>
          )}
          {usernameSuccess && (
            <p className="mt-2 text-body-sm text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />Username saved
            </p>
          )}
        </Card>
      </section>

      {/* Find Organizations */}
      <section>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <Globe className="w-5 h-5" />
          Find Organizations
        </h2>

        <Card className="p-6">
          <p className="text-body text-text-secondary mb-4">
            Search the directory to find trucking companies and request a connection.
          </p>
          <div className="flex gap-3 mb-3">
            <Input
              value={orgDirQuery}
              onChange={(e) => setOrgDirQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleOrgDirSearch()}
              placeholder="Search by name, state, DOT/MC..."
            />
            <Button
              onClick={handleOrgDirSearch}
              loading={orgDirSearching}
              disabled={!orgDirQuery.trim() || orgDirQuery.trim().length < 2}
              variant="secondary"
            >
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>

          {orgDirError && (
            <p className="text-body-sm text-error flex items-center gap-2 mb-3">
              <X className="w-4 h-4" />{orgDirError}
            </p>
          )}

          {/* Org Profile View */}
          {selectedOrgProfile && (
            <div className="mb-4 p-5 bg-surface-secondary rounded-lg border border-surface-tertiary">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedOrgProfile.logo_url ? (
                    <img src={selectedOrgProfile.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-accent" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-body font-medium text-text-primary">{selectedOrgProfile.name}</h3>
                    {(selectedOrgProfile.city || selectedOrgProfile.state) && (
                      <p className="text-small text-text-secondary flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {[selectedOrgProfile.city, selectedOrgProfile.state].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
                <button onClick={() => setSelectedOrgProfile(null)} className="text-text-tertiary hover:text-text-primary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              {selectedOrgProfile.description && (
                <p className="text-body-sm text-text-secondary mb-3">{selectedOrgProfile.description}</p>
              )}
              <div className="grid grid-cols-2 gap-3 text-small text-text-secondary mb-4">
                {selectedOrgProfile.dot_number && <div>DOT: {selectedOrgProfile.dot_number}</div>}
                {selectedOrgProfile.mc_number && <div>MC: {selectedOrgProfile.mc_number}</div>}
                {selectedOrgProfile.fleet_size && <div><Truck className="w-3 h-3 inline mr-1" />{selectedOrgProfile.fleet_size} trucks</div>}
                {selectedOrgProfile.website && <div><Globe className="w-3 h-3 inline mr-1" />{selectedOrgProfile.website}</div>}
                {selectedOrgProfile.public_phone && <div>Phone: {selectedOrgProfile.public_phone}</div>}
                {selectedOrgProfile.public_email && <div>Email: {selectedOrgProfile.public_email}</div>}
              </div>
              {selectedOrgProfile.org_code && (
                <Button onClick={() => handleConnectFromDirectory(selectedOrgProfile.org_code)}>
                  <Send className="w-4 h-4 mr-2" />
                  Request Connection
                </Button>
              )}
            </div>
          )}

          {/* Search Results */}
          {orgDirResults.length > 0 && !selectedOrgProfile && (
            <div className="space-y-2">
              {orgDirResults.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 bg-surface-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    {org.logo_url ? (
                      <img src={org.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                    )}
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">{org.name}</p>
                      <p className="text-small text-text-secondary">
                        {[org.city, org.state].filter(Boolean).join(', ')}
                        {org.description && ` — ${org.description.substring(0, 60)}${org.description.length > 60 ? '...' : ''}`}
                      </p>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => handleViewOrgProfile(org.slug)}>
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!orgDirSearching && orgDirResults.length === 0 && orgDirQuery.trim().length >= 2 && !orgDirError && !selectedOrgProfile && (
            <p className="text-body-sm text-text-tertiary text-center py-4">
              No organizations found. Try a different search term.
            </p>
          )}
        </Card>
      </section>

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

      {/* Incoming Organization Invites */}
      {!loadingOrgInvites && incomingOrgInvites.length > 0 && (
        <section>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            Organization Invitations
          </h2>

          <div className="space-y-3">
            {incomingOrgInvites.map((invite) => (
              <Card key={invite.id} className="p-4 border-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {invite.organization?.logo_url ? (
                      <img src={invite.organization.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-accent" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-body font-medium text-text-primary">
                        {invite.organization?.name}
                      </h3>
                      <p className="text-small text-text-secondary">
                        {invite.organization?.state && `${invite.organization.state} · `}
                        Invited {formatDate(invite.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRejectOrgInvite(invite.id)}
                      disabled={processingOrgInviteId !== null}
                      className="text-error hover:bg-error/10"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptOrgInvite(invite.id)}
                      loading={processingOrgInviteId === invite.id}
                      disabled={processingOrgInviteId !== null && processingOrgInviteId !== invite.id}
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                  </div>
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

      {/* Connect to Organization (via org code) */}
      <section>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <LinkIcon className="w-5 h-5" />
          Connect to Organization
        </h2>

        <Card className="p-6">
          <p className="text-body text-text-secondary mb-4">
            Enter an organization's code to request a connection. Your profile data will be
            shared with the organization once they approve.
          </p>
          <div className="flex gap-3">
            <Input
              value={orgCode}
              onChange={(e) => {
                setOrgCode(e.target.value.toUpperCase());
                setOrgSearchError(null);
                setOrgPreview(null);
                setConnectionSuccess(null);
                setConnectionError(null);
              }}
              placeholder="Enter org code (e.g., ACME24)"
              maxLength={10}
              className="font-mono text-lg tracking-widest uppercase"
            />
            <Button
              onClick={handleSearchOrg}
              loading={searchingOrg}
              disabled={!orgCode.trim()}
              variant="secondary"
            >
              <Search className="w-4 h-4 mr-2" />
              Find
            </Button>
          </div>

          {orgSearchError && (
            <p className="mt-3 text-body-sm text-error flex items-center gap-2">
              <X className="w-4 h-4" />{orgSearchError}
            </p>
          )}

          {connectionSuccess && (
            <p className="mt-3 text-body-sm text-success flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />{connectionSuccess}
            </p>
          )}

          {connectionError && (
            <p className="mt-3 text-body-sm text-error flex items-center gap-2">
              <X className="w-4 h-4" />{connectionError}
            </p>
          )}

          {orgPreview && (
            <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">{orgPreview.name}</p>
                    {orgPreview.state && (
                      <p className="text-small text-text-secondary">{orgPreview.state}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handleRequestConnection} loading={connectionRequesting}>
                  <Send className="w-4 h-4 mr-2" />
                  Request
                </Button>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* Pending Connection Requests */}
      {pendingConnectionRequests.length > 0 && (
        <section>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Connection Requests
          </h2>
          <div className="space-y-3">
            {pendingConnectionRequests.map((request) => (
              <Card key={request.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">
                        {request.organization?.name}
                      </p>
                      <p className="text-small text-text-secondary">
                        Requested {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCancelConnectionRequest(request.id)}
                    className="text-error hover:bg-error/10"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

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
