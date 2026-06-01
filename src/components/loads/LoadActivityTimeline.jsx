import { useState, useEffect, useCallback, useMemo, lazy, Suspense } from 'react';
import {
  Loader2,
  ChevronDown,
  Plus,
  ArrowRightLeft,
  Pencil,
  StickyNote,
  FileText,
  Sparkles,
  Cpu,
  Settings2,
  Truck,
  MapPin,
  Navigation,
  Send,
  Flag,
  Clock,
  Gauge,
  RefreshCw,
  Activity
} from 'lucide-react';
import { getLoadEvents } from '../../api/loads.api';
import { useLiveLocation } from '../../hooks/useLiveLocation';
import { Spinner } from '../ui/Spinner';

const LoadRouteMap = lazy(() =>
  import('../map/LoadRouteMap').then((m) => ({ default: m.LoadRouteMap }))
);

/**
 * LoadActivityTimeline — the load's narrative.
 *
 * Phase cards lay the trip out chronologically: Created → Dispatched →
 * In Transit → Delivered. The map at the top "tells the story" by
 * showing the planned route, the driver's actual position, and where
 * they are in the journey. The raw event log is collapsed at the
 * bottom for the audit-trail use case.
 */

// ── relative-time helper ──────────────────────────────────────────────
const rel = (d) => {
  if (!d) return '';
  const t = new Date(d).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

const fmtDuration = (ms) => {
  if (!ms || ms < 0) return '—';
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const fmtClock = (d) => {
  if (!d) return '';
  const date = new Date(d);
  return date.toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
};

// ── phase definitions ─────────────────────────────────────────────────
// Each phase has an icon, accent color, and a list of statuses that
// indicate this phase has been reached. The "active" phase glows.
const PHASES = [
  {
    key: 'created',
    label: 'Created',
    icon: Plus,
    accent: '#94A3B8',
    accentBg: 'rgba(148,163,184,0.10)',
    reachedAt: () => true
  },
  {
    key: 'dispatched',
    label: 'Dispatched',
    icon: Send,
    accent: '#34CCFF',
    accentBg: 'rgba(52,204,255,0.10)',
    reachedAt: (status) => !['new', 'booked'].includes(status)
  },
  {
    key: 'in_transit',
    label: 'In Transit',
    icon: Truck,
    accent: '#F97316',
    accentBg: 'rgba(249,115,22,0.10)',
    reachedAt: (status) => ['in_transit', 'picked_up', 'delayed', 'delivered'].includes(status)
  },
  {
    key: 'delivered',
    label: 'Delivered',
    icon: Flag,
    accent: '#10B981',
    accentBg: 'rgba(16,185,129,0.10)',
    reachedAt: (status) => status === 'delivered'
  }
];

// Map status_change events to which phase they "belong" to.
const phaseForEvent = (e) => {
  if (e.event_type === 'created') return 'created';
  if (e.event_type === 'status_change') {
    const next = String(e.new_value || '').toLowerCase();
    if (next === 'dispatched') return 'dispatched';
    if (['in_transit', 'picked_up', 'delayed'].includes(next)) return 'in_transit';
    if (next === 'delivered') return 'delivered';
  }
  // Everything else (document, field_edit, agent, note) attaches to whatever
  // phase the load was IN at the time. We assign these after sorting.
  return null;
};

// ── sub-event row ─────────────────────────────────────────────────────
const SUBEVENT_META = {
  status_change: { icon: ArrowRightLeft, tint: '#64748B' },
  field_edit:    { icon: Pencil,        tint: '#A78BFA' },
  document:      { icon: FileText,      tint: '#60A5FA' },
  note:          { icon: StickyNote,    tint: '#FBBF24' },
  agent_action:  { icon: Sparkles,      tint: '#E879F9' },
  created:       { icon: Plus,          tint: '#34CCFF' }
};

function SubEvent({ e }) {
  const meta = SUBEVENT_META[e.event_type] || SUBEVENT_META.field_edit;
  const Icon = meta.icon;
  return (
    <li className="flex items-start gap-2.5 text-sm group">
      <span
        className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.tint}1f` }}
      >
        <Icon className="w-3 h-3" style={{ color: meta.tint }} />
      </span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          <span className="text-gray-800">
            {e.event_type === 'status_change' ? (
              <>Status <span className="text-gray-400">→</span>{' '}
                <span className="capitalize font-medium">{e.new_value}</span></>
            ) : e.event_type === 'field_edit' ? (
              <><span className="font-medium">{e.field}</span> updated</>
            ) : e.event_type === 'document' ? (
              <>Uploaded <span className="font-medium">{e.new_value || 'document'}</span></>
            ) : e.event_type === 'created' ? (
              'Load created'
            ) : e.event_type === 'agent_action' ? (
              <>Agent <span className="font-medium">{e.field || 'ran'}</span></>
            ) : e.event_type === 'note' ? (
              'Note'
            ) : (
              e.event_type
            )}
          </span>
          {e.actor_type === 'agent' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-fuchsia-600">
              <Cpu className="w-2.5 h-2.5" /> agent
            </span>
          )}
          {e.actor_type === 'system' && (
            <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-gray-500">
              <Settings2 className="w-2.5 h-2.5" />
            </span>
          )}
          <span className="text-xs text-gray-400 ml-auto">{rel(e.created_at)}</span>
        </div>
        {e.note && (
          <div className="text-xs text-gray-600 mt-0.5">{e.note}</div>
        )}
        {e.actor_label && (
          <div className="text-[11px] text-gray-400 mt-0.5">{e.actor_label}{e.source ? ` · ${e.source}` : ''}</div>
        )}
      </div>
    </li>
  );
}

// ── phase card ────────────────────────────────────────────────────────
function PhaseCard({ phase, state, milestone, subEvents, telemetry, last }) {
  const Icon = phase.icon;
  const isActive = state === 'active';
  const isReached = state === 'active' || state === 'past';
  const isFuture = state === 'future';

  return (
    <li className="relative pl-12 pb-6">
      {/* connector line */}
      {!last && (
        <span
          className="absolute left-[18px] top-9 bottom-0 w-px"
          style={{
            background: isReached
              ? 'linear-gradient(to bottom, ' + phase.accent + '66, ' + phase.accent + '22)'
              : '#E5E7EB'
          }}
          aria-hidden
        />
      )}

      {/* phase node */}
      <span
        className="absolute left-0 top-1 w-9 h-9 rounded-full flex items-center justify-center"
        style={{
          background: isReached ? phase.accent : '#F3F4F6',
          boxShadow: isActive
            ? `0 0 0 6px ${phase.accent}22, 0 6px 16px -4px ${phase.accent}55`
            : 'none',
          border: isReached ? 'none' : '2px dashed #CBD5E1'
        }}
      >
        <Icon
          className="w-4 h-4"
          style={{ color: isReached ? 'white' : '#94A3B8' }}
        />
        {isActive && (
          <span
            className="absolute inset-0 rounded-full animate-ping"
            style={{ background: phase.accent, opacity: 0.35 }}
            aria-hidden
          />
        )}
      </span>

      {/* phase body */}
      <div
        className={`rounded-xl border ${
          isActive
            ? 'border-transparent shadow-md'
            : isReached
              ? 'border-gray-200'
              : 'border-dashed border-gray-200'
        }`}
        style={{
          background: isActive
            ? `linear-gradient(135deg, ${phase.accentBg}, white 60%)`
            : isReached
              ? 'white'
              : '#FAFAFA',
          ringColor: phase.accent
        }}
      >
        {/* header */}
        <div className="px-4 pt-3.5 pb-2 flex items-center gap-2 flex-wrap">
          <span
            className="text-[10px] uppercase tracking-[0.14em] font-bold"
            style={{ color: isReached ? phase.accent : '#94A3B8' }}
          >
            {phase.label}
          </span>
          {isActive && (
            <span
              className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded-full"
              style={{ background: `${phase.accent}22`, color: phase.accent }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                  style={{ background: phase.accent }}
                />
                <span
                  className="relative inline-flex rounded-full h-1.5 w-1.5"
                  style={{ background: phase.accent }}
                />
              </span>
              Now
            </span>
          )}
          {milestone?.created_at && (
            <span className="text-xs text-gray-400 ml-auto">
              {fmtClock(milestone.created_at)} · {rel(milestone.created_at)}
            </span>
          )}
        </div>

        {/* milestone summary */}
        <div className="px-4 pb-3 text-sm">
          {milestone ? (
            <div className="text-gray-900">
              {milestone.event_type === 'status_change' ? (
                <>Status moved to <span className="capitalize font-semibold">{milestone.new_value}</span></>
              ) : milestone.event_type === 'created' ? (
                'Load created'
              ) : (
                milestone.event_type
              )}
              {milestone.actor_label && (
                <span className="text-gray-500"> by {milestone.actor_label}</span>
              )}
              {milestone.source === 'driver_portal' && (
                <span className="text-[10px] uppercase tracking-wider text-emerald-600 ml-2 px-1.5 py-0.5 rounded-full bg-emerald-50">
                  from driver
                </span>
              )}
            </div>
          ) : isFuture ? (
            <div className="text-gray-400 italic">Pending</div>
          ) : null}

          {/* in-transit live telemetry inside the in_transit phase card */}
          {phase.key === 'in_transit' && telemetry && (
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <TeleStat
                icon={Navigation}
                label="Last ping"
                value={telemetry.lastPing ? rel(telemetry.lastPing) : '—'}
                tint={phase.accent}
              />
              <TeleStat
                icon={Gauge}
                label="Speed"
                value={telemetry.speedMph != null ? `${telemetry.speedMph} mph` : '—'}
                tint={phase.accent}
              />
              <TeleStat
                icon={Activity}
                label="Pings"
                value={telemetry.pingCount}
                tint={phase.accent}
              />
              <TeleStat
                icon={Clock}
                label="Elapsed"
                value={fmtDuration(telemetry.elapsedMs)}
                tint={phase.accent}
              />
            </div>
          )}

          {/* sub-events */}
          {subEvents && subEvents.length > 0 && (
            <ul className="mt-3 space-y-2 border-t border-gray-100 pt-3">
              {subEvents.map((e) => (
                <SubEvent key={e.id || `${e.event_type}-${e.created_at}`} e={e} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

function TeleStat({ icon: Icon, label, value, tint }) {
  return (
    <div className="rounded-lg bg-white/70 border border-gray-100 px-2.5 py-2">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-gray-400">
        <Icon className="w-3 h-3" style={{ color: tint }} />
        {label}
      </div>
      <div className="text-sm font-semibold text-gray-900 mt-0.5">{value}</div>
    </div>
  );
}

// ── trip stats strip — quick numbers above the map ────────────────────
function TripStatsStrip({ load, telemetry }) {
  const status = String(load?.status || '').toLowerCase();

  const items = [
    {
      label: 'Status',
      value: status.replace(/_/g, ' '),
      tint: status === 'delivered' ? '#10B981'
        : status === 'in_transit' ? '#F97316'
        : status === 'dispatched' ? '#34CCFF'
        : '#94A3B8'
    },
    {
      label: 'Distance',
      value: load?.miles ? `${Math.round(load.miles).toLocaleString()} mi` : '—'
    },
    {
      label: 'Elapsed',
      value: telemetry?.elapsedMs ? fmtDuration(telemetry.elapsedMs) : '—'
    },
    {
      label: 'Live speed',
      value: telemetry?.speedMph != null ? `${telemetry.speedMph} mph` : '—'
    }
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
      {items.map((it) => (
        <div key={it.label} className="bg-white border border-gray-200 rounded-lg px-3 py-2">
          <div className="text-[10px] uppercase tracking-wider text-gray-400">{it.label}</div>
          <div
            className="text-sm font-semibold capitalize"
            style={{ color: it.tint || '#111827' }}
          >
            {it.value || '—'}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── full details (collapsed) ─────────────────────────────────────────
const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

function DetailGrid({ load }) {
  if (!load) return null;
  const s = load.schedule || {};
  const groups = [
    ['Identity', [
      ['Reference #', load.reference_number],
      ['Customer load #', load.customer_load_number],
      ['Status', load.status],
      ['Billing status', load.billing_status],
      ['Load type', load.load_type],
      ['Created', load.created_at && new Date(load.created_at).toLocaleString()]
    ]],
    ['Handling', [
      ['Customer criticality', load.customer_criticality],
      ['Appointment rigidity', load.appointment_rigidity],
      ['Hazmat', load.hazmat],
      ['Hazmat class', load.hazmat_class],
      ['Temp controlled', load.temp_controlled],
      ['High value', load.high_value],
      ['Requires team', load.requires_team],
      ['Recovery difficulty', load.recovery_difficulty]
    ]],
    ['Schedule', [
      ['Pickup date', s.pickup_date],
      ['Pickup window', [s.pickup_time_start, s.pickup_time_end].filter(Boolean).join('–')],
      ['Delivery date', s.delivery_date],
      ['Delivery window', [s.delivery_time_start, s.delivery_time_end].filter(Boolean).join('–')],
      ['Completed at', s.completed_at && new Date(s.completed_at).toLocaleString()]
    ]],
    ['Broker', [
      ['Broker', load.broker?.name],
      ['Broker MC', load.broker?.mc]
    ]]
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
      {groups.map(([title, rows]) => (
        <div key={title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{title}</div>
          <dl className="space-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <dt className="text-gray-500 flex-shrink-0">{k}</dt>
                <dd className="text-gray-800 text-right truncate">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

// ── story map ─────────────────────────────────────────────────────────
const SHOW_MAP_STATUSES = new Set([
  'dispatched', 'picked_up', 'in_transit', 'delayed', 'delivered'
]);

function StoryMap({ load, liveLocation }) {
  const status = String(load?.status || '').toLowerCase();
  const showMap = SHOW_MAP_STATUSES.has(status);
  const isLive = ['dispatched', 'picked_up', 'in_transit', 'delayed'].includes(status);
  if (!showMap || !load?.id) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-6 py-12 text-center">
        <MapPin className="w-7 h-7 text-gray-300 mx-auto mb-2" />
        <div className="text-sm text-gray-500 font-medium">Trip hasn't started yet</div>
        <div className="text-xs text-gray-400 mt-1">
          Dispatch this load and the route will appear here.
        </div>
      </div>
    );
  }
  return (
    <div
      className="relative rounded-xl overflow-hidden border border-gray-200 bg-gray-900 shadow-sm"
      style={{ height: 380 }}
    >
      <Suspense fallback={
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <Spinner size="md" />
        </div>
      }>
        <LoadRouteMap
          loadId={load.id}
          loadStatus={load.status}
          className="absolute inset-0"
          showOverlay={false}
        />
      </Suspense>

      {/* single live indicator: badge + speed inline */}
      <div className="absolute top-3 left-3 pointer-events-none flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-sm ring-1 ${
          isLive ? 'ring-emerald-400/40' : 'ring-cyan-400/30'
        }`}>
          <span className="relative flex h-1.5 w-1.5">
            {isLive && (
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-emerald-400" />
            )}
            <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${isLive ? 'bg-emerald-400' : 'bg-cyan-400'}`} />
          </span>
          <span className={`text-[10px] font-bold tracking-[0.12em] ${isLive ? 'text-emerald-300' : 'text-cyan-300'}`}>
            {isLive ? 'LIVE' : 'COMPLETED ROUTE'}
          </span>
        </div>
        {liveLocation?.speed_mps != null && isLive && (
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-sm text-cyan-300 text-[11px] font-semibold">
            <Gauge className="w-3 h-3" />
            {Math.round(liveLocation.speed_mps * 2.23694)} mph
          </div>
        )}
      </div>

      <div className="absolute inset-x-0 top-0 h-12 bg-gradient-to-b from-black/30 to-transparent pointer-events-none" />
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────
export function LoadActivityTimeline({ loadId, load }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFullDetails, setShowFullDetails] = useState(false);

  const { location: liveLocation } = useLiveLocation(loadId, {
    enabled: !!loadId,
    currentStatus: load?.status
  });

  const [pingStats, setPingStats] = useState({ count: 0, latest: null });

  const load_ = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoadEvents(loadId);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => { if (loadId) load_(); }, [loadId, load_]);

  // Each time a fresh live ping comes in, bump our local counter so the
  // "X pings" tile feels alive without an extra API roundtrip.
  useEffect(() => {
    if (liveLocation?.observed_at) {
      setPingStats((p) => ({
        count: p.count + 1,
        latest: liveLocation.observed_at
      }));
    }
  }, [liveLocation?.observed_at]);

  const status = String(load?.status || '').toLowerCase();

  // Figure out which phase is "active". The active phase is the last
  // one that's been reached. Events that don't tie to a status flip
  // (documents, edits, etc.) drift forward to the phase the load was
  // in at the time they happened.
  const grouped = useMemo(() => {
    const byPhase = { created: [], dispatched: [], in_transit: [], delivered: [] };
    const milestones = {}; // phase → first event hitting that phase

    // Sort ascending to walk chronologically.
    const sorted = [...events].sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at)
    );

    let currentPhase = 'created';
    for (const e of sorted) {
      const tagged = phaseForEvent(e);
      if (tagged) currentPhase = tagged;
      if (tagged && !milestones[tagged]) milestones[tagged] = e;
      byPhase[currentPhase].push(e);
    }
    return { byPhase, milestones };
  }, [events]);

  // Determine each phase's display state
  const phaseStates = useMemo(() => {
    const reached = PHASES.filter((p) => p.reachedAt(status)).map((p) => p.key);
    const active = status === 'delivered'
      ? 'delivered'
      : ['in_transit', 'picked_up', 'delayed'].includes(status)
        ? 'in_transit'
        : status === 'dispatched'
          ? 'dispatched'
          : 'created';
    return PHASES.reduce((acc, p) => {
      if (p.key === active) acc[p.key] = 'active';
      else if (reached.includes(p.key)) acc[p.key] = 'past';
      else acc[p.key] = 'future';
      return acc;
    }, {});
  }, [status]);

  const telemetry = useMemo(() => {
    const inTransitMilestone = grouped.milestones.in_transit;
    const startedAt = inTransitMilestone ? new Date(inTransitMilestone.created_at).getTime() : null;
    return {
      lastPing: pingStats.latest || liveLocation?.observed_at || null,
      speedMph: liveLocation?.speed_mps != null
        ? Math.round(liveLocation.speed_mps * 2.23694)
        : null,
      pingCount: pingStats.count || (liveLocation ? 1 : 0),
      elapsedMs: startedAt ? Date.now() - startedAt : null
    };
  }, [grouped.milestones, liveLocation, pingStats]);

  return (
    <div className="space-y-5 py-4">
      {/* trip stats */}
      <TripStatsStrip load={load} telemetry={telemetry} />

      {/* story map */}
      <StoryMap load={load} liveLocation={liveLocation} />

      {/* phases */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-900">Trip story</h3>
          <button
            onClick={load_}
            className="text-xs text-gray-400 hover:text-gray-600 inline-flex items-center gap-1"
            title="Refresh events"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500 px-4 py-3 bg-red-50 rounded-xl border border-red-100">
            {error}
          </div>
        ) : (
          <ul className="relative">
            {PHASES.map((phase, i) => {
              const state = phaseStates[phase.key];
              const milestone = grouped.milestones[phase.key];
              const sub = grouped.byPhase[phase.key].filter((e) => e !== milestone);
              return (
                <PhaseCard
                  key={phase.key}
                  phase={phase}
                  state={state}
                  milestone={milestone}
                  subEvents={sub}
                  telemetry={phase.key === 'in_transit' ? telemetry : null}
                  last={i === PHASES.length - 1}
                />
              );
            })}
          </ul>
        )}
      </section>

      {/* full details */}
      <section>
        <button
          onClick={() => setShowFullDetails((v) => !v)}
          className="flex items-center justify-between w-full text-left px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
        >
          <span className="text-sm font-semibold text-gray-900">
            All load fields
          </span>
          <ChevronDown
            className={`w-4 h-4 text-gray-400 transition-transform ${showFullDetails ? 'rotate-180' : ''}`}
          />
        </button>
        {showFullDetails && (
          <>
            <p className="text-xs text-gray-400 mt-3 mb-1">
              Everything on this load — including fields the edit tabs don't surface.
            </p>
            <DetailGrid load={load} />
          </>
        )}
      </section>
    </div>
  );
}

export default LoadActivityTimeline;
