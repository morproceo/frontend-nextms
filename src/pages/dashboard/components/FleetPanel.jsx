/**
 * FleetPanel — left column of the executive briefing. One vertical list
 * showing every truck with a status pill, driver, and last known
 * location. A small map sits beneath the list as visual confirmation
 * — not the focus.
 *
 * For owner-ops with 1-3 trucks this reads like a captain's roster.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Truck, User, Pause, Loader2,
  Plus, Receipt, Inbox, TrendingUp, Sparkles
} from 'lucide-react';
import api from '../../../api/client';

const STATUS_META = {
  driving:  { label: 'Driving',  cls: 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30', dot: 'bg-emerald-500' },
  on_duty:  { label: 'On duty',  cls: 'bg-amber-500/10 text-amber-700 border-amber-500/30', dot: 'bg-amber-500' },
  off_duty: { label: 'Off duty', cls: 'bg-slate-500/10 text-slate-600 border-slate-500/30', dot: 'bg-slate-400' }
};

export function FleetPanel({ onTrucksLoaded, orgUrl }) {
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetch = async () => {
      try {
        const res = await api.get('/v1/ava/fleet-locations');
        if (cancelled) return;
        const payload = res.data?.data ?? res.data;
        const list = payload?.trucks || [];
        setTrucks(list);
        onTrucksLoaded?.(list);
        setUnavailable(false);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 400 || status === 404) {
          setUnavailable(true);
          onTrucksLoaded?.([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, [onTrucksLoaded]);

  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary overflow-hidden h-full flex flex-col">
      <header className="px-5 py-4 border-b border-surface-tertiary flex items-center gap-2">
        <Truck className="w-4 h-4 text-cyan-500" />
        <h2 className="text-body font-semibold text-text-primary">The Fleet</h2>
        {trucks.length > 0 && (
          <span className="ml-auto text-small text-text-tertiary tabular-nums">
            {trucks.length} unit{trucks.length === 1 ? '' : 's'}
          </span>
        )}
      </header>

      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : unavailable ? (
        <UnavailableState />
      ) : trucks.length === 0 ? (
        <EmptyState />
      ) : (
        <ul className="divide-y divide-surface-tertiary">
          {trucks.map((t) => <TruckRow key={t.id || t.unit_number} truck={t} />)}
        </ul>
      )}

      {/* Run a task — replaces the old embedded map. Quick links to the
          four daily owner-op tasks live here so the action is one click
          away from wherever your eye lands. */}
      <RunATask orgUrl={orgUrl} />
    </section>
  );
}

function TruckRow({ truck }) {
  const eldStatus = truck.driver?.eld_status || 'off_duty';
  const meta = STATUS_META[eldStatus] || STATUS_META.off_duty;
  const driverName = truck.driver
    ? [truck.driver.first_name, truck.driver.last_name].filter(Boolean).join(' ')
    : null;
  const place = truck.location?.description || null;
  const speed = truck.location?.speed_mph;
  const inMotion = eldStatus === 'driving' || (typeof speed === 'number' && speed > 5);

  return (
    <li className="px-5 py-3 flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/10 to-blue-600/10 border border-cyan-400/20 flex items-center justify-center shrink-0">
        <Truck className="w-4 h-4 text-cyan-600" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-body-sm font-semibold text-text-primary truncate">
            Unit {truck.unit_number || '—'}
          </p>
          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${meta.cls}`}>
            <span className={`w-1 h-1 rounded-full ${meta.dot} ${inMotion ? 'animate-pulse' : ''}`} />
            {meta.label}
          </span>
        </div>
        <div className="flex items-center gap-2 text-small text-text-secondary">
          <User className="w-3 h-3 text-text-tertiary shrink-0" />
          <span className="truncate">
            {driverName || <span className="italic text-text-tertiary">No driver</span>}
          </span>
          {place && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="truncate">{place}</span>
            </>
          )}
          {typeof speed === 'number' && speed > 0 && (
            <>
              <span className="text-text-tertiary">·</span>
              <span className="tabular-nums">{Math.round(speed)} mph</span>
            </>
          )}
        </div>
      </div>
    </li>
  );
}

/**
 * RunATask — quick-action grid for the four daily owner-op tasks.
 * Replaces the old embedded fleet map. 2×2 grid of button tiles, each
 * with an accent-tinted icon + bold label. Owner-op flow: glance at
 * fleet, then do the next thing without scrolling.
 *
 * The buttons mirror what was previously in the top header pill row.
 */
function RunATask({ orgUrl }) {
  const link = (path) => (orgUrl ? orgUrl(path) : path);

  const actions = [
    {
      to: link('/loads/new'),
      icon: Plus,
      label: 'New load',
      sub: 'Log a freight job',
      tint: 'text-cyan-600',
      bg: 'bg-cyan-50',
      ring: 'hover:border-cyan-300'
    },
    {
      to: link('/expenses/new'),
      icon: Receipt,
      label: 'Expense',
      sub: 'Fuel, tolls, lumpers',
      tint: 'text-emerald-600',
      bg: 'bg-emerald-50',
      ring: 'hover:border-emerald-300'
    },
    {
      to: link('/genie/inbox'),
      icon: Inbox,
      label: 'Inbox',
      sub: 'Agent updates',
      tint: 'text-violet-600',
      bg: 'bg-violet-50',
      ring: 'hover:border-violet-300'
    },
    {
      to: link('/pnl'),
      icon: TrendingUp,
      label: 'P&L',
      sub: 'Money check',
      tint: 'text-amber-600',
      bg: 'bg-amber-50',
      ring: 'hover:border-amber-300'
    }
  ];

  return (
    <div className="border-t border-surface-tertiary px-5 py-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-3.5 h-3.5 text-fuchsia-500" />
        <h3 className="text-[11px] uppercase tracking-wider font-semibold text-text-tertiary">
          Run a task
        </h3>
      </div>
      <div className="grid grid-cols-2 gap-2.5">
        {actions.map(({ to, icon: Icon, label, sub, tint, bg, ring }) => (
          <Link
            key={label}
            to={to}
            className={`group flex items-center gap-3 px-3 py-3 rounded-xl border border-surface-tertiary bg-surface-secondary/40 hover:bg-surface-primary transition-all ${ring}`}
          >
            <span className={`w-9 h-9 rounded-lg ${bg} ${tint} flex items-center justify-center shrink-0 transition-transform group-hover:scale-105`}>
              <Icon className="w-4 h-4" strokeWidth={2.2} />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="text-body-sm font-semibold text-text-primary truncate">{label}</div>
              <div className="text-[11px] text-text-tertiary truncate">{sub}</div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex-1 px-5 py-10 text-center">
      <Truck className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
      <p className="text-body-sm text-text-secondary">No trucks yet</p>
    </div>
  );
}

function UnavailableState() {
  return (
    <div className="flex-1 px-5 py-10 text-center">
      <Pause className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
      <p className="text-body-sm text-text-secondary">Connect Motive to see live status</p>
      <p className="text-small text-text-tertiary mt-1">
        Without ELD, we can still show your trucks but not their live positions.
      </p>
    </div>
  );
}

export default FleetPanel;
