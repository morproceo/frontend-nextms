import { useEffect, useState, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  ArrowLeft, Truck, Loader2, AlertTriangle, MapPin, Activity,
  Wrench, FileText, History, StickyNote, Sparkles, Gauge, CheckCircle2
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';
import AiDiagnosisCard from '../../components/wrench/AiDiagnosisCard';
import MaintenanceForm from '../../components/wrench/MaintenanceForm';

const TABS = [
  { key: 'overview',    label: 'Overview',     icon: Truck },
  { key: 'faultcodes',  label: 'Fault codes',  icon: AlertTriangle },
  { key: 'diagnosis',   label: 'AI diagnosis', icon: Sparkles },
  { key: 'telematics',  label: 'Telematics',   icon: Gauge },
  { key: 'maintenance', label: 'Maintenance',  icon: Wrench },
  { key: 'documents',   label: 'Documents',    icon: FileText },
  { key: 'history',     label: 'History',      icon: History },
  { key: 'notes',       label: 'Notes',        icon: StickyNote }
];

export default function TruckDetailPage() {
  const { orgSlug, id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('overview');

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await wrenchApi.getTruck(id);
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [id]);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  if (error) {
    return <div className="px-6 py-10 max-w-3xl mx-auto"><div className="rounded-card border border-error/30 bg-error-muted text-error p-3"><p className="text-body-sm">{error}</p></div></div>;
  }
  if (!data) return null;

  const { truck, diagnostics, location } = data;
  const driverName = truck.currentDriver
    ? `${truck.currentDriver.first_name} ${truck.currentDriver.last_name}`
    : null;
  const activeDiagnostics = diagnostics.filter(d => !d.resolved_at);

  return (
    <div className="px-6 py-10 max-w-6xl mx-auto">
      <Link to={`/o/${orgSlug}/wrench/trucks`}
        className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Trucks
      </Link>

      <header className="flex items-start gap-3 mb-6">
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
          <Truck className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-title text-text-primary truncate">
            Unit {truck.unit_number || truck.id.slice(0, 8)}
          </h1>
          <p className="text-body-sm text-text-secondary">
            {[truck.year, truck.make, truck.model].filter(Boolean).join(' ') || '—'}
            {truck.vin ? ` · VIN ${truck.vin}` : ''}
          </p>
          {driverName && <p className="text-small text-text-tertiary mt-0.5">Driver: {driverName}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {activeDiagnostics.length > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] font-bold bg-amber-500/15 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="w-3 h-3" />
              {activeDiagnostics.length} ACTIVE
            </span>
          )}
        </div>
      </header>

      <div className="border-b border-border-subtle mb-6 overflow-x-auto">
        <div className="flex gap-1">
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 text-body-sm font-medium border-b-2 inline-flex items-center gap-1.5 whitespace-nowrap transition-colors ${
                tab === key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-secondary hover:text-text-primary'
              }`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview'   && <Overview truck={truck} location={location} active={activeDiagnostics} />}
      {tab === 'faultcodes' && <FaultCodes diagnostics={diagnostics} onChange={refresh} />}
      {tab === 'diagnosis'  && <DiagnosisTab diagnostics={diagnostics} />}
      {tab === 'telematics' && <Telematics truck={truck} location={location} />}
      {tab === 'maintenance'&& <MaintenanceTab truckId={truck.id} />}
      {tab === 'documents'  && <Placeholder text="Document attachments ship in Phase D." />}
      {tab === 'history'    && <Placeholder text="Event timeline lands later." />}
      {tab === 'notes'      && <Placeholder text="Driver/operator notes land later." />}
    </div>
  );
}

function Overview({ truck, location, active }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card title="Current status">
          <KV label="Status" value={truck.status || '—'} />
          <KV label="Odometer" value={truck.current_odometer ? `${Number(truck.current_odometer).toLocaleString()} mi` : '—'} />
          <KV label="Last odometer update" value={truck.odometer_updated_at ? new Date(truck.odometer_updated_at).toLocaleString() : '—'} />
          <KV label="Last service" value={truck.last_service_date ? new Date(truck.last_service_date).toLocaleDateString() : '—'} />
          <KV label="Next service due" value={truck.next_service_date ? new Date(truck.next_service_date).toLocaleDateString() : '—'} />
        </Card>
        <Card title="Location">
          {location ? (
            <>
              <KV label="Lat / Lng" value={`${(location.lat || 0).toFixed(4)}, ${(location.lng || 0).toFixed(4)}`} />
              <KV label="Speed" value={location.speed_mph != null ? `${location.speed_mph} mph` : '—'} />
              <KV label="As of" value={location.located_at ? new Date(location.located_at).toLocaleString() : '—'} />
            </>
          ) : (
            <p className="text-body-sm text-text-tertiary">No live location. Connect Motive to track this truck.</p>
          )}
        </Card>
      </div>

      <Card title={`Active fault codes${active.length ? ` (${active.length})` : ''}`}>
        {active.length === 0 ? (
          <p className="text-body-sm text-text-tertiary">No active codes — this truck is healthy.</p>
        ) : (
          <ul className="divide-y divide-border-subtle -mx-1">
            {active.slice(0, 5).map((d) => (
              <li key={d.id} className="px-1 py-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">{d.code} — {d.description || 'No description'}</p>
                    <p className="text-small text-text-tertiary">{d.system} · last seen {new Date(d.last_seen_at).toLocaleString()}</p>
                  </div>
                  <SeverityPill s={d.severity} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function FaultCodes({ diagnostics, onChange }) {
  const [expandedId, setExpandedId] = useState(null);
  const [analyzing, setAnalyzing] = useState(null);
  const [reviewing, setReviewing] = useState(null);
  const [error, setError] = useState(null);
  const [freshAnalysis, setFreshAnalysis] = useState({}); // id -> analysis just fetched

  if (!diagnostics.length) {
    return <Placeholder text="No fault codes recorded for this truck." />;
  }

  const onAnalyze = async (id) => {
    setAnalyzing(id); setError(null);
    try {
      const r = await wrenchApi.analyzeDiagnostic(id);
      setFreshAnalysis((m) => ({ ...m, [id]: r.analysis }));
      setExpandedId(id);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setAnalyzing(null); }
  };

  const onReview = async (id) => {
    setReviewing(id); setError(null);
    try {
      await wrenchApi.markDiagnosticReviewed(id);
      onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setReviewing(null); }
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}
      <ul className="space-y-2">
        {diagnostics.map((d) => {
          const expanded = expandedId === d.id;
          const cached = d.ai_analysis;
          const renderable = freshAnalysis[d.id] || cached;
          return (
            <li key={d.id} className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
              <div className="p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-body font-medium text-text-primary">{d.code}</p>
                    <SeverityPill s={d.severity} />
                    {d.resolved_at && <span className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-medium">resolved</span>}
                    {cached && <span className="text-[10px] uppercase tracking-wider text-accent font-medium">AI cached</span>}
                  </div>
                  <p className="text-small text-text-secondary">{d.description || '—'}</p>
                  <p className="text-small text-text-tertiary mt-0.5">
                    {d.system} · first seen {new Date(d.first_seen_at).toLocaleDateString()}
                    {d.occurrence_count ? ` · ${d.occurrence_count}× occurrences` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {!d.resolved_at && (
                    <button onClick={() => onReview(d.id)} disabled={reviewing === d.id}
                      className="px-2.5 py-1.5 rounded-button border border-border text-small font-medium text-text-secondary hover:bg-surface-secondary disabled:opacity-50">
                      {reviewing === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><CheckCircle2 className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />Mark reviewed</>}
                    </button>
                  )}
                  {cached && !expanded && (
                    <button onClick={() => setExpandedId(d.id)}
                      className="px-2.5 py-1.5 rounded-button border border-border text-small font-medium text-text-secondary hover:bg-surface-secondary">
                      View AI
                    </button>
                  )}
                  <button onClick={() => onAnalyze(d.id)} disabled={analyzing === d.id}
                    className="px-3 py-1.5 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-1">
                    {analyzing === d.id
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <><Sparkles className="w-3.5 h-3.5" /> {cached ? 'Re-analyze' : 'Diagnose'}</>}
                  </button>
                </div>
              </div>
              {expanded && renderable && (
                <div className="border-t border-border-subtle p-4 bg-surface-secondary/30 space-y-3">
                  <AiDiagnosisCard analysis={renderable} code={d.code} />
                  <CreateMaintenanceFromDiagnostic diagnostic={{ ...d, ai_analysis: renderable }} onSaved={() => onChange?.()} />
                  <button onClick={() => setExpandedId(null)}
                    className="text-body-sm text-text-secondary hover:text-text-primary">
                    Close
                  </button>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function DiagnosisTab({ diagnostics }) {
  const withAi = diagnostics.filter(d => d.ai_analysis);
  if (!withAi.length) {
    return <Placeholder text='No AI diagnoses yet. Open the Fault codes tab and click "Diagnose" on a code.' />;
  }
  return (
    <div className="space-y-3">
      {withAi.map((d) => (
        <AiDiagnosisCard key={d.id} analysis={d.ai_analysis} code={d.code} />
      ))}
    </div>
  );
}

function Telematics({ truck, location }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card title="Live">
        <KV label="GPS" value={location ? `${location.lat?.toFixed(4)}, ${location.lng?.toFixed(4)}` : '—'} />
        <KV label="Speed" value={location?.speed_mph != null ? `${location.speed_mph} mph` : '—'} />
        <KV label="Bearing" value={location?.bearing != null ? `${location.bearing}°` : '—'} />
        <KV label="As of" value={location?.located_at ? new Date(location.located_at).toLocaleString() : '—'} />
      </Card>
      <Card title="Vehicle stats">
        <KV label="Odometer" value={truck.current_odometer ? `${Number(truck.current_odometer).toLocaleString()} mi` : '—'} />
        <KV label="Fuel type" value={truck.fuel_type || '—'} />
        <KV label="Engine" value={[truck.engine_make, truck.engine_model].filter(Boolean).join(' ') || '—'} />
        <KV label="HP" value={truck.engine_hp || '—'} />
        <KV label="Transmission" value={truck.transmission_type || '—'} />
      </Card>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <h3 className="text-body-sm font-medium text-text-primary mb-3">{title}</h3>
      <dl className="space-y-1.5">{children}</dl>
    </div>
  );
}
function KV({ label, value }) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="text-[10px] uppercase tracking-wider text-text-tertiary w-32 flex-shrink-0">{label}</dt>
      <dd className="text-body-sm text-text-primary flex-1">{value}</dd>
    </div>
  );
}
function MaintenanceTab({ truckId, prefillFromDiagnostic = null }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [creating, setCreating] = useState(!!prefillFromDiagnostic);
  const [prefill, setPrefill] = useState(() => buildPrefill(prefillFromDiagnostic));

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setRecords(await wrenchApi.listMaintenanceForTruck(truckId) || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  }, [truckId]);

  useEffect(() => { refresh(); }, [refresh]);

  const onSaved = async () => {
    setCreating(false);
    setPrefill({});
    await refresh();
  };

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {creating ? (
        <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
          <h3 className="text-body font-semibold text-text-primary mb-3">New maintenance record</h3>
          <MaintenanceForm truckId={truckId} prefill={prefill}
            onCancel={() => { setCreating(false); setPrefill({}); }}
            onSaved={onSaved} />
        </div>
      ) : (
        <div className="flex justify-end">
          <button onClick={() => setCreating(true)}
            className="px-3 py-1.5 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover inline-flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Add record
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : records.length === 0 ? (
        <Placeholder text="No maintenance records yet. Add one above or from a fault code's AI diagnosis." />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="rounded-card border border-border-subtle bg-surface-primary p-4">
              <div className="flex items-center gap-2 mb-1">
                <p className="text-body font-medium text-text-primary truncate">{r.title}</p>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-surface-secondary text-text-secondary">
                  {String(r.maintenance_type).replace(/_/g, ' ')}
                </span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-surface-secondary text-text-secondary">
                  {String(r.status).replace(/_/g, ' ')}
                </span>
              </div>
              {r.description && <p className="text-small text-text-secondary">{r.description}</p>}
              <p className="text-small text-text-tertiary mt-1">
                {r.actual_cost_cents
                  ? `$${(r.actual_cost_cents / 100).toLocaleString()} actual`
                  : (r.estimated_cost_low_cents && r.estimated_cost_high_cents
                    ? `est $${(r.estimated_cost_low_cents/100).toFixed(0)}–$${(r.estimated_cost_high_cents/100).toFixed(0)}`
                    : '')}
                {r.shop_name ? ` · ${r.shop_name}` : ''}
                {' · '}{new Date(r.created_at).toLocaleDateString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CreateMaintenanceFromDiagnostic({ diagnostic, onSaved }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  if (done) {
    return (
      <div className="rounded-card border border-emerald-500/30 bg-emerald-500/10 p-3 inline-flex items-center gap-2 text-body-sm text-emerald-700 dark:text-emerald-400">
        <CheckCircle2 className="w-4 h-4" /> Maintenance record created.
      </div>
    );
  }
  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-button bg-text-primary text-surface-primary text-body-sm font-medium hover:opacity-90 inline-flex items-center gap-1.5">
        <Wrench className="w-3.5 h-3.5" /> Create maintenance from this
      </button>
    );
  }
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <h4 className="text-body-sm font-medium text-text-primary mb-3">New maintenance record</h4>
      <MaintenanceForm
        truckId={diagnostic.truck_id}
        prefill={buildPrefill(diagnostic)}
        onCancel={() => setOpen(false)}
        onSaved={() => { setDone(true); setOpen(false); onSaved?.(); }} />
    </div>
  );
}

function buildPrefill(d) {
  if (!d) return {};
  const a = d.ai_analysis || {};
  return {
    title: a.name ? `${d.code} — ${a.name}` : (d.code || 'Repair'),
    description: a.explanation || d.description || '',
    maintenance_type: 'repair',
    severity: a.severity === 'critical' ? 'critical' :
              a.severity === 'warning' ? 'high' :
              a.severity === 'info' ? 'medium' : 'unknown',
    estimated_cost_low_cents: a.estimatedCost?.min ? a.estimatedCost.min * 100 : null,
    estimated_cost_high_cents: a.estimatedCost?.max ? a.estimatedCost.max * 100 : null,
    related_fault_code_id: d.id,
    related_diagnosis_id: d.id
  };
}

function Placeholder({ text }) {
  return (
    <div className="rounded-card border border-border-subtle p-10 text-center">
      <Wrench className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
      <p className="text-body-sm text-text-secondary">{text}</p>
    </div>
  );
}
function SeverityPill({ s }) {
  const cfg = ({
    critical: 'bg-red-500/15 text-red-700 dark:text-red-400',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    unknown: 'bg-gray-500/15 text-gray-600'
  })[s] || 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>{s || 'unknown'}</span>;
}
