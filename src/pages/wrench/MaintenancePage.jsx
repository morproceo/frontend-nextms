import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Wrench, Loader2, Plus, ChevronRight, DollarSign } from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

const TABS = [
  { v: '', label: 'All' },
  { v: 'open', label: 'Open' },
  { v: 'scheduled', label: 'Scheduled' },
  { v: 'in_shop', label: 'In shop' },
  { v: 'completed', label: 'Completed' }
];

export default function MaintenancePage() {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      setRows(await wrenchApi.listMaintenance({ status: status || undefined }) || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [status]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-5xl">
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
            <Wrench className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-title text-text-primary">Maintenance</h1>
            <p className="text-[11px] sm:text-body-sm text-text-secondary mt-0.5">
              {rows.length} record{rows.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>
      </header>

      <div className="flex gap-1 border-b border-border-subtle overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        {TABS.map((t) => (
          <button key={t.v} onClick={() => setStatus(t.v)}
            className={`px-3 sm:px-4 py-2 text-body-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              status === t.v
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-8 sm:p-10 text-center">
          <Wrench className="w-7 h-7 sm:w-8 sm:h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No maintenance records yet. Open a truck and create one from a fault code.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="rounded-card border border-border-subtle bg-surface-primary p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <p className="text-body-sm sm:text-body font-medium text-text-primary truncate">{r.title}</p>
                    <StatusPill s={r.status} />
                  </div>
                  <p className="text-[11px] sm:text-small text-text-tertiary truncate">
                    {r.truck?.unit_number ? `Unit ${r.truck.unit_number}` : 'Truck'}
                    {' · '}{prettyType(r.maintenance_type)}
                    {r.actual_cost_cents
                      ? ` · $${(r.actual_cost_cents / 100).toLocaleString()}`
                      : (r.estimated_cost_low_cents && r.estimated_cost_high_cents
                          ? ` · est $${(r.estimated_cost_low_cents/100).toFixed(0)}–$${(r.estimated_cost_high_cents/100).toFixed(0)}`
                          : '')}
                  </p>
                  <p className="text-[11px] sm:text-small text-text-tertiary mt-0.5">
                    Created {new Date(r.created_at).toLocaleDateString()}
                    {r.completed_at ? ` · Completed ${new Date(r.completed_at).toLocaleDateString()}` : ''}
                  </p>
                </div>
                {r.truck && (
                  <Link to={`/o/${orgSlug}/wrench/trucks/${r.truck.id}`}
                    className="text-[11px] sm:text-body-sm text-text-secondary hover:text-text-primary flex-shrink-0 inline-flex items-center whitespace-nowrap">
                    <span className="hidden sm:inline">View truck</span>
                    <ChevronRight className="w-3.5 h-3.5 sm:ml-0.5" />
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function prettyType(t) {
  if (!t) return '—';
  return String(t).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function StatusPill({ s }) {
  const cfg = ({
    open: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    reviewed: 'bg-blue-500/15 text-blue-700 dark:text-blue-400',
    scheduled: 'bg-violet-500/15 text-violet-700 dark:text-violet-400',
    in_shop: 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-400',
    completed: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-500/15 text-red-700 dark:text-red-400',
    deferred: 'bg-gray-500/15 text-gray-600'
  })[s] || 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>{String(s).replace(/_/g, ' ')}</span>;
}
