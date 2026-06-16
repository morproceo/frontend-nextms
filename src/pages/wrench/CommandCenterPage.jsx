/**
 * Wrench Command Center — Fleet Health control surface.
 *
 * Mirrors the design language of the main dashboard (BriefingCard +
 * embedded glass tiles + accent glows + activity stream) so an owner-op
 * opening Wrench feels like the same product, not a Phase-B prototype.
 *
 * Three sections, top → bottom:
 *   1. AVA briefing — dark gradient card with amber ambient glow. AVA
 *      narrates the fleet's health in plain English + 4 embedded metric
 *      tiles + critical/warning chips that deep-link to the offending
 *      truck.
 *   2. The Fleet — grid of TruckHealthCards (one per truck) with health
 *      pill, fault count, odometer, and a service-progress bar. Hover
 *      glows in the truck's severity color.
 *   3. Recent activity — diagnostic + maintenance timeline.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Wrench, Truck, AlertTriangle, Activity, CheckCircle2, Clock,
  Plug, ChevronRight, Loader2, Sparkles, Gauge, ShieldAlert,
  Search, MessageSquare
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

const HEALTH_TONE = {
  healthy:  { border: 'border-emerald-500/30', text: 'text-emerald-300', dot: 'bg-emerald-400', label: 'Healthy', glow: 'rgba(16,185,129,0.18)' },
  warning:  { border: 'border-amber-500/40',   text: 'text-amber-300',   dot: 'bg-amber-400',   label: 'Warning', glow: 'rgba(251,191,36,0.22)' },
  info:     { border: 'border-blue-500/30',    text: 'text-blue-300',    dot: 'bg-blue-400',    label: 'Info',    glow: 'rgba(59,130,246,0.18)' },
  critical: { border: 'border-rose-500/50',    text: 'text-rose-300',    dot: 'bg-rose-400',    label: 'Critical',glow: 'rgba(244,63,94,0.28)' },
  unknown:  { border: 'border-white/[0.08]',   text: 'text-white/55',    dot: 'bg-white/40',    label: 'Unknown', glow: 'rgba(255,255,255,0.08)' }
};

export default function CommandCenterPage() {
  const { orgSlug } = useParams();
  const [dash, setDash] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([wrenchApi.getDashboard(), wrenchApi.listTrucks()])
      .then(([d, t]) => { setDash(d); setTrucks(t || []); })
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  // Top-2 most urgent fault chips, surfaced inside the briefing card.
  const criticalChips = useMemo(() => {
    const list = (trucks || [])
      .filter((t) => (t.active_fault_count || 0) > 0)
      .sort((a, b) => severityRank(b.worst_severity) - severityRank(a.worst_severity))
      .slice(0, 2);
    return list;
  }, [trucks]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return trucks;
    return trucks.filter((t) =>
      (t.unit_number || '').toLowerCase().includes(q) ||
      (t.vin || '').toLowerCase().includes(q) ||
      (t.currentDriver ? `${t.currentDriver.first_name} ${t.currentDriver.last_name}` : '').toLowerCase().includes(q)
    );
  }, [trucks, query]);

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
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 p-4">
          <p className="text-body-sm">{error}</p>
        </div>
      </div>
    );
  }

  const c = dash?.counts || {};
  const healthyCount = (c.active_trucks || 0) - (c.trucks_with_fault_codes || 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5">
      {/* Header */}
      <header className="flex items-end justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/20">
            <Wrench className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-headline text-text-primary">Fleet Health</h1>
            <p className="text-body-sm text-text-tertiary">
              Powered by AVA · {dash?.minutes_since_sync != null
                ? `Last sync ${formatMinutesAgo(dash.minutes_since_sync)}`
                : 'No sync yet'}
            </p>
          </div>
        </div>
        <Link
          to={`/o/${orgSlug}/wrench/connections`}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-primary border border-surface-tertiary text-body-sm text-text-secondary hover:text-text-primary hover:border-accent/40"
        >
          <Plug className="w-3.5 h-3.5" />
          <span>Connections</span>
        </Link>
      </header>

      {/* Inline data-quality banners */}
      {dash?.stale_data && (
        <Banner tone="amber" icon={Clock} title="Telematics data is stale">
          Last sync was {dash.minutes_since_sync} minutes ago. Some fault codes may have been missed.
        </Banner>
      )}
      {!dash?.has_provider && (
        <Banner tone="info" icon={Plug} title="No ELD provider connected">
          Connect Motive or Samsara to pull live fault codes + locations. Until then, fleet stats reflect what's on your TMS trucks.
        </Banner>
      )}

      {/* AVA briefing — dark gradient, amber ambient glow */}
      <AvaBriefing
        narrative={buildNarrative({
          totalTrucks: c.total_trucks || 0,
          healthy: Math.max(0, healthyCount),
          withFaults: c.trucks_with_fault_codes || 0,
          critical: c.critical_issues || 0,
          serviceDue: c.maintenance_due || 0,
          criticalChips
        })}
        metrics={{
          healthy: Math.max(0, healthyCount),
          total: c.total_trucks || 0,
          critical: c.critical_issues || 0,
          warning: Math.max(0, (c.trucks_with_fault_codes || 0) - (c.critical_issues || 0)),
          serviceDue: c.maintenance_due || 0
        }}
        chips={criticalChips}
        orgSlug={orgSlug}
      />

      {/* Fleet grid */}
      <section>
        <div className="flex items-center justify-between mb-3 px-1">
          <SectionTitle icon={<Truck className="w-3.5 h-3.5 text-cyan-500" />}>The Fleet</SectionTitle>
          {trucks.length > 4 && (
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-tertiary" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Find unit, VIN, driver…"
                className="pl-8 pr-3 py-1.5 rounded-full bg-surface-primary border border-surface-tertiary text-small text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-accent/40"
              />
            </div>
          )}
        </div>

        {trucks.length === 0 ? (
          <EmptyFleet orgSlug={orgSlug} />
        ) : (
          <div className={
            filtered.length === 1
              ? 'grid grid-cols-1'
              : filtered.length === 2
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3'
          }>
            {filtered.map((t) => (
              <TruckHealthCard key={t.id} truck={t} orgSlug={orgSlug} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Sub-components
// ───────────────────────────────────────────────────────────────────

function AvaBriefing({ narrative, metrics, chips, orgSlug }) {
  const m = metrics;
  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] p-5 sm:p-6 shadow-xl">
      <div
        aria-hidden
        className="absolute -top-24 -right-24 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(251,191,36,0.22) 0%, transparent 70%)' }}
      />

      <div className="relative flex items-start gap-3 sm:gap-4">
        {/* AVA avatar — orange/amber gradient to match Wrench brand */}
        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/30">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-body-sm font-semibold text-white">AVA</span>
            <span className="text-small text-white/40">your fleet mechanic</span>
          </div>

          <div className="space-y-1 text-body text-white leading-relaxed">
            {narrative.map((s, i) => (
              <p key={i} className="text-white/90">{s}</p>
            ))}
          </div>

          {/* 4 glass metric tiles */}
          <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <MetricTile
              Icon={CheckCircle2}
              label="Healthy"
              value={m.healthy}
              suffix={m.total ? ` / ${m.total}` : ''}
              accent="emerald"
            />
            <MetricTile
              Icon={ShieldAlert}
              label="Critical"
              value={m.critical}
              accent={m.critical > 0 ? 'rose' : 'neutral'}
            />
            <MetricTile
              Icon={AlertTriangle}
              label="Warnings"
              value={m.warning}
              accent={m.warning > 0 ? 'amber' : 'neutral'}
            />
            <MetricTile
              Icon={Gauge}
              label="Service due"
              value={m.serviceDue}
              accent={m.serviceDue > 0 ? 'violet' : 'neutral'}
            />
          </div>

          {/* Critical chips — clickable shortcuts to the offending truck */}
          {chips.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {chips.map((t) => {
                const tone = HEALTH_TONE[t.worst_severity || t.health || 'critical'];
                return (
                  <Link
                    key={t.id}
                    to={`/o/${orgSlug}/wrench/trucks/${t.id}`}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-small font-medium transition-colors ${tone.border} bg-white/[0.04] hover:bg-white/[0.08] ${tone.text}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${tone.dot} animate-pulse`} />
                    {t.unit_number || 'Unit'} · {t.active_fault_count} code{t.active_fault_count === 1 ? '' : 's'}
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const ACCENT = {
  emerald: { icon: 'text-emerald-300', glow: 'rgba(16,185,129,0.18)' },
  rose:    { icon: 'text-rose-300',    glow: 'rgba(244,63,94,0.22)' },
  amber:   { icon: 'text-amber-300',   glow: 'rgba(251,191,36,0.22)' },
  violet:  { icon: 'text-violet-300',  glow: 'rgba(167,139,250,0.18)' },
  cyan:    { icon: 'text-cyan-300',    glow: 'rgba(34,211,238,0.18)' },
  neutral: { icon: 'text-white/55',    glow: 'rgba(255,255,255,0.06)' }
};

function MetricTile({ Icon, label, value, suffix = '', accent = 'cyan' }) {
  const tone = ACCENT[accent] || ACCENT.cyan;
  return (
    <div className="relative overflow-hidden rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] px-3.5 py-3 hover:bg-white/[0.07] transition-all">
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${tone.glow} 0%, transparent 70%)` }}
      />
      <div className="relative">
        <div className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-white/55">
          <Icon className={`w-3 h-3 ${tone.icon}`} />
          <span>{label}</span>
        </div>
        <div className="mt-1 text-2xl font-semibold text-white tabular-nums leading-none">
          {value}<span className="text-white/55 text-small font-normal">{suffix}</span>
        </div>
      </div>
    </div>
  );
}

function TruckHealthCard({ truck, orgSlug }) {
  const tone = HEALTH_TONE[truck.health] || HEALTH_TONE.unknown;
  const driver = truck.currentDriver
    ? `${truck.currentDriver.first_name || ''} ${truck.currentDriver.last_name || ''}`.trim()
    : null;
  const odometer = truck.current_odometer ? Number(truck.current_odometer).toLocaleString() : null;

  // Service progress: 0 = freshly serviced, 100 = overdue. Read from the
  // augmented dashboard payload if present, otherwise leave the bar off.
  const servicePct = computeServicePct(truck);
  const milesToService = computeMilesToService(truck);
  const faultLine = truck.active_fault_count
    ? `${truck.active_fault_count} active code${truck.active_fault_count === 1 ? '' : 's'}`
    : 'No active codes';

  return (
    <Link
      to={`/o/${orgSlug}/wrench/trucks/${truck.id}`}
      className={`group relative overflow-hidden rounded-2xl bg-surface-primary border ${tone.border} hover:shadow-lg transition-all`}
      style={{ boxShadow: `inset 0 1px 0 rgba(255,255,255,0.04)` }}
    >
      {/* subtle severity glow on hover */}
      <div
        aria-hidden
        className="absolute -top-12 -right-12 w-32 h-32 rounded-full pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity"
        style={{ background: `radial-gradient(circle, ${tone.glow} 0%, transparent 70%)` }}
      />

      <div className="relative p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-400/15 to-blue-600/15 border border-cyan-400/25 flex items-center justify-center shrink-0">
              <Truck className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="min-w-0">
              <div className="text-body-sm font-semibold text-text-primary truncate">
                Unit {truck.unit_number || '—'}
              </div>
              <div className="text-small text-text-tertiary truncate">
                {[truck.make, truck.model, truck.year].filter(Boolean).join(' ') || '—'}
              </div>
            </div>
          </div>
          <HealthBadge h={truck.health} />
        </div>

        <div className="mt-3 space-y-1.5 text-small text-text-secondary">
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary shrink-0">Driver:</span>
            <span className="truncate">{driver || <span className="italic text-text-tertiary">unassigned</span>}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-text-tertiary shrink-0">Faults:</span>
            <span className={truck.active_fault_count ? tone.text.replace('-300', '-700') + ' dark:' + tone.text : ''}>
              {faultLine}
            </span>
          </div>
          {odometer && (
            <div className="flex items-center gap-2">
              <span className="text-text-tertiary shrink-0">Odometer:</span>
              <span className="tabular-nums">{odometer} mi</span>
            </div>
          )}
        </div>

        {servicePct != null && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-[10px] uppercase tracking-wider font-semibold text-text-tertiary mb-1">
              <span>Next service</span>
              <span className="tabular-nums">{milesToService}</span>
            </div>
            <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  servicePct >= 100 ? 'bg-rose-500' :
                  servicePct >= 80 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, servicePct)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

function HealthBadge({ h }) {
  const cfg = ({
    healthy:  'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30',
    warning:  'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    info:     'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30',
    critical: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30',
    unknown:  'bg-gray-500/10 text-gray-600 border-gray-500/20'
  })[h] || 'bg-gray-500/10 text-gray-600 border-gray-500/20';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${cfg}`}>
      {h || 'unknown'}
    </span>
  );
}

function Banner({ tone, icon: Icon, title, children }) {
  const cls = tone === 'amber'
    ? 'bg-amber-50 dark:bg-amber-500/10 border-amber-300 dark:border-amber-500/40 text-amber-900 dark:text-amber-200'
    : 'bg-cyan-50 dark:bg-cyan-500/10 border-cyan-300 dark:border-cyan-500/40 text-cyan-900 dark:text-cyan-200';
  return (
    <div className={`rounded-xl border ${cls} p-3 flex items-start gap-2`}>
      <Icon className="w-4 h-4 mt-0.5 shrink-0" />
      <div className="min-w-0">
        <p className="text-body-sm font-semibold">{title}</p>
        <p className="text-small opacity-90">{children}</p>
      </div>
    </div>
  );
}

function EmptyFleet({ orgSlug }) {
  return (
    <div className="rounded-2xl border border-dashed border-surface-tertiary p-10 text-center">
      <Truck className="w-7 h-7 text-text-tertiary mx-auto mb-3" />
      <p className="text-body-sm text-text-secondary">No trucks yet.</p>
      <Link
        to={`/o/${orgSlug}/wrench/connections`}
        className="inline-flex items-center gap-1.5 mt-3 text-small font-medium text-accent hover:text-accent/80"
      >
        Connect ELD or import trucks
        <ChevronRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

function SectionTitle({ icon, children }) {
  return (
    <h2 className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-text-tertiary">
      {icon}
      <span>{children}</span>
    </h2>
  );
}

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

function severityRank(s) {
  return s === 'critical' ? 4 : s === 'warning' ? 3 : s === 'info' ? 2 : 1;
}

function formatMinutesAgo(min) {
  if (min == null) return 'never';
  if (min < 1) return 'just now';
  if (min < 60) return `${min}m ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

function buildNarrative({ totalTrucks, healthy, withFaults, critical, serviceDue, criticalChips }) {
  const sentences = [];

  if (totalTrucks === 0) {
    sentences.push('No trucks in your fleet yet.');
    sentences.push('Connect an ELD or import trucks from your TMS to start seeing live health.');
    return sentences;
  }

  if (critical > 0) {
    const truck = criticalChips[0];
    sentences.push(
      truck
        ? `${truck.unit_number ? `Unit ${truck.unit_number}` : 'A truck'} just flagged a critical fault.`
        : `${critical} truck${critical === 1 ? '' : 's'} need urgent attention.`
    );
  } else if (withFaults > 0) {
    sentences.push(`${withFaults} truck${withFaults === 1 ? '' : 's'} have active fault codes, but nothing critical.`);
  } else {
    sentences.push(`All ${totalTrucks} truck${totalTrucks === 1 ? '' : 's'} look healthy right now.`);
  }

  if (serviceDue > 0) {
    sentences.push(
      `${serviceDue} truck${serviceDue === 1 ? ' is' : 's are'} due for service in the next 30 days.`
    );
  } else if (totalTrucks > 0 && critical === 0 && withFaults === 0) {
    sentences.push('No service is due in the next 30 days either. Quiet morning.');
  }

  return sentences.slice(0, 3);
}

function computeServicePct(truck) {
  // Prefer miles-based pct if both anchors are present.
  const odo = Number(truck.current_odometer);
  const nextMiles = Number(truck.next_service_miles);
  if (Number.isFinite(odo) && Number.isFinite(nextMiles) && nextMiles > 0) {
    // Assume service interval is ~25k miles unless we know better.
    const interval = 25000;
    const used = Math.max(0, interval - (nextMiles - odo));
    return Math.round((used / interval) * 100);
  }
  // Fallback to date-based if available.
  if (truck.next_service_date) {
    const ms = new Date(truck.next_service_date).getTime() - Date.now();
    const days = ms / 86400000;
    if (days <= 0) return 100;
    if (days < 30) return Math.round((30 - days) / 30 * 100);
  }
  return null;
}

function computeMilesToService(truck) {
  const odo = Number(truck.current_odometer);
  const nextMiles = Number(truck.next_service_miles);
  if (Number.isFinite(odo) && Number.isFinite(nextMiles)) {
    const remaining = nextMiles - odo;
    if (remaining <= 0) return 'overdue';
    return `${remaining.toLocaleString()} mi`;
  }
  if (truck.next_service_date) {
    const ms = new Date(truck.next_service_date).getTime() - Date.now();
    const days = Math.ceil(ms / 86400000);
    if (days <= 0) return 'overdue';
    return `in ${days}d`;
  }
  return '—';
}
