import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Truck, Loader2, ChevronRight } from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

/**
 * Trucks list — same data as command center's table, no stat cards.
 * Standalone page for "I just want the fleet view."
 */
export default function TrucksPage() {
  const { orgSlug } = useParams();
  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    wrenchApi.listTrucks()
      .then((t) => setTrucks(t || []))
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>;

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <Truck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Trucks</h1>
          <p className="text-body-sm text-text-secondary">{trucks.length} truck{trucks.length === 1 ? '' : 's'}</p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {trucks.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Truck className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No trucks yet.</p>
        </div>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {trucks.map((t) => (
              <li key={t.id}>
                <Link to={`/o/${orgSlug}/wrench/trucks/${t.id}`}
                  className="flex items-center gap-3 p-4 hover:bg-surface-secondary/40 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-body font-medium text-text-primary">{t.unit_number || '—'}</p>
                      <HealthPill h={t.health} />
                    </div>
                    <p className="text-small text-text-tertiary truncate">
                      {[t.year, t.make, t.model].filter(Boolean).join(' ') || '—'}
                      {t.current_odometer ? ` · ${Number(t.current_odometer).toLocaleString()} mi` : ''}
                      {t.active_fault_count ? ` · ${t.active_fault_count} active code${t.active_fault_count === 1 ? '' : 's'}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
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
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>{h || 'unknown'}</span>;
}
