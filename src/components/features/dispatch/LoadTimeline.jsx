/**
 * LoadTimeline - Shows active/recent loads with dispatch event timelines
 * Supports List view and Calendar view toggle
 */

import { useState, useMemo } from 'react';
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

export function LoadTimeline({ timeline, loading, days, onDaysChange }) {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const [view, setView] = useState('list'); // 'list' | 'calendar'

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
          <CalendarView
            timeline={timeline}
            onLoadClick={handleLoadClick}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default LoadTimeline;
