/**
 * GeneralPage — organization profile fields (company info, address, public profile).
 *
 * Split out of the old SettingsPage. Same form fields, same updateOrg call —
 * just no longer paired with the members table.
 */

import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import VerificationWizard from '../../../components/verification/VerificationWizard';
import { useOrg } from '../../../contexts/OrgContext';
import {
  Building2,
  MapPin,
  Globe,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle,
  BadgeCheck,
  ShieldCheck,
  ArrowRight,
  Lock
} from 'lucide-react';
import { getMyVerification } from '../../../api/networkVerification.api';

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
  const { orgSlug } = useParams();
  const { organization, updateOrg } = useOrg();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [verif, setVerif] = useState(null);
  const [verifLoading, setVerifLoading] = useState(true);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  const refetchVerification = () => {
    return getMyVerification()
      .then((r) => setVerif(r?.verification || null))
      .catch(() => {});
  };

  // Pull the shared MorPro Verification state (used by both Direct + Connect).
  // The endpoint returns { verification, settings }; we only need the
  // verification row here.
  useEffect(() => {
    getMyVerification()
      .then((r) => setVerif(r?.verification || null))
      .catch(() => setVerif(null))
      .finally(() => setVerifLoading(false));
  }, []);

  // Note: once verification completes, the org row gets backfilled from
  // LINQ on the backend. The form below picks up the new values on the
  // next org-context refresh (re-mount or org switch). Manual reload is
  // a fallback if the user wants to see the LINQ-populated fields now.

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
    fleet_size: ''
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
        fleet_size: organization.fleet_size || ''
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

      {/* MorPro Verification — shared trust check used by Direct + Connect.
          Single source of truth: when complete, LINQ auto-populates the
          DOT/MC/legal name/address fields below and locks them. */}
      <VerificationCard
        verif={verif}
        loading={verifLoading}
        orgSlug={orgSlug}
        isVerifiedBadge={!!organization?.is_morpro_verified}
        onStart={() => setShowVerifyModal(true)}
      />

      {/* Verification modal — runs the SAME stepper /direct/verify uses,
          just embedded inline so the carrier never leaves settings. */}
      {showVerifyModal && (
        <VerifyModal
          orgSlug={orgSlug}
          onClose={() => { setShowVerifyModal(false); refetchVerification(); }}
          onApproved={() => { setShowVerifyModal(false); refetchVerification(); }}
        />
      )}

      <form onSubmit={handleSave} className="space-y-8 mt-8">
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
              <label className="block text-body-sm font-medium text-text-primary mb-2 flex items-center gap-1.5">
                DOT Number
                {organization?.is_morpro_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Lock className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </label>
              <input
                type="text"
                name="dot_number"
                value={form.dot_number}
                onChange={handleChange}
                readOnly={organization?.is_morpro_verified}
                placeholder="e.g., 1234567"
                className={`w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${organization?.is_morpro_verified ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {organization?.is_morpro_verified && (
                <p className="text-[11px] text-text-tertiary mt-1">
                  Locked — sourced from MorPro LINQ verification.
                </p>
              )}
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2 flex items-center gap-1.5">
                MC Number
                {organization?.is_morpro_verified && (
                  <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <Lock className="w-2.5 h-2.5" /> Verified
                  </span>
                )}
              </label>
              <input
                type="text"
                name="mc_number"
                value={form.mc_number}
                onChange={handleChange}
                readOnly={organization?.is_morpro_verified}
                placeholder="e.g., MC-123456"
                className={`w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent ${organization?.is_morpro_verified ? 'opacity-60 cursor-not-allowed' : ''}`}
              />
              {organization?.is_morpro_verified && (
                <p className="text-[11px] text-text-tertiary mt-1">
                  Locked — sourced from MorPro LINQ verification.
                </p>
              )}
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
            Company Info (driver-facing)
          </h2>
          <p className="text-body-sm text-text-secondary mb-6">
            What drivers + shippers see on your MorPro Connect and MorPro Direct profile cards. Visibility is controlled separately from each product&apos;s profile page (Connect &middot; Direct).
          </p>

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

/* ───────── MorPro Verification card ───────── */

const STEP_LABEL = {
  not_started: 'Not started',
  mc_pending: 'Enter your MC',
  otp_pending: 'Verify your email',
  identity_pending: 'Verify owner identity',
  profile_pending: 'Submit profile',
  submitted: 'Under review',
  approved: 'Verified',
  rejected: 'Rejected'
};

function VerificationCard({ verif, loading, orgSlug, isVerifiedBadge, onStart }) {
  const status = verif?.status || 'not_started';
  const isApproved = status === 'approved' || isVerifiedBadge;
  const isRejected = status === 'rejected';
  // `submitted` = carrier finished all four steps; just waiting on MorPro
  // human review. Treat as its own state so the card doesn't keep nagging
  // them to "Continue" when there's nothing left for them to do.
  const isUnderReview = !isApproved && !isRejected && status === 'submitted';
  const inProgress = !isApproved && !isRejected && !isUnderReview && status !== 'not_started';

  if (loading) {
    return (
      <div className="mb-6 bg-surface-primary rounded-card border border-surface-tertiary p-6 flex items-center gap-3 text-text-tertiary">
        <Loader2 className="w-4 h-4 animate-spin" /> Checking verification status…
      </div>
    );
  }

  void orgSlug; // kept for backwards-compat; deep-link no longer used

  // Approved — green hero card
  if (isApproved) {
    return (
      <div className="mb-6 rounded-card border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
            <BadgeCheck className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-title-sm text-text-primary font-semibold">Verified with MorPro LINQ</h2>
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                <Check className="w-2.5 h-2.5" /> Active
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              {verif?.linq_legal_name && (
                <>Legal name <span className="font-medium text-text-primary">{verif.linq_legal_name}</span> · </>
              )}
              Your carrier has been verified through MorPro LINQ — DOT, MC and address are now authoritative across MorPro Direct and MorPro Connect.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-text-tertiary">
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Trusted on Direct</span>
              <span className="text-text-tertiary">·</span>
              <span className="flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Trusted on Connect</span>
              {verif?.linq_lookup_at && (
                <>
                  <span className="text-text-tertiary">·</span>
                  <span>Last verified {new Date(verif.linq_lookup_at).toLocaleDateString()}</span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Rejected — amber
  if (isRejected) {
    return (
      <div className="mb-6 rounded-card border border-amber-200 bg-amber-50/50 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-700 flex items-center justify-center flex-shrink-0">
            <AlertCircle className="w-7 h-7" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-title-sm text-text-primary font-semibold">Verification rejected</h2>
            <p className="text-body-sm text-text-secondary mt-1">
              Our team reviewed your submission and couldn&apos;t verify your carrier. Re-submit with correct information.
            </p>
            <button
              type="button"
              onClick={onStart}
              className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90"
            >
              Re-submit verification <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Under review — they finished all the steps, just waiting on a MorPro
  // human. No action button; just calm reassurance.
  if (isUnderReview) {
    return (
      <div className="mb-6 rounded-card border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-500/15 text-blue-700 flex items-center justify-center flex-shrink-0">
            <Loader2 className="w-7 h-7 animate-spin" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-title-sm text-text-primary font-semibold">Under MorPro review</h2>
            <p className="text-body-sm text-text-secondary mt-1">
              Your submission is in our queue. You&apos;ll see this card flip to{' '}
              <span className="font-medium text-text-primary">Verified with MorPro LINQ</span> the moment our team approves it (usually within one business day).
            </p>
            <div className="mt-3 text-[11px] text-text-tertiary">
              {verif?.linq_legal_name && <>Legal name on file: <span className="font-medium text-text-secondary">{verif.linq_legal_name}</span></>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // In-progress OR not started — blue hero CTA
  return (
    <div className="mb-6 rounded-card border border-accent/20 bg-gradient-to-br from-accent/5 to-white p-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-accent text-white flex items-center justify-center flex-shrink-0 shadow-sm">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-title-sm text-text-primary font-semibold">
            {inProgress ? 'Finish verifying your carrier' : 'Verify your carrier'}
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            MorPro Verification is a one-time check via MorPro LINQ (DOT lookup, FMCSA email, owner identity). Required to publish on
            <span className="font-medium text-text-primary"> MorPro Direct</span> and
            <span className="font-medium text-text-primary"> MorPro Connect</span> — verified data auto-populates DOT, MC, legal name, and address below.
          </p>
          <div className="mt-3 flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={onStart}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90"
            >
              {inProgress ? 'Continue verification' : 'Start verification'} <ArrowRight className="w-4 h-4" />
            </button>
            {inProgress && (
              <span className="text-small text-text-tertiary">
                Current step: <span className="font-medium text-text-secondary">{STEP_LABEL[status] || status}</span>
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────── Verify modal ───────── */

function VerifyModal({ onClose, onApproved, orgSlug }) {
  void orgSlug;

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Modal shell */}
      <div className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-hidden bg-white rounded-card shadow-elevated flex flex-col">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-tertiary">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-accent" />
            <h2 className="text-title-sm text-text-primary font-semibold">MorPro Verification</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full text-text-secondary hover:bg-surface-secondary flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          <VerificationWizard onApproved={onApproved} showHeader />
        </div>
      </div>
    </div>
  );
}
