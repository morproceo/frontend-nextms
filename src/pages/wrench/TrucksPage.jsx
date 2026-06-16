/**
 * Wrench Trucks — the fleet roster.
 *
 * Dark gradient hero up top with the fleet pulse (health distribution +
 * search + severity filter chips), then a rich card grid below. Mirrors
 * the design language of CommandCenterPage / TruckDetailPage: dark
 * glass + amber ambient glow + severity-coded accents.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Truck, Loader2, ChevronRight, Search, User, Activity, Calendar,
  AlertCircle, CheckCircle2, ShieldAlert, Sparkles
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

const SEVERITY = {
  critical: { label: 'Critical', dot: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-400',  chip: 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30',     bar: '#f43f5e' },
  warning:  { label: 'Warning',  dot: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-400', chip: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30', bar: '#f59e0b' },
  info:     { label: 'Info',     dot: 'bg-cyan-500',    text: 'text-cyan-700 dark:text-cyan-400',  chip: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/30',     bar: '#06b6d4' },
  healthy:  { label: 'Healthy',  dot: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-400', chip: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30', bar: '#10b981' },
  unknown:  { label: 'Unknown',  dot: 'bg-gray-400',    text: 'text-gray-600',                     chip: 'bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/30',    bar: '#9ca3af' }
};

const FILTERS = ['all', 'critical', 'warning', 'healthy'];

export default function TrucksPage() {
  const { orgSlug } = useParams();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    wrenchApi.listTrucks()
      .then((t) => setTrucks(t || []))
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const counts = useMemo(() => {
    const out = { all: trucks.length, critical: 0, warning: 0, info: 0, healthy: 0, unknown: 0 };
    for (const t of trucks) out[t.health || 'unknown'] = (out[t.health || 'unknown'] || 0) + 1;
    return out;
  }, [trucks]);

  const needsAttention = counts.critical + counts.warning;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = trucks
      .filter((t) => filter === 'all' ? true : t.health === filter)
      .filter((t) => {
        if (!q) return true;
        const driver = t.currentDriver ? `${t.currentDriver.first_name || ''} ${t.currentDriver.last_name || ''}` : '';
        return (
          (t.unit_number || '').toLowerCase().includes(q) ||
          (t.vin || '').toLowerCase().includes(q) ||
          (t.make || '').toLowerCase().includes(q) ||
          (t.model || '').toLowerCase().includes(q) ||
          driver.toLowerCase().includes(q)
        );
      });
    return list.sort((a, b) => severityRank(b.health) - severityRank(a.health));
  }, [trucks, query, filter]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 p-4">
          <p className="text-body-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-5">
      <Hero
        total={trucks.length}
        needsAttention={needsAttention}
        counts={counts}
        query={query}
        onQuery={setQuery}
        filter={filter}
        onFilter={setFilter}
      />

      {trucks.length === 0 ? (
        <EmptyFleet />
      ) : filtered.length === 0 ? (
        <NoResults onReset={() => { setQuery(''); setFilter('all'); }} />
      ) : (
        <>
          <div className="text-small text-text-tertiary">
            Showing {filtered.length} of {trucks.length} truck{trucks.length === 1 ? '' : 's'}
            {filter !== 'all' && <span> · {filter}</span>}
            {query && <span> · matching "{query}"</span>}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((t) => (
              <TruckCard key={t.id} truck={t} orgSlug={orgSlug} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Hero — dark gradient with title, fleet pulse, search, filter chips
// ───────────────────────────────────────────────────────────────────

function Hero({ total, needsAttention, counts, query, onQuery, filter, onFilter }) {
  const glow = needsAttention > 0
    ? (counts.critical > 0 ? 'rgba(244,63,94,0.20)' : 'rgba(251,191,36,0.20)')
    : 'rgba(16,185,129,0.18)';

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] p-5 sm:p-6 shadow-xl">
      <div aria-hidden className="absolute -top-24 -right-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${glow} 0%, transparent 70%)` }} />
      <div aria-hidden className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.08) 0%, transparent 70%)' }} />

      <div className="relative">
        <div className="flex items-start gap-3 flex-wrap">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
            <Truck className="w-6 h-6 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-white/55">
              <ShieldAlert className="w-3 h-3" />
              Fleet roster
            </div>
            <h1 className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
              {total === 0 ? 'No trucks yet'
                : total === 1 ? '1 truck in your fleet'
                : `${total} trucks in your fleet`}
            </h1>
            <p className="mt-1 text-body-sm text-white/65">
              {needsAttention === 0 && total > 0 && (
                <>
                  <span className="inline-flex items-center gap-1 mr-2 text-emerald-300 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    All systems nominal
                  </span>
                  — AVA's watching for changes in real time.
                </>
              )}
              {needsAttention > 0 && (
                <>
                  <span className="text-amber-300 font-semibold">{needsAttention}</span>
                  {' '}truck{needsAttention === 1 ? '' : 's'} need{needsAttention === 1 ? 's' : ''} your attention.
                  {counts.critical > 0 && (
                    <span className="ml-2 inline-flex items-center gap-1 text-rose-300">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                      {counts.critical} critical
                    </span>
                  )}
                </>
              )}
            </p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-72 lg:w-80 lg:ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => onQuery(e.target.value)}
              placeholder="Search unit, driver, VIN…"
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-body-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
            />
          </div>
        </div>

        {/* Filter chips */}
        {total > 0 && (
          <div className="mt-4 flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((key) => {
              const active = filter === key;
              const n = counts[key] ?? 0;
              const tone = SEVERITY[key] || null;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => onFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-small font-semibold transition-colors border ${
                    active
                      ? 'bg-white text-slate-900 border-white shadow-lg'
                      : 'bg-white/[0.04] text-white/75 border-white/[0.08] hover:bg-white/[0.08]'
                  }`}
                >
                  {tone && <span className={`w-1.5 h-1.5 rounded-full ${tone.dot}`} />}
                  <span className="capitalize">{key}</span>
                  <span className={`tabular-nums text-[11px] ${active ? 'text-slate-500' : 'text-white/45'}`}>
                    {n}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ───────────────────────────────────────────────────────────────────
// Truck card — light surface, severity-colored left strip, rich data
// ───────────────────────────────────────────────────────────────────

function TruckCard({ truck: t, orgSlug }) {
  const sev = SEVERITY[t.health] || SEVERITY.unknown;
  const driver = t.currentDriver
    ? `${t.currentDriver.first_name || ''} ${t.currentDriver.last_name || ''}`.trim()
    : null;
  const odo = t.current_odometer ? Number(t.current_odometer).toLocaleString() + ' mi' : null;
  const nextSvc = formatNextService(t);
  const codes = t.active_fault_count || 0;

  return (
    <Link
      to={`/o/${orgSlug}/wrench/trucks/${t.id}`}
      className="group relative overflow-hidden rounded-2xl bg-surface-primary border border-surface-tertiary hover:border-text-tertiary/40 hover:shadow-md transition-all flex"
    >
      {/* Severity strip */}
      <span className="w-1 shrink-0" style={{ background: sev.bar }} />

      <div className="flex-1 p-4 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2 flex-wrap">
              <h3 className="text-lg font-semibold text-text-primary tabular-nums">
                {t.unit_number || t.id.slice(0, 8)}
              </h3>
              <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${sev.chip}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${sev.dot}`} />
                {sev.label}
              </span>
            </div>
            <p className="text-small text-text-secondary mt-0.5 truncate">
              {[t.year, t.make, t.model].filter(Boolean).join(' ') || '—'}
              {t.vin && <span className="text-text-tertiary"> · ····{t.vin.slice(-6)}</span>}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-text-primary transition-colors shrink-0 mt-1" />
        </div>

        {codes > 0 && (
          <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-[11px] font-semibold">
            <AlertCircle className="w-3 h-3" />
            {codes} active code{codes === 1 ? '' : 's'}
            {t.latest_diagnostic && (
              <span className="font-normal text-amber-700/70 dark:text-amber-300/70">
                · {formatRelative(t.latest_diagnostic)}
              </span>
            )}
          </div>
        )}

        <dl className="mt-3 grid grid-cols-3 gap-3 pt-3 border-t border-surface-tertiary">
          <Mini Icon={User}     label="Driver"   value={driver}        empty="Unassigned" />
          <Mini Icon={Activity} label="Odometer" value={odo}           empty="—" />
          <Mini Icon={Calendar} label="Next svc" value={nextSvc.label} tone={nextSvc.accent} />
        </dl>
      </div>
    </Link>
  );
}

