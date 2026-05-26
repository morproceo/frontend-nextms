/**
 * LoadTimeline - Shows active/recent loads with dispatch event timelines
 * Supports List view and Calendar view toggle
 */

import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { LoadStatusConfig, getStatusConfig } from '../../../config/status';
import { Package, Clock, User, Truck as TruckIcon, List, CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);
};

const formatShortDate = (date) => {
  if (!date) return '';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatRelativeTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

// ELD status config: color-coded badges
const ELD_STATUS_CONFIG = {
  driving:       { dot: 'bg-red-500',    label: 'Driving',  textColor: 'text-red-500' },
  on_duty:       { dot: 'bg-orange-500', label: 'On Duty',  textColor: 'text-orange-500' },
  sleeper_berth: { dot: 'bg-blue-500',   label: 'Sleeper',  textColor: 'text-blue-500' },
  off_duty:      { dot: 'bg-green-500',  label: 'Off Duty', textColor: 'text-green-500' },
};

const getEldConfig = (status) =>
  ELD_STATUS_CONFIG[status] || { dot: 'bg-gray-400', label: 'No ELD', textColor: 'text-text-tertiary' };

const formatHoursRemaining = (hours) => {
  if (hours == null) return null;
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m left`;
};

const isEldStale = (updatedAt) => {
  if (!updatedAt) return false;
  const diffMs = Date.now() - new Date(updatedAt).getTime();
  return diffMs > 30 * 60 * 1000; // 30 minutes
};

// Event type config: color and label
const EVENT_CONFIG = {
  created:    { color: 'bg-gray-400',   ring: 'ring-gray-200',   label: 'Created' },
  dispatched: { color: 'bg-purple-500', ring: 'ring-purple-200', label: 'Dispatched' },
  accepted:   { color: 'bg-blue-500',   ring: 'ring-blue-200',   label: 'Accepted' },
  started:    { color: 'bg-orange-500', ring: 'ring-orange-200', label: 'In Transit' },
  completed:  { color: 'bg-green-500',  ring: 'ring-green-200',  label: 'Delivered' }
};

// All possible event types in order
const EVENT_STEPS = ['created', 'dispatched', 'accepted', 'started', 'completed'];

function MiniTimeline({ events }) {
  // Build a map of completed event types
  const completedTypes = new Set(events.map(e => e.type));
  const lastCompletedIndex = EVENT_STEPS.reduce((max, step, i) =>
    completedTypes.has(step) ? i : max, -1);

  return (
    <div className="flex items-start w-full">
      {EVENT_STEPS.map((step, i) => {
        const config = EVENT_CONFIG[step];
        const isCompleted = completedTypes.has(step);
        const isCurrent = i === lastCompletedIndex;
        const event = events.find(e => e.type === step);

        return (
          <div key={step} className="flex items-start flex-1 last:flex-none">
            {/* Dot + label + date column */}
            <div className="flex flex-col items-center">
              <div className={`
                ${isCurrent ? 'w-4 h-4' : 'w-3 h-3'} rounded-full transition-all shrink-0
                ${isCompleted ? `${config.color} ${isCurrent ? `ring-4 ${config.ring}` : ''}` : 'bg-gray-200 border border-gray-300'}
              `} />
              <span className={`text-[9px] mt-1 whitespace-nowrap leading-none ${
                isCompleted ? 'text-text-secondary font-medium' : 'text-text-tertiary/50'
              }`}>
                {config.label}
              </span>
              {event ? (
                <span className="text-[9px] text-text-tertiary whitespace-nowrap leading-none mt-0.5">
                  {formatShortDate(event.date)}
                </span>
              ) : (
                <span className="text-[9px] text-text-tertiary/30 whitespace-nowrap leading-none mt-0.5">—</span>
              )}
            </div>

            {/* Connector line (after dot, except last) */}
            {i < EVENT_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mt-[7px] mx-1.5 ${
                isCompleted && completedTypes.has(EVENT_STEPS[i + 1])
                  ? 'bg-gray-300'
                  : 'bg-gray-200'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function TimelineRow({ load, onClick }) {
  const statusConfig = getStatusConfig(LoadStatusConfig, load.status);

  return (
    <div
      onClick={onClick}
      className="p-3 sm:p-4 border-b border-surface-tertiary last:border-0 cursor-pointer hover:bg-surface-secondary/50 rounded-lg transition-colors -mx-2 px-2"
    >
      {/* 3-column grid: info | timeline | financials */}
      <div className="grid grid-cols-[1fr_auto_auto] sm:grid-cols-[minmax(200px,1.2fr)_1fr_auto] items-center gap-4">
        {/* Left: load info */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-body font-semibold text-text-primary">
              {load.reference_number}
            </span>
            <Badge variant={statusConfig?.color || 'gray'}>
              {statusConfig?.label || load.status}
            </Badge>
          </div>
          <p className="text-body-sm text-text-tertiary mt-0.5 truncate">
            {load.lane}
          </p>
          <div className="flex items-center gap-3 mt-1">
            {load.driver && (
              <span className="flex items-center gap-1 text-small text-text-secondary">
                <User className="w-3 h-3" />
                {load.driver.name}
              </span>
            )}
            {load.truck && (
              <span className="flex items-center gap-1 text-small text-text-secondary">
                <TruckIcon className="w-3 h-3" />
                {load.truck.unit_number}
              </span>
            )}
          </div>
          {/* ELD Status */}
          {load.driver && (() => {
            const eld = getEldConfig(load.driver.eld_status);
            const stale = isEldStale(load.driver.eld_status_updated_at);
            const hoursLeft = formatHoursRemaining(load.driver.eld_hours_remaining);
            return (
              <div className={`flex items-center gap-2 mt-1 ${stale ? 'opacity-50 italic' : ''}`}>
                <span className="flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${eld.dot}`} />
                  <span className={`text-[11px] font-medium ${eld.textColor}`}>
                    {eld.label}
                  </span>
                </span>
                {hoursLeft && (
                  <span className="text-[11px] text-text-tertiary">
                    {hoursLeft}
                  </span>
                )}
              </div>
            );
          })()}
        </div>

        {/* Center: mini timeline */}
        <div className="hidden sm:block">
          <MiniTimeline events={load.events || []} />
        </div>

        {/* Right: financials + time */}
        <div className="text-right shrink-0">
          {load.revenue > 0 && (
            <p className="text-body font-bold text-text-primary tabular-nums">
              {formatCurrency(load.revenue)}
            </p>
          )}
          {load.rpm > 0 && (
            <p className="text-body-sm text-text-tertiary tabular-nums">
              ${Number(load.rpm).toFixed(2)}/mi
            </p>
          )}
          {load.updated_at && (
            <span className="flex items-center gap-1 text-small text-text-tertiary justify-end mt-0.5">
              <Clock className="w-3 h-3" />
              {formatRelativeTime(load.updated_at)}
            </span>
          )}
        </div>
      </div>

      {/* Mini timeline on mobile (below) */}
      <div className="sm:hidden mt-2">
        <MiniTimeline events={load.events || []} />
      </div>
    </div>
  );
}

