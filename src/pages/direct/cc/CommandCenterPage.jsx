import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Building2, BadgeCheck, Send, FileText,
  MessageSquare, Activity, Phone, Upload, ShieldOff, Eye,
  Wallet, CheckCircle2, ShieldAlert, Star
} from 'lucide-react';
import networkApi from '../../../api/network.api';
import { StatusPill } from '../loads/MyLoadsPage';

/**
 * Shared command center — Phase 4.
 *
 * Three sections:
 *   1. Header strip — counterpart, route, status, accepted rate.
 *   2. Timeline + messages (unified — status events auto-post as messages).
 *   3. Documents panel + driver-contact card (right rail).
 */
export default function CommandCenterPage() {
  const { orgSlug, loadId } = useParams();
  const [data, setData] = useState(null);
  const [payment, setPayment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [composer, setComposer] = useState('');
  const [posting, setPosting] = useState(false);
  const [actingPayment, setActingPayment] = useState(false);
  const messagesEndRef = useRef(null);

  const [reviewState, setReviewState] = useState(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);

  const refresh = async () => {
    try {
      const [r, p, rs] = await Promise.all([
        networkApi.getCommandCenter(loadId),
        networkApi.getLoadPayment(loadId).catch(() => null),
        networkApi.getMyReviewState(loadId).catch(() => null)
      ]);
      setData(r);
      setPayment(p);
      setReviewState(rs);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const onApprovePod = async () => {
    if (!confirm('Approve POD? Funds release in 48h unless a dispute is opened.')) return;
    setActingPayment(true);
    try { await networkApi.approveLoadPod(loadId); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActingPayment(false); }
  };

  const onOpenDispute = async () => {
    const reason = window.prompt('Dispute reason (late_pickup, damage, missing_pod, etc):');
    if (!reason) return;
    const description = window.prompt('Describe the issue:');
    setActingPayment(true);
    try { await networkApi.openDispute(loadId, { reason, description }); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActingPayment(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [loadId]);
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [data?.messages?.length]);

  const onSend = async (e) => {
    e.preventDefault();
    const body = composer.trim();
    if (!body || !data?.cc?.id) return;
    setPosting(true);
    try {
      await networkApi.postCommandCenterMessage(data.cc.id, { body, visibility: 'both' });
      setComposer('');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setPosting(false);
    }
  };

  const onAttachDoc = async (document_type) => {
    const url = window.prompt(`Paste the URL of the ${document_type}:`);
    if (!url) return;
    try {
      await networkApi.attachCommandCenterDocument(data.cc.id, loadId, {
        document_type,
        file_name: url.split('/').pop() || `${document_type}.pdf`,
        file_url: url
      });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    }
  };

  if (loading) {
    return <div className="px-6 py-10 max-w-5xl mx-auto flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  }
  if (!data) {
    return (
      <div className="px-6 py-10 max-w-5xl mx-auto">
        <Link to={`/o/${orgSlug}/direct/loads`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="w-3 h-3" /> Back
        </Link>
        <p className="text-body-sm text-error">{error || 'Command center not found.'}</p>
      </div>
    );
  }

  const { cc, load, role, counterparts, messages, documents, driverInfo } = data;
  const counterpart = role === 'shipper' ? counterparts.carrier : counterparts.shipper;

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <Link
        to={role === 'shipper' ? `/o/${orgSlug}/direct/loads/${loadId}` : `/o/${orgSlug}/direct/loads/${loadId}/view`}
        className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-3 h-3" /> Back to load
      </Link>

      <header className="rounded-card border border-border-subtle bg-surface-primary p-5 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {counterpart?.logo_url ? (
              <img src={counterpart.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-surface-secondary flex items-center justify-center">
                <Building2 className="w-5 h-5 text-text-tertiary" />
              </div>
            )}
            <div className="min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <p className="text-small text-text-tertiary uppercase tracking-wide">
                  {role === 'shipper' ? 'Carrier' : 'Shipper'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <h1 className="text-title text-text-primary truncate">{counterpart?.name}</h1>
                {counterpart?.is_morpro_verified && <BadgeCheck className="w-5 h-5 text-emerald-500" />}
              </div>
              <p className="text-body-sm text-text-secondary">
                {load.pickup?.city}, {load.pickup?.state} → {load.delivery?.city}, {load.delivery?.state}
                {load.accepted_rate ? ` · $${Number(load.accepted_rate).toFixed(2)}` : ''}
              </p>
            </div>
          </div>
          <StatusPill status={load.network_status} />
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {/* Phase 6: review prompt — appears once load is delivered/completed and
          this side hasn't yet rated. */}
      {['delivered', 'completed'].includes(load.network_status) &&
       reviewState && !reviewState.hasReviewed && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/5 p-4 mb-4 flex items-center gap-3">
          <Star className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-body-sm font-medium text-text-primary">Rate this load</p>
            <p className="text-small text-text-secondary mt-0.5">
              How was working with {counterpart?.name}? Your rating affects their MorPro grade.
            </p>
          </div>
          <button onClick={() => setReviewModalOpen(true)}
            className="px-3 py-1.5 rounded-button text-small font-medium bg-accent text-white">
            Leave a review
          </button>
        </div>
      )}

      {reviewModalOpen && (
        <ReviewModal
          loadId={loadId}
          counterpartName={counterpart?.name || 'this org'}
          onClose={() => setReviewModalOpen(false)}
          onPosted={async () => {
            setReviewModalOpen(false);
            await refresh();
          }}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Timeline + composer */}
        <section className="lg:col-span-2 rounded-card border border-border-subtle bg-surface-primary flex flex-col h-[600px]">
          <div className="px-4 py-3 border-b border-border-subtle flex items-center gap-2">
            <Activity className="w-4 h-4 text-text-tertiary" />
            <h2 className="text-body-sm font-medium text-text-primary">Timeline</h2>
          </div>
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-small text-text-tertiary text-center py-12">
                No activity yet. Send a message to get started.
              </p>
            ) : (
              messages.map((m) => <MessageRow key={m.id} message={m} role={role} />)
            )}
            <div ref={messagesEndRef} />
          </div>
          {cc.status === 'active' ? (
            <form onSubmit={onSend} className="border-t border-border-subtle p-3 flex gap-2">
              <input
                value={composer}
                onChange={(e) => setComposer(e.target.value)}
                placeholder="Type a message…"
                className="flex-1 px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm"
              />
              <button type="submit" disabled={posting || !composer.trim()}
                className="px-3 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2">
                <Send className="w-4 h-4" /> {posting ? 'Sending…' : 'Send'}
              </button>
            </form>
          ) : (
            <div className="border-t border-border-subtle p-3 text-center text-small text-text-tertiary">
              CC is {cc.status} — messaging disabled.
            </div>
          )}
        </section>

        {/* Right rail */}
        <aside className="space-y-4">
          <PaymentCard
            payment={payment} role={role}
            onApprovePod={onApprovePod}
            onOpenDispute={onOpenDispute}
            disabled={actingPayment}
          />
          {role === 'shipper' && (
            <DriverCard driverInfo={driverInfo} />
          )}
          <DocumentsCard
            documents={documents}
            role={role}
            onAttach={onAttachDoc}
            disabled={cc.status !== 'active'}
          />
        </aside>
      </div>
    </div>
  );
}

function MessageRow({ message, role }) {
  const isSystem = message.message_type === 'status_update' || message.message_type === 'system_event';
  const isMine = (role === 'shipper' && message.sender_organization_id === message.commandCenter?.shipper_organization_id) ||
                 (role === 'carrier' && message.sender_organization_id === message.commandCenter?.carrier_organization_id);
  const ts = new Date(message.created_at).toLocaleString();

  if (isSystem) {
    return (
      <div className="text-center text-small text-text-tertiary py-1">
        <span className="px-2 py-1 rounded-full bg-surface-secondary">{message.body}</span>
        <span className="ml-2 text-[10px]">{ts}</span>
      </div>
    );
  }

  const sender = message.senderOrganization?.name || 'Unknown';
  return (
    <div className={`max-w-[80%] ${isMine ? 'ml-auto' : ''}`}>
      <div className={`rounded-card p-3 ${isMine ? 'bg-accent text-white' : 'bg-surface-secondary'}`}>
        <p className="text-small font-medium opacity-80 mb-1">{sender}</p>
        <p className="text-body-sm whitespace-pre-line">{message.body}</p>
        {message.attachment_document_id && (
          <div className="mt-2 text-small opacity-80 inline-flex items-center gap-1">
            <FileText className="w-3 h-3" /> Document attached
          </div>
        )}
      </div>
      <p className="text-[10px] text-text-tertiary mt-1 px-1">{ts}</p>
    </div>
  );
}

function ReviewModal({ loadId, counterpartName, onClose, onPosted }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { setError('Pick a rating from 1-5'); return; }
    setSubmitting(true); setError(null);
    try {
      await networkApi.postLoadReview(loadId, { rating, comments: comments.trim() || undefined });
      onPosted();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-primary border border-border rounded-card p-5 w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-body font-medium mb-3">Rate {counterpartName}</h2>
        <form onSubmit={submit}>
          <div className="flex gap-1 mb-4 justify-center">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button"
                onClick={() => setRating(n)}
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                className="p-1">
                <Star className={`w-8 h-8 ${
                  (hover || rating) >= n ? 'fill-amber-400 text-amber-400' : 'text-text-tertiary'
                }`} />
              </button>
            ))}
          </div>
          <label className="block">
            <span className="block text-small text-text-tertiary mb-1">Comments (optional)</span>
            <textarea rows={4} value={comments} onChange={(e) => setComments(e.target.value)}
              placeholder="What worked well, what could improve?"
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
          </label>
          {error && <p className="text-small text-error mt-2">{error}</p>}
          <div className="flex justify-end gap-2 mt-4">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-button text-body-sm text-text-secondary">Cancel</button>
            <button type="submit" disabled={submitting || !rating}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-body-sm font-medium disabled:opacity-50">
              {submitting ? 'Posting…' : 'Post review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function PaymentCard({ payment, role, onApprovePod, onOpenDispute, disabled }) {
  if (!payment) {
    return (
      <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
        <h3 className="text-body-sm font-medium text-text-primary mb-2 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-text-tertiary" /> Payment
        </h3>
        <p className="text-small text-text-tertiary">No transaction yet.</p>
      </div>
    );
  }
  const cents = (c) => ((Number(c) || 0) / 100).toFixed(2);
  const canApprove = role === 'shipper' && ['authorized', 'awaiting_pod'].includes(payment.status);
  const canDispute = ['authorized', 'awaiting_pod', 'awaiting_release', 'held'].includes(payment.status);
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <h3 className="text-body-sm font-medium text-text-primary mb-3 flex items-center gap-2">
        <Wallet className="w-4 h-4 text-text-tertiary" /> Payment
        <PayStatusPill status={payment.status} />
      </h3>
      <dl className="space-y-1 mb-3">
        <Row label="Gross" value={`$${cents(payment.gross_load_amount_cents)}`} />
        {role === 'shipper' && (
          <Row label="Platform fee" value={`$${cents(payment.shipper_platform_fee_cents)}`} />
        )}
        {role === 'shipper' && (
          <Row label="Total charge" value={`$${cents(payment.gross_load_amount_cents + payment.shipper_platform_fee_cents)}`} bold />
        )}
        {role === 'carrier' && (
          <Row label="Platform fee" value={`-$${cents(payment.carrier_platform_fee_cents)}`} muted />
        )}
        {role === 'carrier' && (
          <Row label="Net payout" value={`$${cents(payment.carrier_net_payout_cents)}`} bold />
        )}
      </dl>
      {payment.hold_reason && (
        <p className="text-small text-warning mb-2">Hold: {payment.hold_reason}</p>
      )}
      <div className="flex flex-col gap-2">
        {canApprove && (
          <button onClick={onApprovePod} disabled={disabled}
            className="px-3 py-1.5 rounded-button bg-emerald-500 text-white text-small font-medium hover:bg-emerald-600 disabled:opacity-50 inline-flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Approve POD → release in 48h
          </button>
        )}
        {canDispute && (
          <button onClick={onOpenDispute} disabled={disabled}
            className="px-3 py-1.5 rounded-button border border-error/40 text-error text-small font-medium hover:bg-error-muted inline-flex items-center justify-center gap-1">
            <ShieldAlert className="w-3 h-3" /> Open dispute
          </button>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, bold, muted }) {
  return (
    <div className="flex justify-between text-small">
      <dt className="text-text-tertiary">{label}</dt>
      <dd className={`${bold ? 'font-medium text-text-primary' : muted ? 'text-text-tertiary' : 'text-text-primary'}`}>{value}</dd>
    </div>
  );
}

function PayStatusPill({ status }) {
  const cfg = ({
    awaiting_payment_method: 'bg-amber-500/10 text-amber-700',
    pending_payment: 'bg-amber-500/10 text-amber-700',
    authorized: 'bg-blue-500/10 text-blue-700',
    awaiting_pod: 'bg-violet-500/10 text-violet-700',
    awaiting_release: 'bg-cyan-500/10 text-cyan-700',
    held: 'bg-orange-500/10 text-orange-700',
    released: 'bg-emerald-500/10 text-emerald-700',
    refunded: 'bg-red-500/10 text-red-700',
    disputed: 'bg-red-500/10 text-red-700'
  })[status] || 'bg-gray-500/10 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

function DriverCard({ driverInfo }) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <h3 className="text-body-sm font-medium text-text-primary mb-2">Driver</h3>
      {!driverInfo ? (
        <div className="flex items-center gap-2 text-small text-text-tertiary">
          <ShieldOff className="w-4 h-4" />
          Not yet assigned, or contact hidden by carrier policy.
        </div>
      ) : (
        <div className="space-y-1">
          <p className="text-body-sm text-text-primary">{driverInfo.display_name}</p>
          {driverInfo.phone && (
            <p className="text-small text-text-tertiary inline-flex items-center gap-1">
              <Phone className="w-3 h-3" /> {driverInfo.phone}
            </p>
          )}
          {driverInfo.contact_mode && (
            <p className="text-[10px] uppercase tracking-wide text-text-tertiary">
              <Eye className="w-3 h-3 inline mr-1" /> {driverInfo.contact_mode.replace(/_/g, ' ')}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentsCard({ documents, role, onAttach, disabled }) {
  const types = [
    { key: 'rate_confirmation', label: 'Rate confirmation' },
    { key: 'bol', label: 'BOL' },
    { key: 'pod', label: 'POD' },
    { key: 'lumper', label: 'Lumper' },
    { key: 'scale_ticket', label: 'Scale ticket' },
    { key: 'invoice', label: 'Invoice' }
  ];

  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <h3 className="text-body-sm font-medium text-text-primary mb-3">Documents</h3>
      {documents.length === 0 ? (
        <p className="text-small text-text-tertiary mb-3">None yet.</p>
      ) : (
        <ul className="space-y-2 mb-3">
          {documents.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2 text-body-sm">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <a href={d.file_url} target="_blank" rel="noopener noreferrer"
                  className="text-text-primary hover:text-accent truncate">{d.file_name}</a>
              </div>
              <span className="text-[10px] text-text-tertiary uppercase tracking-wide">{d.document_type}</span>
            </li>
          ))}
        </ul>
      )}
      <div className="grid grid-cols-2 gap-2">
        {types.map(({ key, label }) => (
          <button key={key} onClick={() => onAttach(key)} disabled={disabled}
            className="px-2 py-1.5 rounded-button text-small font-medium border border-border hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center justify-center gap-1">
            <Upload className="w-3 h-3" /> {label}
          </button>
        ))}
      </div>
      <p className="text-[10px] text-text-tertiary mt-2">Phase 4 accepts URL pastes.</p>
    </div>
  );
}
