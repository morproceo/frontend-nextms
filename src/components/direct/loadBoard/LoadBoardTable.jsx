import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronUp, ChevronDown, AlertTriangle, Phone, Building2,
  ExternalLink, Bookmark, Wrench
} from 'lucide-react';
import { codesForLoad } from './equipment';
import LoadBoardMiniMap from './LoadBoardMiniMap';

/**
 * Classic DAT-style load board.
 *
 * Columns:
 *   Age | Pickup | DH-O | Origin | Dest | WT | Size | Dist | Truck | Price | $/mi | Company
 *
 * - Sortable headers (click to toggle asc/desc).
 * - Click a row to expand an inline detail panel with mini-map + broker info.
 * - DH-O (deadhead from origin) is null until carrier home location is wired.
 *   When unavailable we render an em-dash so the column stays aligned.
 */
export default function LoadBoardTable({ loads, orgSlug }) {
  const [sortKey, setSortKey] = useState('posted_at');
  const [sortDir, setSortDir] = useState('desc');
  const [expandedId, setExpandedId] = useState(null);

  const rows = useMemo(() => decorate(loads), [loads]);
  const sorted = useMemo(
    () => sortRows(rows, sortKey, sortDir),
    [rows, sortKey, sortDir]
  );

  const onSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir(key === 'posted_at' ? 'desc' : 'asc');
    }
  };

  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-surface-secondary/60 text-text-tertiary">
            <tr className="text-left">
              <Th label="Age"     k="age_seconds"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <Th label="Pickup"  k="pickup_at"    sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <Th label="DH-O"    k="dh_o" />
              <Th label="Origin"  k="origin_city"  sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <Th label="Destination" k="dest_city" sortKey={sortKey} sortDir={sortDir} onSort={onSort} />
              <Th label="WT"      k="weight_lbs"   sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <Th label="Size"    k="size" />
              <Th label="Dist"    k="miles"        sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <Th label="Truck"   k="truck" />
              <Th label="Price"   k="rate_offered" sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <Th label="$/mi"    k="rpm"          sortKey={sortKey} sortDir={sortDir} onSort={onSort} align="right" />
              <Th label="Company" k="company" />
              <th className="px-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((l) => (
              <Row
                key={l.id}
                load={l}
                orgSlug={orgSlug}
                expanded={expandedId === l.id}
                onToggle={() =>
                  setExpandedId((id) => (id === l.id ? null : l.id))
                }
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ label, k, sortKey, sortDir, onSort, align = 'left' }) {
  const sortable = typeof onSort === 'function' && !!k;
  const active = sortKey === k;
  return (
    <th
      onClick={sortable ? () => onSort(k) : undefined}
      className={`px-3 py-2 font-medium text-[11px] uppercase tracking-wider whitespace-nowrap select-none ${
        align === 'right' ? 'text-right' : ''
      } ${sortable ? 'cursor-pointer hover:text-text-primary' : ''} ${
        active ? 'text-text-primary' : ''
      }`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortable && active &&
          (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </span>
    </th>
  );
}

function Row({ load, orgSlug, expanded, onToggle }) {
  const trucks = codesForLoad(load);
  return (
    <>
      <tr
        onClick={onToggle}
        className={`border-t border-border-subtle cursor-pointer transition-colors ${
          expanded
            ? 'bg-surface-secondary'
            : 'hover:bg-surface-secondary/40 even:bg-surface-secondary/20'
        }`}
      >
        <td className="px-3 py-2">
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
            {load.age_label}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-text-primary">
          {load.pickup_label}
        </td>
        <td className="px-3 py-2 text-text-tertiary whitespace-nowrap">
          {load.dh_o != null ? `${load.dh_o} mi` : '—'}
        </td>
        <td className="px-3 py-2 text-text-primary whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[140px]" title={load.origin_city}>
              {load.origin_city || '—'}
            </span>
            <span className="text-text-tertiary">{load.origin_state}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-text-primary whitespace-nowrap">
          <div className="flex items-center gap-2">
            <span className="truncate max-w-[140px]" title={load.dest_city}>
              {load.dest_city || '—'}
            </span>
            <span className="text-text-tertiary">{load.dest_state}</span>
          </div>
        </td>
        <td className="px-3 py-2 text-right text-text-primary whitespace-nowrap">
          {load.weight_lbs ? `${Math.round(load.weight_lbs / 1000)}k` : '—'}
        </td>
        <td className="px-3 py-2 text-text-primary">
          <SizeIndicator load={load} />
        </td>
        <td className="px-3 py-2 text-right text-text-primary whitespace-nowrap">
          {load.miles ? `${load.miles} mi` : '—'}
        </td>
        <td className="px-3 py-2 text-text-primary whitespace-nowrap">
          {trucks.length === 0 ? '—' : (
            <span className="inline-flex gap-1">
              {trucks.map((c) => (
                <span key={c} className="text-[11px] font-semibold text-text-secondary">{c}</span>
              ))}
            </span>
          )}
        </td>
        <td className="px-3 py-2 text-right text-text-primary whitespace-nowrap font-medium">
          {load.rate_offered != null
            ? `$${Number(load.rate_offered).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
            : <span className="text-text-tertiary text-[11px]">show</span>}
        </td>
        <td className="px-3 py-2 text-right text-text-primary whitespace-nowrap">
          {load.rpm != null
            ? `$${load.rpm.toFixed(2)}`
            : <span className="text-text-tertiary text-[11px]">show</span>}
        </td>
        <td className="px-3 py-2 text-text-primary truncate max-w-[180px]">
          <span className="inline-flex items-center gap-1">
            {load.is_emergency && (
              <AlertTriangle className="w-3 h-3 text-red-500 flex-shrink-0" />
            )}
            <span className="truncate">{load.company || 'Shipper'}</span>
          </span>
        </td>
        <td className="px-2 py-2 text-right">
          <Phone className="w-4 h-4 text-red-500 inline" />
        </td>
      </tr>
      {expanded && (
        <tr className="bg-surface-secondary/30">
          <td colSpan={13} className="px-4 py-5 border-t border-border-subtle">
            <LoadDetailPanel load={load} orgSlug={orgSlug} />
          </td>
        </tr>
      )}
    </>
  );
}

function SizeIndicator({ load }) {
  // Crude: full truckload if weight >= 40k or no weight given (assume full).
  const ltl = load.weight_lbs && load.weight_lbs < 20000;
  return (
    <span
      title={ltl ? 'Partial / LTL' : 'Truckload'}
      className={`inline-block w-3 h-3 rounded-sm ${
        ltl ? 'bg-text-tertiary/30' : 'bg-text-primary'
      }`}
    />
  );
}

function LoadDetailPanel({ load, orgSlug }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-6">
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-body font-semibold text-text-primary">
                {load.reference_number || `#${load.id.slice(0, 6)}`}
              </span>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">
                Posted
              </span>
              <span className="text-small text-text-tertiary">
                Posted {load.age_label} ago
              </span>
            </div>
            <p className="text-body-sm text-text-secondary mt-1">
              {load.pickup_full} → {load.dest_full}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center gap-1">
              <Bookmark className="w-4 h-4" /> Save
            </button>
            <Link
              to={`/o/${orgSlug}/direct/loads/${load.id}/view`}
              className="text-body-sm text-accent hover:underline inline-flex items-center gap-1"
            >
              <ExternalLink className="w-4 h-4" /> Open
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <DetailField label="Truck type" value={load.truck_label} />
          <DetailField label="Distance" value={load.miles ? `${load.miles} mi` : '—'} />
          <DetailField label="Weight" value={load.weight_lbs ? `${load.weight_lbs.toLocaleString()} lbs` : '—'} />
          <DetailField label="Commodity" value={load.commodity || '—'} />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-border-subtle">
          <DetailField
            label="Price"
            value={load.rate_offered != null ? `$${Number(load.rate_offered).toLocaleString()}` : 'Show price'}
            valueClass={load.rate_offered != null ? 'text-text-primary font-semibold' : 'text-accent text-sm'}
          />
          <DetailField
            label="$/mi"
            value={load.rpm != null ? `$${load.rpm.toFixed(2)}` : '—'}
          />
          <DetailField
            label="Pickup window"
            value={load.pickup_window || '—'}
          />
          <DetailField
            label="Reference"
            value={load.reference_number || '—'}
          />
        </div>

        <div className="pt-3 border-t border-border-subtle">
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Posted by</p>
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-text-tertiary" />
            <span className="text-body-sm font-medium text-text-primary">
              {load.company || 'Shipper'}
            </span>
          </div>
        </div>
      </div>

      <LoadBoardMiniMap load={load} className="w-full lg:w-[420px] h-[260px] rounded-card overflow-hidden" />
    </div>
  );
}

function DetailField({ label, value, valueClass }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">
        {label}
      </p>
      <p className={`text-body-sm ${valueClass || 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

// ----------------------------------------------------------------------------
// Helpers

function decorate(loads) {
  const now = Date.now();
  return loads.map((l) => {
    const postedAt = l.posted_at ? new Date(l.posted_at).getTime() : null;
    const pickupAt = l.pickup?.earliest_at ? new Date(l.pickup.earliest_at).getTime() : null;
    const ageSec = postedAt ? Math.max(0, Math.floor((now - postedAt) / 1000)) : null;
    const miles = l.miles || null;
    const rate = l.rate_offered != null ? Number(l.rate_offered) : null;
    const rpm = miles && rate ? rate / miles : null;
    const trucks = codesForLoad(l);
    return {
      ...l,
      age_seconds: ageSec,
      age_label: ageSec == null ? '—' : ageLabel(ageSec),
      pickup_at: pickupAt,
      pickup_label: pickupAt ? new Date(pickupAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—',
      pickup_window: pickupAt ? new Date(pickupAt).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—',
      pickup_full: [l.pickup?.city, l.pickup?.state].filter(Boolean).join(', ') || '—',
      dest_full: [l.delivery?.city, l.delivery?.state].filter(Boolean).join(', ') || '—',
      origin_city: l.pickup?.city || '',
      origin_state: l.pickup?.state || '',
      dest_city: l.delivery?.city || '',
      dest_state: l.delivery?.state || '',
      miles,
      rpm,
      truck: trucks.join(' '),
      truck_label: trucks.length ? trucks.join(' / ') : '—',
      company: l.postingOrganization?.name,
      dh_o: null
    };
  });
}

function ageLabel(seconds) {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function sortRows(rows, key, dir) {
  const factor = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[key];
    const bv = b[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;     // nulls always last
    if (bv == null) return -1;
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * factor;
    return String(av).localeCompare(String(bv)) * factor;
  });
}