// ─── Status colors for calendar pills ─────────────────────
const STATUS_PILL = {
  in_transit:  'bg-orange-500/15 text-orange-500 border-orange-500/20',
  dispatched:  'bg-purple-500/15 text-purple-500 border-purple-500/20',
  booked:      'bg-blue-500/15 text-blue-500 border-blue-500/20',
  delivered:   'bg-green-500/15 text-green-500 border-green-500/20',
  new:         'bg-gray-500/15 text-gray-500 border-gray-500/20',
  draft:       'bg-gray-500/15 text-gray-400 border-gray-500/20',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// ───────────────────────────────────────────────────────────────
// Gantt-style schedule: driver rows × time columns. Each load is
// a horizontal bar spanning from pickup_date → delivery_date in
// the assigned driver's row. Bars are color-coded by status and
// clickable. Loads without a driver land in an "Unassigned" row
// at the top so dispatchers can see at a glance what needs cover.
// ───────────────────────────────────────────────────────────────

const STATUS_BAR = {
  booked:     { bg: 'bg-purple-100',  border: 'border-purple-300',  label: 'text-purple-800',  pill: 'bg-purple-200/70 text-purple-900' },
  dispatched: { bg: 'bg-violet-100',  border: 'border-violet-300',  label: 'text-violet-800',  pill: 'bg-violet-200/70 text-violet-900' },
  in_transit: { bg: 'bg-sky-100',     border: 'border-sky-300',     label: 'text-sky-800',     pill: 'bg-sky-200/70 text-sky-900' },
  picked_up:  { bg: 'bg-sky-100',     border: 'border-sky-300',     label: 'text-sky-800',     pill: 'bg-sky-200/70 text-sky-900' },
  delayed:    { bg: 'bg-amber-100',   border: 'border-amber-300',   label: 'text-amber-800',   pill: 'bg-amber-200/70 text-amber-900' },
  delivered:  { bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'text-emerald-800', pill: 'bg-emerald-200/70 text-emerald-900' },
  completed:  { bg: 'bg-emerald-100', border: 'border-emerald-300', label: 'text-emerald-800', pill: 'bg-emerald-200/70 text-emerald-900' }
};
const DEFAULT_BAR = { bg: 'bg-slate-100', border: 'border-slate-300', label: 'text-slate-700', pill: 'bg-slate-200/70 text-slate-800' };

const dayKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const startOfDay = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86400000);
const parseLoadDate = (s) => {
  if (!s) return null;
  // DATEONLY columns come back as 'YYYY-MM-DD'. Pin noon to dodge TZ drift.
  return new Date(typeof s === 'string' && s.length === 10 ? s + 'T12:00:00' : s);
};
const initials = (name) => (name || '').split(/\s+/).map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';

