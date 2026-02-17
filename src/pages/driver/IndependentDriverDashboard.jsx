/**
 * IndependentDriverDashboard
 * Shown for self-registered drivers who have no org connections.
 * Displays profile card, load history, documents, and org connection flow.
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import driverConnectionApi from '../../api/driverConnection.api';
import {
  User,
  FileText,
  Building2,
  Search,
  X,
  CheckCircle2,
  Clock,
  AlertTriangle,
  History,
  Send,
  XCircle,
  Check,
  Mail,
  Globe,
  Eye,
  MapPin,
  Truck
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

export function IndependentDriverDashboard({ profile, personalStats, recentHistory }) {
  // Org code search state
  const [orgCode, setOrgCode] = useState('');
  const [orgPreview, setOrgPreview] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Connection request state
  const [requesting, setRequesting] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState(null);
  const [requestError, setRequestError] = useState(null);

  // Pending requests
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Incoming org invites state
  const [incomingInvites, setIncomingInvites] = useState([]);
  const [loadingInvites, setLoadingInvites] = useState(true);
  const [processingInviteId, setProcessingInviteId] = useState(null);

  // Org directory state
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
      fetchPendingRequests();
    } catch (err) {
      console.error('Failed to request connection:', err);
    }
  };

  // Fetch pending requests and incoming invites on mount
  useEffect(() => {
    fetchPendingRequests();
    fetchIncomingInvites();
  }, []);

  const fetchIncomingInvites = useCallback(async () => {
    try {
      setLoadingInvites(true);
      const response = await driverConnectionApi.getIncomingInvites();
      setIncomingInvites(response.data || []);
    } catch (err) {
      console.error('Failed to load incoming invites:', err);
    } finally {
      setLoadingInvites(false);
    }
  }, []);

  const handleAcceptOrgInvite = useCallback(async (inviteId) => {
    setProcessingInviteId(inviteId);
    try {
      await driverConnectionApi.acceptOrgInvite(inviteId);
      window.location.reload();
    } catch (err) {
      console.error('Failed to accept invite:', err);
      setProcessingInviteId(null);
    }
  }, []);

  const handleRejectOrgInvite = useCallback(async (inviteId) => {
    setProcessingInviteId(inviteId);
    try {
      await driverConnectionApi.rejectOrgInvite(inviteId);
      setIncomingInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (err) {
      console.error('Failed to reject invite:', err);
    } finally {
      setProcessingInviteId(null);
    }
  }, []);

  const fetchPendingRequests = useCallback(async () => {
    try {
      setLoadingRequests(true);
      const response = await driverConnectionApi.getMyRequests();
      setPendingRequests(response.data || []);
    } catch (err) {
      console.error('Failed to load pending requests:', err);
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  const handleSearchOrg = async () => {
    if (!orgCode.trim()) return;
    setSearching(true);
    setSearchError(null);
    setOrgPreview(null);
    setRequestSuccess(null);
    setRequestError(null);

    try {
      const response = await driverConnectionApi.findOrg(orgCode.trim());
      setOrgPreview(response.data);
    } catch (err) {
      setSearchError(err.response?.data?.message || 'Organization not found');
    } finally {
      setSearching(false);
    }
  };

  const handleRequestConnection = async () => {
    setRequesting(true);
    setRequestError(null);

    try {
      await driverConnectionApi.requestConnection(orgCode.trim());
      setRequestSuccess('Connection request sent! The organization will review your request.');
      setOrgPreview(null);
      setOrgCode('');
      fetchPendingRequests();
    } catch (err) {
      setRequestError(err.response?.data?.message || 'Failed to send request');
    } finally {
      setRequesting(false);
    }
  };

  const handleCancelRequest = async (requestId) => {
    try {
      await driverConnectionApi.cancelRequest(requestId);
      fetchPendingRequests();
    } catch (err) {
      console.error('Failed to cancel request:', err);
    }
  };

  // Check license/medical card expiry warnings
  const licenseWarning = profile?.license_expiry && isExpiringSoon(profile.license_expiry);
  const medicalWarning = profile?.medical_card_expiry && isExpiringSoon(profile.medical_card_expiry);

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl sm:text-headline text-text-primary">
          Welcome, {profile?.first_name || 'Driver'}
        </h1>
        <p className="text-body-sm sm:text-body text-text-secondary mt-1">
          Your independent driver dashboard
        </p>
      </div>

      {/* Organization Invitations */}
      {!loadingInvites && incomingInvites.length > 0 && (
        <Card className="p-6 border-accent/30 bg-accent/5">
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5 text-accent" />
            Organization Invitations
          </h2>
          <p className="text-body-sm text-text-secondary mb-4">
            These organizations have invited you to connect. Accept to share your profile and receive loads.
          </p>
          <div className="space-y-3">
            {incomingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between p-4 bg-surface-primary rounded-lg border border-surface-tertiary">
                <div className="flex items-center gap-3">
                  {invite.organization?.logo_url ? (
                    <img src={invite.organization.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      {invite.organization?.name}
                    </p>
                    {invite.organization?.state && (
                      <p className="text-small text-text-secondary">{invite.organization.state}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectOrgInvite(invite.id)}
                    disabled={processingInviteId !== null}
                    className="text-error hover:bg-error/10"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Reject
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleAcceptOrgInvite(invite.id)}
                    loading={processingInviteId === invite.id}
                    disabled={processingInviteId !== null && processingInviteId !== invite.id}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Accept
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Profile Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-accent" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-title text-text-primary">
              {profile?.first_name} {profile?.last_name}
            </h2>
            <p className="text-body-sm text-text-secondary">{profile?.email}</p>
            {profile?.phone && (
              <p className="text-body-sm text-text-secondary">{profile.phone}</p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-small text-text-tertiary">CDL Number</p>
                <p className="text-body text-text-primary">
                  {profile?.license_number || 'Not set'}
                  {profile?.license_state && ` (${profile.license_state})`}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">License Expiry</p>
                <p className={`text-body ${licenseWarning ? 'text-warning font-medium' : 'text-text-primary'}`}>
                  {profile?.license_expiry ? formatDate(profile.license_expiry) : 'Not set'}
                  {licenseWarning && <AlertTriangle className="w-4 h-4 inline ml-1 text-warning" />}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Medical Card Expiry</p>
                <p className={`text-body ${medicalWarning ? 'text-warning font-medium' : 'text-text-primary'}`}>
                  {profile?.medical_card_expiry ? formatDate(profile.medical_card_expiry) : 'Not set'}
                  {medicalWarning && <AlertTriangle className="w-4 h-4 inline ml-1 text-warning" />}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Personal Documents</p>
                <p className="text-body text-text-primary">
                  {personalStats?.documentsCount || 0} documents
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-surface-tertiary flex gap-3">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/driver/settings">Edit Profile</Link>
          </Button>
          <Button variant="secondary" size="sm" asChild>
            <Link to="/driver/documents">
              <FileText className="w-4 h-4 mr-2" />
              Documents
            </Link>
          </Button>
        </div>
      </Card>

      {/* Load History */}
      {recentHistory && recentHistory.length > 0 && (
        <div>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <History className="w-5 h-5" />
            Recent Load History
          </h2>
          <Card className="divide-y divide-surface-tertiary">
            {recentHistory.map((record) => (
              <div key={record.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      {record.origin_city}, {record.origin_state} → {record.destination_city}, {record.destination_state}
                    </p>
                    <p className="text-small text-text-secondary">
                      {record.organization_name} · {formatDate(record.completed_at || record.created_at)}
                    </p>
                  </div>
                  {record.miles && (
                    <span className="text-body-sm text-text-secondary">{record.miles} mi</span>
                  )}
                </div>
              </div>
            ))}
          </Card>
        </div>
      )}

      {/* Find Organizations (Directory) */}
      <div>
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
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
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
      </div>

      {/* Find Organization */}
      <div>
        <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Connect to an Organization
        </h2>

        <Card className="p-6">
          <p className="text-body text-text-secondary mb-4">
            Enter an organization's code to request a connection. Once approved, your profile
            will be shared and you'll be able to receive loads.
          </p>

          <div className="flex gap-3">
            <Input
              value={orgCode}
              onChange={(e) => {
                setOrgCode(e.target.value.toUpperCase());
                setSearchError(null);
                setOrgPreview(null);
                setRequestSuccess(null);
                setRequestError(null);
              }}
              placeholder="Enter org code (e.g., ACME24)"
              maxLength={10}
              className="font-mono text-lg tracking-widest uppercase"
            />
            <Button
              onClick={handleSearchOrg}
              loading={searching}
              disabled={!orgCode.trim()}
              variant="secondary"
            >
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Find</span>
            </Button>
          </div>

          {searchError && (
            <p className="mt-3 text-body-sm text-error flex items-center gap-2">
              <X className="w-4 h-4" />
              {searchError}
            </p>
          )}

          {requestSuccess && (
            <p className="mt-3 text-body-sm text-success flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              {requestSuccess}
            </p>
          )}

          {requestError && (
            <p className="mt-3 text-body-sm text-error flex items-center gap-2">
              <X className="w-4 h-4" />
              {requestError}
            </p>
          )}

          {/* Org Preview */}
          {orgPreview && (
            <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {orgPreview.logo_url ? (
                    <img src={orgPreview.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-accent" />
                    </div>
                  )}
                  <div>
                    <p className="text-body font-medium text-text-primary">{orgPreview.name}</p>
                    {orgPreview.state && (
                      <p className="text-small text-text-secondary">{orgPreview.state}</p>
                    )}
                  </div>
                </div>
                <Button onClick={handleRequestConnection} loading={requesting}>
                  <Send className="w-4 h-4 mr-2" />
                  Request to Connect
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Pending Requests */}
      {!loadingRequests && pendingRequests.length > 0 && (
        <div>
          <h2 className="text-title text-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Connection Requests
          </h2>

          <div className="space-y-3">
            {pendingRequests.map((request) => (
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
                    onClick={() => handleCancelRequest(request.id)}
                    className="text-error hover:bg-error/10"
                  >
                    <XCircle className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Settings Link */}
      <div className="text-center pt-4">
        <Link
          to="/driver/settings"
          className="text-body-sm text-accent hover:underline"
        >
          Go to Settings
        </Link>
      </div>
    </div>
  );
}

/**
 * Check if a date is within 30 days of today
 */
function isExpiringSoon(dateStr) {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  const daysLeft = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
  return daysLeft <= 30 && daysLeft >= 0;
}

export default IndependentDriverDashboard;
