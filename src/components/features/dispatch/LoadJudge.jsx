/**
 * LogIQ - 3-Column load profitability evaluator
 *
 * Layout:
 *   Col 1: Form (pickup, drop-off, rate)
 *   Col 2: Verdict (metrics, gauge, counter offers)
 *   Col 3: Route Map (Mapbox visualization)
 */

import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '../../ui/Button';
import {
  MAPBOX_TOKEN,
  MAP_STYLES,
  DEFAULT_CENTER,
  DEFAULT_ZOOM
} from '../../../services/map/config';
import { calculateBounds } from '../../../services/map/mapbox';
import {
  BrainCircuit,
  ArrowRight,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  RotateCcw,
  Zap,
  Target,
  Clock,
  Route,
  MapPin,
  Gauge,
  ChevronRight,
  ChevronDown,
  CircleDollarSign,
  Plus
} from 'lucide-react';

mapboxgl.accessToken = MAPBOX_TOKEN;

const fmt = (amount) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency', currency: 'USD',
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount);

const inputClass = 'px-3 py-2.5 bg-surface-secondary border border-surface-tertiary/50 rounded-xl text-body-sm text-text-primary placeholder:text-text-tertiary/60 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent/30 transition-all';

// ─── Judge Map ──────────────────────────────────────────────
function JudgeMap({ routeGeometry, locations, collapsed }) {
  const container = useRef(null);
  const map = useRef(null);
  const markers = useRef([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (map.current) return;
    map.current = new mapboxgl.Map({
      container: container.current,
      style: MAP_STYLES.dark,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      interactive: true,
      attributionControl: false
    });
    map.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.current.on('load', () => setLoaded(true));
    return () => {
      markers.current.forEach(m => m.remove());
      if (map.current) { map.current.remove(); map.current = null; }
    };
  }, []);

  // Resize map when collapsible card expands
  useEffect(() => {
    if (!collapsed && map.current) {
      // Wait for CSS transition to finish before resizing
      const timer = setTimeout(() => map.current?.resize(), 350);
      return () => clearTimeout(timer);
    }
  }, [collapsed]);

  useEffect(() => {
    if (!loaded || !map.current) return;

    if (map.current.getSource('judge-route')) {
      map.current.removeLayer('judge-route-line');
      map.current.removeLayer('judge-route-glow');
      map.current.removeSource('judge-route');
    }
    markers.current.forEach(m => m.remove());
    markers.current = [];

    if (!routeGeometry?.coordinates?.length) return;

    map.current.addSource('judge-route', {
      type: 'geojson',
      data: { type: 'Feature', geometry: routeGeometry }
    });
    map.current.addLayer({
      id: 'judge-route-glow',
      type: 'line',
      source: 'judge-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0071E3', 'line-width': 10, 'line-opacity': 0.15 }
    });
    map.current.addLayer({
      id: 'judge-route-line',
      type: 'line',
      source: 'judge-route',
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: { 'line-color': '#0071E3', 'line-width': 3.5, 'line-opacity': 0.9 }
    });

    if (locations?.length > 0) {
      locations.forEach(loc => {
        if (!loc.coordinates?.lat || !loc.coordinates?.lng) return;
        const isPickup = loc.type === 'pickup';
        const color = isPickup ? '#22c55e' : '#ef4444';
        const label = isPickup ? 'P' : 'D';

        const el = document.createElement('div');
        el.innerHTML = `
          <div style="
            width:28px;height:28px;background:${color};
            border:3px solid white;border-radius:50%;
            box-shadow:0 2px 10px ${color}66;
            display:flex;align-items:center;justify-content:center;
          "><span style="color:white;font-size:11px;font-weight:700;">${label}</span></div>
        `;

        const cityState = loc.city ? `${loc.city}, ${loc.state}` : '';
        const popup = new mapboxgl.Popup({ offset: 18, closeButton: false, maxWidth: '180px' })
          .setHTML(`
            <div style="padding:4px 0;font-family:system-ui,sans-serif;">
              <div style="font-weight:700;font-size:12px;color:#111;">${isPickup ? 'Pickup' : 'Delivery'}</div>
              <div style="font-size:11px;color:#666;margin-top:2px;">${cityState}</div>
            </div>
          `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([loc.coordinates.lng, loc.coordinates.lat])
          .setPopup(popup)
          .addTo(map.current);
        markers.current.push(marker);
      });
    }

    const coords = (locations || [])
      .filter(l => l.coordinates?.lat && l.coordinates?.lng)
      .map(l => ({ lat: l.coordinates.lat, lng: l.coordinates.lng }));
    if (coords.length > 0) {
      const bounds = calculateBounds(coords);
      if (bounds) {
        map.current.fitBounds([bounds.sw, bounds.ne], { padding: { top: 60, bottom: 60, left: 50, right: 50 }, duration: 800 });
      }
    }
  }, [routeGeometry, locations, loaded]);

  return <div ref={container} className="absolute inset-0" />;
}

