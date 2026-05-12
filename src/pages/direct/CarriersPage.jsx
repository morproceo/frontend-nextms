import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, Loader2, Building2, BadgeCheck, Zap } from 'lucide-react';
import networkApi from '../../api/network.api';
import { gradeFromScore } from './CarrierDetailPage';

/**
 * Public carrier directory — Phase 1.
 * Shows visibility_status='public' carriers with simple filters.
 */
export default function CarriersPage() {
  const { orgSlug } = useParams();
  const [carriers, setCarriers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    equipment: '',
    region: '',
    lane: '',
    instant_booking: false,
    verified: false
  });

  const refresh = async (f = filters) => {
    setLoading(true);
    setError(null);
    try {
      const list = await networkApi.listCarriers({
        equipment: f.equipment || undefined,
        region: f.region || undefined,
        lane: f.lane || undefined,
        instant_booking: f.instant_booking ? 'true' : undefined,
        verified: f.verified ? 'true' : undefined
      });
      setCarriers(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, []);

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
          <Search className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Find carriers</h1>
          <p className="text-body-sm text-text-secondary">Verified carriers in MorPro Direct.</p>
        </div>
      </header>

      <div className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <FilterText label="Equipment" placeholder="dry_van" value={filters.equipment}
          onChange={(v) => setFilters({ ...filters, equipment: v })} />
        <FilterText label="Region" placeholder="northeast" value={filters.region}
          onChange={(v) => setFilters({ ...filters, region: v })} />
        <FilterText label="Lane" placeholder="LA" value={filters.lane}
          onChange={(v) => setFilters({ ...filters, lane: v })} />
        <FilterToggle label="Instant booking" value={filters.instant_booking}
          onChange={(v) => setFilters({ ...filters, instant_booking: v })} />
        <FilterToggle label="Verified" value={filters.verified}
          onChange={(v) => setFilters({ ...filters, verified: v })} />
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-small text-text-tertiary">
          {loading ? 'Loading…' : `${carriers.length} carrier${carriers.length === 1 ? '' : 's'}`}
        </p>
        <button
          onClick={() => refresh(filters)}
          className="px-3 py-1.5 rounded-button text-small font-medium border border-border hover:bg-surface-secondary"
        >
          Apply filters
        </button>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
        </div>
      ) : carriers.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Building2 className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No carriers match these filters.</p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {carriers.map(({ organization: o, profile: p }) => (
            <li key={o.id}>
              <Link
                to={`/o/${orgSlug}/direct/carriers/${o.slug}`}
                className="block rounded-card border border-border-subtle bg-surface-primary p-4 hover:border-border transition-colors"
              >
                <div className="flex items-start gap-3">
                  {o.logo_url ? (
                    <img src={o.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-text-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1 flex-wrap">
                      <p className="text-body font-medium text-text-primary truncate">{o.name}</p>
                      {o.is_morpro_verified && (
                        <BadgeCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" title="Verified by MorPro" />
                      )}
                      {p.instant_booking_enabled && (
                        <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" title="Instant booking enabled" />
                      )}
                      {(() => {
                        const grade = gradeFromScore(o.carrier_grade_score);
                        if (!grade) return null;
                        const tone = grade.startsWith('A') ? 'bg-emerald-500/10 text-emerald-700'
                          : grade === 'B' ? 'bg-blue-500/10 text-blue-700'
                          : grade === 'C' ? 'bg-amber-500/10 text-amber-700'
                          : 'bg-red-500/10 text-red-700';
                        return (
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${tone}`}>{grade}</span>
                        );
                      })()}
                    </div>
                    <p className="text-small text-text-tertiary truncate">
                      {[o.city, o.state].filter(Boolean).join(', ') || '—'} · MC {o.mc_number || '—'}
                    </p>
                    <p className="text-small text-text-secondary mt-2 truncate">
                      {Array.isArray(p.equipment_types) && p.equipment_types.length > 0
                        ? p.equipment_types.join(', ')
                        : '—'}
                    </p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function FilterText({ label, placeholder, value, onChange }) {
  return (
    <div>
      <label className="block text-small text-text-tertiary mb-1">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-2 py-1.5 rounded-button border border-border bg-surface-primary text-body-sm"
      />
    </div>
  );
}

function FilterToggle({ label, value, onChange }) {
  return (
    <label className="flex items-center gap-2 mt-5">
      <input
        type="checkbox"
        checked={value}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-body-sm text-text-primary">{label}</span>
    </label>
  );
}
