/**
 * MarketData - DAT-style market intelligence dashboard
 *
 * Shows:
 * - National spot & contract rate trendlines (Van, Reefer, Flatbed)
 * - Diesel fuel average with regional breakdown
 * - Load-to-truck ratio gauge
 * - Top lane rate heat indicators
 * - Quick links to DAT Trendlines
 */

import { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Fuel,
  Truck,
  Package,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  ExternalLink,
  BarChart3,
  Flame,
  Thermometer,
  ChevronRight
} from 'lucide-react';

// ─── Demo market data (realistic based on DAT Feb/Mar 2026) ────
const RATE_HISTORY = {
  van: {
    label: 'Dry Van', color: '#3b82f6',
    current: 1.89, prev: 1.81, contract: 2.02,
    // 12 weeks of data
    trend: [1.62, 1.65, 1.67, 1.65, 1.68, 1.71, 1.74, 1.78, 1.81, 1.84, 1.81, 1.89]
  },
  reefer: {
    label: 'Reefer', color: '#06b6d4',
    current: 2.21, prev: 2.18, contract: 2.38,
    trend: [1.98, 2.01, 2.04, 2.02, 2.05, 2.08, 2.11, 2.14, 2.18, 2.20, 2.18, 2.21]
  },
  flatbed: {
    label: 'Flatbed', color: '#f59e0b',
    current: 2.07, prev: 2.05, contract: 2.24,
    trend: [1.88, 1.90, 1.92, 1.91, 1.93, 1.95, 1.97, 2.00, 2.03, 2.05, 2.05, 2.07]
  }
};

const FUEL_DATA = {
  national: 3.81,
  prevWeek: 3.77,
  yearAgo: 3.70,
  regions: [
    { name: 'East Coast', price: 3.84 },
    { name: 'Midwest', price: 3.80 },
    { name: 'Gulf Coast', price: 3.68 },
    { name: 'Rocky Mtn', price: 3.79 },
    { name: 'West Coast', price: 4.32 },
    { name: 'California', price: 4.94 }
  ]
};

const LOAD_RATIO = {
  van: { ratio: 8.29, prevMonth: 6.0, label: 'Van' },
  reefer: { ratio: 9.2, prevMonth: 7.1, label: 'Reefer' },
  flatbed: { ratio: 56.92, prevMonth: 37.3, label: 'Flatbed' }
};

const HOT_LANES = [
  { origin: 'Dallas, TX', dest: 'Atlanta, GA', rate: 2.45, change: 0.12, volume: 'High' },
  { origin: 'Chicago, IL', dest: 'Los Angeles, CA', rate: 2.18, change: 0.08, volume: 'High' },
  { origin: 'Atlanta, GA', dest: 'Miami, FL', rate: 2.62, change: 0.15, volume: 'Very High' },
  { origin: 'Los Angeles, CA', dest: 'Phoenix, AZ', rate: 2.85, change: -0.05, volume: 'Medium' },
  { origin: 'Houston, TX', dest: 'Nashville, TN', rate: 2.31, change: 0.10, volume: 'High' },
  { origin: 'New York, NY', dest: 'Boston, MA', rate: 3.45, change: 0.22, volume: 'Medium' },
  { origin: 'Denver, CO', dest: 'Salt Lake City, UT', rate: 2.55, change: -0.03, volume: 'Low' },
  { origin: 'Jacksonville, FL', dest: 'Charlotte, NC', rate: 2.38, change: 0.18, volume: 'High' }
];

const WEEK_LABELS = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'];

// ─── Sparkline (pure CSS/SVG) ─────────────────────────────
function Sparkline({ data, color, height = 48, width = '100%' }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;
  const h = height - padding * 2;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = padding + h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');

  const areaPoints = `0,${height} ${points} 100,${height}`;

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width, height }} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color.replace('#','')}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#grad-${color.replace('#','')})`} />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      {/* Current value dot */}
      {(() => {
        const lastX = 100;
        const lastY = padding + h - ((data[data.length - 1] - min) / range) * h;
        return <circle cx={lastX} cy={lastY} r="2.5" fill={color} stroke="white" strokeWidth="1" vectorEffect="non-scaling-stroke" />;
      })()}
    </svg>
  );
}

