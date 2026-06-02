/**
 * MoneyStrip — four tiles answering "did I make money."
 *
 *   Revenue (period)   — sparkline + delta vs prior period
 *   Profit margin %    — sparkline + colored delta
 *   Cash to bill       — invoiced but not paid (single bar; owner-ops
 *                        check this last thing at night)
 *   RPM 7-day          — speedometer-style number with target band
 *
 * Data is shared with the rest of the dashboard via props from the
 * domain hook (revenue/profit/RPM are already on `useDashboard`).
 * Cash-to-bill is computed from /v1/invoices?status=sent,viewed in the
 * caller — we just render the number.
 *
 * Sparklines use recharts (already in package.json), drawn with no axes
 * or grid — pure visual texture, not data interrogation. Tiles are
 * glass-ish to feel like extension of the hero, not new surfaces.
 */

import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts';
import { TrendingUp, TrendingDown, Minus, DollarSign, Percent, Wallet, Gauge } from 'lucide-react';

const fmtMoney = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');
const fmtMoneyCents = (n) => '$' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => `${(Number(n) || 0).toFixed(1)}%`;

export function MoneyStrip({ trend, metrics, cashToBill }) {
  // Sparkline series: revenue + costs from /v1/pnl/trend monthly
  const trendData = (trend || []).map((t) => ({
    month: t.month,
    revenue: Number(t.revenue) || 0,
    profit: (Number(t.revenue) || 0) - (Number(t.totalCosts) || 0)
  }));

  const revenue = Number(metrics?.totalRevenue) || 0;
  const operatingMargin = Number(metrics?.operatingMargin) || 0;
  const rpm = Number(metrics?.revenuePerMile) || 0;
  const cpm = Number(metrics?.costPerMile) || 0;
  const profitable = rpm > cpm;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Tile
        icon={<DollarSign className="w-3.5 h-3.5" />}
        label="Revenue"
        value={fmtMoney(revenue)}
        delta={computeDelta(trendData, 'revenue')}
        sparkSeries={trendData}
        sparkKey="revenue"
        stroke="#34CCFF"
      />
      <Tile
        icon={<Percent className="w-3.5 h-3.5" />}
        label="Operating margin"
        value={fmtPct(operatingMargin)}
        delta={null}
        deltaLabel={metrics?.marginDisplay?.extreme ? 'Settling' : null}
        sparkSeries={trendData}
        sparkKey="profit"
        stroke={operatingMargin >= 0 ? '#10b981' : '#f43f5e'}
      />
      <Tile
        icon={<Wallet className="w-3.5 h-3.5" />}
        label="Cash to bill"
        value={fmtMoney(cashToBill ?? 0)}
        delta={null}
        deltaLabel={cashToBill > 0 ? 'Sent · awaiting' : 'All current'}
        sparkSeries={null}
        sparkKey={null}
        stroke="#a78bfa"
      />
      <Tile
        icon={<Gauge className="w-3.5 h-3.5" />}
        label="Rate / mile"
        value={fmtMoneyCents(rpm)}
        delta={null}
        deltaLabel={profitable ? `${fmtMoneyCents(rpm - cpm)} over cost` : `${fmtMoneyCents(cpm - rpm)} under cost`}
        deltaTone={profitable ? 'pos' : 'neg'}
        sparkSeries={null}
        sparkKey={null}
        stroke="#fbbf24"
      />
    </div>
  );
}

function Tile({ icon, label, value, delta, deltaLabel, deltaTone, sparkSeries, sparkKey, stroke }) {
  const showSpark = sparkSeries && sparkKey && sparkSeries.length > 1;
  return (
    <div className="rounded-2xl bg-surface-primary border border-surface-tertiary p-4 hover:border-accent/40 transition-colors flex flex-col gap-2 min-h-[120px]">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
        <span style={{ color: stroke }}>{icon}</span>
        <span>{label}</span>
      </div>
      <div className="flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-semibold text-text-primary tabular-nums">{value}</span>
        {delta != null && <DeltaPill value={delta} />}
        {deltaLabel && !delta && (
          <span className={`text-small font-medium ${
            deltaTone === 'pos' ? 'text-emerald-500' : deltaTone === 'neg' ? 'text-rose-500' : 'text-text-tertiary'
          }`}>{deltaLabel}</span>
        )}
      </div>

      {showSpark && (
        <div className="flex-1 -mx-1 mt-1 min-h-[28px]">
          <ResponsiveContainer width="100%" height={32}>
            <LineChart data={sparkSeries} margin={{ top: 2, right: 2, left: 2, bottom: 0 }}>
              <Tooltip cursor={false} contentStyle={{ background: 'rgba(15,23,42,0.95)', border: 'none', borderRadius: 6, fontSize: 11, padding: '4px 8px', color: '#fff' }} formatter={(v) => fmtMoney(v)} labelFormatter={(l) => l} />
              <Line type="monotone" dataKey={sparkKey} stroke={stroke} strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      {!showSpark && deltaLabel && delta == null && (
        <div className="flex-1 min-h-[28px]" />
      )}
    </div>
  );
}

function DeltaPill({ value }) {
  const v = Number(value) || 0;
  const Icon = v > 0.001 ? TrendingUp : v < -0.001 ? TrendingDown : Minus;
  const cls = v > 0.001 ? 'text-emerald-500' : v < -0.001 ? 'text-rose-500' : 'text-text-tertiary';
  return (
    <span className={`inline-flex items-center gap-0.5 text-small font-medium ${cls}`}>
      <Icon className="w-3 h-3" />
      {Math.abs(v).toFixed(1)}%
    </span>
  );
}

// % delta of the last point vs the median of the prior points.
function computeDelta(series, key) {
  if (!Array.isArray(series) || series.length < 2) return null;
  const last = Number(series[series.length - 1]?.[key]) || 0;
  const prior = series.slice(0, -1).map((p) => Number(p[key]) || 0).filter((n) => n > 0);
  if (prior.length === 0) return null;
  const median = prior.slice().sort((a, b) => a - b)[Math.floor(prior.length / 2)];
  if (median === 0) return null;
  return ((last - median) / median) * 100;
}

export default MoneyStrip;
