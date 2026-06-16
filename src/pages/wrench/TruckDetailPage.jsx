/**
 * Wrench Truck Detail — Diagnostic Bay layout.
 *
 * One big LEFT card swaps between two modes:
 *   • List mode    — all fault codes as prominent rows; click to open
 *   • Detail mode  — back-arrow + selected code + AVA analysis +
 *                    embedded mini-chat scoped to that code + action bar
 *
 * RIGHT column is a quiet stack of context: Service plan, Maintenance,
 * Specs (collapsible). No standalone AVA chat — it lives inside the
 * detail view where the question actually has context.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Truck, Loader2, MapPin, Activity, Wrench, Sparkles, Gauge,
  CheckCircle2, ChevronDown, User, Fuel, Calendar, Copy, ShieldAlert,
  AlertCircle, Send as SendIcon, ListChecks, Lightbulb,
  Clock as ClockIcon, Info as InfoIcon, MessageCircle, ChevronRight
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';
import * as avaApi from '../../api/ava.api';
import MaintenanceForm from '../../components/wrench/MaintenanceForm';

const SEVERITY = {
  critical: { label: 'Critical', chip: 'bg-rose-500/20 text-rose-300 border-rose-500/30',  bar: '#f43f5e', glow: 'rgba(244,63,94,0.18)' },
  warning:  { label: 'Warning',  chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30', bar: '#f59e0b', glow: 'rgba(251,191,36,0.16)' },
  info:     { label: 'Info',     chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',   bar: '#06b6d4', glow: 'rgba(6,182,212,0.16)' },
  unknown:  { label: 'Unknown',  chip: 'bg-white/[0.08] text-white/65 border-white/[0.12]',  bar: 'rgba(255,255,255,0.18)', glow: 'rgba(255,255,255,0.04)' }
};

export default function TruckDetailPage() {
  const { orgSlug, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);

  const refresh = useCallback(async () => {
    // Reset state so navigation between trucks (id change) doesn't
    // flash the previous truck's data while the new one loads.
    setLoading(true);
    setError(null);
    try {
      const r = await wrenchApi.getTruck(id);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  // Drop any selected fault when switching trucks — the id won't match.
  useEffect(() => { setSelectedId(null); }, [id]);
  useEffect(() => { refresh(); }, [refresh]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  if (error) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-200 p-4">
          <p className="text-body-sm">{error}</p>
        </div>
      </div>
    );
  }
  if (!data) return null;

  const { truck, diagnostics = [], location } = data;
  const active = diagnostics
    .filter((d) => !d.resolved_at)
    .slice()
    .sort((a, b) => severityRank(b.severity) - severityRank(a.severity));
  const selected = active.find((d) => d.id === selectedId) || null;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <Link
        to={`/o/${orgSlug}/wrench/trucks`}
        className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to fleet
      </Link>

      <VehicleHero truck={truck} location={location} activeCount={active.length} />

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT — Diagnostic Bay (list ↔ detail) */}
        <main className="lg:col-span-8">
          {selected ? (
            <FaultDetailCard
              key={selected.id}
              fault={selected}
              truck={truck}
              onBack={() => setSelectedId(null)}
              onChange={refresh}
            />
          ) : (
            <DiagnosticBayCard
              active={active}
              onSelect={setSelectedId}
            />
          )}
        </main>

        {/* RIGHT — Truck context */}
        <aside className="lg:col-span-4 space-y-4">
          <ServicePlanCard truck={truck} />
          <MaintenanceRail truckId={truck.id} />
          <SpecsCollapsible truck={truck} location={location} />
        </aside>
      </div>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Vehicle hero (UNCHANGED from prior pass per user request)
// ───────────────────────────────────────────────────────────────────

