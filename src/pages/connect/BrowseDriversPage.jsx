import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Loader2, Search, ShieldCheck, MapPin, Truck, UserRound, Check,
  ChevronDown, X, Filter, BadgeCheck
} from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const STATUS_LABEL = {
  looking_for_work: 'Looking for work',
  open_to_offers: 'Open to offers'
};

const verifBadge = (v) =>
  v === 'verified'
    ? { label: 'Verified', cls: 'text-emerald-600 bg-emerald-50 border-emerald-200', icon: BadgeCheck }
    : v === 'pending'
      ? { label: 'Pending', cls: 'text-amber-600 bg-amber-50 border-amber-200', icon: ShieldCheck }
      : { label: 'Unverified', cls: 'text-text-secondary bg-surface-secondary border-surface-tertiary', icon: ShieldCheck };

const connState = (c) => {
  if (!c) return null;
  if (c.status === 'connected') return { label: 'Connected', cls: 'text-emerald-600' };
  if (c.status?.startsWith('pending')) return { label: 'Invite sent', cls: 'text-amber-600' };
  if (c.status === 'declined') return { label: 'Declined', cls: 'text-text-tertiary' };
  return { label: c.status, cls: 'text-text-tertiary' };
};

const initialsOf = (name) =>
  (name || '').split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'D';