function GanttView({ timeline, drivers = [], onLoadClick }) {
  // Visible window — 14 days by default. Dispatchers can flip span
  // (7/14/28) + page forward/back week-by-week. `rangeStart` re-anchors
  // when the timeline first arrives (see effect below) so the user
  // doesn't open the page to an empty grid when all loads are in the past.
  const [rangeStart, setRangeStart] = useState(() => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - d.getDay()); // back to Sunday
    return d;
  });
  const [span, setSpan] = useState(14);
  // User-driven nav (←/→ /This week) should NOT be overridden by the
  // auto-anchor effect below — flip this once the user touches the toolbar.
  const [userPositioned, setUserPositioned] = useState(false);

  // Auto-anchor: if the data has no loads in the default "this week"
  // window but DOES have loads elsewhere, jump to the week of the
  // earliest pickup_date so we paint something. Only fires once per
  // timeline arrival, before the user navigates manually.
  useEffect(() => {
    if (userPositioned || !timeline || timeline.length === 0) return;
    const today = startOfDay(new Date());
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 13); // 2-week default span
    const dates = timeline
      .flatMap((l) => [parseLoadDate(l.pickup_date), parseLoadDate(l.delivery_date)])
      .filter(Boolean);
    if (dates.length === 0) return;
    const anyInWindow = dates.some((d) => d >= thisWeekStart && d <= thisWeekEnd);
    if (anyInWindow) return; // current window has data; leave it
    // Pivot to the week of the earliest visible date
    const earliest = dates.reduce((a, b) => (a < b ? a : b));
    const anchor = new Date(earliest);
    anchor.setDate(earliest.getDate() - earliest.getDay()); // back to Sunday
    setRangeStart(startOfDay(anchor));
  }, [timeline, userPositioned]);

  const days = useMemo(() => {
    const out = [];
    for (let i = 0; i < span; i++) {
      const d = new Date(rangeStart);
      d.setDate(d.getDate() + i);
      out.push(d);
    }
    return out;
  }, [rangeStart, span]);

  const rangeEnd = days[days.length - 1];

  // Build driver rows from BOTH the driver roster AND the loads timeline:
  // every active driver gets a row (even with zero loads — dispatchers
  // want to see availability), and unassigned loads bubble to a row at
  // the top. Loads outside the visible window are still filtered.
  const driverRows = useMemo(() => {
    const byDriver = new Map();
    // Seed with every active driver so empty rows show
    (drivers || []).forEach((d) => {
      const id = d.id;
      const name = [d.first_name, d.last_name].filter(Boolean).join(' ') || d.name || d.email || 'Driver';
      if (id && !byDriver.has(id)) byDriver.set(id, { id, name, loads: [] });
    });
    // Add unassigned bucket as a candidate (only kept if it actually gets loads)
    const unassignedSeed = { id: '__unassigned', name: 'Unassigned', loads: [] };
    let sawUnassigned = false;

    (timeline || []).forEach((load) => {
      const start = parseLoadDate(load.pickup_date);
      const end = parseLoadDate(load.delivery_date) || start;
      if (!start && !end) return;
      // Honest rendering for dirty data: if delivery is BEFORE pickup,
      // collapse the bar to a single-day stub at pickup_date and flag it
      // — silent-swap would draw a bar going backwards in time and lie.
      let barStart = start || end;
      let barEnd = end || start;
      let datesInvalid = false;
      if (barEnd < barStart) {
        datesInvalid = true;
        barEnd = barStart;
      }
      if (barStart > rangeEnd) return;
      if (barEnd < rangeStart) return;
      const drvId = load.driver?.id || '__unassigned';
      if (drvId === '__unassigned') {
        sawUnassigned = true;
        unassignedSeed.loads.push({ load, start: barStart, end: barEnd, datesInvalid });
        return;
      }
      // If a load arrives for a driver not in the active roster (e.g. inactive
      // or just missing from the cache), still create a row for them.
      if (!byDriver.has(drvId)) {
        byDriver.set(drvId, { id: drvId, name: load.driver?.name || 'Driver', loads: [] });
      }
      byDriver.get(drvId).loads.push({ load, start: barStart, end: barEnd, datesInvalid });
    });

    const rows = Array.from(byDriver.values()).sort((a, b) => a.name.localeCompare(b.name));
    const allRows = sawUnassigned ? [unassignedSeed, ...rows] : rows;

    // Lane allocation per driver: greedy first-fit. Sort each driver's
    // loads by start, then drop each load into the first lane whose last
    // bar ends before this one begins (otherwise open a new lane). This
    // mirrors how schedulers stack overlapping intervals (e.g. trailer
    // drop vs. freight load running concurrently for the same driver).
    return allRows.map((row) => {
      const sorted = [...row.loads].sort((a, b) => a.start - b.start);
      const lanes = []; // lanes[i] = end-of-last-bar in that lane
      const placed = sorted.map((item) => {
        let laneIdx = lanes.findIndex((endOfLane) => endOfLane < item.start);
        if (laneIdx === -1) {
          laneIdx = lanes.length;
          lanes.push(item.end);
        } else {
          lanes[laneIdx] = item.end;
        }
        return { ...item, laneIdx };
      });
      return { ...row, loads: placed, laneCount: Math.max(1, lanes.length) };
    });
  }, [timeline, drivers, rangeStart, rangeEnd]);

  // Layout: driver column is a fixed px width on the left; the rest of the
  // grid sizes by percent so day cells always FILL the available width.
  // `cellPct` is how much of the right-side container each day takes.
  // `minCellPx` keeps long ranges (28 days) from crushing cells to nothing
  // — when the panel is narrower than that, the grid scrolls horizontally.
  // Multi-lane stacking: when a driver has overlapping loads (e.g. trailer
  // drop + freight on the same day), each load gets its own lane within
  // the driver's row so bars never overlap visually.
  const laneH = 36;
  const laneGap = 4;
  const rowPad = 8;
  const rowHeightFor = (lanes) => rowPad * 2 + lanes * laneH + (lanes - 1) * laneGap;
  const driverColW = 200;
  const cellPct = 100 / span;
  const minCellPx = 40;
  const minGridPx = span * minCellPx;

  const today = startOfDay(new Date());

  const shiftDays = (delta) => {
    const d = new Date(rangeStart);
    d.setDate(d.getDate() + delta);
    setRangeStart(d);
    setUserPositioned(true);
  };
  const goThisWeek = () => {
    const d = startOfDay(new Date());
    d.setDate(d.getDate() - d.getDay());
    setRangeStart(d);
    setUserPositioned(true);
  };

  // Week-header grouping: span the day cells under each week label.
  const weekGroups = useMemo(() => {
    const groups = [];
    let curStart = days[0];
    let curCount = 0;
    days.forEach((d) => {
      if (curStart && d.getDay() === 0 && curCount > 0) {
        groups.push({ start: curStart, count: curCount });
        curStart = d;
        curCount = 1;
      } else {
        curCount++;
      }
    });
    if (curCount > 0) groups.push({ start: curStart, count: curCount });
    return groups;
  }, [days]);

  const formatWeekLabel = (start, count) => {
    const end = new Date(start);
    end.setDate(end.getDate() + count - 1);
    const sameMonth = start.getMonth() === end.getMonth();
    const m = (d) => d.toLocaleDateString('en-US', { month: 'short' });
    return sameMonth
      ? `${m(start)} ${start.getDate()}–${end.getDate()}`
      : `${m(start)} ${start.getDate()} – ${m(end)} ${end.getDate()}`;
  };

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftDays(-7)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Previous week"
          >
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <button
            onClick={goThisWeek}
            className="text-[11px] font-medium text-accent hover:text-accent/80 px-2.5 py-1 rounded-md bg-accent/5 hover:bg-accent/10 transition-colors"
          >
            This week
          </button>
          <button
            onClick={() => shiftDays(7)}
            className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors"
            aria-label="Next week"
          >
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
          <span className="text-body-sm font-semibold text-text-primary ml-2">
            {rangeStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
        </div>
        <div className="flex items-center gap-1 bg-surface-secondary p-1 rounded-lg">
          {[
            { v: 7, l: '1w' },
            { v: 14, l: '2w' },
            { v: 28, l: '4w' }
          ].map((opt) => (
            <button
              key={opt.v}
              onClick={() => setSpan(opt.v)}
              className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                span === opt.v ? 'bg-white text-text-primary shadow-sm' : 'text-text-tertiary hover:text-text-secondary'
              }`}
            >
              {opt.l}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="border border-surface-tertiary/70 rounded-xl overflow-hidden bg-white">
        <div className="flex">
          {/* Left rail: driver names (sticky) */}
          <div className="shrink-0 border-r border-surface-tertiary/70" style={{ width: driverColW }}>
            {/* Header spacer — must match the two right-side header rows
                (week label + day numbers) so the driver rows below align
                pixel-perfect with the timeline bars. */}
            <div className="h-[72px] border-b border-surface-tertiary/70 bg-surface-secondary/30 flex items-end px-4 pb-2">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary">
                Driver
              </span>
            </div>
            {driverRows.length === 0 ? (
              <div className="px-4 py-6 text-body-sm text-text-tertiary">No loads in range</div>
            ) : (
              driverRows.map((row) => (
                <div
                  key={row.id}
                  className="border-b border-surface-tertiary/70 px-3 flex items-center gap-2.5"
                  style={{ height: rowHeightFor(row.laneCount) }}
                >
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 ${
                      row.id === '__unassigned'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-accent/10 text-accent'
                    }`}
                  >
                    {row.id === '__unassigned' ? '?' : initials(row.name)}
                  </span>
                  <div className="min-w-0">
                    <div className="text-body-sm font-medium text-text-primary truncate">{row.name}</div>
                    <div className="text-[10px] text-text-tertiary">
                      {row.loads.length} {row.loads.length === 1 ? 'load' : 'loads'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right side: grid fills the available width; scrolls horizontally
              only when the span × min-cell would overflow the container. */}
          <div className="overflow-x-auto flex-1">
            <div style={{ minWidth: `${minGridPx}px` }}>
              {/* Week label row — fixed h-9 (36px) so left-rail header
                  alignment (h-[72px] = 2× this) stays exact. */}
              <div className="flex h-9 border-b border-surface-tertiary/70 bg-surface-secondary/30">
                {weekGroups.map((g, i) => (
                  <div
                    key={i}
                    className="text-[11px] font-medium text-text-tertiary uppercase tracking-wider px-2 border-r border-surface-tertiary/70 last:border-r-0 truncate flex items-center"
                    style={{ width: `${(g.count / span) * 100}%` }}
                  >
                    {formatWeekLabel(g.start, g.count)}
                  </div>
                ))}
              </div>
              {/* Day-number row — same h-9. */}
              <div className="flex h-9 border-b border-surface-tertiary/70 bg-surface-secondary/10">
                {days.map((d) => {
                  const isToday = dayKey(d) === dayKey(today);
                  const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                  return (
                    <div
                      key={dayKey(d)}
                      className={`text-center text-[11px] font-medium border-r border-surface-tertiary/70 flex items-center justify-center ${
                        isWeekend ? 'bg-surface-secondary/30' : ''
                      } ${isToday ? 'text-accent' : 'text-text-tertiary'}`}
                      style={{ width: `${cellPct}%` }}
                    >
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full ${
                        isToday ? 'bg-accent text-white' : ''
                      }`}>
                        {d.getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Driver rows — height grows with lane count so stacked
                  overlapping loads each get their own track. */}
              {driverRows.map((row) => (
                <div
                  key={row.id}
                  className="relative border-b border-surface-tertiary/70"
                  style={{ height: rowHeightFor(row.laneCount) }}
                >
                  {/* Day grid lines + weekend tint + today highlight */}
                  <div className="absolute inset-0 flex">
                    {days.map((d) => {
                      const isToday = dayKey(d) === dayKey(today);
                      const isWeekend = d.getDay() === 0 || d.getDay() === 6;
                      return (
                        <div
                          key={dayKey(d)}
                          className={`border-r border-surface-tertiary/40 ${
                            isWeekend ? 'bg-surface-secondary/20' : ''
                          } ${isToday ? 'bg-accent/[0.04]' : ''}`}
                          style={{ width: `${cellPct}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Load bars positioned absolutely over the grid — percent
                      anchors so they always line up with the day cells no
                      matter the container width. `laneIdx` stacks
                      overlapping loads vertically within the same row. */}
                  {row.loads.map(({ load, start, end, datesInvalid, laneIdx }) => {
                    const startIdx = Math.max(0, daysBetween(rangeStart, start));
                    // +1 so a same-day load occupies its single cell
                    const endIdx = Math.min(span, daysBetween(rangeStart, end) + 1);
                    const spanCells = endIdx - startIdx;
                    if (spanCells <= 0) return null;
                    const leftPct = (startIdx / span) * 100;
                    const widthPct = (spanCells / span) * 100;
                    const config = STATUS_BAR[load.status?.toLowerCase()] || DEFAULT_BAR;
                    const statusLabel = LoadStatusConfig[load.status]?.label || load.status;
                    return (
                      <button
                        key={load.id}
                        type="button"
                        onClick={() => onLoadClick(load)}
                        title={`${load.reference_number} · ${load.lane || ''} · ${statusLabel}${datesInvalid ? '\n⚠ delivery_date is before pickup_date — fix the load to render the full span' : ''}`}
                        className={`absolute group rounded-lg border ${config.bg} ${config.border} hover:shadow-md hover:scale-[1.01] transition-all overflow-hidden text-left`}
                        style={{
                          left: `calc(${leftPct}% + 4px)`,
                          width: `calc(${widthPct}% - 8px)`,
                          top: rowPad + laneIdx * (laneH + laneGap),
                          height: laneH
                        }}
                      >
                        <div className="flex items-center justify-between gap-1.5 px-2 h-full">
                          <div className="min-w-0 flex-1">
                            <div className={`text-[11px] font-semibold ${config.label} truncate`}>
                              {load.reference_number}
                            </div>
                            <div className="text-[10px] text-text-tertiary truncate">
                              {load.lane || '—'}
                            </div>
                          </div>
                          {/* "TR" badge for trailer-rental moves (broker-
                              owned trailer drop/pickup at a flat fee, not
                              a per-mile freight load). Distinguishes the
                              trailer leg from the freight leg when both
                              land in the same row. */}
                          {load.load_type === 'trailer_rental' && (
                            <span
                              className="shrink-0 text-[9px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-800 border border-amber-500/30"
                              title="Trailer rental move"
                            >
                              TR
                            </span>
                          )}
                          {/* Show the status pill when the bar is long enough
                              to host it comfortably (≥ 2 days OR ≥ 12% of
                              the grid). Avoids overflow on stub bars. */}
                          {(spanCells >= 2 && widthPct >= 12) && (
                            <span className={`shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${config.pill}`}>
                              {statusLabel}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 mt-3 px-1 flex-wrap">
        {[
          { k: 'booked', l: 'Booked' },
          { k: 'dispatched', l: 'Dispatched' },
          { k: 'in_transit', l: 'In Transit' },
          { k: 'delivered', l: 'Delivered' }
        ].map(({ k, l }) => {
          const c = STATUS_BAR[k];
          return (
            <div key={k} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${c.bg} ${c.border} border`} />
              <span className="text-[11px] text-text-tertiary">{l}</span>
            </div>
          );
        })}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-3 h-3 rounded bg-accent/[0.08] border border-accent/30" />
          <span className="text-[11px] text-text-tertiary">Today</span>
        </div>
      </div>
    </div>
  );
}

function CalendarView({ timeline, onLoadClick }) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));
  const goToday = () => setViewDate(new Date());

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];

    // Leading empty cells
    for (let i = 0; i < firstDay; i++) days.push(null);
    // Day cells
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [year, month]);

  // Map loads to dates (by pickup_date and delivery_date)
  const loadsByDate = useMemo(() => {
    const map = {};
    (timeline || []).forEach(load => {
      const addToDate = (dateStr, type) => {
        if (!dateStr) return;
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const day = d.getDate();
          if (!map[day]) map[day] = [];
          // Avoid duplicate load on same day
          if (!map[day].find(e => e.load.id === load.id && e.type === type)) {
            map[day].push({ load, type });
          }
        }
      };
      addToDate(load.pickup_date, 'pickup');
      addToDate(load.delivery_date, 'delivery');
    });
    return map;
  }, [timeline, year, month]);

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;
  const todayDate = today.getDate();

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  return (
    <div>
      {/* Calendar header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-body font-semibold text-text-primary">{monthLabel}</h3>
          {!isCurrentMonth && (
            <button
              onClick={goToday}
              className="text-[11px] text-accent font-medium hover:text-accent/80 transition-colors px-2 py-0.5 rounded-md bg-accent/5"
            >
              Today
            </button>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
            <ChevronLeft className="w-4 h-4 text-text-secondary" />
          </button>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-surface-secondary transition-colors">
            <ChevronRight className="w-4 h-4 text-text-secondary" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAYS_OF_WEEK.map(d => (
          <div key={d} className="text-center text-[11px] font-semibold text-text-tertiary uppercase tracking-wider py-2">
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 border-t border-l border-surface-tertiary/60">
        {calendarDays.map((day, i) => {
          const isToday = isCurrentMonth && day === todayDate;
          const entries = day ? (loadsByDate[day] || []) : [];

          return (
            <div
              key={i}
              className={`min-h-[90px] border-r border-b border-surface-tertiary/60 p-1.5 ${
                day ? 'bg-surface' : 'bg-surface-secondary/30'
              }`}
            >
              {day && (
                <>
                  <span className={`text-[12px] font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${
                    isToday
                      ? 'bg-accent text-white'
                      : 'text-text-secondary'
                  }`}>
                    {day}
                  </span>

                  <div className="mt-0.5 space-y-0.5">
                    {entries.slice(0, 3).map(({ load, type }, j) => {
                      const pillColor = STATUS_PILL[load.status?.toLowerCase()] || STATUS_PILL.new;
                      return (
                        <div
                          key={`${load.id}-${type}-${j}`}
                          onClick={() => onLoadClick(load)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-[10px] font-medium cursor-pointer hover:opacity-80 transition-opacity truncate ${pillColor}`}
                        >
                          <span className={`w-1 h-1 rounded-full shrink-0 ${type === 'pickup' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                          <span className="truncate">{load.reference_number}</span>
                        </div>
                      );
                    })}
                    {entries.length > 3 && (
                      <p className="text-[9px] text-text-tertiary font-medium pl-1">+{entries.length - 3} more</p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] text-text-tertiary">Pickup</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500" />
          <span className="text-[11px] text-text-tertiary">Delivery</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="w-3 h-2 rounded bg-orange-500/15 border border-orange-500/20" />
          <span className="text-[11px] text-text-tertiary">In Transit</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-purple-500/15 border border-purple-500/20" />
          <span className="text-[11px] text-text-tertiary">Dispatched</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-2 rounded bg-green-500/15 border border-green-500/20" />
          <span className="text-[11px] text-text-tertiary">Delivered</span>
        </div>
      </div>
    </div>
  );
}

export function LoadTimeline({ timeline, loading, days, onDaysChange, drivers = [] }) {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const [view, setView] = useState('calendar'); // 'list' | 'calendar'

  const handleLoadClick = (load) => navigate(orgUrl(`/loads/${load.id}`));

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Load Timeline</CardTitle>
            {!loading && (
              <span className="text-small bg-surface-secondary text-text-secondary px-2 py-0.5 rounded-full">
                {timeline.length}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex items-center bg-surface-secondary rounded-lg p-0.5">
              <button
                onClick={() => setView('list')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  view === 'list'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                List
              </button>
              <button
                onClick={() => setView('calendar')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                  view === 'calendar'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-tertiary hover:text-text-secondary'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Calendar
              </button>
            </div>

            {/* Days filter (list view only) */}
            {view === 'list' && (
              <select
                value={days}
                onChange={(e) => onDaysChange(Number(e.target.value))}
                className="text-small bg-surface-secondary border-0 rounded-lg px-2 py-1.5 text-text-secondary focus:outline-none focus:ring-2 focus:ring-accent/20"
              >
                <option value={7}>Last 7 days</option>
                <option value={14}>Last 14 days</option>
                <option value={30}>Last 30 days</option>
              </select>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading && timeline.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <Spinner size="md" />
          </div>
        ) : timeline.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
            <p className="text-body-sm text-text-secondary">No active loads</p>
            <p className="text-small text-text-tertiary mt-1">
              Loads that are booked, dispatched, in transit, or recently delivered will appear here.
            </p>
          </div>
        ) : view === 'list' ? (
          <div className="space-y-0">
            {timeline.map((load) => (
              <TimelineRow
                key={load.id}
                load={load}
                onClick={() => handleLoadClick(load)}
              />
            ))}
          </div>
        ) : (
          <GanttView
            timeline={timeline}
            drivers={drivers}
            onLoadClick={handleLoadClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default LoadTimeline;