function VehicleHero({ truck, location, activeCount }) {
  const driverName = truck.currentDriver
    ? `${truck.currentDriver.first_name || ''} ${truck.currentDriver.last_name || ''}`.trim()
    : null;
  const odo = truck.current_odometer ? Number(truck.current_odometer).toLocaleString() + ' mi' : null;
  const next = formatNextService(truck);
  const fuel = truck.fuel_type ? String(truck.fuel_type).replace(/^./, (c) => c.toUpperCase()) : null;
  const place = location?.description;

  return (
    <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] px-5 py-4 shadow-xl">
      <div aria-hidden className="absolute -top-24 -right-24 w-72 h-72 rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(34,211,238,0.15) 0%, transparent 70%)' }} />

      <div className="relative flex items-center gap-4 flex-wrap">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-400/20 to-blue-600/20 border border-cyan-400/30 flex items-center justify-center shrink-0 shadow-lg shadow-cyan-500/20">
          <Truck className="w-5 h-5 text-cyan-300" />
        </div>

        <div className="min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h1 className="text-xl sm:text-2xl font-semibold text-white truncate">
              Unit {truck.unit_number || truck.id.slice(0, 8)}
            </h1>
            <StatusPill status={truck.status || 'active'} />
            {activeCount > 0 && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                <AlertCircle className="w-3 h-3" />
                {activeCount} active code{activeCount === 1 ? '' : 's'}
              </span>
            )}
          </div>
          <p className="text-body-sm text-white/60 mt-0.5">
            {[truck.year, truck.make, truck.model].filter(Boolean).join(' ') || '—'}
            {truck.vin && <span className="text-white/40"> · VIN ····{truck.vin.slice(-6)}</span>}
          </p>
        </div>

        <div className="flex items-center gap-4 lg:gap-5 ml-auto flex-wrap text-small">
          <Stat Icon={User}     label="Driver"   value={driverName}      empty="Unassigned" />
          <Stat Icon={Activity} label="Odometer" value={odo}             empty="—" />
          <Stat Icon={Calendar} label="Next svc" value={next.label} tone={next.accent} />
          <Stat Icon={Fuel}     label="Fuel"     value={fuel}            empty="—" />
          {place && <Stat Icon={MapPin} label="Location" value={place} />}
        </div>
      </div>
    </section>
  );
}