const prettyEquip = (e) => e.replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export default function BrowseDriversPage() {
  const { orgSlug } = useParams();
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [inviting, setInviting] = useState(null);

  // Filter chip state — toggled, drives client-side filtering on top of the
  // server response so chip clicks feel instant (no re-fetch round-trip).
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'looking_for_work' | 'open_to_offers'
  const [equipFilter, setEquipFilter] = useState(null);   // string | null
  const [relocateOnly, setRelocateOnly] = useState(false);

  const load = () => {
    setLoading(true);
    connectApi.browseDrivers({ q: q || undefined })
      .then((r) => setDrivers(r.data?.drivers || []))
      .catch(() => setDrivers([]))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, []);

  // Build unique equipment list from the loaded data to power the dropdown.
  const allEquip = useMemo(() => {
    const s = new Set();
    drivers.forEach((d) => (d.preferred_equipment || []).forEach((e) => s.add(e)));
    return Array.from(s).sort();
  }, [drivers]);

  // Apply chips client-side over the server result.
  const filtered = useMemo(() => {
    return drivers.filter((d) => {
      if (verifiedOnly && d.verification !== 'verified') return false;
      if (statusFilter !== 'all' && d.availability_status !== statusFilter) return false;
      if (equipFilter && !(d.preferred_equipment || []).includes(equipFilter)) return false;
      if (relocateOnly && !d.willing_to_relocate) return false;
      return true;
    });
  }, [drivers, verifiedOnly, statusFilter, equipFilter, relocateOnly]);

  const invite = async (d) => {
    setInviting(d.user_id);
    try {
      await connectApi.inviteDriver(d.user_id, null);
      load();
    } finally {
      setInviting(null);
    }
  };

  const clearAll = () => {
    setVerifiedOnly(false);
    setStatusFilter('all');
    setEquipFilter(null);
    setRelocateOnly(false);
    setQ('');
    load();
  };

  const activeFilterCount =
    (verifiedOnly ? 1 : 0) +
    (statusFilter !== 'all' ? 1 : 0) +
    (equipFilter ? 1 : 0) +
    (relocateOnly ? 1 : 0);

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-title text-text-primary">Browse drivers</h1>
        <p className="text-body-sm text-text-secondary">
          Drivers in the MorPro Connect network who are available for work.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-text-tertiary absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && load()}
          placeholder="Search drivers by name, headline, region…"
          className="w-full pl-10 pr-10 py-2.5 rounded-full bg-white border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
        {q && (
          <button
            type="button"
            onClick={() => { setQ(''); load(); }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:bg-surface-secondary"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter chip row — LinkedIn-style pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <FilterPill active={verifiedOnly} onClick={() => setVerifiedOnly((v) => !v)}>
          <BadgeCheck className="w-3.5 h-3.5" /> Verified
        </FilterPill>
        <StatusFilterPill value={statusFilter} onChange={setStatusFilter} />
        <EquipmentFilterPill value={equipFilter} options={allEquip} onChange={setEquipFilter} />
        <FilterPill active={relocateOnly} onClick={() => setRelocateOnly((v) => !v)}>
          <MapPin className="w-3.5 h-3.5" /> Will relocate
        </FilterPill>
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={clearAll}
            className="ml-1 px-3 py-1.5 text-[12px] font-medium text-text-tertiary hover:text-text-primary transition-colors whitespace-nowrap"
          >
            Clear filters ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading drivers…
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-card border border-surface-tertiary p-10 text-center">
          <UserRound className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <div className="text-body-sm text-text-secondary">
            {drivers.length === 0
              ? 'No available drivers yet. Drivers appear here when they mark themselves "looking for work".'
              : 'No drivers match the current filters.'}
          </div>
          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={clearAll}
              className="mt-3 text-body-sm text-accent font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="text-small text-text-tertiary">
            {filtered.length} {filtered.length === 1 ? 'driver' : 'drivers'}
            {filtered.length !== drivers.length && ` of ${drivers.length}`}
          </div>
          <div className="bg-white rounded-card border border-surface-tertiary divide-y divide-surface-tertiary/70 overflow-hidden">
            {filtered.map((d) => (
              <DriverRow
                key={d.user_id}
                driver={d}
                orgSlug={orgSlug}
                onInvite={invite}
                inviting={inviting === d.user_id}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

/* ───────────────────────── row ─────────────────────────────── */

function DriverRow({ driver: d, orgSlug, onInvite, inviting }) {
  const vb = verifBadge(d.verification);
  const cs = connState(d.connection);
  const Vi = vb.icon;
  const profileHref = `/o/${orgSlug}/connect/drivers/${d.user_id}`;

  return (
    <div className="px-4 py-4 hover:bg-surface-secondary/30 transition-colors">
      <div className="flex items-start gap-4">
        {/* Avatar */}
        <Link to={profileHref} className="flex-shrink-0">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-accent/15 to-accent/5 border border-surface-tertiary flex items-center justify-center">
            <span className="text-body-sm font-semibold text-accent">{initialsOf(d.name)}</span>
          </div>
        </Link>

        {/* Center: name, badges, headline, region, chips */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link
              to={profileHref}
              className="text-body font-semibold text-text-primary hover:text-accent transition-colors truncate"
            >
              {d.name}
            </Link>
            {d.verification === 'verified' && (
              <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Identity verified" />
            )}
            <span className="text-text-tertiary text-small">·</span>
            <span className={cn('text-small font-medium', d.availability_status === 'looking_for_work' ? 'text-emerald-600' : 'text-blue-600')}>
              {STATUS_LABEL[d.availability_status] || d.availability_status}
            </span>
          </div>

          {d.headline && (
            <p className="text-body-sm text-text-secondary mt-0.5 truncate">{d.headline}</p>
          )}

          <div className="flex items-center gap-3 mt-1 text-small text-text-tertiary flex-wrap">
            {d.cdl_state && (
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> CDL {d.cdl_state}
              </span>
            )}
            {(d.preferred_regions || []).slice(0, 2).map((r) => (
              <span key={r} className="flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {r}
              </span>
            ))}
            {d.willing_to_relocate && (
              <span className="text-emerald-600">· Will relocate</span>
            )}
          </div>

          {(d.preferred_equipment || []).length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {(d.preferred_equipment || []).slice(0, 4).map((e) => (
                <span
                  key={e}
                  className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1"
                >
                  <Truck className="w-3 h-3" /> {prettyEquip(e)}
                </span>
              ))}
              {(d.preferred_equipment || []).length > 4 && (
                <span className="text-[11px] text-text-tertiary px-1">
                  +{(d.preferred_equipment || []).length - 4} more
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right: status + action button (stacked like LinkedIn) */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {cs && (
            <span className={cn('text-[11px] font-medium', cs.cls)}>{cs.label}</span>
          )}
          {d.connection ? (
            <button
              type="button"
              disabled
              className="px-4 py-1.5 rounded-full border border-surface-tertiary text-small font-medium text-text-tertiary cursor-not-allowed flex items-center gap-1.5 whitespace-nowrap"
            >
              <Check className="w-3.5 h-3.5" /> Invited
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onInvite(d)}
              disabled={inviting}
              className="px-4 py-1.5 rounded-full border-2 border-accent text-accent text-small font-semibold hover:bg-accent hover:text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              {inviting ? 'Sending…' : 'Connect'}
            </button>
          )}
          <Link
            to={profileHref}
            className="text-[11px] text-text-tertiary hover:text-text-primary transition-colors"
          >
            View profile
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── filter pills ────────────────────────── */

function FilterPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12px] font-medium whitespace-nowrap transition-colors',
        active
          ? 'bg-accent text-white border-accent'
          : 'bg-white text-text-secondary border-surface-tertiary hover:border-text-tertiary'
      )}
    >
      {children}
    </button>
  );
}

function StatusFilterPill({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const active = value !== 'all';
  const label = value === 'looking_for_work' ? 'Looking' : value === 'open_to_offers' ? 'Open to offers' : 'Status';
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12px] font-medium whitespace-nowrap transition-colors',
          active
            ? 'bg-accent text-white border-accent'
            : 'bg-white text-text-secondary border-surface-tertiary hover:border-text-tertiary'
        )}
      >
        {label} <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 min-w-[180px] bg-white border border-surface-tertiary rounded-lg shadow-elevated overflow-hidden">
            {[
              { v: 'all', l: 'All' },
              { v: 'looking_for_work', l: 'Looking for work' },
              { v: 'open_to_offers', l: 'Open to offers' }
            ].map((opt) => (
              <button
                key={opt.v}
                type="button"
                onClick={() => { onChange(opt.v); setOpen(false); }}
                className={cn(
                  'w-full text-left px-3 py-2 text-[12px] hover:bg-surface-secondary flex items-center justify-between',
                  value === opt.v && 'text-accent font-medium'
                )}
              >
                {opt.l}
                {value === opt.v && <Check className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function EquipmentFilterPill({ value, options, onChange }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border text-[12px] font-medium whitespace-nowrap transition-colors',
          value
            ? 'bg-accent text-white border-accent'
            : 'bg-white text-text-secondary border-surface-tertiary hover:border-text-tertiary'
        )}
      >
        <Truck className="w-3.5 h-3.5" />
        {value ? prettyEquip(value) : 'Equipment'}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute z-20 mt-1.5 min-w-[180px] bg-white border border-surface-tertiary rounded-lg shadow-elevated overflow-hidden max-h-72 overflow-y-auto">
            <button
              type="button"
              onClick={() => { onChange(null); setOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-2 text-[12px] hover:bg-surface-secondary flex items-center justify-between',
                !value && 'text-accent font-medium'
              )}
            >
              Any equipment
              {!value && <Check className="w-3.5 h-3.5" />}
            </button>
            {options.length === 0 ? (
              <div className="px-3 py-2 text-[12px] text-text-tertiary">No equipment data yet</div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => { onChange(opt); setOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-[12px] hover:bg-surface-secondary flex items-center justify-between',
                    value === opt && 'text-accent font-medium'
                  )}
                >
                  {prettyEquip(opt)}
                  {value === opt && <Check className="w-3.5 h-3.5" />}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
