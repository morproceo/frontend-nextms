import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Package, Plus, Loader2, Search, ChevronRight,
  Building2, Gavel, Truck, AlertTriangle, LayoutGrid, Map as MapIcon, List
} from 'lucide-react';
import networkApi from '../../../api/network.api';
import { useOrg } from '../../../contexts/OrgContext';
import LoadBoardTable from '../../../components/direct/loadBoard/LoadBoardTable';
import LoadBoardMap from '../../../components/direct/loadBoard/LoadBoardMap';
import {
  FILTER_CHIPS, EQUIPMENT_LABELS, codeToBackendType, codesForLoad
} from '../../../components/direct/loadBoard/equipment';

const SHIPPER_TABS = [
  { value: '', label: 'All' },
  { value: 'draft', label: 'Drafts' },
  { value: 'posted', label: 'Posted' },
  { value: 'receiving_bids', label: 'Receiving bids' },
  { value: 'booked', label: 'Booked' },
  { value: 'cancelled', label: 'Cancelled' }
];

/**
 * /loads — branches on currentOrg.network_roles:
 *   - shipper-side org → list of MY posted loads (with bid summaries).
 *   - carrier-side org → available-loads board.
 * Hybrid orgs default to shipper view (their nav item that brought them here
 * is "My loads", not "Find loads"; see DirectShell).
 */
export default function MyLoadsPage() {
  const { currentOrg } = useOrg();
  const networkRoles = currentOrg?.network_roles || [];
  const isShipperSide =
    networkRoles.includes('shipper') ||
    networkRoles.includes('3pl') ||
    networkRoles.includes('manufacturer');

  return isShipperSide ? <ShipperMyLoads /> : <CarrierLoadBoard />;
}

