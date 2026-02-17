/**
 * SettingsPage - Organization settings and team management
 *
 * Note: Uses organizationsApi directly for member management (removeMember, updateMember)
 * because these operations are not exposed through useOrg context. Most organization
 * operations use useOrg context methods (updateOrg, inviteMember, refreshMembers).
 */

import { useState, useEffect } from 'react';
import { useOrg } from '../../contexts/OrgContext';
import { useAuth } from '../../contexts/AuthContext';
import organizationsApi from '../../api/organizations.api'; // Exception: Member management not in context
import {
  Building2,
  MapPin,
  Globe,
  Save,
  Loader2,
  Users,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const TIMEZONES = [
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'Pacific/Honolulu',
];

const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access to all features and billing' },
  { value: 'admin', label: 'Administrator', description: 'Full access except billing management' },
  { value: 'dispatcher', label: 'Dispatcher', description: 'Manage loads, drivers, and dispatch' },
  { value: 'driver', label: 'Driver', description: 'View assigned loads and upload documents' },
  { value: 'accountant', label: 'Accountant', description: 'Access to invoicing and financial reports' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to operational data' },
];

export function SettingsPage() {
  const { organization, updateOrg, members, refreshMembers, inviteMember } = useOrg();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  // Form state
  const [form, setForm] = useState({
    name: '',
    slug: '',
    timezone: 'America/New_York',
    dot_number: '',
    mc_number: '',
    org_code: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    country: 'USA',
    description: '',
    website: '',
    public_phone: '',
    public_email: '',
    fleet_size: '',
    is_profile_public: false,
  });

  // Invite form state
  const [inviteForm, setInviteForm] = useState({ email: '', role: 'dispatcher' });
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);

  // Load org data into form
  useEffect(() => {
    if (organization) {
      setForm({
        name: organization.name || '',
        slug: organization.slug || '',
        timezone: organization.timezone || 'America/New_York',
        dot_number: organization.dot_number || '',
        mc_number: organization.mc_number || '',
        org_code: organization.org_code || '',
        address_line1: organization.address_line1 || '',
        address_line2: organization.address_line2 || '',
        city: organization.city || '',
        state: organization.state || '',
        zip: organization.zip || '',
        country: organization.country || 'USA',
        description: organization.description || '',
        website: organization.website || '',
        public_phone: organization.public_phone || '',
        public_email: organization.public_email || '',
        fleet_size: organization.fleet_size || '',
        is_profile_public: organization.is_profile_public || false,
      });
    }
  }, [organization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await updateOrg(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);

    try {
      await inviteMember(inviteForm);
      setInviteForm({ email: '', role: 'dispatcher' });
      setShowInviteForm(false);
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;

    try {
      await organizationsApi.removeMember(organization.id, memberId);
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await organizationsApi.updateMember(organization.id, memberId, { role: newRole });
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage your organization settings and team
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-8 border-b border-surface-tertiary">
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-3 text-body-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'general'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            General
          </div>
        </button>
        <button
          onClick={() => setActiveTab('team')}
          className={`px-4 py-3 text-body-sm font-medium border-b-2 -mb-px transition-colors ${
            activeTab === 'team'
              ? 'border-accent text-accent'
              : 'border-transparent text-text-secondary hover:text-text-primary'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Team
          </div>
        </button>
      </div>

      {/* General Settings Tab */}
      {activeTab === 'general' && (
        <form onSubmit={handleSave} className="space-y-8">
          {/* Company Info */}
          <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
            <h2 className="text-title-sm text-text-primary mb-6 flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Company Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  URL Slug
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-3 bg-surface-tertiary border border-r-0 border-surface-tertiary rounded-l-input text-text-secondary text-body-sm">
                    nexttms.com/o/
                  </span>
                  <input
                    type="text"
                    name="slug"
                    value={form.slug}
                    onChange={handleChange}
                    className="flex-1 px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-r-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  DOT Number
                </label>
                <input
                  type="text"
                  name="dot_number"
                  value={form.dot_number}
                  onChange={handleChange}
                  placeholder="e.g., 1234567"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  MC Number
                </label>
                <input
                  type="text"
                  name="mc_number"
                  value={form.mc_number}
                  onChange={handleChange}
                  placeholder="e.g., MC-123456"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Driver Connection Code
                </label>
                <input
                  type="text"
                  name="org_code"
                  value={form.org_code}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
                    setForm(prev => ({ ...prev, org_code: val }));
                    setSaved(false);
                  }}
                  placeholder="e.g., ACME24"
                  maxLength={10}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary font-mono tracking-widest uppercase focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
                <p className="text-small text-text-tertiary mt-1">
                  Drivers use this code to request a connection to your organization.
                </p>
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  <Globe className="w-4 h-4 inline mr-1" />
                  Timezone
                </label>
                <select
                  name="timezone"
                  value={form.timezone}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                >
                  {TIMEZONES.map(tz => (
                    <option key={tz} value={tz}>{tz.replace('_', ' ')}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
            <h2 className="text-title-sm text-text-primary mb-6 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Business Address
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={form.address_line1}
                  onChange={handleChange}
                  placeholder="123 Main Street"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={form.address_line2}
                  onChange={handleChange}
                  placeholder="Suite 100"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={form.state}
                  onChange={handleChange}
                  placeholder="TX"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  ZIP Code
                </label>
                <input
                  type="text"
                  name="zip"
                  value={form.zip}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Country
                </label>
                <input
                  type="text"
                  name="country"
                  value={form.country}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Public Profile */}
          <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
            <h2 className="text-title-sm text-text-primary mb-2 flex items-center gap-2">
              <Globe className="w-5 h-5" />
              Public Profile
            </h2>
            <p className="text-body-sm text-text-secondary mb-6">
              When enabled, your organization appears in the driver directory so drivers can find and connect with you.
            </p>

            {/* Public Profile Toggle */}
            <div className="flex items-center justify-between mb-6 p-4 bg-surface-secondary rounded-lg">
              <div>
                <p className="text-body-sm font-medium text-text-primary">Show in Driver Directory</p>
                <p className="text-small text-text-tertiary">Drivers can find your organization when searching the directory</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setForm(prev => ({ ...prev, is_profile_public: !prev.is_profile_public }));
                  setSaved(false);
                }}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  form.is_profile_public ? 'bg-accent' : 'bg-surface-tertiary'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_profile_public ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Company Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Tell drivers about your company..."
                  rows={3}
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent resize-none"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={form.website}
                  onChange={handleChange}
                  placeholder="https://www.example.com"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Fleet Size
                </label>
                <input
                  type="number"
                  name="fleet_size"
                  value={form.fleet_size}
                  onChange={handleChange}
                  placeholder="Number of trucks"
                  min="0"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Public Phone
                </label>
                <input
                  type="tel"
                  name="public_phone"
                  value={form.public_phone}
                  onChange={handleChange}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>

              <div>
                <label className="block text-body-sm font-medium text-text-primary mb-2">
                  Public Email
                </label>
                <input
                  type="email"
                  name="public_email"
                  value={form.public_email}
                  onChange={handleChange}
                  placeholder="contact@example.com"
                  className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                />
              </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex items-center justify-end gap-4">
            {saved && (
              <span className="text-body-sm text-success flex items-center gap-1">
                <Check className="w-4 h-4" />
                Saved successfully
              </span>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Save Changes
            </button>
          </div>
        </form>
      )}

      {/* Team Tab */}
      {activeTab === 'team' && (
        <div className="space-y-6">
          {/* Team Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-title-sm text-text-primary">Team Members</h2>
              <p className="text-body-sm text-text-secondary mt-1">
                {members.length} member{members.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setShowInviteForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-button text-body-sm font-medium transition-colors"
            >
              <UserPlus className="w-4 h-4" />
              Invite Member
            </button>
          </div>

          {/* Invite Form */}
          {showInviteForm && (
            <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
              <h3 className="text-body font-medium text-text-primary mb-4">Invite New Member</h3>
              <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <input
                    type="email"
                    placeholder="Email address"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  />
                </div>
                <div>
                  <select
                    value={inviteForm.role}
                    onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                  >
                    {ROLES.filter(r => r.value !== 'owner').map(role => (
                      <option key={role.value} value={role.value}>{role.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={inviting}
                    className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors disabled:opacity-50"
                  >
                    {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowInviteForm(false)}
                    className="px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary text-text-primary rounded-button transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Members List */}
          <div className="bg-surface-primary rounded-card border border-surface-tertiary overflow-hidden">
            <div className="divide-y divide-surface-tertiary">
              {members.map((member) => (
                <div key={member.id} className="p-4 flex items-center justify-between hover:bg-surface-secondary/50">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                      <span className="text-accent font-medium text-body-sm">
                        {(member.first_name?.[0] || member.email[0]).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="text-body-sm font-medium text-text-primary">
                        {member.first_name && member.last_name
                          ? `${member.first_name} ${member.last_name}`
                          : member.email}
                        {member.user_id === user?.id && (
                          <span className="ml-2 text-xs text-text-tertiary">(You)</span>
                        )}
                      </div>
                      <div className="text-small text-text-tertiary flex items-center gap-2">
                        <Mail className="w-3 h-3" />
                        {member.email}
                        {member.status === 'invited' && (
                          <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full">
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {member.role === 'owner' ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent text-body-sm rounded-chip">
                        <Shield className="w-4 h-4" />
                        Owner
                      </span>
                    ) : member.user_id !== user?.id ? (
                      <>
                        <select
                          value={member.role}
                          onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                          className="px-3 py-1.5 bg-surface-secondary border border-surface-tertiary rounded-chip text-body-sm text-text-primary"
                        >
                          {ROLES.filter(r => r.value !== 'owner').map(role => (
                            <option key={role.value} value={role.value}>{role.label}</option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleRemoveMember(member.id)}
                          className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-chip transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <span className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-body-sm rounded-chip capitalize">
                        {member.role}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPage;