function Stat({ Icon, label, value, empty, tone }) {
  const accent = tone === 'rose'  ? 'text-rose-300'
              : tone === 'amber' ? 'text-amber-300'
              : 'text-white';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <Icon className="w-3.5 h-3.5 text-white/40 shrink-0" />
      <div className="min-w-0">
        <div className="text-[9px] uppercase tracking-wider font-semibold text-white/45 leading-none">{label}</div>
        <div className={`text-body-sm font-semibold tabular-nums mt-0.5 truncate ${value ? accent : 'text-white/50 italic'}`}>
          {value || empty || '—'}
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const cls = ({
    active:   'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    idle:     'bg-white/[0.06] text-white/65 border-white/[0.1]',
    repair:   'bg-amber-500/20 text-amber-200 border-amber-500/30',
    inactive: 'bg-white/[0.04] text-white/40 border-white/[0.08]'
  })[status] || 'bg-white/[0.06] text-white/65 border-white/[0.1]';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] uppercase tracking-wider font-semibold ${cls}`}>
      {status}
    </span>
  );
}

// ───────────────────────────────────────────────────────────────────
// LEFT — List mode: Diagnostic Bay
// ───────────────────────────────────────────────────────────────────

function DiagnosticBayCard({ active, onSelect }) {
  const counts = useMemo(() => active.reduce((acc, d) => {
    const k = d.severity || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, { critical: 0, warning: 0, info: 0, unknown: 0 }), [active]);

  const worst = active.find((d) => d.severity === 'critical') ? 'critical'
              : active.find((d) => d.severity === 'warning')  ? 'warning'
              : active.length > 0 ? 'info'
              : 'healthy';
  const headlineGlow = worst === 'critical' ? 'rgba(244,63,94,0.22)'
                     : worst === 'warning'  ? 'rgba(251,191,36,0.22)'
                     : worst === 'info'     ? 'rgba(6,182,212,0.20)'
                     :                        'rgba(16,185,129,0.20)';

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] shadow-xl flex flex-col"
      style={{ minHeight: '620px' }}
    >
      <div aria-hidden className="absolute -top-32 -right-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${headlineGlow} 0%, transparent 70%)` }} />

      {/* Headline */}
      <header className="relative px-6 pt-6 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider font-semibold text-white/55">
          <ShieldAlert className="w-3 h-3" />
          Diagnostic Bay
        </div>
        <h2 className="mt-1 text-2xl sm:text-3xl font-semibold text-white">
          {active.length === 0
            ? 'All systems nominal'
            : active.length === 1
              ? '1 code needs attention'
              : `${active.length} codes need attention`}
        </h2>
        {active.length > 0 ? (
          <div className="mt-2 flex items-center gap-4 text-small">
            {counts.critical > 0 && (
              <span className="inline-flex items-center gap-1.5 text-rose-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                {counts.critical} critical
              </span>
            )}
            {counts.warning > 0 && (
              <span className="inline-flex items-center gap-1.5 text-amber-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {counts.warning} warning
              </span>
            )}
            {counts.info > 0 && (
              <span className="inline-flex items-center gap-1.5 text-cyan-300 font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                {counts.info} info
              </span>
            )}
            <span className="ml-auto text-white/45">Tap any code — AVA explains, you decide.</span>
          </div>
        ) : (
          <p className="mt-2 text-body-sm text-white/55">
            Last check just now · AVA's watching for new codes in real time.
          </p>
        )}
      </header>

      {/* Body */}
      <div className="relative flex-1 overflow-y-auto px-3 sm:px-4 py-3">
        {active.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            </div>
            <p className="text-body font-semibold text-white">Everything checks out.</p>
            <p className="text-body-sm text-white/55 mt-1 max-w-xs">
              No active fault codes. Drive it.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {active.map((d) => (
              <FaultRow key={d.id} d={d} onClick={() => onSelect(d.id)} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function FaultRow({ d, onClick }) {
  const sev = SEVERITY[d.severity] || SEVERITY.unknown;
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className="group w-full text-left flex items-stretch gap-3 rounded-xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] transition-colors px-3 sm:px-4 py-3"
      >
        <span className="w-1 rounded-full shrink-0" style={{ background: sev.bar }} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-body sm:text-lg font-semibold text-white tabular-nums">{d.code}</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${sev.chip}`}>
              {sev.label}
            </span>
            {d.ai_analysis && (
              <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wider text-cyan-300/80 font-semibold">
                <Sparkles className="w-2.5 h-2.5" /> AI ready
              </span>
            )}
          </div>
          <p className="text-body-sm text-white/85 mt-1 line-clamp-2 leading-snug">
            {d.description || 'No description'}
          </p>
          <p className="text-[11px] text-white/45 mt-1">
            {d.system || 'unknown system'}
            {' · '}last seen {formatRelative(d.last_seen_at)}
            {d.occurrence_count > 1 && ` · ${d.occurrence_count}× occurrences`}
          </p>
        </div>
        <div className="self-center pr-1 text-white/40 group-hover:text-white transition-colors">
          <ChevronRight className="w-4 h-4" />
        </div>
      </button>
    </li>
  );
}

// ───────────────────────────────────────────────────────────────────
// LEFT — Detail mode: Fault detail with embedded AVA chat
// ───────────────────────────────────────────────────────────────────

function FaultDetailCard({ fault: d, truck, onBack, onChange }) {
  const sev = SEVERITY[d.severity] || SEVERITY.unknown;
  const [analyzing, setAnalyzing] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [showMaintenance, setShowMaintenance] = useState(false);
  const [copied, setCopied] = useState(false);
  const [freshAnalysis, setFreshAnalysis] = useState(null);
  const [err, setErr] = useState(null);
  // Clear any pending "Copied!" reset on unmount so we don't setState
  // on an unmounted card.
  const copiedTimeoutRef = useRef(null);
  useEffect(() => () => clearTimeout(copiedTimeoutRef.current), []);

  const analysis = freshAnalysis || d.ai_analysis;

  const analyze = async () => {
    setAnalyzing(true);
    setErr(null);
    try {
      const r = await wrenchApi.analyzeDiagnostic(d.id);
      setFreshAnalysis(r.analysis);
      onChange?.();
    } catch (e) {
      setErr(e?.response?.data?.error?.message || e?.message || 'Diagnose failed.');
    } finally {
      setAnalyzing(false);
    }
  };

  const resolve = async () => {
    setReviewing(true);
    try {
      await wrenchApi.markDiagnosticReviewed(d.id);
      onChange?.();
      onBack?.();
    } catch (e) {
      setErr(e?.response?.data?.error?.message || e?.message || 'Mark resolved failed.');
    } finally {
      setReviewing(false);
    }
  };

  const copyForMechanic = async () => {
    const lines = [
      `${d.code} — ${d.description || ''}`.trim(),
      `System: ${d.system || '—'} · Severity: ${d.severity || '—'}`,
      `First seen: ${d.first_seen_at ? new Date(d.first_seen_at).toLocaleString() : '—'}`,
      `Occurrences: ${d.occurrence_count || 1}`,
      truck.unit_number ? `Truck: Unit ${truck.unit_number} (${truck.year || ''} ${truck.make || ''} ${truck.model || ''})` : '',
      truck.vin ? `VIN: ${truck.vin}` : '',
      truck.current_odometer ? `Odometer: ${Number(truck.current_odometer).toLocaleString()} mi` : ''
    ].filter(Boolean);
    if (analysis?.explanation) lines.push('', 'AVA analysis:', analysis.explanation);
    if (Array.isArray(analysis?.recommendedFixes) && analysis.recommendedFixes.length) {
      lines.push('', 'Recommended fixes:', ...analysis.recommendedFixes.map((f) => `- ${f}`));
    }
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      clearTimeout(copiedTimeoutRef.current);
      copiedTimeoutRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setErr('Copy failed — your browser blocked clipboard access.');
    }
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] shadow-xl flex flex-col"
      style={{ minHeight: '620px' }}
    >
      <div aria-hidden className="absolute -top-32 -right-24 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: `radial-gradient(circle, ${sev.glow} 0%, transparent 70%)` }} />

      {/* Header — back + code */}
      <header className="relative px-5 py-4 border-b border-white/[0.06] flex items-start gap-3">
        <button
          type="button"
          onClick={onBack}
          className="mt-0.5 w-8 h-8 inline-flex items-center justify-center rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-white/65"
          aria-label="Back to all codes"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <h2 className="text-xl font-semibold text-white tabular-nums">{d.code}</h2>
            <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${sev.chip}`}>
              {sev.label}
            </span>
          </div>
          <p className="text-body-sm text-white/85 mt-1 leading-snug">{d.description || 'No description'}</p>
          <p className="text-[11px] text-white/45 mt-1">
            {d.system || 'unknown system'}
            {' · first seen '}{d.first_seen_at ? new Date(d.first_seen_at).toLocaleDateString() : '—'}
            {d.occurrence_count > 1 && ` · ${d.occurrence_count}× occurrences`}
          </p>
        </div>
        <button
          type="button"
          onClick={analyze}
          disabled={analyzing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-small font-semibold disabled:opacity-50 shrink-0"
        >
          {analyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          {analysis ? 'Re-diagnose' : 'Diagnose'}
        </button>
      </header>

      {/* Body — analysis + embedded chat */}
      <div className="relative flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {!analysis && !analyzing && (
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-6 text-center">
            <Sparkles className="w-7 h-7 text-cyan-300 mx-auto mb-2" />
            <p className="text-body-sm text-white font-medium">No AVA analysis yet.</p>
            <p className="text-small text-white/55 mt-1">
              Click <span className="text-cyan-300 font-semibold">Diagnose</span> — AVA will explain what this code means, what's causing it, and what to do.
            </p>
          </div>
        )}

        {analyzing && (
          <div className="flex items-center justify-center py-10 text-white/55">
            <Loader2 className="w-5 h-5 animate-spin mr-2" />
            AVA is analyzing this code…
          </div>
        )}

        {analysis && !analyzing && <DarkAvaAnalysis analysis={analysis} />}

        {err && (
          <p className="text-small text-rose-300">{err}</p>
        )}

        {/* Embedded chat — only when there's something to talk about */}
        {analysis && !analyzing && (
          <FollowUpChat truck={truck} diagnostic={d} analysis={analysis} />
        )}

        {showMaintenance && (
          <div className="rounded-xl bg-slate-950/40 border border-white/[0.06] p-4">
            <h4 className="text-body-sm font-semibold text-white mb-3">New maintenance record</h4>
            <MaintenanceForm
              truckId={d.truck_id || truck.id}
              prefill={buildPrefill({ ...d, ai_analysis: analysis })}
              onCancel={() => setShowMaintenance(false)}
              onSaved={() => { setShowMaintenance(false); onChange?.(); }}
            />
          </div>
        )}
      </div>

      {/* Sticky action bar */}
      <footer className="relative border-t border-white/[0.06] px-5 py-3 flex flex-wrap items-center gap-2 bg-slate-950/50">
        <button
          type="button"
          onClick={() => setShowMaintenance((v) => !v)}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-small text-white"
        >
          <Wrench className="w-3 h-3" />
          {showMaintenance ? 'Hide form' : 'Schedule maintenance'}
        </button>
        <button
          type="button"
          onClick={copyForMechanic}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-small text-white"
        >
          <Copy className="w-3 h-3" />
          {copied ? 'Copied!' : 'Copy to mechanic'}
        </button>
        <button
          type="button"
          onClick={resolve}
          disabled={reviewing}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-small text-emerald-200 disabled:opacity-50 ml-auto"
        >
          {reviewing ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
          Mark resolved
        </button>
      </footer>
    </section>
  );
}

/**
 * FollowUpChat — embedded mini-conversation scoped to a single fault.
 * Renders inline at the bottom of the analysis. Collapsed by default;
 * opens with one click. Keeps AVA contextually relevant — no separate
 * standalone chat panel.
 */
function FollowUpChat({ truck, diagnostic, analysis }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setSending(true);
    try {
      // Inject a system message focusing AVA on this fault code. The
      // backend hydrates truck + active codes from truckId; we just
      // need to point AVA at the specific code the user opened.
      const focusSystem = {
        role: 'system',
        content:
          `Focus this conversation on fault code ${diagnostic.code} ` +
          `(${diagnostic.severity || 'unknown'} — ${diagnostic.description || 'no description'}).` +
          (analysis?.explanation ? ` Prior analysis: ${analysis.explanation}` : '')
      };
      const res = await avaApi.chat(
        [focusSystem, ...next.map((m) => ({ role: m.role, content: m.content }))],
        truck.id
      );
      // Backend envelope: { success: true, data: { message: '...' } }
      const reply = res?.data?.message || res?.message || 'No response.';
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err?.message || 'Chat failed.';
      setMessages((m) => [...m, { role: 'assistant', content: `⚠️ ${msg}` }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center gap-2 px-4 py-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-left transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center shrink-0">
          <Wrench className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-body-sm font-semibold text-white">Ask AVA about this code</p>
          <p className="text-small text-white/55">
            "Can I drive on it?" · "How urgent is this?" · "What parts do I need?"
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-white/40" />
      </button>
    );
  }

  return (
    <div className="rounded-xl bg-white/[0.03] border border-white/[0.08] overflow-hidden">
      <header className="px-4 py-2.5 border-b border-white/[0.06] flex items-center gap-2">
        <div className="w-6 h-6 rounded-md bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <Wrench className="w-3 h-3 text-white" />
        </div>
        <span className="text-small font-semibold text-white">AVA — about {diagnostic.code}</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto text-[11px] text-white/55 hover:text-white"
        >
          Close
        </button>
      </header>

      <div ref={scrollRef} className="max-h-[280px] min-h-[120px] overflow-y-auto px-4 py-3 space-y-2.5">
        {messages.length === 0 && (
          <p className="text-small text-white/55 italic">
            Ask anything about this code. I'll keep it specific to {diagnostic.code}.
          </p>
        )}
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[88%] px-3 py-2 rounded-2xl text-body-sm leading-relaxed ${
              m.role === 'user'
                ? 'ml-auto bg-cyan-500/20 text-white border border-cyan-500/30'
                : 'bg-white/[0.04] text-white/90 border border-white/[0.08]'
            }`}
          >
            {m.content}
          </div>
        ))}
        {sending && (
          <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-2 max-w-[88%] flex items-center gap-2 text-body-sm text-white/65">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            AVA is thinking…
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] p-2.5 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={`Ask AVA about ${diagnostic.code}…`}
          rows={1}
          className="flex-1 resize-none min-h-[36px] max-h-[100px] px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-body-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-500/40"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || sending}
          className="h-9 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-small font-semibold disabled:opacity-50 flex items-center gap-1"
        >
          <SendIcon className="w-3 h-3" />
          Send
        </button>
      </div>
    </div>
  );
}

