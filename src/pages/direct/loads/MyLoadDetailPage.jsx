import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Package, BadgeCheck, Building2, MapPin, Truck,
  CheckCircle2, XCircle, MessageSquare, Send, Activity, ChevronRight,
  Sparkles
} from 'lucide-react';
import networkApi from '../../../api/network.api';
import { StatusPill } from './MyLoadsPage';

export default function MyLoadDetailPage() {
  const { orgSlug, id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const [recommendations, setRecommendations] = useState([]);
  const [recsLoading, setRecsLoading] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await networkApi.getMyLoad(id);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecommendations = async () => {
    setRecsLoading(true);
    try {
      const r = await networkApi.getRecommendedCarriers(id, 5);
      setRecommendations(r || []);
    } catch (err) {
      // Non-blocking; just hide the panel.
      setRecommendations([]);
    } finally {
      setRecsLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [id]);
  useEffect(() => {
    if (data?.load && ['posted', 'receiving_bids'].includes(data.load.network_status)) {
      fetchRecommendations();
    }
    // eslint-disable-next-line
  }, [data?.load?.id, data?.load?.network_status]);

  const onAccept = async (bidId) => {
    if (!confirm('Accept this bid? Other pending bids on this load will be auto-rejected and the load will be booked to this carrier.')) return;
    setActing(`accept-${bidId}`);
    try { await networkApi.shipperAcceptBid(bidId); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onReject = async (bidId) => {
    const reason = window.prompt('Reason for rejection (optional):');
    if (reason === null) return;
    setActing(`reject-${bidId}`);
    try { await networkApi.shipperRejectBid(bidId, reason); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onCounter = async (bidId) => {
    const amt = window.prompt('Counter-offer amount ($):');
    if (!amt) return;
    setActing(`counter-${bidId}`);
    try { await networkApi.shipperCounterBid(bidId, Number(amt)); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onCancel = async () => {
    const reason = window.prompt('Cancel this load? Reason (optional):');
    if (reason === null) return;
    setActing('cancel');
    try { await networkApi.cancelLoad(id, reason); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onPublish = async () => {
    setActing('publish');
    try { await networkApi.publishLoad(id); await refresh(); }
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
          <ArrowLeft className="w-3 h-3" /> My loads
        </Link>
        <p className="text-body-sm text-error">{error || 'Load not found.'}</p>
      </div>
    );
  }

  const { load, bids } = data;
  const isDraft = load.network_status === 'draft';
  const isCancelled = load.network_status === 'cancelled';
  const isBooked = ['booked', 'in_progress', 'delivered', 'completed'].includes(load.network_status);
  const hasCC = isBooked; // CC scaffold is created on accept

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/loads`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> My loads
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
        <div className="flex gap-2">
          {isDraft && (
            <button onClick={onPublish} disabled={!!acting}
              className="px-3 py-1.5 rounded-button text-small font-medium bg-accent text-white inline-flex items-center gap-2">
              <Send className="w-3 h-3" /> Publish
            </button>
          )}
          {!isCancelled && !isBooked && (
            <button onClick={onCancel} disabled={!!acting}
              className="px-3 py-1.5 rounded-button text-small font-medium border border-error/40 text-error hover:bg-error-muted">
              Cancel load
            </button>
          )}
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
              Live timeline, messages, documents, and tracking with the carrier.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary" />
        </Link>
      )}

      <Section title="Load details">
        <KV label="Commodity" value={load.commodity || '—'} />
        <KV label="Weight" value={load.weight_lbs ? `${Number(load.weight_lbs).toLocaleString()} lbs` : '—'} />
        <KV label="Equipment" value={(load.equipment_requirements?.types || []).join(', ') || '—'} />
        <KV label="Rate offered" value={load.rate_offered != null ? `$${Number(load.rate_offered).toFixed(2)}` : '—'} />
        <KV label="Accepted rate" value={load.accepted_rate != null ? `$${Number(load.accepted_rate).toFixed(2)}` : '—'} />
        <KV label="Payment terms" value={load.payment_terms || '—'} />
      </Section>

      {!isBooked && !isCancelled && (recommendations.length > 0 || recsLoading) && (
        <Section title="Recommended carriers">
          <div className="flex items-center gap-2 mb-2 text-small text-text-tertiary">
            <Sparkles className="w-3 h-3" /> Top matches based on equipment, grade, and prior history.
          </div>
          {recsLoading ? (
            <p className="text-small text-text-tertiary">Computing…</p>
          ) : (
            <ul className="space-y-2">
              {recommendations.map((r) => (
                <li key={r.organization.id} className="flex items-center justify-between gap-3 p-3 rounded-card border border-border-subtle">
                  <div className="flex items-center gap-3 min-w-0">
                    {r.organization.logo_url ? (
                      <img src={r.organization.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                    ) : (
                      <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
                        <Building2 className="w-3 h-3 text-text-tertiary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary truncate">{r.organization.name}</p>
                      <p className="text-small text-text-tertiary truncate">{r.reason || `match score ${r.score}`}</p>
                    </div>
                  </div>
                  <Link to={`/o/${orgSlug}/direct/carriers/${r.organization.slug}`}
                    className="text-small text-accent hover:underline flex-shrink-0">
                    View
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      )}

      <Section title="Bids">
        {bids.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">No bids yet.</p>
        ) : (
          <ul className="space-y-2">
            {bids.map((b) => {
              const carrier = b.carrierOrganization || {};
              const isPending = b.status === 'pending';
              const isCountered = b.status === 'countered';
              return (
                <li key={b.id} className="rounded-card border border-border-subtle bg-surface-primary p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Building2 className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="text-body-sm font-medium text-text-primary truncate">
                            {carrier.name || 'Carrier'}
                          </p>
                          {carrier.is_morpro_verified && (
                            <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-small text-text-tertiary truncate">
                          MC {carrier.mc_number || '—'} · {String(b.status).replace(/_/g, ' ')}
                          {b.rejection_reason ? ` · "${b.rejection_reason}"` : ''}
                        </p>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-body font-medium text-text-primary">${Number(b.bid_amount).toFixed(2)}</p>
                      {b.counter_amount != null && (
                        <p className="text-small text-violet-600 dark:text-violet-400">
                          counter: ${Number(b.counter_amount).toFixed(2)}
                        </p>
                      )}
                    </div>
                  </div>
                  {b.notes && <p className="text-small text-text-secondary mt-2 italic">"{b.notes}"</p>}
                  {(isPending || isCountered) && !isBooked && !isCancelled && (
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-border-subtle">
                      {isPending && (
                        <button onClick={() => onCounter(b.id)} disabled={!!acting}
                          className="px-3 py-1 rounded-button text-small font-medium border border-border hover:bg-surface-secondary inline-flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> Counter
                        </button>
                      )}
                      <button onClick={() => onReject(b.id)} disabled={!!acting}
                        className="px-3 py-1 rounded-button text-small font-medium border border-error/40 text-error hover:bg-error-muted inline-flex items-center gap-1">
                        <XCircle className="w-3 h-3" /> Reject
                      </button>
                      {isPending && (
                        <button onClick={() => onAccept(b.id)} disabled={!!acting}
                          className="px-3 py-1 rounded-button text-small font-medium bg-emerald-500 text-white hover:bg-emerald-600 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Accept
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Section>
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
