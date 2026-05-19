import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Search, ShieldCheck, MapPin, Truck, UserRound, Check } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const STATUS_LABEL = {
  looking_for_work: 'Looking for work',
  open_to_offers: 'Open to offers'
};

const verifBadge = (v) =>
  v === 'verified'
    ? { label: 'Verified', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
    : v === 'pending'
      ? { label: 'Verification pending', cls: 'text-amber-600 bg-amber-50 border-amber-200' }
      : { label: 'Unverified', cls: 'text-text-secondary bg-surface-secondary border-surface-tertiary' };

const connState = (c) => {
  if (!c) return null;
  if (c.status === 'connected') return { label: 'Connected', cls: 'text-emerald-600' };
  if (c.status?.startsWith('pending')) return { label: 'Invite pending', cls: 'text-amber-600' };
  if (c.status === 'declined') return { label: 'Declined', cls: 'text-text-tertiary' };
  return { label: c.status, cls: 'text-text-tertiary' };
};

export default function BrowseDriversPage() {
  const { orgSlug } = useParams();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [inviting, setInviting] = useState(null);

  const load = () => {
    setLoading(true);
    connectApi.browseDrivers({ q: q || undefined, verified: verifiedOnly ? 'true' : undefined })
      .then((r) => setDrivers(r.data?.drivers || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [verifiedOnly]);

  const invite = async (d) => {
    setInviting(d.user_id);
    try {
      await connectApi.inviteDriver(d.user_id, null);
      load();
    } finally {
      setInviting(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-title text-text-primary">Browse drivers</h1>
        <p className="text-body-sm text-text-secondary">
          Drivers in the MorPro Connect network who are available for work. Invite one to start hiring.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-text-tertiary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            placeholder="Search name or headline…"
            className="w-full pl-9 pr-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90"
        >
          Search
        </button>
        <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="rounded" />
          Verified only
        </label>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading drivers…
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-card border border-surface-tertiary p-10 text-center">
          <UserRound className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <div className="text-body-sm text-text-secondary">
            No available drivers yet. Drivers appear here when they mark themselves
            “looking for work” and visible in MorPro Connect.
          </div>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {drivers.map((d) => {
            const vb = verifBadge(d.verification);
            const cs = connState(d.connection);
            return (
              <div key={d.user_id} className="bg-white rounded-card border border-surface-tertiary p-5">
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-body-sm font-semibold text-accent">
                      {d.name?.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'D'}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-body font-semibold text-text-primary truncate">{d.name}</div>
                    <div className="text-small text-text-tertiary">
                      {STATUS_LABEL[d.availability_status] || d.availability_status}
                      {d.cdl_state ? ` · CDL ${d.cdl_state}` : ''}
                    </div>
                  </div>
                  <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border flex items-center gap-1', vb.cls)}>
                    <ShieldCheck className="w-3 h-3" /> {vb.label}
                  </span>
                </div>

                {d.headline && (
                  <p className="text-body-sm text-text-secondary mt-3">{d.headline}</p>
                )}

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {d.willing_to_relocate && (
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Will relocate
                    </span>
                  )}
                  {(d.preferred_equipment || []).slice(0, 3).map((e) => (
                    <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1">
                      <Truck className="w-3 h-3" /> {e}
                    </span>
                  ))}
                  {(d.preferred_regions || []).slice(0, 3).map((r) => (
                    <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">
                      {r}
                    </span>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {cs ? (
                    <span className={cn('text-small font-medium', cs.cls)}>{cs.label}</span>
                  ) : (
                    <span className="text-small text-text-tertiary">Not contacted</span>
                  )}
                  <div className="flex gap-2">
                    <Link
                      to={`/o/${orgSlug}/connect/drivers/${d.user_id}`}
                      className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary"
                    >
                      View profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => invite(d)}
                      disabled={!!d.connection || inviting === d.user_id}
                      className={cn(
                        'px-4 py-1.5 rounded-button text-small font-medium flex items-center gap-1.5',
                        d.connection
                          ? 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
                          : 'bg-accent text-white hover:bg-accent/90'
                      )}
                    >
                      {inviting === d.user_id
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : d.connection
                          ? <Check className="w-3.5 h-3.5" />
                          : null}
                      {d.connection ? 'Invited' : 'Invite to connect'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
