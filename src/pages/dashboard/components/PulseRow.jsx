/**
 * PulseRow — four executive-grade numbers, side by side.
 *
 *   REVENUE (this week)   with sparkline + week-over-week delta
 *   MARGIN                operating margin from /v1/pnl
 *   TO COLLECT (AR)       outstanding revenue + count
 *   PIPELINE              booked work + count
 *
 * Numbers count up on first render so the page feels alive on load.
 * Layout is borderless on lighter surface — these aren't cards in the
 * SaaS-tile sense, they're the headline numbers a CFO reads first.
 */

import { useEffect, useState } from 'react';
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

const fmt$ = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

export function PulseRow({ pulse, trend, metrics }) {
  // Sparkline series for the revenue tile: pull `revenue` per month from
  // the existing pnl trend. The other tiles don't get sparks — single
  // current-state numbers shouldn't pretend to be time-series.
  const revenueSpark = (trend || []).slice(-6).map((t) => ({
    label: t.month,
    value: Number(t.revenue) || 0
  }));

  const margin = Number(metrics?.operatingMargin) || 0;
  const marginExtreme = !!metrics?.marginDisplay?.extreme;

  const revenueWeek = Number(pulse?.revenue_week) || 0;
  const revenueDelta = pulse?.revenue_week_delta; // null when no prior week
  const arOutstanding = Number(pulse?.ar_outstanding) || 0;
  const arCount = Number(pulse?.ar_count) || 0;
  const pipelineBooked = Number(pulse?.pipeline_booked) || 0;
  const pipelineCount = Number(pulse?.pipeline_count) || 0;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 px-1">
      <Stat
        label="Revenue · this week"
        value={revenueWeek}
        formatter={fmt$}
        delta={revenueDelta}
        sparkSeries={revenueSpark}
        accent="#34CCFF"
      />
      <Stat
        label="Operating margin"
        value={marginExtreme ? null : margin}
        formatter={fmtPct}
        valueFallback={marginExtreme ? 'Settling' : null}
        accent={margin >= 0 ? '#10b981' : '#f43f5e'}
        helper={marginExtreme ? 'Awaiting more deliveries' : null}
      />
      <Stat
        label="To collect (AR)"
        value={arOutstanding}
        formatter={fmt$}
        accent="#a78bfa"
        helper={arCount > 0 ? `${arCount} load${arCount === 1 ? '' : 's'} outstanding` : 'All current'}
        helperTone={arCount > 0 ? 'warn' : 'pos'}
      />
      <Stat
        label="Pipeline"
        value={pipelineBooked}
        formatter={fmt$}
        accent="#fbbf24"
        helper={pipelineCount > 0
          ? `${pipelineCount} load${pipelineCount === 1 ? '' : 's'} booked`
          : 'No loads booked'}
        helperTone={pipelineCount > 0 ? 'pos' : 'muted'}
      />
    </div>
  );
}

function Stat({ label, value, formatter, delta, sparkSeries, accent, helper, helperTone, valueFallback }) {
  const displayValue = value == null
    ? (valueFallback || '—')
    : formatter(useCountUp(value));

  const showSpark = Array.isArray(sparkSeries) && sparkSeries.length > 1;

  return (
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary mb-1.5">
        {label}
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-3xl sm:text-4xl font-semibold text-text-primary tabular-nums leading-none">
          {displayValue}
        </span>
        {delta != null && <Delta value={delta} />}
      </div>
      {helper && (
        <div className={`text-small mt-1 ${
          helperTone === 'pos' ? 'text-emerald-600' :
          helperTone === 'warn' ? 'text-amber-600' :
          helperTone === 'neg' ? 'text-rose-600' :
          'text-text-tertiary'
        }`}>
          {helper}
        </div>
      )}
      {showSpark && (
        <div className="mt-2 -mx-1 h-8 max-w-[140px]">
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={sparkSeries} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <Tooltip
                cursor={false}
                contentStyle={{
                  background: 'rgba(15,23,42,0.95)', border: 'none',
                  borderRadius: 6, fontSize: 11, padding: '4px 8px', color: '#fff'
                }}
                formatter={(v) => fmt$(v)}
                labelFormatter={(l) => l}
              />
              <Line type="monotone" dataKey="value" stroke={accent} strokeWidth={2}
                    dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function Delta({ value }) {
  const v = Number(value) || 0;
  const Icon = v > 0.05 ? TrendingUp : v < -0.05 ? TrendingDown : Minus;
  const cls = v > 0.05 ? 'text-emerald-600' : v < -0.05 ? 'text-rose-600' : 'text-text-tertiary';
  return (
    <span className={`inline-flex items-center gap-0.5 text-small font-semibold ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

// Cheap count-up: animates 0 → target in 600ms on mount. Re-runs whenever
// the target changes (so refetches feel alive too).
function useCountUp(target, durationMs = 600) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!Number.isFinite(target)) { setV(0); return; }
    const start = performance.now();
    let raf;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / durationMs);
      // easeOutCubic
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

export default PulseRow;
