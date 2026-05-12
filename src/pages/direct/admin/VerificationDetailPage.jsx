import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, ShieldCheck, ShieldAlert, FileText, Building2,
  CheckCircle2, XCircle, ExternalLink
} from 'lucide-react';
import networkApi from '../../../api/network.api';

/**
 * Single-profile verification screen — Phase 1.
 * Shows: carrier-submitted fields, uploaded docs, LINQ lookup (SAFER + Chameleon).
 * Actions: approve, reject (modal for reason).
 */
export default function VerificationDetailPage() {
  const { orgSlug, orgId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [acting, setActing] = useState(null);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await networkApi.getAdminProfile(orgId);
      setData(res);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [orgId]);

  const onApprove = async () => {
    setActing('approve');
    try {
      await networkApi.approveProfile(orgId);
      navigate(`/o/${orgSlug}/direct/admin/verifications`);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setActing(null);
    }
  };

  const onReject = async () => {
    if (!rejectReason.trim()) return;
    setActing('reject');
    try {
      await networkApi.rejectProfile(orgId, rejectReason.trim());
      navigate(`/o/${orgSlug}/direct/admin/verifications`);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setActing(null);
    }
  };

  if (loading) {
    return (
      <div className="px-6 py-10 max-w-4xl mx-auto flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="px-6 py-10 max-w-4xl mx-auto">
        <p className="text-body-sm text-text-secondary">Profile not found.</p>
      </div>
    );
  }

  const { organization: org, profile, documents, linq } = data;
  const isPending = profile.visibility_status === 'pending';

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/admin/verifications`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to queue
      </Link>

      <header className="flex items-center gap-3 mb-6">
        {org.logo_url ? (
          <img src={org.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-surface-secondary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-text-tertiary" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-title text-text-primary">{org.name}</h1>
          <p className="text-body-sm text-text-secondary">
            MC {org.mc_number || '—'} · DOT {org.dot_number || '—'} · {profile.visibility_status}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <LinqCard linq={linq} carrierName={org.name} />

      <Section title="Carrier-submitted profile">
        <KV label="Equipment" value={joinList(profile.equipment_types)} />
        <KV label="Service regions" value={joinList(profile.service_regions)} />
        <KV label="Preferred lanes" value={joinList(profile.preferred_lanes)} />
        <KV label="Available trucks" value={profile.available_trucks ?? '—'} />
        <KV label="Min rate" value={profile.min_rate != null ? `$${Number(profile.min_rate).toFixed(2)}` : '—'} />
        <KV label="Instant booking" value={profile.instant_booking_enabled ? 'enabled' : 'disabled'} />
        <KV label="Public notes" value={profile.public_notes || '—'} multiline />
      </Section>

      <Section title="Documents">
        {documents.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">No documents uploaded.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((d) => (
              <li key={d.id} className="flex items-center justify-between p-3 rounded-card border border-border-subtle">
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-text-tertiary" />
                  <div>
                    <p className="text-body-sm font-medium">{labelForDocType(d.document_type)}</p>
                    <p className="text-small text-text-tertiary">{d.file_name}</p>
                  </div>
                </div>
                <a
                  href={d.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-small text-accent hover:underline inline-flex items-center gap-1"
                >
                  Open <ExternalLink className="w-3 h-3" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {isPending && (
        <div className="flex items-center justify-end gap-3 mt-8">
          <button
            onClick={() => setRejectModal(true)}
            disabled={!!acting}
            className="px-4 py-2 rounded-button border border-error/40 text-error text-body-sm font-medium hover:bg-error-muted disabled:opacity-50 inline-flex items-center gap-2"
          >
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button
            onClick={onApprove}
            disabled={!!acting}
            className="px-4 py-2 rounded-button bg-emerald-500 text-white text-body-sm font-medium hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            {acting === 'approve' ? 'Approving…' : 'Approve'}
          </button>
        </div>
      )}

      {rejectModal && (
        <Modal onClose={() => setRejectModal(false)}>
          <h2 className="text-body font-medium mb-2">Reject this profile?</h2>
          <p className="text-small text-text-tertiary mb-3">
            The carrier sees this reason in their profile editor and via email.
          </p>
          <textarea
            rows={4}
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="What needs to change before this can be approved?"
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setRejectModal(false)}
              className="px-3 py-1.5 rounded-button text-body-sm text-text-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onReject}
              disabled={!rejectReason.trim() || acting === 'reject'}
              className="px-3 py-1.5 rounded-button bg-error text-white text-body-sm font-medium disabled:opacity-50"
            >
              {acting === 'reject' ? 'Rejecting…' : 'Reject'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function LinqCard({ linq, carrierName }) {
  if (!linq) return null;
  if (!linq.configured) {
    return (
      <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 mb-6">
        <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
          <ShieldAlert className="w-4 h-4" />
          <p className="text-body-sm font-medium">LINQ lookup not configured</p>
        </div>
        <p className="text-small text-text-tertiary mt-1">
          Set MORPROLINQ_API_KEY in backend .env to enable automatic carrier verification.
        </p>
      </div>
    );
  }

  const s = linq.summary || {};
  const dangerous = s.riskLevel === 'HIGH' || s.riskLevel === 'CRITICAL';
  const tone = dangerous
    ? 'border-error/40 bg-error-muted'
    : 'border-emerald-500/30 bg-emerald-500/5';
  const Icon = dangerous ? ShieldAlert : ShieldCheck;
  const iconColor = dangerous ? 'text-error' : 'text-emerald-500';

  return (
    <div className={`rounded-card border p-4 mb-6 ${tone}`}>
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`w-4 h-4 ${iconColor}`} />
        <p className="text-body-sm font-medium text-text-primary">LINQ verification</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-small">
        <Field label="Legal name" value={s.legalName} />
        <Field label="DBA" value={s.dbaName} />
        <Field label="Authority" value={s.authorityStatus} />
        <Field label="Insurance" value={s.insuranceStatus} />
        <Field label="Fleet size" value={s.fleetSize} />
        <Field label="Risk" value={s.riskLevel ? `${s.riskLevel} (${s.riskScore ?? '—'})` : null} />
      </div>
      {s.legalName && carrierName && s.legalName.toUpperCase() !== carrierName.toUpperCase() && (
        <p className="text-small text-warning mt-3">
          ⚠️ LINQ legal name doesn't exactly match the carrier-submitted name. Verify manually.
        </p>
      )}
      <p className="text-small text-text-tertiary mt-3">
        Source: <a href="https://www.morprolinq.com" target="_blank" rel="noopener noreferrer" className="underline">morprolinq</a> · cached 15 min.
      </p>
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-text-tertiary text-[10px] uppercase tracking-wide">{label}</p>
      <p className="text-text-primary font-medium">{value ?? '—'}</p>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-4">
      <h2 className="text-body-sm font-medium text-text-primary mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function KV({ label, value, multiline }) {
  return (
    <div className={`grid ${multiline ? 'grid-cols-1' : 'grid-cols-3'} gap-2`}>
      <p className="text-small text-text-tertiary">{label}</p>
      <p className={`text-body-sm text-text-primary ${multiline ? '' : 'col-span-2'}`}>{value}</p>
    </div>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-primary border border-border rounded-card p-5 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function joinList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  return arr.join(', ');
}

function labelForDocType(t) {
  return ({
    insurance: 'Insurance certificate',
    w9: 'W-9',
    carrier_packet: 'Carrier packet',
    rate_confirmation: 'Rate confirmation',
    bol: 'BOL',
    pod: 'POD',
    invoice: 'Invoice',
    other: 'Other'
  })[t] || t;
}
