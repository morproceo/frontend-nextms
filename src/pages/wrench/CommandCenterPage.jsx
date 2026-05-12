import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Wrench, Truck, AlertTriangle, Activity, Clock, Loader2,
  CheckCircle2, ChevronRight, Plug
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

/**
 * Command Center — top stat cards, stale-data banner, truck health table.
 *
 * Phase B ships table + cards. Map view (FleetMap reuse) lands once
 * Motive sync is wired and we have live truck coordinates flowing.
 */
export default function CommandCenterPage() {
  const { orgSlug } = useParams();
  const [dash, setDash] = useState(null);
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([wrenchApi.getDashboard(), wrenchApi.listTrucks()])
      .then(([d, t]) => { setDash(d); setTrucks(t || []); })
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;
  }
  if (error) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      </div>
    );
  }

  const c = dash?.counts || {};

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <Wrench className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Command center</h1>
          <p className="text-body-sm text-text-secondary">Real-time fleet health, fault codes, and AI diagnosis.</p>
        </div>
      </header>

      {dash?.stale_data && (
        <div className="rounded-card border border-amber-500/30 bg-amber-500/10 p-3 mb-4 flex items-start gap-2">
          <Clock className="w-4 h-4 text-amber-700 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-body-sm text-text-primary">Data may be stale</p>
            <p className="text-small text-text-secondary">
              Last sync was {dash.minutes_since_sync} minutes ago. Provider connection may need attention.
            </p>
          </div>
          <Link to={`/o/${orgSlug}/wrench/connections`}
            className="text-body-sm text-amber-700 dark:text-amber-400 hover:underline flex-shrink-0">
            Check
          </Link>
        </div>
      )}

      {!dash?.has_provider && (
        <div className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-4 flex items-start gap-3">
          <Plug className="w-5 h-5 text-text-tertiary mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-body-sm font-medium text-text-primary">No telematics provider connected</p>
            <p className="text-small text-text-secondary mt-0.5">
              Connect Motive or Samsara to get live locations + fault codes. Or keep using your imported MorPro TMS trucks.
            </p>
          </div>
          <Link to={`/o/${orgSlug}/wrench/connections`}
            className="text-body-sm text-accent hover:underline flex-shrink-0">
            Connect
          </Link>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Total trucks" value={c.total_trucks ?? 0} icon={Truck} />
        <StatCard label="Active" value={c.active_trucks ?? 0} icon={CheckCircle2} tone="emerald" />
        <StatCard label="With fault codes" value={c.trucks_with_fault_codes ?? 0} icon={AlertTriangle} tone={c.trucks_with_fault_codes ? 'amber' : 'default'} />
        <StatCard label="Critical" value={c.critical_issues ?? 0} icon={AlertTriangle} tone={c.critical_issues ? 'red' : 'default'} />
        <StatCard label="Maintenance due" value={c.maintenance_due ?? 0} icon={Activity} tone={c.maintenance_due ? 'amber' : 'default'} />
      </div>

      <TruckHealthTable trucks={trucks} orgSlug={orgSlug} />
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tone = 'default' }) {
  const toneCls = {
    default: 'text-text-secondary',
    amber: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
    emerald: 'text-emerald-600 dark:text-emerald-400'
  }[tone];
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-4">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 ${toneCls}`} />
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      </div>
      <p className={`text-title-lg font-semibold ${toneCls}`}>{value}</p>
    </div>
  );
}

function TruckHealthTable({ trucks, orgSlug }) {
  if (trucks.length === 0) {
    return (
      <div className="rounded-card border border-border-subtle p-10 text-center">
        <Truck className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-body-sm text-text-secondary">No trucks yet. Add trucks via Connections.</p>
      </div>
    );
  }
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary/60 text-text-tertiary text-left">
            <tr>
              <Th>Unit</Th>
              <Th>VIN</Th>
              <Th>Driver</Th>
              <Th>Health</Th>
              <Th align="right">Active codes</Th>
              <Th align="right">Odometer</Th>
              <Th>Last code seen</Th>
              <th className="px-2"></th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((t) => (
              <tr key={t.id} className="border-t border-border-subtle hover:bg-surface-secondary/40 transition-colors">
                <td className="px-3 py-2 font-medium text-text-primary">{t.unit_number || '—'}</td>
                <td className="px-3 py-2 text-text-tertiary font-mono text-[11px]">{t.vin ? t.vin.slice(-8) : '—'}</td>
                <td className="px-3 py-2 text-text-primary">
                  {t.currentDriver ? `${t.currentDriver.first_name} ${t.currentDriver.last_name}` : '—'}
                </td>
                <td className="px-3 py-2"><HealthPill h={t.health} /></td>
                <td className="px-3 py-2 text-right text-text-primary">{t.active_fault_count || '—'}</td>
                <td className="px-3 py-2 text-right text-text-primary">
                  {t.current_odometer ? Number(t.current_odometer).toLocaleString() : '—'}
                </td>
                <td className="px-3 py-2 text-text-tertiary text-[11px]">
                  {t.latest_diagnostic ? new Date(t.latest_diagnostic).toLocaleString() : '—'}
                </td>
                <td className="px-2 py-2 text-right">
                  <Link to={`/o/${orgSlug}/wrench/trucks/${t.id}`}
                    className="inline-flex items-center text-text-tertiary hover:text-text-primary">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }) {
  return (
    <th className={`px-3 py-2 text-[11px] uppercase tracking-wider font-medium ${align === 'right' ? 'text-right' : ''}`}>
      {children}
    </th>
  );
}

function HealthPill({ h }) {
  const cfg = ({
    healthy: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    critical: 'bg-red-500/15 text-red-700 dark:text-red-400',
    unknown: 'bg-gray-500/15 text-gray-600'
  })[h] || 'bg-gray-500/15 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {h || 'unknown'}
    </span>
  );
}
