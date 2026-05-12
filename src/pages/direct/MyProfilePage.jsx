import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle, AlertTriangle, CheckCircle2, Clock, FileText, Loader2,
  Upload, Send
} from 'lucide-react';
import networkApi from '../../api/network.api';

/**
 * Carrier profile editor — Phase 1.
 *
 * State machine surfaced via the status banner:
 *   private  → editable; submit-for-review CTA when readiness.canSubmit
 *   pending  → read-only; "under review" banner
 *   public   → editable but edits revert visibility back to pending
 *   suspended → read-only with admin contact
 */
export default function MyProfilePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [form, setForm] = useState({
    equipment_types: [],
    service_regions: [],
    preferred_lanes: [],
    available_trucks: '',
    instant_booking_enabled: false,
    min_rate: '',
    public_notes: ''
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await networkApi.getMyProfile();
      setData(res);
      if (res?.profile) {
        setForm({
          equipment_types: res.profile.equipment_types || [],
          service_regions: res.profile.service_regions || [],
          preferred_lanes: res.profile.preferred_lanes || [],
          available_trucks: res.profile.available_trucks ?? '',
          instant_booking_enabled: !!res.profile.instant_booking_enabled,
          min_rate: res.profile.min_rate ?? '',
          public_notes: res.profile.public_notes || ''
        });
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const status = data?.profile?.visibility_status || 'private';
  const readiness = data?.readiness || { canSubmit: false, missingFields: [], missingDocs: [] };
  const isLocked = status === 'pending';

  const onSave = async () => {
    setError(null);
    setSuccess(null);
    setSaving(true);
    try {
      await networkApi.upsertMyProfile({
        equipment_types: form.equipment_types,
        service_regions: form.service_regions,
        preferred_lanes: form.preferred_lanes,
        available_trucks: form.available_trucks === '' ? null : Number(form.available_trucks),
        instant_booking_enabled: form.instant_booking_enabled,
        min_rate: form.min_rate === '' ? null : Number(form.min_rate),
        public_notes: form.public_notes
      });
      setSuccess('Profile saved.');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const onSubmit = async () => {
    setError(null);
    setSuccess(null);
    setSubmitting(true);
    try {
      await networkApi.submitProfile();
      setSuccess('Submitted for verification. We\'ll email you when a decision is made.');
      await refresh();
    } catch (err) {
      const msg = err.response?.data?.error?.message || err.message;
      setError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
          <UserCircle className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Public profile</h1>
          <p className="text-body-sm text-text-secondary">Visible to shippers in MorPro Direct once approved.</p>
        </div>
      </header>

      <StatusBanner status={status} readiness={readiness} org={data?.organization} />

      {(error || success) && (
        <div className={`rounded-card border p-3 mb-4 ${error
          ? 'border-error/30 bg-error-muted text-error'
          : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-700 dark:text-emerald-400'
        }`}>
          <p className="text-body-sm">{error || success}</p>
        </div>
      )}

      <fieldset disabled={isLocked} className="space-y-5">
        <ListField
          label="Equipment types"
          value={form.equipment_types}
          onChange={(v) => setForm({ ...form, equipment_types: v })}
          placeholder="dry_van, reefer, flatbed"
          hint="Comma-separated. Examples: dry_van, reefer, flatbed, step_deck, power_only"
        />
        <ListField
          label="Service regions"
          value={form.service_regions}
          onChange={(v) => setForm({ ...form, service_regions: v })}
          placeholder="northeast, southeast, west_coast"
          hint="Regions or state codes. Comma-separated."
        />
        <ListField
          label="Preferred lanes"
          value={form.preferred_lanes}
          onChange={(v) => setForm({ ...form, preferred_lanes: v })}
          placeholder="LA → Phoenix, Atlanta → Dallas"
          hint="Comma-separated origin → destination pairs."
        />
        <NumberField
          label="Available trucks"
          value={form.available_trucks}
          onChange={(v) => setForm({ ...form, available_trucks: v })}
        />
        <NumberField
          label="Minimum rate ($)"
          value={form.min_rate}
          onChange={(v) => setForm({ ...form, min_rate: v })}
          step="0.01"
        />
        <ToggleField
          label="Instant booking"
          description="Allow shippers to book without negotiation when their load matches your rules."
          value={form.instant_booking_enabled}
          onChange={(v) => setForm({ ...form, instant_booking_enabled: v })}
        />
        <TextareaField
          label="Public notes"
          value={form.public_notes}
          onChange={(v) => setForm({ ...form, public_notes: v })}
          rows={3}
          hint="Anything shippers should know — specialties, hours, insurance highlights."
        />
      </fieldset>

      <DocumentsSection documents={data?.documents || []} disabled={isLocked} onUploaded={refresh} />

      <div className="flex items-center justify-between mt-8 gap-3">
        <button
          onClick={onSave}
          disabled={isLocked || saving}
          className="px-4 py-2 rounded-button bg-surface-primary border border-border text-body-sm font-medium hover:bg-surface-secondary disabled:opacity-50"
        >
          {saving ? 'Saving…' : 'Save changes'}
        </button>
        <button
          onClick={onSubmit}
          disabled={isLocked || submitting || !readiness.canSubmit}
          className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {submitting ? 'Submitting…' : isLocked ? 'Awaiting review' : 'Submit for verification'}
        </button>
      </div>
    </div>
  );
}

function StatusBanner({ status, readiness, org }) {
  const cfg = {
    private: {
      icon: AlertTriangle,
      color: 'text-warning',
      bg: 'bg-warning/5 border-warning/20',
      title: 'Profile is private',
      body: readiness.canSubmit
        ? 'Ready to submit for verification.'
        : `Complete required fields before submitting${readiness.missingFields.length ? `: missing ${readiness.missingFields.join(', ')}` : ''}${readiness.missingDocs.length ? `${readiness.missingFields.length ? '; ' : ': '}upload ${readiness.missingDocs.join(', ')} documents` : ''}.`
    },
    pending: {
      icon: Clock,
      color: 'text-blue-500',
      bg: 'bg-blue-500/5 border-blue-500/20',
      title: 'Under review',
      body: 'A MorPro super-admin is reviewing your submission. You\'ll be emailed when a decision is made.'
    },
    public: {
      icon: CheckCircle2,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/5 border-emerald-500/20',
      title: 'Public — verified',
      body: 'You\'re visible in the carrier directory. Booked-load acceptance unlocks in Phase 5 (payment onboarding).'
    },
    suspended: {
      icon: AlertTriangle,
      color: 'text-error',
      bg: 'bg-error-muted border-error/20',
      title: 'Suspended',
      body: 'Contact MorPro support to discuss reinstatement.'
    }
  }[status] || { icon: AlertTriangle, color: 'text-warning', bg: '', title: status, body: '' };

  const Icon = cfg.icon;
  return (
    <div className={`rounded-card border p-4 mb-6 flex gap-3 ${cfg.bg}`}>
      <Icon className={`w-5 h-5 flex-shrink-0 ${cfg.color}`} />
      <div className="min-w-0">
        <p className="text-body-sm font-medium text-text-primary">{cfg.title}</p>
        <p className="text-small text-text-secondary mt-0.5">{cfg.body}</p>
        {org?.payment_onboarding_rejection_reason && status === 'private' && (
          <p className="text-small text-error mt-2">
            Last rejection reason: {org.payment_onboarding_rejection_reason}
          </p>
        )}
      </div>
    </div>
  );
}

function ListField({ label, value, onChange, placeholder, hint }) {
  const [text, setText] = useState((value || []).join(', '));
  useEffect(() => { setText((value || []).join(', ')); }, [JSON.stringify(value)]);
  const handle = (e) => {
    setText(e.target.value);
    onChange(
      e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
    );
  };
  return (
    <div>
      <label className="block text-body-sm font-medium text-text-primary mb-1">{label}</label>
      <input
        type="text"
        value={text}
        onChange={handle}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm"
      />
      {hint && <p className="text-small text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

function NumberField({ label, value, onChange, step = '1' }) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-text-primary mb-1">{label}</label>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm"
      />
    </div>
  );
}

function ToggleField({ label, description, value, onChange }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-1"
      />
      <div>
        <p className="text-body-sm font-medium text-text-primary">{label}</p>
        {description && <p className="text-small text-text-tertiary">{description}</p>}
      </div>
    </label>
  );
}

function TextareaField({ label, value, onChange, rows, hint }) {
  return (
    <div>
      <label className="block text-body-sm font-medium text-text-primary mb-1">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm"
      />
      {hint && <p className="text-small text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}

function DocumentsSection({ documents, disabled, onUploaded }) {
  const [uploading, setUploading] = useState(null);
  const [error, setError] = useState(null);

  // For Phase 1 we accept a URL paste-in flow as a fallback if S3 presign
  // isn't wired for non-load docs yet. Replace with a presign + upload chain
  // once the existing /v1/uploads scaffolding handles profile-scoped docs.
  const onAttachUrl = async (document_type) => {
    const url = window.prompt(`Paste the public URL of your ${document_type} document:`);
    if (!url) return;
    setUploading(document_type);
    setError(null);
    try {
      await networkApi.recordProfileDocument({
        document_type,
        file_name: url.split('/').pop() || `${document_type}.pdf`,
        file_url: url
      });
      onUploaded?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setUploading(null);
    }
  };

  const types = [
    { key: 'insurance', label: 'Insurance certificate', required: true },
    { key: 'w9', label: 'W-9', required: true },
    { key: 'carrier_packet', label: 'Carrier packet', required: false }
  ];

  return (
    <section className="mt-8">
      <h2 className="text-body font-medium text-text-primary mb-3">Documents</h2>
      {error && <p className="text-small text-error mb-2">{error}</p>}
      <div className="space-y-2">
        {types.map(({ key, label, required }) => {
          const doc = documents.find((d) => d.document_type === key);
          return (
            <div key={key} className="flex items-center justify-between p-3 rounded-card border border-border-subtle bg-surface-primary">
              <div className="flex items-center gap-3 min-w-0">
                <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-body-sm font-medium text-text-primary">
                    {label}{required && <span className="text-error ml-1">*</span>}
                  </p>
                  {doc ? (
                    <p className="text-small text-text-tertiary truncate">{doc.file_name} · {doc.status}</p>
                  ) : (
                    <p className="text-small text-text-tertiary">Not uploaded</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => onAttachUrl(key)}
                disabled={disabled || uploading === key}
                className="px-3 py-1.5 rounded-button text-small font-medium border border-border hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-2"
              >
                {uploading === key
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> …</>
                  : <><Upload className="w-3 h-3" /> {doc ? 'Replace' : 'Attach'}</>}
              </button>
            </div>
          );
        })}
      </div>
      <p className="text-small text-text-tertiary mt-2">
        Phase 1 accepts URL pastes. Direct upload through MorPro storage lands in Phase 2.
      </p>
    </section>
  );
}
