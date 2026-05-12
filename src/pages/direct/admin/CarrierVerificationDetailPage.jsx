import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, ShieldCheck, AlertCircle, CheckCircle2, XCircle,
  Building2, Mail, Fingerprint, FileText, Wrench, MapPin, AlertTriangle, ScanFace
} from 'lucide-react';
import verificationApi from '../../../api/networkVerification.api';

/**
 * Single-org admin view of a carrier-onboarding submission. Shows every
 * artifact captured during the staircase — LINQ snapshot, OTP audit, Stripe
 * Identity result, name-match score, public profile — and gives the
 * reviewer Approve / Reject buttons + a soft-flag override.
 */
export default function CarrierVerificationDetailPage() {
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
      const r = await verificationApi.adminGetVerification(orgId);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [orgId]);

  const onApprove = async () => {
    setActing('approve');
    try {
      await verificationApi.adminApprove(orgId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };
  const onReject = async () => {
    setActing('reject');
    try {
      await verificationApi.adminReject(orgId, rejectReason);
      setRejectModal(false);
      setRejectReason('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };
  const onOverride = async () => {
    setActing('override');
    try {
      await verificationApi.adminOverrideNameMatch(orgId);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  }
  if (!data) {
    return <div className="px-6 py-10 max-w-3xl mx-auto"><p className="text-error">Not found</p></div>;
  }

  const isPending = data.status === 'submitted';
  const isFlagged = data.name_match_decision === 'flagged';
  const profile = data.profile_data || {};

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/admin/carrier-verifications`}
        className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Carrier verifications
      </Link>

      <header className="flex items-start gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-title text-text-primary truncate">
            {data.linq_legal_name || `Org ${orgId.slice(0, 8)}`}
          </h1>
          <p className="text-body-sm text-text-secondary">
            MC {data.mc_number || '—'} · DOT {data.dot_number || '—'}
          </p>
        </div>
        <StatusPill status={data.status} />
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {isFlagged && data.status === 'submitted' && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-4 mb-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-text-primary">Name mismatch flagged</p>
              <p className="text-small text-text-secondary mt-1">
                LINQ: <strong>{data.linq_legal_name}</strong> · ID: <strong>{data.identity_owner_name}</strong>
                {data.name_match_score != null && ` · score ${(data.name_match_score * 100).toFixed(0)}%`}
              </p>
              <button onClick={onOverride} disabled={!!acting}
                className="text-body-sm text-amber-700 dark:text-amber-400 hover:underline mt-2">
                Override (if you've checked this elsewhere)
              </button>
            </div>
          </div>
        </div>
      )}

      <Section title="LINQ snapshot" icon={Building2}>
        <KV label="Legal name" value={data.linq_legal_name || '—'} />
        <KV label="Email on file" value={data.linq_email || '—'} mono />
        <KV label="Pulled at" value={data.linq_lookup_at ? new Date(data.linq_lookup_at).toLocaleString() : '—'} />
        {data.linq_data?.summary && (
          <>
            <KV label="Authority" value={data.linq_data.summary.authorityStatus || '—'} />
            <KV label="Insurance" value={data.linq_data.summary.insuranceStatus || '—'} />
            <KV label="Power units" value={data.linq_data.summary.fleetSize || '—'} />
            <KV label="Risk score" value={data.linq_data.summary.riskScore != null ? `${data.linq_data.summary.riskScore} (${data.linq_data.summary.riskLevel})` : '—'} />
          </>
        )}
      </Section>

      <Section title="OTP" icon={Mail}>
        <KV label="Sent" value={data.otp_sent_at ? new Date(data.otp_sent_at).toLocaleString() : 'never'} />
        <KV label="Verified" value={data.otp_verified_at ? new Date(data.otp_verified_at).toLocaleString() : 'no'} />
        <KV label="Failed attempts" value={String(data.otp_attempts ?? 0)} />
      </Section>

      <Section title="Stripe Identity" icon={ScanFace}>
        <KV label="Status" value={data.identity_status || '—'} />
        <KV label="Verified name" value={data.identity_owner_name || '—'} />
        <KV label="Completed" value={data.identity_completed_at ? new Date(data.identity_completed_at).toLocaleString() : '—'} />
      </Section>

      <Section title="Name match" icon={Fingerprint}>
        <KV label="Score" value={data.name_match_score != null ? `${(data.name_match_score * 100).toFixed(1)}%` : '—'} />
        <KV label="Decision" value={data.name_match_decision || '—'} />
        <KV label="Mode" value={data.name_match_mode || '—'} />
      </Section>

      {Object.keys(profile).length > 0 && (
        <Section title="Public profile" icon={FileText}>
          <KV label="Tagline" value={profile.tagline || '—'} />
          <KV label="Phone" value={profile.public_phone || '—'} />
          <KV label="Email" value={profile.public_email || '—'} />
          <KV label="Website" value={profile.website || '—'} />
          <KV label="Trucks" value={profile.fleet_size || '—'} />
          <KV label="Equipment" value={(profile.equipment || []).join(', ') || '—'} />
          <KV label="Service regions" value={(profile.service_regions || []).join(', ') || '—'} />
          <KV label="About" value={profile.description || '—'} />
        </Section>
      )}

      {(isPending || isFlagged) && data.status === 'submitted' && (
        <div className="sticky bottom-0 bg-surface-secondary/80 backdrop-blur-sm border-t border-border-subtle py-4 mt-6 flex gap-2">
          <button onClick={() => setRejectModal(true)} disabled={!!acting}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-button border border-error/40 text-error font-medium hover:bg-error-muted disabled:opacity-50">
            <XCircle className="w-4 h-4" /> Reject
          </button>
          <button onClick={onApprove} disabled={!!acting || (isFlagged && data.name_match_decision !== 'overridden')}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-button bg-emerald-500 text-white font-medium hover:bg-emerald-600 disabled:opacity-50"
            title={isFlagged && data.name_match_decision !== 'overridden' ? 'Override the name mismatch first' : ''}>
            {acting === 'approve' ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Approve
          </button>
        </div>
      )}

      {rejectModal && (
        <Modal onClose={() => setRejectModal(false)}>
          <h3 className="text-title-sm text-text-primary mb-2">Reject this submission</h3>
          <p className="text-body-sm text-text-secondary mb-3">The carrier sees this reason in the wizard.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={4}
            placeholder="Insurance lapsed; please update FMCSA + resubmit."
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
          <div className="flex gap-2 mt-4">
            <button onClick={() => setRejectModal(false)}
              className="flex-1 px-4 py-2 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary">
              Cancel
            </button>
            <button onClick={onReject} disabled={!!acting || !rejectReason.trim()}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-button bg-error text-white text-body-sm font-medium hover:opacity-90 disabled:opacity-50">
              {acting === 'reject' ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
              Reject
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Section({ title, icon: Icon, children }) {
  return (
    <section className="bg-surface-primary border border-border-subtle rounded-card p-4 mb-3">
      <h3 className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
        <Icon className="w-4 h-4 text-text-tertiary" /> {title}
      </h3>
      <dl className="space-y-2">{children}</dl>
    </section>
  );
}
function KV({ label, value, mono }) {
  return (
    <div className="flex items-start gap-3">
      <dt className="text-[10px] uppercase tracking-wider text-text-tertiary w-32 flex-shrink-0 pt-0.5">{label}</dt>
      <dd className={`text-body-sm text-text-primary flex-1 break-words ${mono ? 'font-mono' : ''}`}>{value}</dd>
    </div>
  );
}

function StatusPill({ status }) {
  const cfg = ({
    submitted: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    approved: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-500/15 text-red-700 dark:text-red-400'
  })[status] || 'bg-gray-500/15 text-gray-600';
  return (
    <span className={`px-2 py-1 rounded text-[10px] uppercase tracking-wider font-medium ${cfg} flex-shrink-0`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-card max-w-md w-full p-5 shadow-elevated">
        {children}
      </div>
    </div>
  );
}