// ─── Rate Card ────────────────────────────────────────────
function RateCard({ data, isSelected, onSelect }) {
  const change = data.current - data.prev;
  const changePct = ((change / data.prev) * 100).toFixed(1);
  const isUp = change >= 0;

  return (
    <button
      onClick={onSelect}
      className={`text-left p-4 rounded-xl border transition-all ${
        isSelected
          ? 'border-accent/30 bg-accent/5 shadow-sm'
          : 'border-surface-tertiary/50 bg-surface hover:border-surface-tertiary'
      }`}
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">{data.label}</span>
        <div className={`flex items-center gap-0.5 text-[11px] font-semibold ${isUp ? 'text-emerald-500' : 'text-red-500'}`}>
          {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
          {isUp ? '+' : ''}{changePct}%
        </div>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-title-sm font-bold text-text-primary">${data.current.toFixed(2)}</span>
        <span className="text-[11px] text-text-tertiary">/mi spot</span>
      </div>

      <div className="mt-2">
        <Sparkline data={data.trend} color={data.color} height={36} />
      </div>

      <div className="flex items-center justify-between mt-2">
        <span className="text-[10px] text-text-tertiary">Contract: ${data.contract.toFixed(2)}/mi</span>
        <span className="text-[10px] text-text-tertiary">12 wk</span>
      </div>
    </button>
  );
}

// ─── Ratio Gauge ──────────────────────────────────────────
function RatioGauge({ data }) {
  const change = data.ratio - data.prevMonth;
  const changePct = ((change / data.prevMonth) * 100).toFixed(0);
  const isUp = change >= 0;

  // Determine tightness level
  let tightness, tightnessColor;
  if (data.label === 'Flatbed') {
    tightness = data.ratio > 40 ? 'Very Tight' : data.ratio > 20 ? 'Tight' : 'Balanced';
    tightnessColor = data.ratio > 40 ? 'text-red-500' : data.ratio > 20 ? 'text-orange-500' : 'text-emerald-500';
  } else {
    tightness = data.ratio > 8 ? 'Very Tight' : data.ratio > 5 ? 'Tight' : data.ratio > 3 ? 'Balanced' : 'Loose';
    tightnessColor = data.ratio > 8 ? 'text-red-500' : data.ratio > 5 ? 'text-orange-500' : data.ratio > 3 ? 'text-emerald-500' : 'text-blue-500';
  }

  // Bar width (capped)
  const maxRatio = data.label === 'Flatbed' ? 80 : 15;
  const barPct = Math.min((data.ratio / maxRatio) * 100, 100);

  return (
    <div className="py-3 border-b border-surface-tertiary/30 last:border-0">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-body-sm font-semibold text-text-primary">{data.label}</span>
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-semibold ${tightnessColor}`}>{tightness}</span>
          <span className="text-body-sm font-bold text-text-primary tabular-nums">{data.ratio}:1</span>
        </div>
      </div>
      <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 bg-gradient-to-r from-emerald-400 via-orange-400 to-red-500"
          style={{ width: `${barPct}%` }}
        />
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[10px] text-text-tertiary">Prev mo: {data.prevMonth}:1</span>
        <span className={`text-[10px] font-medium ${isUp ? 'text-red-400' : 'text-emerald-400'}`}>
          {isUp ? '+' : ''}{changePct}% {isUp ? '(tighter)' : '(looser)'}
        </span>
      </div>
    </div>
  );
}

// ─── Volume Heat Badge ────────────────────────────────────
function VolumeBadge({ volume }) {
  const config = {
    'Very High': 'bg-red-500/15 text-red-500',
    'High': 'bg-orange-500/15 text-orange-500',
    'Medium': 'bg-amber-500/15 text-amber-500',
    'Low': 'bg-blue-500/15 text-blue-500',
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${config[volume] || config.Medium}`}>
      {volume}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────
export function MarketData() {
  const [selectedRate, setSelectedRate] = useState('van');
  const selected = RATE_HISTORY[selectedRate];

  return (
    <div className="space-y-6">
      {/* Disclaimer bar */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
        <BarChart3 className="w-4 h-4 text-amber-500 shrink-0" />
        <p className="text-[12px] text-amber-400 flex-1">
          Market data is based on national averages and updated weekly. For live rates, visit{' '}
          <a href="https://www.dat.com/trendlines" target="_blank" rel="noopener noreferrer" className="underline font-semibold hover:text-amber-300">
            DAT Trendlines
          </a>
        </p>
      </div>

      {/* Rate Trendlines */}
      <div>
        <h3 className="text-body font-bold text-text-primary mb-3 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent" />
          National Spot Rates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {Object.entries(RATE_HISTORY).map(([key, data]) => (
            <RateCard
              key={key}
              data={data}
              isSelected={selectedRate === key}
              onSelect={() => setSelectedRate(key)}
            />
          ))}
        </div>

        {/* Expanded chart for selected */}
        <div className="mt-4 bg-surface border border-surface-tertiary/50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h4 className="text-body-sm font-semibold text-text-primary">
                {selected.label} — 12 Week Trend
              </h4>
              <p className="text-[11px] text-text-tertiary">
                Spot: ${selected.current.toFixed(2)}/mi &nbsp;|&nbsp; Contract: ${selected.contract.toFixed(2)}/mi
              </p>
            </div>
            <div className="text-right">
              <span className="text-title-sm font-bold text-text-primary">${selected.current.toFixed(2)}</span>
              <span className="text-[11px] text-text-tertiary ml-1">/mi</span>
            </div>
          </div>
          <div className="h-[120px]">
            <Sparkline data={selected.trend} color={selected.color} height={120} />
          </div>
          <div className="flex justify-between mt-2">
            {WEEK_LABELS.map((w, i) => (
              <span key={w} className="text-[9px] text-text-tertiary/60">{i % 3 === 0 ? w : ''}</span>
            ))}
          </div>
        </div>
      </div>

      {/* Two-column: Fuel + Load-to-Truck Ratio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fuel Prices */}
        <div className="bg-surface border border-surface-tertiary/50 rounded-xl p-4">
          <h3 className="text-body font-bold text-text-primary mb-3 flex items-center gap-2">
            <Fuel className="w-4 h-4 text-orange-500" />
            Diesel Fuel Average
          </h3>

          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-headline font-bold text-text-primary">${FUEL_DATA.national.toFixed(2)}</span>
            <span className="text-body-sm text-text-tertiary">/gal</span>
            <span className={`text-[11px] font-semibold ml-auto flex items-center gap-0.5 ${
              FUEL_DATA.national > FUEL_DATA.prevWeek ? 'text-red-500' : 'text-emerald-500'
            }`}>
              {FUEL_DATA.national > FUEL_DATA.prevWeek ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {FUEL_DATA.national > FUEL_DATA.prevWeek ? '+' : ''}
              {((FUEL_DATA.national - FUEL_DATA.prevWeek) * 100).toFixed(0)}¢ vs last week
            </span>
          </div>
          <p className="text-[11px] text-text-tertiary mb-4">
            Year ago: ${FUEL_DATA.yearAgo.toFixed(2)}/gal ({((FUEL_DATA.national - FUEL_DATA.yearAgo) / FUEL_DATA.yearAgo * 100).toFixed(1)}% YoY)
          </p>

          <div className="space-y-2">
            {FUEL_DATA.regions.map(r => {
              const barPct = ((r.price - 3.40) / (5.00 - 3.40)) * 100; // scale 3.40-5.00
              const isHigh = r.price > 4.00;
              return (
                <div key={r.name}>
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[11px] text-text-secondary">{r.name}</span>
                    <span className={`text-[11px] font-semibold tabular-nums ${isHigh ? 'text-red-400' : 'text-text-primary'}`}>
                      ${r.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isHigh ? 'bg-red-400' : 'bg-orange-400'}`}
                      style={{ width: `${Math.min(Math.max(barPct, 5), 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Load-to-Truck Ratio */}
        <div className="bg-surface border border-surface-tertiary/50 rounded-xl p-4">
          <h3 className="text-body font-bold text-text-primary mb-3 flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-red-500" />
            Load-to-Truck Ratio
          </h3>

          <div className="flex items-center gap-3 mb-4 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
            <Flame className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <p className="text-body-sm font-semibold text-red-400">Market is Tightening</p>
              <p className="text-[11px] text-text-tertiary">
                Load-to-truck ratios are at multi-year highs. Rates trending up.
              </p>
            </div>
          </div>

          {Object.entries(LOAD_RATIO).map(([key, data]) => (
            <RatioGauge key={key} data={data} />
          ))}
        </div>
      </div>

      {/* Hot Lanes */}
      <div className="bg-surface border border-surface-tertiary/50 rounded-xl p-4">
        <h3 className="text-body font-bold text-text-primary mb-3 flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500" />
          Hot Lanes — Top Spot Rates
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-tertiary/40">
                <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary pb-2 pr-4">Lane</th>
                <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary pb-2 pr-4 text-right">Rate/Mi</th>
                <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary pb-2 pr-4 text-right">Chg</th>
                <th className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary pb-2 text-right">Volume</th>
              </tr>
            </thead>
            <tbody>
              {HOT_LANES.map((lane, i) => (
                <tr key={i} className="border-b border-surface-tertiary/20 last:border-0 hover:bg-surface-secondary/30 transition-colors">
                  <td className="py-2.5 pr-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3 h-3 text-text-tertiary shrink-0" />
                      <span className="text-body-sm text-text-primary font-medium">{lane.origin}</span>
                      <ChevronRight className="w-3 h-3 text-text-tertiary" />
                      <span className="text-body-sm text-text-primary font-medium">{lane.dest}</span>
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className="text-body-sm font-bold text-text-primary tabular-nums">${lane.rate.toFixed(2)}</span>
                  </td>
                  <td className="py-2.5 pr-4 text-right">
                    <span className={`text-[12px] font-semibold flex items-center gap-0.5 justify-end ${
                      lane.change >= 0 ? 'text-emerald-500' : 'text-red-500'
                    }`}>
                      {lane.change >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      {lane.change >= 0 ? '+' : ''}${lane.change.toFixed(2)}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    <VolumeBadge volume={lane.volume} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: 'DAT Trendlines', desc: 'Live rate & ratio data', url: 'https://www.dat.com/trendlines', icon: BarChart3 },
          { label: 'DAT Van Rates', desc: 'National van rate trends', url: 'https://www.dat.com/trendlines/van/national-rates', icon: Truck },
          { label: 'EIA Diesel Prices', desc: 'Official fuel price data', url: 'https://www.eia.gov/petroleum/gasdiesel/', icon: Fuel }
        ].map(link => (
          <a
            key={link.label}
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-xl border border-surface-tertiary/50 bg-surface hover:border-accent/30 hover:bg-accent/5 transition-all group"
          >
            <div className="w-9 h-9 bg-surface-secondary rounded-lg flex items-center justify-center shrink-0 group-hover:bg-accent/10">
              <link.icon className="w-4 h-4 text-text-tertiary group-hover:text-accent" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-body-sm font-semibold text-text-primary">{link.label}</p>
              <p className="text-[11px] text-text-tertiary">{link.desc}</p>
            </div>
            <ExternalLink className="w-3.5 h-3.5 text-text-tertiary group-hover:text-accent shrink-0" />
          </a>
        ))}
      </div>
    </div>
  );
}

export default MarketData;