/**
 * DarkAvaAnalysis — inline dark-themed renderer for the AI analysis JSON.
 */
function DarkAvaAnalysis({ analysis: a }) {
  const sevToTone = ({
    critical: { label: 'Stop driving',       chip: 'bg-rose-500/20 text-rose-300 border-rose-500/30' },
    warning:  { label: 'Drive with caution', chip: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    info:     { label: 'Routine',            chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
    unknown:  { label: 'Unknown',            chip: 'bg-white/[0.08] text-white/65 border-white/[0.12]' }
  })[a?.severity] || { label: 'Routine', chip: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' };

  const cost = a?.estimatedCost?.min != null && a?.estimatedCost?.max != null
    ? `$${Number(a.estimatedCost.min).toLocaleString()}–$${Number(a.estimatedCost.max).toLocaleString()}`
    : null;
  const causes = a?.possibleCauses || a?.causes || [];
  const steps  = a?.recommendedNextSteps || a?.recommendedFixes || a?.nextSteps || [];

  return (
    <div className="space-y-4">
      {a?.name && (
        <h3 className="text-lg font-semibold text-white">{a.name}</h3>
      )}

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border ${sevToTone.chip}`}>
          {sevToTone.label}
        </span>
        {a?.category && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border border-white/[0.12] bg-white/[0.04] text-white/75">
            <Wrench className="w-3 h-3" />
            {a.category}
          </span>
        )}
        {cost && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border border-white/[0.12] bg-white/[0.04] text-white/75">
            $ {cost}
          </span>
        )}
      </div>

      {a?.explanation && (
        <p className="text-body-sm text-white/85 leading-relaxed">{a.explanation}</p>
      )}

      {causes.length > 0 && (
        <Block Icon={InfoIcon} title="Possible causes">
          <ul className="space-y-1.5">
            {causes.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-white/85">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-white/40 shrink-0" />
                <span className="leading-snug">{typeof c === 'string' ? c : c?.text || JSON.stringify(c)}</span>
              </li>
            ))}
          </ul>
        </Block>
      )}

      {steps.length > 0 && (
        <Block Icon={ListChecks} title="Recommended next steps">
          <ol className="space-y-2">
            {steps.map((s, i) => {
              const text = typeof s === 'string' ? s : (s?.text || s?.step || s?.description || s?.action || '');
              const diff = s?.difficulty;
              const mins = s?.estimatedMinutes || s?.minutes;
              return (
                <li key={i} className="flex items-start gap-3">
                  <span className="w-5 h-5 rounded-full bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-body-sm text-white/90 leading-snug">{text}</p>
                    {(diff || mins) && (
                      <p className="text-[11px] text-white/45 mt-0.5">
                        {[diff, mins && `${mins} min`].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </Block>
      )}

      {a?.notes && (
        <Block Icon={Lightbulb} title="Notes">
          <p className="text-body-sm text-white/80 leading-relaxed">{a.notes}</p>
        </Block>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/[0.06] text-[10px] uppercase tracking-wider text-white/40">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="w-3 h-3" />
          {new Date().toLocaleString()}
        </span>
        <span>AI-generated · verify with a qualified mechanic</span>
      </div>
    </div>
  );
}

function Block({ Icon, title, children }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 mb-1.5">
        <Icon className="w-3 h-3 text-white/50" />
        <h4 className="text-[10px] uppercase tracking-wider font-semibold text-white/55">{title}</h4>
      </div>
      {children}
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// RIGHT — Truck context stack
// ───────────────────────────────────────────────────────────────────

function ServicePlanCard({ truck }) {
  const last   = truck.last_service_date ? new Date(truck.last_service_date) : null;
  const next   = truck.next_service_date ? new Date(truck.next_service_date) : null;
  const annual = truck.annual_inspection_expiry ? new Date(truck.annual_inspection_expiry) : null;
  const odo = Number(truck.current_odometer);
  const nextMiles = Number(truck.next_service_miles);

  const pct  = computeServicePct({ next_service_date: truck.next_service_date, current_odometer: odo, next_service_miles: nextMiles });
  const note = computeMilesToService({ current_odometer: odo, next_service_miles: nextMiles, next_service_date: truck.next_service_date });
  const overdue = pct != null && pct >= 100;
  const soon    = pct != null && pct >= 80 && pct < 100;
  const hasAny  = last || next || annual || pct != null;

  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary p-4">
      <div className="flex items-center gap-2 mb-3">
        <Gauge className="w-4 h-4 text-cyan-500" />
        <h2 className="text-body-sm font-semibold text-text-primary">Service plan</h2>
      </div>

      {!hasAny ? (
        <p className="text-small text-text-tertiary">
          No service schedule on file. Add a maintenance record below to start tracking.
        </p>
      ) : (
        <>
          {pct != null && (
            <div className="mb-3">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-wider font-semibold text-text-tertiary mb-1.5">
                <span>Interval used</span>
                <span className="tabular-nums">{note}</span>
              </div>
              <div className="h-2 bg-surface-secondary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    overdue ? 'bg-rose-500' : soon ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, pct)}%` }}
                />
              </div>
            </div>
          )}
          <dl className="space-y-1.5 text-small">
            <ServiceRow label="Last service"   value={last   ? last.toLocaleDateString()   : '—'} />
            <ServiceRow label="Next service"   value={next   ? next.toLocaleDateString()   : '—'} tone={overdue ? 'rose' : soon ? 'amber' : 'normal'} />
            <ServiceRow label="Annual inspect" value={annual ? annual.toLocaleDateString() : '—'} />
          </dl>
        </>
      )}
    </section>
  );
}