function ShipperMyLoads() {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('');
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await networkApi.listMyLoads(status || undefined);
      setLoads(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, [status]);

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
            <Package className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-title text-text-primary">My loads</h1>
            <p className="text-body-sm text-text-secondary">Loads you've posted to MorPro Direct.</p>
          </div>
        </div>
        <Link to={`/o/${orgSlug}/direct/loads/new`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover">
          <Plus className="w-4 h-4" /> Post a load
        </Link>
      </header>

      <div className="flex gap-1 mb-4 border-b border-border-subtle overflow-x-auto">
        {SHIPPER_TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              status === t.value
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <Center><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></Center>
      ) : loads.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Package className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No loads here yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {loads.map((l) => (
            <li key={l.id}>
              <Link to={`/o/${orgSlug}/direct/loads/${l.id}`}
                className="flex items-center justify-between gap-3 p-4 rounded-card border border-border-subtle bg-surface-primary hover:border-border transition-colors">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-body font-medium text-text-primary truncate">
                      {l.reference_number || `#${l.id.slice(0, 6)}`}
                    </p>
                    <StatusPill status={l.network_status} />
                  </div>
                  <p className="text-small text-text-tertiary truncate">
                    {l.pickup?.city}, {l.pickup?.state} → {l.delivery?.city}, {l.delivery?.state}
                    {l.commodity ? ` · ${l.commodity}` : ''}
                    {l.rate_offered ? ` · $${Number(l.rate_offered).toFixed(2)}` : ''}
                  </p>
                  <p className="text-small text-text-secondary mt-1">
                    {l.bid_summary?.total ?? 0} bid{(l.bid_summary?.total ?? 0) === 1 ? '' : 's'}
                    {l.bid_summary?.pending ? ` · ${l.bid_summary.pending} pending` : ''}
                  </p>
                </div>
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CarrierLoadBoard() {
  const { orgSlug } = useParams();
  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ trucks: [], region: '', lane: '' });
  const [viewMode, setViewMode] = useState('table'); // 'table' | 'map' | 'cards'

  const refresh = async () => {
    setLoading(true);
    try {
      // When 0 or 1 truck chips are selected we let the backend filter.
      // For multi-select we fetch unfiltered and narrow client-side below.
      const oneType = filters.trucks.length === 1
        ? codeToBackendType(filters.trucks[0])
        : undefined;
      const list = await networkApi.listAvailableLoads({
        equipment: oneType,
        region: filters.region || undefined,
        lane: filters.lane || undefined
      });
      setLoads(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); /* eslint-disable-line */ }, []);

  const filteredLoads = useMemo(() => {
    if (filters.trucks.length < 2) return loads;
    const allowed = new Set(filters.trucks);
    return loads.filter((l) => {
      const codes = codesForLoad(l);
      return codes.some((c) => allowed.has(c));
    });
  }, [loads, filters.trucks]);

  const toggleTruck = (code) => {
    setFilters((f) => {
      const has = f.trucks.includes(code);
      return {
        ...f,
        trucks: has ? f.trucks.filter((c) => c !== code) : [...f.trucks, code]
      };
    });
  };

  return (
    <div className="px-6 py-10 max-w-7xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-title text-text-primary">Find loads</h1>
            <p className="text-body-sm text-text-secondary">
              {loading ? 'Loading…' : `${filteredLoads.length} load${filteredLoads.length === 1 ? '' : 's'} found`}
            </p>
          </div>
        </div>
        <ViewToggle value={viewMode} onChange={setViewMode} />
      </header>

      <div className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <Field label="Origin (state)">
            <Input value={filters.region}
              onChange={(e) => setFilters({ ...filters, region: e.target.value })}
              placeholder="TX" />
          </Field>
          <Field label="Lane match">
            <Input value={filters.lane}
              onChange={(e) => setFilters({ ...filters, lane: e.target.value })}
              placeholder="dallas" />
          </Field>
          <button onClick={refresh}
            className="px-3 py-2 rounded-button text-body-sm font-medium bg-accent text-white hover:bg-accent-hover inline-flex items-center justify-center gap-2">
            <Search className="w-4 h-4" /> Search
          </button>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5">Truck type</p>
          <div className="flex flex-wrap gap-1.5">
            {FILTER_CHIPS.map((code) => {
              const active = filters.trucks.includes(code);
              return (
                <button key={code} onClick={() => toggleTruck(code)}
                  title={EQUIPMENT_LABELS[code]}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                    active
                      ? 'bg-text-primary text-surface-primary border-text-primary'
                      : 'bg-surface-primary text-text-secondary border-border hover:border-text-secondary'
                  }`}>
                  {code}
                </button>
              );
            })}
            {filters.trucks.length > 0 && (
              <button onClick={() => setFilters({ ...filters, trucks: [] })}
                className="text-[11px] text-text-tertiary hover:text-text-primary px-2 py-1">
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <Center><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></Center>
      ) : filteredLoads.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Package className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No matching loads right now.</p>
        </div>
      ) : viewMode === 'map' ? (
        <LoadBoardMap loads={filteredLoads} orgSlug={orgSlug} />
      ) : viewMode === 'table' ? (
        <LoadBoardTable loads={filteredLoads} orgSlug={orgSlug} />
      ) : (
        <CardsGrid loads={filteredLoads} orgSlug={orgSlug} />
      )}
    </div>
  );
}

function ViewToggle({ value, onChange }) {
  const opts = [
    { v: 'table', icon: List, label: 'Table' },
    { v: 'map', icon: MapIcon, label: 'Map' },
    { v: 'cards', icon: LayoutGrid, label: 'Cards' }
  ];
  return (
    <div className="inline-flex items-center bg-surface-secondary rounded-button p-1">
      {opts.map(({ v, icon: I, label }) => (
        <button key={v} onClick={() => onChange(v)}
          className={`px-3 py-1.5 rounded-button text-body-sm font-medium inline-flex items-center gap-1.5 transition-colors ${
            value === v
              ? 'bg-surface-primary text-text-primary shadow-sm'
              : 'text-text-tertiary hover:text-text-primary'
          }`}>
          <I className="w-4 h-4" /> {label}
        </button>
      ))}
    </div>
  );
}

function CardsGrid({ loads, orgSlug }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {loads.map((l) => (
        <li key={l.id}>
          <Link to={`/o/${orgSlug}/direct/loads/${l.id}/view`}
            className="block rounded-card border border-border-subtle bg-surface-primary p-4 hover:border-border transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <p className="text-body font-medium text-text-primary truncate flex-1">
                {l.reference_number || `#${l.id.slice(0, 6)}`}
              </p>
              {l.is_emergency && (
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-700 dark:text-red-400" title="Urgent capacity request">
                  <AlertTriangle className="w-3 h-3" /> URGENT
                </span>
              )}
              <StatusPill status={l.network_status} />
            </div>
            <p className="text-body-sm text-text-primary truncate">
              {l.pickup?.city}, {l.pickup?.state} → {l.delivery?.city}, {l.delivery?.state}
            </p>
            <p className="text-small text-text-tertiary mt-1 truncate">
              {l.commodity || '—'}
              {l.weight_lbs ? ` · ${Number(l.weight_lbs).toLocaleString()} lbs` : ''}
              {l.miles ? ` · ${l.miles} mi` : ''}
            </p>
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border-subtle">
              <div className="flex items-center gap-1 text-small text-text-tertiary">
                <Building2 className="w-3 h-3" />
                {l.postingOrganization?.name || 'Shipper'}
              </div>
              {l.rate_offered != null && (
                <p className="text-body-sm font-medium text-text-primary">${Number(l.rate_offered).toFixed(2)}</p>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function StatusPill({ status }) {
  const cfg = ({
    draft: 'bg-gray-500/10 text-gray-600 dark:text-gray-400',
    posted: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    receiving_bids: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    booked: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    in_progress: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    delivered: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    completed: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    cancelled: 'bg-red-500/10 text-red-700 dark:text-red-400',
    disputed: 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
  })[status] || 'bg-gray-500/10 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}

function Center({ children }) {
  return <div className="flex items-center justify-center py-16">{children}</div>;
}
function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-small text-text-tertiary mb-1">{label}</span>
      {children}
    </label>
  );
}
function Input(props) {
  return <input {...props} className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />;
}
