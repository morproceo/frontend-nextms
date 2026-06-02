/**
 * FleetStrip — horizontal row of truck cards under the hero map. Each
 * card mirrors what an owner-op needs at a glance for one truck:
 *
 *   - Unit number
 *   - Driver name + ELD status (driving / on_duty / off_duty)
 *   - Current load reference (if any)
 *   - "Where" line — last reported place
 *
 * Data source is the same /v1/ava/fleet-locations response the hero map
 * uses; we re-fetch here instead of sharing state because the components
 * mount/unmount independently and the strip needs the response shape
 * once on mount (no need to keep them in sync down to the second).
 *
 * For ≤3 trucks the row centers; for more, horizontal scroll snaps.
 */

import { useEffect, useState } from 'react';
import { Truck, User, Pause, Activity, Loader2 } from 'lucide-react';
import api from '../../../api/client';

const STATUS_META = {
  driving:  { label: 'Driving',  className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400' },
  on_duty:  { label: 'On duty',  className: 'bg-amber-500/15 text-amber-300 border-amber-500/30', dot: 'bg-amber-400' },
  off_duty: { label: 'Off duty', className: 'bg-slate-500/15 text-slate-300 border-slate-500/30', dot: 'bg-slate-400' }
};

export function FleetStrip() {
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
        setTrucks(payload?.trucks || []);
      } catch (err) {
        if (cancelled) return;
        const status = err.response?.status;
        if (status === 400 || status === 404) setUnavailable(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetch();
    const id = setInterval(fetch, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-3 px-1 py-6 text-text-tertiary">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-small">Loading fleet…</span>
      </div>
    );
  }

  if (unavailable || trucks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-surface-tertiary p-6 text-center">
        <Truck className="w-6 h-6 text-text-tertiary mx-auto mb-2" />
        <p className="text-body-sm text-text-secondary">
          {unavailable ? 'Connect Motive to see your fleet here.' : 'No trucks added yet.'}
        </p>
      </div>
    );
  }

  // For 1 truck make it hero-sized; for 2-3 grid them; for 4+ horizontal scroll
  const layout = trucks.length === 1
    ? 'grid grid-cols-1'
    : trucks.length <= 3
      ? `grid grid-cols-1 sm:grid-cols-${trucks.length} gap-3`
      : 'flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 -mx-1 px-1 no-scrollbar';

  return (
    <div className={layout}>
      {trucks.map((t) => (
        <TruckCard key={t.id || t.unit_number} truck={t} solo={trucks.length === 1} />
      ))}
    </div>
  );
}

function TruckCard({ truck, solo }) {
  const eldStatus = truck.driver?.eld_status || 'off_duty';
  const meta = STATUS_META[eldStatus] || STATUS_META.off_duty;
  const driverName = truck.driver
    ? [truck.driver.first_name, truck.driver.last_name].filter(Boolean).join(' ')
    : null;
  const place = truck.location?.description || null;
  const speed = truck.location?.speed_mph;
  const inMotion = eldStatus === 'driving' || (typeof speed === 'number' && speed > 5);

  return (
    <div className={`shrink-0 ${solo ? 'w-full' : 'min-w-[260px]'} snap-start rounded-2xl bg-surface-primary border border-surface-tertiary p-4 hover:border-accent/40 transition-colors`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center">
            <Truck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="min-w-0">
            <div className="text-body-sm font-semibold text-text-primary truncate">
              Unit {truck.unit_number || '—'}
            </div>
            <div className="text-small text-text-tertiary truncate">
              {truck.make || ''} {truck.model || ''}
            </div>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${meta.className}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${meta.dot} ${inMotion ? 'animate-pulse' : ''}`} />
          {meta.label}
        </span>
      </div>

      <div className="mt-3 space-y-1.5">
        <Row icon={<User className="w-3.5 h-3.5" />}>
          {driverName || <span className="italic text-text-tertiary">No driver</span>}
        </Row>
        {place && (
          <Row icon={<Activity className="w-3.5 h-3.5" />}>
            {place}
            {typeof speed === 'number' && speed > 0 && (
              <span className="text-text-tertiary"> · {Math.round(speed)} mph</span>
            )}
          </Row>
        )}
        {!place && eldStatus === 'off_duty' && (
          <Row icon={<Pause className="w-3.5 h-3.5" />}>
            <span className="text-text-tertiary">Resting</span>
          </Row>
        )}
      </div>
    </div>
  );
}

function Row({ icon, children }) {
  return (
    <div className="flex items-center gap-2 text-small text-text-secondary">
      <span className="text-text-tertiary shrink-0">{icon}</span>
      <span className="truncate">{children}</span>
    </div>
  );
}

export default FleetStrip;