function ServiceRow({ label, value, tone = 'normal' }) {
  const valueCls = tone === 'rose'  ? 'text-rose-600 dark:text-rose-400 font-semibold'
                : tone === 'amber' ? 'text-amber-700 dark:text-amber-400 font-semibold'
                : 'text-text-primary';
  return (
    <div className="flex items-baseline justify-between gap-2">
      <dt className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</dt>
      <dd className={`tabular-nums ${valueCls}`}>{value}</dd>
    </div>
  );
}

function MaintenanceRail({ truckId }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await wrenchApi.listMaintenanceForTruck(truckId) || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [truckId]);

  useEffect(() => { refresh(); }, [refresh]);

  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Wrench className="w-4 h-4 text-cyan-500" />
          <h2 className="text-body-sm font-semibold text-text-primary">Maintenance</h2>
        </div>
        <button
          type="button"
          onClick={() => setCreating((v) => !v)}
          className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-semibold text-accent hover:bg-accent/10"
        >
          {creating ? 'Cancel' : '+ Add'}
        </button>
      </div>

      {creating && (
        <div className="mb-3 rounded-xl bg-surface-secondary/40 border border-surface-tertiary p-3">
          <MaintenanceForm
            truckId={truckId}
            prefill={{}}
            onCancel={() => setCreating(false)}
            onSaved={async () => { setCreating(false); await refresh(); }}
          />
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/5 text-rose-700 dark:text-rose-300 p-2.5 mb-2">
          <p className="text-small">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-6 text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-xl bg-surface-secondary/30 border border-dashed border-surface-tertiary p-4 text-center">
          <p className="text-small text-text-secondary">No records yet.</p>
          <p className="text-[11px] text-text-tertiary mt-1">Schedule one from a fault code, or + Add.</p>
        </div>
      ) : (
        <ul className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {records.map((r) => (
            <li key={r.id} className="rounded-lg bg-surface-secondary/30 border border-surface-tertiary p-2.5">
              <div className="flex items-start justify-between gap-2 mb-0.5">
                <p className="text-small font-semibold text-text-primary truncate flex-1">{r.title}</p>
                <span className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary shrink-0">
                  {new Date(r.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              </div>
              <div className="flex items-center gap-1 flex-wrap">
                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold bg-surface-tertiary text-text-secondary">
                  {String(r.maintenance_type).replace(/_/g, ' ')}
                </span>
                <span className="inline-flex items-center px-1 py-0.5 rounded text-[9px] uppercase tracking-wider font-semibold bg-surface-tertiary text-text-secondary">
                  {String(r.status).replace(/_/g, ' ')}
                </span>
                {(r.actual_cost_cents || r.estimated_cost_low_cents) && (
                  <span className="text-[10px] text-text-tertiary ml-auto">
                    {r.actual_cost_cents
                      ? `$${(r.actual_cost_cents / 100).toLocaleString()}`
                      : `est $${(r.estimated_cost_low_cents/100).toFixed(0)}–$${(r.estimated_cost_high_cents/100).toFixed(0)}`}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SpecsCollapsible({ truck, location }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-surface-secondary/30 transition-colors"
      >
        <span className="inline-flex items-center gap-2 text-body-sm font-semibold text-text-primary">
          <Activity className="w-4 h-4 text-text-tertiary" />
          Specs & telematics
        </span>
        <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <dl className="space-y-1.5">
            <Kv label="VIN" value={truck.vin || '—'} mono />
            <Kv label="Year" value={truck.year || '—'} />
            <Kv label="Engine" value={[truck.engine_make, truck.engine_model].filter(Boolean).join(' ') || '—'} />
            <Kv label="HP" value={truck.engine_hp || '—'} />
            <Kv label="Trans" value={truck.transmission_type || '—'} />
            <Kv label="Odometer" value={truck.current_odometer ? `${Number(truck.current_odometer).toLocaleString()} mi` : '—'} />
            <Kv label="GPS" value={location ? `${(location.lat || 0).toFixed(3)}, ${(location.lng || 0).toFixed(3)}` : '—'} mono />
            <Kv label="As of" value={location?.located_at ? new Date(location.located_at).toLocaleString() : '—'} />
          </dl>
        </div>
      )}
    </section>
  );
}

function Kv({ label, value, mono }) {
  return (
    <div className="flex items-baseline gap-2">
      <dt className="text-[10px] uppercase tracking-wider text-text-tertiary w-20 shrink-0">{label}</dt>
      <dd className={`text-small text-text-primary flex-1 truncate ${mono ? 'font-mono text-[11px]' : ''}`}>{value}</dd>
    </div>
  );
}

// ───────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────

function severityRank(s) {
  return s === 'critical' ? 4 : s === 'warning' ? 3 : s === 'info' ? 2 : 1;
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

function computeServicePct(truck) {
  const odo = Number(truck.current_odometer);
  const nextMiles = Number(truck.next_service_miles);
  if (Number.isFinite(odo) && Number.isFinite(nextMiles) && nextMiles > 0) {
    const interval = 25000;
    const used = Math.max(0, interval - (nextMiles - odo));
    return Math.round((used / interval) * 100);
  }
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
    return `${remaining.toLocaleString()} mi left`;
  }
  if (truck.next_service_date) {
    const ms = new Date(truck.next_service_date).getTime() - Date.now();
    const days = Math.ceil(ms / 86400000);
    if (days <= 0) return 'overdue';
    return `in ${days}d`;
  }
  return '—';
}

function buildPrefill(d) {
  if (!d) return {};
  const a = d.ai_analysis || {};
  return {
    title: a.name ? `${d.code} — ${a.name}` : (d.code || 'Repair'),
    description: a.explanation || d.description || '',
    maintenance_type: 'repair',
    severity:
      a.severity === 'critical' ? 'critical' :
      a.severity === 'warning'  ? 'high'     :
      a.severity === 'info'     ? 'medium'   : 'unknown',
    estimated_cost_low_cents:  a.estimatedCost?.min ? a.estimatedCost.min * 100 : null,
    estimated_cost_high_cents: a.estimatedCost?.max ? a.estimatedCost.max * 100 : null,
    related_fault_code_id: d.id,
    related_diagnosis_id: d.id
  };
}
