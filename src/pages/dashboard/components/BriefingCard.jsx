/**
 * BriefingCard — Alex narrates the morning in 2-3 sentences.
 *
 * The single most important piece of the new dashboard: the dispatcher
 * opens the page and *hears* their business in plain English before
 * scanning a single number. Composes the narrative client-side from
 * data the page already has (no extra round trip), so it stays in sync
 * with the tiles below.
 *
 * Two-line max paragraph + an optional CTA chip row at the bottom.
 *
 * Narration rules:
 *  - Lead with money (yesterday's revenue) if non-zero.
 *  - Then the truck story (1 truck on AZ→CA, or "all 3 resting", etc).
 *  - Then the action count if any ("2 things need you").
 *  - Empty state: warm + actionable, not blank.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AgentAvatar } from '../../../components/genie/AgentAvatar';
import { getAgent } from '../../../config/genieTeam';
import {
  ChevronRight, TrendingUp, TrendingDown, Minus,
  DollarSign, Percent, Wallet, GaugeCircle
} from 'lucide-react';

const alex = getAgent('alex');

const fmt$ = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

export function BriefingCard({ pulse, trucks, actionItems, metrics, orgSlug }) {
  const yesterdayEarned = Number(pulse?.yesterday_earned) || 0;
  const arCount = Number(pulse?.ar_count) || 0;
  const arOutstanding = Number(pulse?.ar_outstanding) || 0;
  const pipelineCount = Number(pulse?.pipeline_count) || 0;

  const truckSummary = summarizeTrucks(trucks);
  const sentences = buildNarrative({
    yesterdayEarned,
    arCount,
    arOutstanding,
    pipelineCount,
    truckSummary,
    actionItemsCount: actionItems?.length || 0
  });

  // Top 2 action items become chips at the bottom; full list lives in the
  // ActionItems panel below.
  const topActions = (actionItems || []).slice(0, 2);

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] p-5 sm:p-6 shadow-xl">
      {/* Subtle ambient glow */}
      <div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(52, 204, 255, 0.18) 0%, transparent 70%)'
        }}
      />

      <div className="relative flex items-start gap-3 sm:gap-4">
        <AgentAvatar agent={alex} size="md" className="shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1.5">
            <span className="text-body-sm font-semibold text-white">Alex</span>
            <span className="text-small text-white/40">your dispatch partner</span>
          </div>

          <div className="space-y-1 text-body sm:text-body text-white leading-relaxed">
            {sentences.map((s, i) => (
              <p key={i} className="text-white/90">{s}</p>
            ))}
          </div>

          {/* The four executive numbers — moved inside the briefing so the
              page reads as one fluid command-center surface instead of a
              header card + a separate metrics row underneath. */}
          <MetricStrip pulse={pulse} metrics={metrics} />

          {topActions.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {topActions.map((item) => (
                <ActionChip key={item.id} item={item} />
              ))}
              {actionItems.length > 2 && (
                <Link
                  to="#what-needs-you"
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-small text-white/70 transition-colors"
                  onClick={(e) => {
                    e.preventDefault();
                    document.getElementById('what-needs-you')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  +{actionItems.length - 2} more
                  <ChevronRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/**
 * MetricStrip — four glass tiles, one per executive number, embedded
 * inside the dark briefing card. Each tile has a unique accent color
 * (cyan / emerald / violet / amber) so the eye can land on the metric
 * it cares about. Count-up animation runs on mount + on data change.
 */
function MetricStrip({ pulse, metrics }) {
  const revenue = Number(pulse?.revenue_week) || 0;
  const margin = Number(metrics?.operatingMargin) || 0;
  const marginExtreme = !!metrics?.marginDisplay?.extreme;
  const ar = Number(pulse?.ar_outstanding) || 0;
  const arCount = Number(pulse?.ar_count) || 0;
  const pipeline = Number(pulse?.pipeline_booked) || 0;
  const pipelineCount = Number(pulse?.pipeline_count) || 0;
  const delta = pulse?.revenue_week_delta;

  return (
    <div className="mt-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5">
      <MetricTile
        Icon={DollarSign}
        label="Revenue · wk"
        value={revenue}
        format={fmt$}
        accent="cyan"
        delta={delta}
      />
      <MetricTile
        Icon={Percent}
        label="Op margin"
        value={marginExtreme ? null : margin}
        format={fmtPct}
        valueFallback={marginExtreme ? 'Settling' : '—'}
        accent={margin >= 0 ? 'emerald' : 'rose'}
        helper={marginExtreme ? 'awaiting deliveries' : null}
      />
      <MetricTile
        Icon={Wallet}
        label="To collect"
        value={ar}
        format={fmt$}
        accent="violet"
        helper={arCount > 0 ? `${arCount} outstanding` : 'all current'}
      />
      <MetricTile
        Icon={GaugeCircle}
        label="Pipeline"
        value={pipeline}
        format={fmt$}
        accent="amber"
        helper={pipelineCount > 0
          ? `${pipelineCount} load${pipelineCount === 1 ? '' : 's'} booked`
          : 'no loads booked'}
      />
    </div>
  );
}

const ACCENT = {
  cyan:    { text: 'text-cyan-300',    glow: 'rgba(34, 211, 238, 0.18)',   icon: 'text-cyan-300' },
  emerald: { text: 'text-emerald-300', glow: 'rgba(16, 185, 129, 0.18)',   icon: 'text-emerald-300' },
  violet:  { text: 'text-violet-300',  glow: 'rgba(167, 139, 250, 0.18)',  icon: 'text-violet-300' },
  amber:   { text: 'text-amber-300',   glow: 'rgba(251, 191, 36, 0.18)',   icon: 'text-amber-300' },
  rose:    { text: 'text-rose-300',    glow: 'rgba(244, 63, 94, 0.18)',    icon: 'text-rose-300' }
};

function MetricTile({ Icon, label, value, format, valueFallback, accent = 'cyan', delta, helper }) {
  const tone = ACCENT[accent] || ACCENT.cyan;
  const animated = useCountUp(typeof value === 'number' ? value : 0);
  const display = value == null
    ? (valueFallback || '—')
    : format(animated);

  return (
    <div
      className="relative overflow-hidden rounded-xl bg-white/[0.04] backdrop-blur-sm border border-white/[0.08] px-3.5 py-3 hover:bg-white/[0.07] transition-all"
    >
      {/* Per-tile ambient glow keyed to the accent */}
      <div
        aria-hidden
        className="absolute -top-8 -right-8 w-24 h-24 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${tone.glow} 0%, transparent 70%)` }}
      />

      <div className="relative">
        <div className={`flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-white/55`}>
          <Icon className={`w-3 h-3 ${tone.icon}`} />
          <span>{label}</span>
        </div>
        <div className="mt-1 flex items-baseline gap-1.5 flex-wrap">
          <span className="text-xl sm:text-2xl font-semibold text-white tabular-nums leading-none">
            {display}
          </span>
          {delta != null && <Delta value={delta} />}
        </div>
        {helper && (
          <div className="mt-1 text-[11px] text-white/55">
            {helper}
          </div>
        )}
      </div>
    </div>
  );
}

function Delta({ value }) {
  const v = Number(value) || 0;
  const Icon = v > 0.05 ? TrendingUp : v < -0.05 ? TrendingDown : Minus;
  const cls = v > 0.05 ? 'text-emerald-400' : v < -0.05 ? 'text-rose-400' : 'text-white/40';
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-semibold ${cls}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

// Quick count-up: 0 → target over ~500ms with easeOutCubic. Re-runs
// whenever target changes (refetches feel alive).
function useCountUp(target, durationMs = 500) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) { setV(0); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setV(target * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
      else setV(target);
    };
    raf = requestAnimationFrame(tick);
    return () => { if (raf) cancelAnimationFrame(raf); };
  }, [target, durationMs]);
  return v;
}

function ActionChip({ item }) {
  const severityClass = item.severity === 'high'
    ? 'bg-rose-500/15 border-rose-500/30 text-rose-200 hover:bg-rose-500/20'
    : 'bg-amber-500/15 border-amber-500/30 text-amber-200 hover:bg-amber-500/20';
  const content = (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-small font-medium transition-colors ${severityClass}`}>
      {item.headline}
      <ChevronRight className="w-3 h-3" />
    </span>
  );
  if (item.href) return <Link to={item.href}>{content}</Link>;
  return content;
}

function buildNarrative({
  yesterdayEarned,
  arCount,
  arOutstanding,
  pipelineCount,
  truckSummary,
  actionItemsCount
}) {
  const sentences = [];

  // Greeting + money first (the dispatcher cares most about cash).
  if (yesterdayEarned > 0) {
    sentences.push(`You earned ${fmt$(yesterdayEarned)} yesterday.`);
  } else if (arOutstanding > 0) {
    sentences.push(`${fmt$(arOutstanding)} is sitting in AR across ${arCount} load${arCount === 1 ? '' : 's'}.`);
  } else if (pipelineCount > 0) {
    sentences.push(`No revenue yesterday — but ${pipelineCount} load${pipelineCount === 1 ? '' : 's'} are queued in the pipeline.`);
  } else {
    sentences.push("Quiet morning — no revenue yesterday and the pipeline is empty.");
  }

  // Truck story second.
  if (truckSummary) sentences.push(truckSummary);

  // Action call-out — keep it tight; the chips show the actual rows.
  if (actionItemsCount > 0) {
    sentences.push(`${actionItemsCount} thing${actionItemsCount === 1 ? '' : 's'} need${actionItemsCount === 1 ? 's' : ''} you today.`);
  } else if (pipelineCount === 0 && yesterdayEarned === 0) {
    sentences.push("Want me to look for loads?");
  }

  return sentences.slice(0, 3);
}

function summarizeTrucks(trucks) {
  if (!Array.isArray(trucks) || trucks.length === 0) return null;

  const driving = trucks.filter((t) => t.driver?.eld_status === 'driving');
  const resting = trucks.filter((t) => t.driver?.eld_status === 'off_duty');

  if (driving.length === 1) {
    const t = driving[0];
    const driverName = t.driver?.first_name || 'A driver';
    const place = t.location?.description ? ` near ${t.location.description}` : '';
    const speed = typeof t.location?.speed_mph === 'number' && t.location.speed_mph > 0
      ? ` at ${Math.round(t.location.speed_mph)} mph`
      : '';
    return `${driverName} is rolling${place}${speed}.`;
  }

  if (driving.length > 1) {
    return `${driving.length} of your ${trucks.length} trucks are on the road.`;
  }

  if (resting.length === trucks.length && trucks.length > 0) {
    return trucks.length === 1
      ? "Your truck is resting."
      : `All ${trucks.length} trucks are off-duty.`;
  }

  return `${trucks.length} truck${trucks.length === 1 ? '' : 's'} in your fleet.`;
}

export default BriefingCard;