function Mini({ Icon, label, value, empty, tone }) {
  const accentText = tone === 'rose'  ? 'text-rose-600 dark:text-rose-400'
                  : tone === 'amber' ? 'text-amber-700 dark:text-amber-400'
                  : 'text-text-primary';
  return (
    <div className="min-w-0">
      <div className="flex items-center gap-1 text-[9px] uppercase tracking-wider font-semibold text-text-tertiary">
        <Icon className="w-2.5 h-2.5" />
        {label}
      </div>
      <div className={`mt-0.5 text-small font-semibold tabular-nums truncate ${value ? accentText : 'text-text-tertiary italic'}`}>
        {value || empty || '—'}
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Empty / no-results states
// ───────────────────────────────────────────────────────────────────

function EmptyFleet() {
  return (
    <div className="rounded-2xl border border-dashed border-surface-tertiary bg-surface-secondary/30 p-10 text-center">
      <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-orange-500/20 to-amber-600/20 border border-amber-500/30 flex items-center justify-center mb-3">
        <Truck className="w-7 h-7 text-amber-600" />
      </div>
      <p className="text-body font-semibold text-text-primary">No trucks yet.</p>
      <p className="text-body-sm text-text-secondary mt-1 max-w-sm mx-auto">
        Add your first truck in Assets to start tracking its health here.
      </p>
    </div>
  );
}

function NoResults({ onReset }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-tertiary bg-surface-secondary/30 p-10 text-center">
      <Search className="w-7 h-7 text-text-tertiary mx-auto mb-3" />
      <p className="text-body font-semibold text-text-primary">No trucks match your filters.</p>
      <button
        type="button"
        onClick={onReset}
        className="mt-3 inline-flex items-center gap-1 text-small font-semibold text-accent hover:underline"
      >
        Clear filters
      </button>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

function severityRank(s) {
  return s === 'critical' ? 4 : s === 'warning' ? 3 : s === 'info' ? 2 : s === 'healthy' ? 1 : 0;
}

function formatRelative(ts) {
  if (!ts) return '—';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  const d = Math.floor(ms / 86_400_000);
  if (d < 7) return `${d}d ago`;
  return new Date(ts).toLocaleDateString();
}

function formatNextService(truck) {
  const odo = Number(truck.current_odometer);
  const nextMiles = Number(truck.next_service_miles);
  if (Number.isFinite(odo) && Number.isFinite(nextMiles)) {
    const remaining = nextMiles - odo;
    if (remaining <= 0) return { label: 'Overdue', accent: 'rose' };
    if (remaining < 2500) return { label: `${remaining.toLocaleString()} mi`, accent: 'amber' };
    return { label: `${remaining.toLocaleString()} mi`, accent: null };
  }
  if (truck.next_service_date) {
    const d = new Date(truck.next_service_date);
    const days = Math.ceil((d.getTime() - Date.now()) / 86400000);
    if (days <= 0) return { label: 'Overdue', accent: 'rose' };
    if (days < 14) return { label: `in ${days}d`, accent: 'amber' };
    return { label: d.toLocaleDateString(), accent: null };
  }
  return { label: '—', accent: null };
}
