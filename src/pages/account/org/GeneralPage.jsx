/**
 * GeneralPage — organization profile fields (company info, address, public profile).
 *
 * Split out of the old SettingsPage. Same form fields, same updateOrg call —
 * just no longer paired with the members table.
 */

import { useState, useEffect } from 'react';
import { useOrg } from '../../../contexts/OrgContext';
import {
  Building2,
  MapPin,
  Globe,
  Save,
  Loader2,
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
  'Pacific/Honolulu'
];

export default function GeneralPage() {
  const { organization, updateOrg } = useOrg();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

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
    is_profile_public: false
  });

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
        is_profile_public: organization.is_profile_public || false
      });
    }
  }, [organization]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8">
        <h1 className="text-title text-text-primary">General</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage your organization profile and contact details
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
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
                  morpro.io/o/
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
                  setForm((prev) => ({ ...prev, org_code: val }));
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
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

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

        <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
          <h2 className="text-title-sm text-text-primary mb-2 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Public Profile
          </h2>
          <p className="text-body-sm text-text-secondary mb-6">
            When enabled, your organization appears in the driver directory so drivers can find and connect with you.
          </p>

          <div className="flex items-center justify-between gap-4 mb-6 p-4 bg-surface-secondary rounded-lg">
            <div className="min-w-0">
              <p className="text-body-sm font-medium text-text-primary">Show in Driver Directory</p>
              <p className="text-small text-text-tertiary">
                Drivers can find your organization when searching the directory
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setForm((prev) => ({ ...prev, is_profile_public: !prev.is_profile_public }));
                setSaved(false);
              }}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors ${
                form.is_profile_public ? 'bg-accent' : 'bg-surface-tertiary'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.is_profile_public ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
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
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}