// ─── Profit Gauge (vertical) ────────────────────────────────
function ProfitGauge({ netPerMile }) {
  const min = -1, max = 2;
  const clamped = Math.max(min, Math.min(max, netPerMile));
  const pct = ((clamped - min) / (max - min)) * 100;
  const breakEvenPct = ((0 - min) / (max - min)) * 100;
  const minProfitPct = ((0.55 - min) / (max - min)) * 100;
  const barColor = netPerMile >= 0.55
    ? 'from-emerald-400 to-emerald-500'
    : netPerMile >= 0 ? 'from-amber-400 to-amber-500' : 'from-red-400 to-red-500';

  return (
    <div className="relative mt-1">
      <div className="h-2 bg-surface-tertiary/40 rounded-full overflow-hidden relative">
        <div className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-all duration-700 ease-out`} style={{ width: `${pct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-text-tertiary/30" style={{ left: `${breakEvenPct}%` }} />
        <div className="absolute top-0 h-full w-0.5 bg-emerald-400/40" style={{ left: `${minProfitPct}%` }} />
      </div>
      <div className="flex justify-between mt-1">
        <span className="text-[11px] text-text-tertiary">Loss</span>
        <span className="text-[11px] text-text-tertiary">$0.55 target</span>
        <span className="text-[11px] text-text-tertiary">High</span>
      </div>
    </div>
  );
}

// ─── Stat Row ────────────────────────────────────────────────
function StatRow({ label, value, sub, accent, icon: Icon }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-surface-tertiary/20 last:border-0">
      <div className="flex items-center gap-2">
        {Icon && (
          <div className="w-6 h-6 bg-surface-tertiary/30 rounded-lg flex items-center justify-center">
            <Icon className="w-3 h-3 text-text-tertiary" />
          </div>
        )}
        <span className="text-[11px] text-text-secondary">{label}</span>
      </div>
      <div className="text-right">
        <span className={`text-body-sm font-bold ${accent || 'text-text-primary'}`}>{value}</span>
        {sub && <p className="text-[9px] text-text-tertiary">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────
export function LogIQ({
  form, onUpdateForm, result, onJudge, judging, error, onReset, onCreateLoad
}) {
  const [collapsed, setCollapsed] = useState(true);

  const isFormValid = form.originCity && form.originState &&
                      form.destCity && form.destState && form.rate;

  const isGood = result?.isGood;
  const isProfit = result?.netPerMile > 0;

  return (
    <div className="bg-surface border border-surface-tertiary/60 rounded-2xl shadow-card overflow-hidden">
      {/* Header — clickable to toggle */}
      <div
        className="relative overflow-hidden px-5 py-3 cursor-pointer select-none hover:bg-surface-secondary/30 transition-colors"
        onClick={() => setCollapsed(prev => !prev)}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-accent/5 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-accent-hover rounded-xl flex items-center justify-center shadow-md shadow-accent/20">
              <BrainCircuit className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-body-sm font-bold text-text-primary tracking-tight">LogIQ</h2>
              <p className="text-[10px] text-text-tertiary">Should you take this load?</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick verdict badge when collapsed */}
            {collapsed && result && (
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold ${
                isGood
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-red-500/15 text-red-400'
              }`}>
                {isGood ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {isGood ? 'Take It' : isProfit ? 'Low Margin' : 'Pass'}
                <span className="text-text-tertiary font-normal ml-1">${result.rpm.toFixed(2)}/mi</span>
              </div>
            )}

            {/* Reset button */}
            {result && (
              <button
                onClick={(e) => { e.stopPropagation(); onReset(); }}
                className="p-2 hover:bg-surface-secondary rounded-xl transition-all duration-200 hover:rotate-[-90deg]"
                title="New evaluation"
              >
                <RotateCcw className="w-4 h-4 text-text-tertiary" />
              </button>
            )}

            {/* Collapse chevron */}
            <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
          </div>
        </div>
      </div>

      {/* Collapsible body */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
        collapsed ? 'max-h-0' : 'max-h-[2000px]'
      }`}>
        <div className="border-t border-surface-tertiary/40" />

        {/* 3-Column Layout */}
        <div className="flex flex-col lg:flex-row">

        {/* ── Column 1: Form ── */}
        <div className="lg:w-[300px] xl:w-[320px] border-b lg:border-b-0 lg:border-r border-surface-tertiary/40 p-4 shrink-0">
          <div className="space-y-2.5">
            {/* Route dots */}
            <div className="relative">
              <div className="absolute left-[15px] top-[32px] bottom-[32px] w-px bg-gradient-to-b from-emerald-400 via-surface-tertiary to-red-400" />

              {/* Origin */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-[8px] h-[8px] rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 z-10" />
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Pickup</label>
                </div>
                <div className="space-y-1.5 pl-5">
                  <input type="text" placeholder="Address (optional)" value={form.originAddress || ''}
                    onChange={(e) => onUpdateForm('originAddress', e.target.value)}
                    className={`w-full ${inputClass}`} />
                  <div className="grid grid-cols-6 gap-1.5">
                    <input type="text" placeholder="City" value={form.originCity}
                      onChange={(e) => onUpdateForm('originCity', e.target.value)}
                      className={`col-span-3 ${inputClass}`} />
                    <input type="text" placeholder="ST" value={form.originState}
                      onChange={(e) => onUpdateForm('originState', e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2} className={`${inputClass} uppercase text-center font-semibold`} />
                    <input type="text" placeholder="ZIP" value={form.originZip || ''}
                      onChange={(e) => onUpdateForm('originZip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      maxLength={5} className={`col-span-2 ${inputClass} text-center`} />
                  </div>
                </div>
              </div>

              <div className="h-2" />

              {/* Destination */}
              <div className="relative">
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-[8px] h-[8px] rounded-full bg-red-500 ring-2 ring-red-500/20 z-10" />
                  <label className="text-[10px] font-semibold uppercase tracking-wider text-text-tertiary">Drop-off</label>
                </div>
                <div className="space-y-1.5 pl-5">
                  <input type="text" placeholder="Address (optional)" value={form.destAddress || ''}
                    onChange={(e) => onUpdateForm('destAddress', e.target.value)}
                    className={`w-full ${inputClass}`} />
                  <div className="grid grid-cols-6 gap-1.5">
                    <input type="text" placeholder="City" value={form.destCity}
                      onChange={(e) => onUpdateForm('destCity', e.target.value)}
                      className={`col-span-3 ${inputClass}`} />
                    <input type="text" placeholder="ST" value={form.destState}
                      onChange={(e) => onUpdateForm('destState', e.target.value.toUpperCase().slice(0, 2))}
                      maxLength={2} className={`${inputClass} uppercase text-center font-semibold`} />
                    <input type="text" placeholder="ZIP" value={form.destZip || ''}
                      onChange={(e) => onUpdateForm('destZip', e.target.value.replace(/\D/g, '').slice(0, 5))}
                      maxLength={5} className={`col-span-2 ${inputClass} text-center`} />
                  </div>
                </div>
              </div>
            </div>

            {/* Rate */}
            <div className="pt-0.5">
              <label className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-text-tertiary mb-1.5">
                <DollarSign className="w-3 h-3" /> Rate Offered
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-tertiary text-body font-semibold">$</span>
                <input type="number" placeholder="3,500" value={form.rate}
                  onChange={(e) => onUpdateForm('rate', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && isFormValid && onJudge()}
                  className={`w-full pl-8 pr-4 !py-3 ${inputClass} !text-title-sm !font-bold placeholder:!font-normal`} />
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-xl">
                <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <p className="text-[12px] text-red-400">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <Button onClick={onJudge} loading={judging} disabled={!isFormValid || judging}
              className="w-full !py-3 !rounded-xl !font-semibold">
              {judging ? 'Calculating...' : (<><Zap className="w-4 h-4" /> Analyze Load</>)}
            </Button>

            {result && onCreateLoad && (
              <button
                onClick={onCreateLoad}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-accent/30 text-accent text-body-sm font-semibold hover:bg-accent/5 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Load
              </button>
            )}
          </div>
        </div>

        {/* ── Column 2: Verdict ── */}
        <div className="lg:flex-1 border-b lg:border-b-0 lg:border-r border-surface-tertiary/40 p-4 flex flex-col">
          {!result && !judging && (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8">
              <div className="w-12 h-12 bg-surface-secondary rounded-2xl flex items-center justify-center mb-3">
                <Gauge className="w-6 h-6 text-text-tertiary/30" />
              </div>
              <p className="text-body-sm font-medium text-text-tertiary">Waiting for analysis</p>
              <p className="text-[11px] text-text-tertiary/60 mt-1 max-w-[180px]">
                Fill in the load details and hit Analyze
              </p>
            </div>
          )}

          {judging && (
            <div className="flex-1 flex flex-col items-center justify-center py-8">
              <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-body-sm font-medium text-text-secondary">Analyzing load...</p>
              <p className="text-[11px] text-text-tertiary mt-1">Calculating route & profitability</p>
            </div>
          )}

          {result && (
            <div className="flex-1 flex flex-col animate-fade-in">
              {/* Verdict hero */}
              <div className={`rounded-xl p-3.5 mb-3 ${
                isGood
                  ? 'bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 border border-emerald-500/20'
                  : 'bg-gradient-to-br from-red-500/15 to-red-500/5 border border-red-500/20'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    isGood
                      ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                      : 'bg-red-500 shadow-lg shadow-red-500/30'
                  }`}>
                    {isGood
                      ? <TrendingUp className="w-5 h-5 text-white" />
                      : <TrendingDown className="w-5 h-5 text-white" />
                    }
                  </div>
                  <div>
                    <h3 className={`text-body font-bold ${isGood ? 'text-emerald-400' : 'text-red-400'}`}>
                      {isGood ? 'Take This Load' : isProfit ? 'Low Margin' : 'Below Cost'}
                    </h3>
                    <p className="text-[11px] text-text-tertiary mt-0.5">
                      {isGood
                        ? `$${result.netPerMile.toFixed(2)}/mi profit — meets $0.55 target`
                        : isProfit
                          ? 'Profit below $0.55/mi minimum'
                          : 'You lose money on this load'
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Lane summary */}
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-secondary/60 rounded-lg mb-3">
                <div className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-[11px] font-medium text-text-secondary truncate">{form.originCity}, {form.originState}</span>
                <ChevronRight className="w-3 h-3 text-text-tertiary shrink-0" />
                <div className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                <span className="text-[11px] font-medium text-text-secondary truncate">{form.destCity}, {form.destState}</span>
              </div>

              {/* Profit gauge */}
              {result.hasCostData && (
                <div className="mb-3">
                  <ProfitGauge netPerMile={result.netPerMile} />
                </div>
              )}

              {/* Stats list */}
              <div className="flex-1">
                <StatRow label="Distance" value={`${result.miles.toLocaleString()} mi`} icon={MapPin} />
                <StatRow label="Drive Time" value={`${result.durationHours}h`} icon={Clock} />
                <StatRow label="Rate" value={fmt(result.rate)} sub={`$${result.rpm.toFixed(2)}/mi`} icon={CircleDollarSign} />
                {result.hasCostData && (
                  <>
                    <StatRow
                      label="Your Cost"
                      value={`$${result.costPerMile.toFixed(2)}/mi`}
                      sub={result.costSource === 'settings' ? 'From saved settings' : 'From P&L report'}
                      icon={Target}
                    />
                    <StatRow
                      label="Net Profit"
                      value={`$${result.netPerMile.toFixed(2)}/mi`}
                      sub={`${fmt(result.totalProfit)} total`}
                      accent={isProfit ? 'text-emerald-400' : 'text-red-400'}
                      icon={TrendingUp}
                    />
                  </>
                )}
              </div>

              {/* Counter offer */}
              {result.hasCostData && !isGood && (
                <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Counter Offer</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-surface/50 rounded-lg px-3 py-2">
                      <p className="text-[9px] text-text-tertiary uppercase">Minimum</p>
                      <p className="text-body-sm font-bold text-amber-300">{fmt(result.minimumRate)}</p>
                    </div>
                    <div className="bg-surface/50 rounded-lg px-3 py-2">
                      <p className="text-[9px] text-text-tertiary uppercase">{result.targetMarginPercent}% Margin</p>
                      <p className="text-body-sm font-bold text-amber-300">{fmt(result.suggestedRate)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* No cost data notice */}
              {!result.hasCostData && (
                <div className="mt-3 flex items-center gap-2 px-3 py-2.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <p className="text-[11px] text-amber-300">
                    Set your cost/mile in <span className="font-semibold">Finances</span> tab for profit analysis
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Column 3: Map ── */}
        <div className="lg:flex-1 relative" style={{ minHeight: '480px' }}>
          <JudgeMap
            routeGeometry={result?.routeGeometry}
            locations={result?.locations}
            collapsed={collapsed}
          />

          {/* Map empty state */}
          {!result && !judging && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none">
              <div className="bg-surface/80 backdrop-blur-sm border border-surface-tertiary/40 rounded-2xl px-8 py-6 text-center">
                <div className="w-12 h-12 bg-surface-secondary rounded-2xl flex items-center justify-center mx-auto mb-3">
                  <Route className="w-6 h-6 text-text-tertiary/40" />
                </div>
                <p className="text-body-sm font-medium text-text-secondary">Route Preview</p>
                <p className="text-[11px] text-text-tertiary mt-1">
                  Your route will appear here
                </p>
              </div>
            </div>
          )}

          {/* Map loading state */}
          {judging && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-surface-inverse/10 backdrop-blur-[2px]">
              <div className="bg-surface/90 backdrop-blur-sm border border-surface-tertiary/40 rounded-2xl px-6 py-4 text-center">
                <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <p className="text-body-sm font-medium text-text-secondary">Mapping route...</p>
              </div>
            </div>
          )}

          {/* Route info overlay on map when result exists */}
          {result && (
            <div className="absolute top-3 left-3 z-10">
              <div className="bg-surface/85 backdrop-blur-sm border border-surface-tertiary/40 rounded-xl px-3 py-2">
                <div className="flex items-center gap-2">
                  <Route className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[11px] font-semibold text-text-primary">
                    {result.miles.toLocaleString()} miles
                  </span>
                  <span className="text-[10px] text-text-tertiary">
                    {result.durationHours}h drive
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      </div>
    </div>
  );
}

export { LogIQ as LoadJudge };
export default LogIQ;
