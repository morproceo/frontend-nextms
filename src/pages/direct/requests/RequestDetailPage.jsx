import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Building2, BadgeCheck, CheckCircle2, XCircle,
  MessageSquare, Send, Package
} from 'lucide-react';
import networkApi from '../../../api/network.api';
import { useOrg } from '../../../contexts/OrgContext';
import { RequestStatusPill } from './RequestsPage';

export default function RequestDetailPage() {
  const { orgSlug, id } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await networkApi.getRequest(id);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, [id]);

  if (loading) {
    return <div className="px-6 py-10 max-w-3xl mx-auto flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  }
  if (!data) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <Link to={`/o/${orgSlug}/direct/requests`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="w-3 h-3" /> Requests
        </Link>
        <p className="text-body-sm text-error">{error || 'Request not found.'}</p>
      </div>
    );
  }

  const r = data;
  const isCarrier = r.carrier_organization_id === currentOrg?.id;
  const isShipper = r.shipper_organization_id === currentOrg?.id;
  const counterparty = isCarrier ? r.shipperOrganization : r.carrierOrganization;
  const isOpen = ['sent', 'viewed', 'countered'].includes(r.status);

  const onCarrierAccept = async () => {
    if (!confirm("Accept this request? This will create a load in your NextMS dispatcher and book the network load.")) return;
    setActing('accept');
    try {
      const res = await networkApi.acceptRequest(id);
      setData(res.request);
      // After accepting, route to the network load detail view (carrier side).
      if (res.load?.id) {
        navigate(`/o/${orgSlug}/direct/loads/${res.load.id}/view`);
      } else {
        await refresh();
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };
  const onCarrierReject = async () => {
    const reason = window.prompt('Reason for declining (optional):');
    if (reason === null) return;
    setActing('reject');
    try { await networkApi.rejectRequest(id, reason); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onCarrierCounter = async () => {
    const amt = window.prompt('Counter-offer amount ($):');
    if (!amt) return;
    setActing('counter');
    try { await networkApi.counterRequest(id, Number(amt)); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onShipperCancel = async () => {
    if (!confirm('Cancel this request?')) return;
    setActing('cancel');
    try { await networkApi.cancelRequest(id); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onShipperAcceptCounter = async () => {
    if (!confirm("Accept the carrier's counter offer? This will book the load.")) return;
    setActing('shipper-accept-counter');
    try {
      const res = await networkApi.shipperAcceptCounter(id);
      setData(res.request);
      if (res.load?.id) {
        navigate(`/o/${orgSlug}/direct/loads/${res.load.id}`);
      } else {
        await refresh();
      }
    } catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/requests`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Requests
      </Link>

      <header className="flex items-start gap-4 mb-6">
        {counterparty?.logo_url ? (
          <img src={counterparty.logo_url} alt="" className="w-12 h-12 rounded-lg object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-surface-secondary flex items-center justify-center">
            <Building2 className="w-5 h-5 text-text-tertiary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <h1 className="text-title text-text-primary truncate">{counterparty?.name}</h1>
            {counterparty?.is_morpro_verified && <BadgeCheck className="w-5 h-5 text-emerald-500" />}
            <RequestStatusPill status={r.status} />
          </div>
          <p className="text-body-sm text-text-secondary">
            {r.pickup?.city}, {r.pickup?.state} → {r.delivery?.city}, {r.delivery?.state}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {r.status === 'accepted' && r.network_load_id && (
        <div className="rounded-card border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4">
          <p className="text-body-sm font-medium text-text-primary">Booked.</p>
          <p className="text-small text-text-secondary mt-1">
            <Link to={isCarrier ? `/o/${orgSlug}/direct/loads/${r.network_load_id}/view` : `/o/${orgSlug}/direct/loads/${r.network_load_id}`}
              className="text-accent hover:underline">
              Open the load →
            </Link>
            {isCarrier && (
              <> Internal load created in your NextMS dispatcher with status <code>draft</code>. Assign driver/truck to confirm into dispatch.</>
            )}
          </p>
        </div>
      )}

      <Section title="Load details">
        <KV label="Commodity" value={r.commodity || '—'} />
        <KV label="Weight" value={r.weight_lbs ? `${Number(r.weight_lbs).toLocaleString()} lbs` : '—'} />
        <KV label="Equipment" value={(r.equipment_requirements?.types || []).join(', ') || '—'} />
        <KV label="Rate offered" value={r.rate_offered != null ? `$${Number(r.rate_offered).toFixed(2)}` : '—'} />
        {r.counter_amount != null && <KV label="Carrier counter" value={`$${Number(r.counter_amount).toFixed(2)}`} />}
        <KV label="Payment terms" value={r.payment_terms || '—'} />
        {r.message && <KV label="Message" value={r.message} multiline />}
        {r.rejection_reason && <KV label="Reason" value={r.rejection_reason} />}
      </Section>

      {isCarrier && isOpen && (
        <div className="flex justify-end gap-2">
          <button onClick={onCarrierCounter} disabled={!!acting || r.counter_amount != null}
            className="px-4 py-2 rounded-button border border-border text-body-sm font-medium hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-2">
            <MessageSquare className="w-4 h-4" /> Counter
          </button>
          <button onClick={onCarrierReject} disabled={!!acting}
            className="px-4 py-2 rounded-button border border-error/40 text-error text-body-sm font-medium hover:bg-error-muted inline-flex items-center gap-2">
            <XCircle className="w-4 h-4" /> Decline
          </button>
          <button onClick={onCarrierAccept} disabled={!!acting}
            className="px-4 py-2 rounded-button bg-emerald-500 text-white text-body-sm font-medium hover:bg-emerald-600 inline-flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {acting === 'accept' ? 'Accepting…' : 'Accept'}
          </button>
        </div>
      )}

      {isShipper && isOpen && (
        <div className="flex justify-end gap-2">
          {r.status === 'countered' && (
            <button onClick={onShipperAcceptCounter} disabled={!!acting}
              className="px-4 py-2 rounded-button bg-emerald-500 text-white text-body-sm font-medium hover:bg-emerald-600 inline-flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> Accept counter
            </button>
          )}
          <button onClick={onShipperCancel} disabled={!!acting}
            className="px-4 py-2 rounded-button border border-error/40 text-error text-body-sm font-medium hover:bg-error-muted">
            Cancel request
          </button>
        </div>
      )}
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
