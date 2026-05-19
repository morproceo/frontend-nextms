import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, Search, ShieldCheck, Truck, Building2, ArrowLeft, Check } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const connState = (c) => {
  if (!c) return null;
  if (c.status === 'connected') return { label: 'Connected', cls: 'text-emerald-600' };
  if (c.status?.startsWith('pending')) return { label: 'Request pending', cls: 'text-amber-600' };
  if (c.status === 'declined') return { label: 'Declined', cls: 'text-text-tertiary' };
  return { label: c.status, cls: 'text-text-tertiary' };
};

export default function BrowseCarriersPage() {
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [requesting, setRequesting] = useState(null);

  const load = () => {
    setLoading(true);
    connectApi.browseCarriers({ q: q || undefined, verified: verifiedOnly ? 'true' : undefined })
      .then((r) => setCarriers(r.data?.carriers || []))
      .catch(() => setCarriers([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [verifiedOnly]);

  const apply = async (c) => {
    setRequesting(c.organization_id);
    try {
      await connectApi.requestConnection(c.organization_id, null);
      load();
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      <div>
        <Link to="/driver/connect" className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to MorPro Connect
        </Link>
        <h1 className="text-title text-text-primary">Find carriers</h1>
        <p className="text-body-sm text-text-secondary">
          Verified trucking companies on the MorPro Connect network. Request to connect to start the hiring conversation.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search company name…"
            className="w-full pl-9 pr-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button type="button" onClick={load} className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90">
          Search
        </button>
        <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="rounded" />
          Verified only
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading carriers…
        </div>
      ) : carriers.length === 0 ? (
        <div className="bg-white rounded-card border border-surface-tertiary p-10 text-center">
          <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <div className="text-body-sm text-text-secondary">
            No carriers listed yet. Companies appear here once they publish a
            public profile on the network.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {carriers.map((c) => {
            const cs = connState(c.connection);
            return (
              <div key={c.organization_id} className="bg-white rounded-card border border-surface-tertiary p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-semibold text-text-primary truncate">{c.name}</div>
                    <div className="text-small text-text-tertiary">
                      {c.mc_number ? `MC ${c.mc_number}` : ''}{c.mc_number && c.dot_number ? ' · ' : ''}{c.dot_number ? `DOT ${c.dot_number}` : ''}
                      {!c.mc_number && !c.dot_number ? 'Carrier' : ''}
                    </div>
                  </div>
                  {c.verified && (
                    <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border text-emerald-600 bg-emerald-50 border-emerald-200 flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>

                {c.public_notes && (
                  <p className="text-body-sm text-text-secondary mt-3 line-clamp-3">{c.public_notes}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {typeof c.available_trucks === 'number' && c.available_trucks > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {c.available_trucks} trucks
                    </span>
                  )}
                  {(c.equipment_types || []).slice(0, 3).map((e) => (
                    <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">{e}</span>
                  ))}
                  {(c.service_regions || []).slice(0, 3).map((r) => (
                    <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">{r}</span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {cs ? (
                    <span className={cn('text-small font-medium', cs.cls)}>{cs.label}</span>
                  ) : (
                    <span className="text-small text-text-tertiary">Not contacted</span>
                  )}
                  <button
                    type="button"
                    onClick={() => apply(c)}
                    disabled={!!c.connection || requesting === c.organization_id}
                    className={cn(
                      'px-4 py-1.5 rounded-button text-small font-medium flex items-center gap-1.5',
                      c.connection
                        ? 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                        : 'bg-accent text-white hover:bg-accent/90'
                    )}
                  >
                    {requesting === c.organization_id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : c.connection ? <Check className="w-3.5 h-3.5" /> : null}
                    {c.connection ? 'Requested' : 'Request to connect'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
