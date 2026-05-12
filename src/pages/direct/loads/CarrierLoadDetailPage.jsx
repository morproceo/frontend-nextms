import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Building2, BadgeCheck, Gavel, X, CheckCircle2,
  MessageSquare, Activity, ChevronRight
} from 'lucide-react';
import networkApi from '../../../api/network.api';
import { StatusPill } from './MyLoadsPage';

export default function CarrierLoadDetailPage() {
  const { orgSlug, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    bid_amount: '',
    notes: '',
    estimated_pickup_at: '',
    estimated_delivery_at: ''
  });

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await networkApi.getLoadForCarrier(id);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, [id]);

  const onPlaceBid = async (e) => {
    e.preventDefault();
    setActing('place');
    setError(null);
    try {
      await networkApi.placeBid(id, {
        bid_amount: Number(form.bid_amount),
        notes: form.notes || undefined,
        estimated_pickup_at: form.estimated_pickup_at || undefined,
        estimated_delivery_at: form.estimated_delivery_at || undefined
      });
      setForm({ bid_amount: '', notes: '', estimated_pickup_at: '', estimated_delivery_at: '' });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setActing(null);
    }
  };

  const onWithdraw = async (bidId) => {
    if (!confirm('Withdraw this bid?')) return;
    setActing(`withdraw-${bidId}`);
    try { await networkApi.withdrawBid(bidId); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onAcceptCounter = async (bidId) => {
    if (!confirm("Accept the shipper's counter offer? Your bid will be re-submitted at the countered amount.")) return;
    setActing(`acceptC-${bidId}`);
    try { await networkApi.carrierAcceptCounter(bidId); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };

  if (loading) {
    return <div className="px-6 py-10 max-w-3xl mx-auto flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  }
  if (!data) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <Link to={`/o/${orgSlug}/direct/loads`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="w-3 h-3" /> Find loads
        </Link>
        <p className="text-body-sm text-error">{error || 'Load not found.'}</p>
      </div>
    );
  }

  const { load, myBid } = data;
  const shipper = load.postingOrganization || {};
  const canBid = !myBid && ['posted', 'receiving_bids'].includes(load.network_status);
  const hasCC = ['booked', 'in_progress', 'delivered', 'completed'].includes(load.network_status);

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/loads`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Find loads
      </Link>

      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-title text-text-primary truncate">{load.reference_number || `#${load.id.slice(0, 6)}`}</h1>
            <StatusPill status={load.network_status} />
          </div>
          <p className="text-body-sm text-text-secondary">
            {load.pickup?.city}, {load.pickup?.state} → {load.delivery?.city}, {load.delivery?.state}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {hasCC && (
        <Link to={`/o/${orgSlug}/direct/cc/${load.id}`}
          className="rounded-card border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 p-4 mb-4 flex items-center gap-3 hover:border-violet-500/50 transition-colors">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
            <Activity className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-medium text-text-primary">Open command center</p>
            <p className="text-small text-text-secondary mt-0.5">
              Live timeline, messages, documents, and tracking with the shipper.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        </Link>
      )}

      <Section title="Shipper">
        <div className="flex items-center gap-3">
          {shipper.logo_url ? (
            <img src={shipper.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
          ) : (
            <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
              <Building2 className="w-4 h-4 text-text-tertiary" />
            </div>
          )}
          <div>
            <div className="flex items-center gap-1">
              <p className="text-body font-medium text-text-primary">{shipper.name}</p>
              {shipper.is_morpro_verified && <BadgeCheck className="w-4 h-4 text-emerald-500" />}
            </div>
          </div>
        </div>
      </Section>

      <Section title="Load details">
        <KV label="Commodity" value={load.commodity || '—'} />
        <KV label="Weight" value={load.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—'} />
        <KV label="Equipment" value={(load.equipment_requirements?.types || []).join(', ') || '—'} />
        <KV label="Pickup" value={`${load.pickup?.city}, ${load.pickup?.state}${load.pickup?.earliest_at ? ` · earliest ${new Date(load.pickup.earliest_at).toLocaleString()}` : ''}`} />
        <KV label="Delivery" value={`${load.delivery?.city}, ${load.delivery?.state}${load.delivery?.latest_at ? ` · latest ${new Date(load.delivery.latest_at).toLocaleString()}` : ''}`} />
        <KV label="Rate offered" value={load.rate_offered != null ? `$${Number(load.rate_offered).toFixed(2)}` : 'open'} />
        <KV label="Payment terms" value={load.payment_terms || '—'} />
      </Section>

      {myBid && (
        <Section title="Your bid">
          <KV label="Amount" value={`$${Number(myBid.bid_amount).toFixed(2)}`} />
          <KV label="Status" value={String(myBid.status).replace(/_/g, ' ')} />
          {myBid.counter_amount != null && (
            <KV label="Shipper counter" value={`$${Number(myBid.counter_amount).toFixed(2)}`} />
          )}
          {myBid.notes && <KV label="Your notes" value={myBid.notes} />}
          {myBid.rejection_reason && <KV label="Reason" value={myBid.rejection_reason} />}

          {(myBid.status === 'pending' || myBid.status === 'countered') && (
            <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border-subtle">
              <button onClick={() => onWithdraw(myBid.id)} disabled={!!acting}
                className="px-3 py-1 rounded-button text-small font-medium border border-border hover:bg-surface-secondary inline-flex items-center gap-1">
                <X className="w-3 h-3" /> Withdraw
              </button>
              {myBid.status === 'countered' && (
                <button onClick={() => onAcceptCounter(myBid.id)} disabled={!!acting}
                  className="px-3 py-1 rounded-button text-small font-medium bg-emerald-500 text-white hover:bg-emerald-600 inline-flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Accept counter
                </button>
              )}
            </div>
          )}
        </Section>
      )}

      {canBid && (
        <Section title="Place a bid">
          <form onSubmit={onPlaceBid} className="space-y-3">
            <Field label="Your bid ($)">
              <Input type="number" step="0.01" required value={form.bid_amount}
                onChange={(e) => setForm({ ...form, bid_amount: e.target.value })}
                placeholder={load.rate_offered != null ? Number(load.rate_offered).toFixed(2) : '2000'} />
            </Field>
            <Field label="Notes (optional)">
              <textarea rows={2} value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="Anything the shipper should know about your offer."
                className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Estimated pickup">
                <Input type="datetime-local" value={form.estimated_pickup_at}
                  onChange={(e) => setForm({ ...form, estimated_pickup_at: e.target.value })} />
              </Field>
              <Field label="Estimated delivery">
                <Input type="datetime-local" value={form.estimated_delivery_at}
                  onChange={(e) => setForm({ ...form, estimated_delivery_at: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled={!!acting}
                className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2">
                <Gavel className="w-4 h-4" /> {acting === 'place' ? 'Placing…' : 'Place bid'}
              </button>
            </div>
          </form>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-3">
      <h2 className="text-body-sm font-medium text-text-primary mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
function KV({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <p className="text-small text-text-tertiary">{label}</p>
      <p className="text-body-sm text-text-primary col-span-2">{value}</p>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-small text-text-tertiary mb-1">{label}</span>
      {children}
    </label>
  );
}
function Input(props) {
  return <input {...props} className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />;
}
