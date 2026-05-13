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
  Truck,
  User as UserIcon,
  Phone,
  HeartPulse,
  BadgeCheck,
  Save
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
    clearInviteMessages,
    refetch
  } = useDriverPortalSettings();

  const { user, updateProfile } = useAuth();

  // Tab: 'profile' | 'find' | 'connected'
  const [tab, setTab] = useState('profile');

  // Username edit state
  const [username, setUsername] = useState(user?.username || '');
  const [usernameSaving, setUsernameSaving] = useState(false);
  const [usernameError, setUsernameError] = useState(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);

  // Personal-profile form state
  const [profile, setProfile] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    license_number: user?.license_number || '',
    license_state: user?.license_state || '',
    license_expiry: user?.license_expiry ? user.license_expiry.slice(0, 10) : '',
    medical_card_expiry: user?.medical_card_expiry ? user.medical_card_expiry.slice(0, 10) : ''
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // Sync the form when AuthContext user updates from elsewhere.
  useEffect(() => {
    if (!user) return;
    setProfile({
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      license_number: user.license_number || '',
      license_state: user.license_state || '',
      license_expiry: user.license_expiry ? user.license_expiry.slice(0, 10) : '',
      medical_card_expiry: user.medical_card_expiry ? user.medical_card_expiry.slice(0, 10) : ''
    });
  }, [user?.id]);

  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await updateProfile({
        first_name: profile.first_name || null,
        last_name: profile.last_name || null,
        phone: profile.phone || null,
        license_number: profile.license_number || null,
        license_state: profile.license_state || null,
        license_expiry: profile.license_expiry || null,
        medical_card_expiry: profile.medical_card_expiry || null
      });
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err.response?.data?.error?.message || err.message);
    } finally {
      setProfileSaving(false);
    }
  };

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

  // Load pending connection requests on mount. (Previously `useState(() => {})`
  // — that runs once but is the wrong primitive; useEffect with [] deps is
  // the correct pattern and works with React Strict Mode dev double-mount.)
  useEffect(() => {
    let cancelled = false;
    driverConnectionApi.getMyRequests()
      .then((res) => { if (!cancelled) setPendingConnectionRequests(res.data || []); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
      // Drop the accepted invite from the local list + refetch orgs so the
      // newly-joined org appears in the Connected tab. Previously we ran a
      // full-page reload which dropped form state and felt jarring.
      setIncomingOrgInvites((prev) => prev.filter((i) => i.id !== inviteId));
      if (typeof refetch === 'function') {
        try { await refetch(); } catch (_) { /* non-fatal */ }
      }
    } catch (err) {
      console.error('Failed to accept invite:', err);
    } finally {
      setProcessingOrgInviteId(null);
    }
  }, [refetch]);

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

  // ──────────────────────────────────────────────────────────────────────
  // Render — three tabs: Profile · Find organization · Connected
  // ──────────────────────────────────────────────────────────────────────

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      <header>
        <h1 className="text-headline text-text-primary">Settings</h1>
        <p className="text-body text-text-secondary mt-1">
          Your profile, your organizations, your account.
        </p>
      </header>

      {/* Tabs */}
      <div className="border-b border-border-subtle">
        <div className="flex gap-1 overflow-x-auto -mb-px">
          {[
            { v: 'profile',   label: 'Profile',           icon: UserIcon },
            { v: 'find',      label: 'Find organization', icon: Search },
            { v: 'connected', label: 'Connected',         icon: Building2, badge: activeOrgs.length || null }
          ].map(({ v, label, icon: Icon, badge }) => (
            <button
              key={v}
              onClick={() => setTab(v)}
              className={`px-4 py-3 text-body-sm font-medium border-b-2 inline-flex items-center gap-2 whitespace-nowrap transition-colors ${
                tab === v
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
              {badge != null && (
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                  tab === v ? 'bg-accent/15 text-accent' : 'bg-surface-tertiary text-text-tertiary'
                }`}>
                  {badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================= */}
      {/* PROFILE TAB                                                    */}
      {/* ============================================================= */}
      {tab === 'profile' && (
        <div className="space-y-6">
          {/* Username (already existed) */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <AtSign className="w-5 h-5 text-text-tertiary" />
              <h2 className="text-title-sm text-text-primary">Public username</h2>
            </div>
            <p className="text-body-sm text-text-secondary mb-4">
              Your handle on the driver network. Carriers can search for you by username.
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

          {/* Personal info */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <UserIcon className="w-5 h-5 text-text-tertiary" />
              <h2 className="text-title-sm text-text-primary">Personal info</h2>
            </div>
            <p className="text-body-sm text-text-secondary mb-4">
              Carriers see this when you connect with them.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="First name"
                value={profile.first_name}
                onChange={(e) => setProfile({ ...profile, first_name: e.target.value })}
                placeholder="John"
              />
              <Input
                label="Last name"
                value={profile.last_name}
                onChange={(e) => setProfile({ ...profile, last_name: e.target.value })}
                placeholder="Doe"
              />
              <Input
                label="Phone"
                type="tel"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                placeholder="(555) 555-0100"
              />
              <Input
                label="Email"
                value={user?.email || ''}
                disabled
                hint="Set at signup. Contact support to change."
              />
            </div>

            <div className="mt-6 pt-6 border-t border-border-subtle">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-3 flex items-center gap-1.5">
                <BadgeCheck className="w-3.5 h-3.5" /> Commercial driver's license
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="CDL number"
                  value={profile.license_number}
                  onChange={(e) => setProfile({ ...profile, license_number: e.target.value })}
                  placeholder="CDL #"
                />
                <Input
                  label="State"
                  value={profile.license_state}
                  onChange={(e) => setProfile({ ...profile, license_state: e.target.value.toUpperCase() })}
                  placeholder="TX"
                  maxLength={2}
                />
                <Input
                  label="License expiry"
                  type="date"
                  value={profile.license_expiry}
                  onChange={(e) => setProfile({ ...profile, license_expiry: e.target.value })}
                />
                <Input
                  label="Medical card expiry"
                  type="date"
                  value={profile.medical_card_expiry}
                  onChange={(e) => setProfile({ ...profile, medical_card_expiry: e.target.value })}
                />
              </div>
            </div>

            {profileError && (
              <p className="mt-4 text-body-sm text-error flex items-center gap-2">
                <X className="w-4 h-4" />{profileError}
              </p>
            )}
            {profileSuccess && (
              <p className="mt-4 text-body-sm text-success flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />Saved
              </p>
            )}

            <div className="mt-6 flex justify-end">
              <Button onClick={handleSaveProfile} loading={profileSaving}>
                <Save className="w-4 h-4 mr-1.5" /> Save changes
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* FIND ORGANIZATION TAB                                          */}
      {/* ============================================================= */}
      {tab === 'find' && (
        <div className="space-y-6">
          {/* Enter Invite Code */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-text-tertiary" />
              <h2 className="text-title-sm text-text-primary">Have a driver invite code?</h2>
            </div>
            <form onSubmit={handleAcceptInviteByCode} className="space-y-3">
              <p className="text-body-sm text-text-secondary">
                A dispatcher should have shared an 8-character code with you. Paste it here to join their team.
              </p>
              <div className="flex gap-3">
                <Input
                  value={inviteCode}
                  onChange={handleCodeChange}
                  placeholder="DRV7X2K9"
                  maxLength={8}
                  className="font-mono text-lg tracking-widest uppercase"
                />
                <Button type="submit" loading={inviteLoading} disabled={inviteCode.length !== 8}>
                  Join
                </Button>
              </div>
              {inviteError && (
                <p className="text-body-sm text-error flex items-center gap-2">
                  <X className="w-4 h-4" />{inviteError}
                </p>
              )}
              {inviteSuccess && (
                <p className="text-body-sm text-success flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />{inviteSuccess}
                </p>
              )}
            </form>
          </Card>

          {/* Connect via org code */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <LinkIcon className="w-5 h-5 text-text-tertiary" />
              <h2 className="text-title-sm text-text-primary">Request to join with an org code</h2>
            </div>
            <p className="text-body-sm text-text-secondary mb-4">
              Have the org's short code? Send them a connection request. Your profile gets shared once they approve.
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
                placeholder="ACME24"
                maxLength={10}
                className="font-mono text-lg tracking-widest uppercase"
              />
              <Button onClick={handleSearchOrg} loading={searchingOrg} disabled={!orgCode.trim()} variant="secondary">
                <Search className="w-4 h-4 mr-1.5" /> Find
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
              <div className="mt-4 p-4 bg-surface-secondary rounded-lg flex items-center justify-between">
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
                  <Send className="w-4 h-4 mr-1.5" /> Request
                </Button>
              </div>
            )}
          </Card>

          {/* Search the directory */}
          <Card className="p-6">
            <div className="mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-text-tertiary" />
              <h2 className="text-title-sm text-text-primary">Search the directory</h2>
            </div>
            <p className="text-body-sm text-text-secondary mb-4">
              Don't have a code? Browse verified carriers by name, state, or MC/DOT.
            </p>
            <div className="flex gap-3">
              <Input
                value={orgDirQuery}
                onChange={(e) => setOrgDirQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleOrgDirSearch()}
                placeholder="Acme · Texas · DOT 1234567"
              />
              <Button onClick={handleOrgDirSearch} loading={orgDirSearching}
                disabled={!orgDirQuery.trim() || orgDirQuery.trim().length < 2} variant="secondary">
                <Search className="w-4 h-4 mr-1.5" /> Search
              </Button>
            </div>

            {selectedOrgProfile ? (
              <div className="mt-4 p-4 bg-surface-secondary rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="min-w-0 flex-1">
                    <h3 className="text-body font-medium text-text-primary">{selectedOrgProfile.name}</h3>
                    {selectedOrgProfile.state && (
                      <p className="text-small text-text-secondary flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {selectedOrgProfile.state}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setSelectedOrgProfile(null)} className="text-text-tertiary hover:text-text-primary">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {selectedOrgProfile.description && (
                  <p className="text-body-sm text-text-secondary mb-3">{selectedOrgProfile.description}</p>
                )}
                <Button onClick={() => handleConnectFromDirectory(selectedOrgProfile.org_code)} size="sm">
                  <Send className="w-3.5 h-3.5 mr-1.5" /> Request connection
                </Button>
              </div>
            ) : orgDirResults.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {orgDirResults.map((org) => (
                  <li key={org.id}>
                    <button onClick={() => handleViewOrgProfile(org.slug)}
                      className="w-full text-left p-3 rounded-lg bg-surface-secondary hover:bg-surface-tertiary transition-colors flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-accent" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-medium text-text-primary">{org.name}</p>
                        <p className="text-small text-text-secondary">
                          {org.state || '—'}
                          {org.mc_number ? ` · MC ${org.mc_number}` : ''}
                        </p>
                      </div>
                      <Eye className="w-4 h-4 text-text-tertiary" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : orgDirError ? (
              <p className="mt-3 text-body-sm text-error flex items-center gap-2">
                <X className="w-4 h-4" />{orgDirError}
              </p>
            ) : null}
          </Card>
        </div>
      )}

      {/* ============================================================= */}
      {/* CONNECTED TAB                                                  */}
      {/* ============================================================= */}
      {tab === 'connected' && (
        <div className="space-y-6">
          {/* My organizations */}
          {activeOrgs.length === 0 ? (
            <Card className="p-8 text-center">
              <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
              <p className="text-body text-text-secondary mb-1">You're not on any teams yet.</p>
              <p className="text-body-sm text-text-tertiary mb-4">
                Join one with an invite code or org code from the Find tab.
              </p>
              <Button variant="secondary" onClick={() => setTab('find')}>
                Find an organization
              </Button>
            </Card>
          ) : (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-primary flex items-center gap-2">
                <Building2 className="w-5 h-5 text-text-tertiary" />
                My organizations
              </h2>
              {activeOrgs.map((org) => (
                <Card key={org.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-body font-medium text-text-primary truncate">{org.name}</h3>
                        <p className="text-small text-text-secondary truncate">
                          {org.role}
                          {org.state ? ` · ${org.state}` : ''}
                          {org.joined_at ? ` · Joined ${formatDate(org.joined_at)}` : ''}
                        </p>
                        {org.dot_number && (
                          <p className="text-[11px] text-text-tertiary mt-0.5">
                            DOT {org.dot_number}{org.mc_number ? ` · MC ${org.mc_number}` : ''}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => disconnectFromOrg(org.id, org.name)}
                      loading={disconnecting === org.id} className="text-error hover:bg-error/10 flex-shrink-0">
                      <LogOut className="w-4 h-4 mr-1.5" /> Leave
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Pending invites (driver-token type) */}
          {pendingInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-tertiary" />
                Pending invites
              </h2>
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-6 h-6 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-body font-medium text-text-primary truncate">{invite.organization?.name}</h3>
                        <p className="text-small text-text-secondary">
                          Invited {formatDate(invite.invited_at)}
                          {invite.invited_by?.name && ` by ${invite.invited_by.name}`}
                        </p>
                        {invite.is_expired && <p className="text-small text-error">Expired</p>}
                      </div>
                    </div>
                    {!invite.is_expired && (
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button variant="ghost" size="sm" onClick={() => declineInvite(invite.id)}>
                          <X className="w-4 h-4 mr-1" /> Decline
                        </Button>
                        <Button size="sm" onClick={() => acceptInvite(invite.id)}>
                          <Check className="w-4 h-4 mr-1" /> Accept
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Incoming org-initiated invites */}
          {!loadingOrgInvites && incomingOrgInvites.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-primary flex items-center gap-2">
                <Mail className="w-5 h-5 text-accent" />
                Organization invitations
              </h2>
              {incomingOrgInvites.map((invite) => (
                <Card key={invite.id} className="p-4 border-accent/30">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {invite.organization?.logo_url ? (
                        <img src={invite.organization.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-accent" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="text-body font-medium text-text-primary truncate">{invite.organization?.name}</h3>
                        <p className="text-small text-text-secondary">
                          {invite.organization?.state && `${invite.organization.state} · `}
                          Invited {formatDate(invite.created_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button variant="ghost" size="sm" onClick={() => handleRejectOrgInvite(invite.id)}
                        disabled={processingOrgInviteId !== null} className="text-error hover:bg-error/10">
                        <X className="w-4 h-4 mr-1" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => handleAcceptOrgInvite(invite.id)}
                        loading={processingOrgInviteId === invite.id}
                        disabled={processingOrgInviteId !== null && processingOrgInviteId !== invite.id}>
                        <Check className="w-4 h-4 mr-1" /> Accept
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Outgoing connection requests */}
          {pendingConnectionRequests.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-primary flex items-center gap-2">
                <Clock className="w-5 h-5 text-text-tertiary" />
                Requests awaiting approval
              </h2>
              {pendingConnectionRequests.map((request) => (
                <Card key={request.id} className="p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
                        <Building2 className="w-5 h-5 text-warning" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium text-text-primary truncate">{request.organization?.name}</p>
                        <p className="text-small text-text-secondary">Requested {formatDate(request.created_at)}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleCancelConnectionRequest(request.id)}
                      className="text-error hover:bg-error/10 flex-shrink-0">
                      <XCircle className="w-4 h-4 mr-1" /> Cancel
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-primary flex items-center gap-2">
                <History className="w-5 h-5 text-text-tertiary" />
                History
              </h2>
              <Card className="p-4">
                <div className="space-y-4">
                  {history.map((event, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        event.type === 'joined' ? 'bg-success/10' :
                        event.type === 'left' ? 'bg-error/10' : 'bg-warning/10'
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
                        <p className="text-small text-text-tertiary">{formatDate(event.date)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* Previous orgs (read-only) */}
          {leftOrgs.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-title-sm text-text-secondary flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                Previous organizations
              </h2>
              {leftOrgs.map((org) => (
                <Card key={org.id} className="p-4 opacity-75">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-surface-tertiary flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-6 h-6 text-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-body font-medium text-text-secondary truncate">{org.name}</h3>
                        <span className="text-xs bg-surface-tertiary text-text-tertiary px-2 py-0.5 rounded-full flex-shrink-0">
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
          )}
        </div>
      )}
    </div>
  );
}

export default DriverSettingsPage;
