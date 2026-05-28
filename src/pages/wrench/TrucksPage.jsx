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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
          <Truck className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title text-text-primary">Trucks</h1>
          <p className="text-[11px] sm:text-body-sm text-text-secondary mt-0.5">
            {trucks.length} truck{trucks.length === 1 ? '' : 's'}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {trucks.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-8 sm:p-10 text-center">
          <Truck className="w-7 h-7 sm:w-8 sm:h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No trucks yet.</p>
        </div>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
          <ul className="divide-y divide-border-subtle">
            {trucks.map((t) => (
              <li key={t.id}>
                <Link to={`/o/${orgSlug}/wrench/trucks/${t.id}`}
                  className="flex items-center gap-3 p-3 sm:p-4 hover:bg-surface-secondary/40 transition-colors">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
                    <Truck className="w-4 h-4 text-text-tertiary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-body-sm sm:text-body font-medium text-text-primary truncate">{t.unit_number || '—'}</p>
                      <HealthPill h={t.health} />
                    </div>
                    <p className="text-[11px] sm:text-small text-text-tertiary truncate">
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
