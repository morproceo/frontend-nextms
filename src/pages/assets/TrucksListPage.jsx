/**
 * TrucksListPage — same design language as the drivers list:
 *   - KPI strip on top (compact 4-col mobile grid, full row on desktop)
 *   - Smart search with clear-X and live count
 *   - Compact dropdown filter pill (status)
 *   - Row design: colored avatar + bold unit + meta line + colored status pill
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrucks } from '../../hooks';
import {
  AssetStatusConfig,
  TruckTypeConfig,
  getStatusConfig
} from '../../config/status';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { cn } from '../../lib/utils';
import {
  Truck, Plus, Search, User, Container, ChevronRight, ChevronDown,
  AlertTriangle, Wrench, Power, X, Activity, UserCheck
} from 'lucide-react';

function KpiCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start sm:gap-3">
      <div className={cn(
        'w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0',
        tone === 'accent' && 'bg-accent/10 text-accent',
        tone === 'green'  && 'bg-emerald-50 text-emerald-600',
        tone === 'amber'  && 'bg-amber-50 text-amber-600',
        tone === 'red'    && 'bg-red-50 text-red-600',
        !tone             && 'bg-surface-secondary text-text-secondary'
      )}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="min-w-0 w-full sm:flex-1 leading-tight text-center sm:text-left mt-1 sm:mt-0">
        <p className="text-[9px] sm:text-[11px] uppercase tracking-wide text-text-tertiary truncate">{label}</p>
        <p className={cn(
          'text-base sm:text-2xl font-semibold truncate leading-tight',
          tone === 'green'  && 'text-emerald-700',
          tone === 'amber'  && 'text-amber-700',
          tone === 'red'    && 'text-red-700',
          tone === 'accent' && 'text-accent',
          !tone             && 'text-text-primary'
        )}>{value}</p>
      </div>
    </div>
  );
}

function FilterDropdown({ label, value, options, onChange }) {
  const current = options.find((o) => o.v === value) || options[0];
  const active = value && value !== 'all';
  return (
    <label className={cn(
      'relative flex sm:inline-flex items-center justify-between sm:justify-start gap-2 px-3 sm:px-4 py-3 rounded-xl cursor-pointer transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04)] min-w-0',
      active
        ? 'bg-accent/10 border border-accent/30 text-accent'
        : 'bg-white border border-gray-200 text-text-secondary hover:bg-surface-secondary'
    )}>
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-small text-text-tertiary shrink-0">{label}:</span>
        <span className={cn('text-body-sm font-semibold truncate', active ? 'text-accent' : 'text-text-primary')}>
          {current.label}
        </span>
      </span>
      <ChevronDown className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-text-tertiary')} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}

export function TrucksListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const {
    trucks,
    allTrucks,
    stats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    refetch
  } = useTrucks();

  const handleAddTruck = () => navigate(orgUrl('/assets/trucks/new'));
  const handleTruckClick = (truckId) => navigate(orgUrl(`/assets/trucks/${truckId}`));

  if (loading && allTrucks.length === 0) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title font-semibold text-text-primary">Trucks</h1>
          <p className="text-body-sm text-text-secondary mt-1 hidden sm:block">
            Manage your fleet's trucks and power units
          </p>
        </div>
        <Button onClick={handleAddTruck} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Truck</span>
        </Button>
      </div>

      {/* KPI Strip */}
      {allTrucks.length > 0 && (
        <div className="grid grid-cols-4 lg:grid-cols-4 gap-2 sm:gap-3">
          <KpiCard icon={Truck}     label="Total"        value={stats.total} />
          <KpiCard icon={Activity}  label="Active"       value={stats.active}      tone="green" />
          <KpiCard icon={Wrench}    label="Maintenance"  value={stats.maintenance} tone="amber" />
          <KpiCard icon={UserCheck} label="With drivers" value={stats.withDrivers} tone="accent" />
        </div>
      )}

      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by unit #, VIN, make, or model…"
            value={filters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-body text-text-primary placeholder:text-text-tertiary shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {filters.search && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-small text-text-tertiary tabular-nums">
              {trucks.length}/{allTrucks.length}
            </span>
          </div>
        </div>

        <FilterDropdown
          label="Status"
          value={filters.status}
          onChange={setStatusFilter}
          options={[
            { v: 'all', label: 'All' },
            ...Object.values(AssetStatusConfig).map((c) => ({ v: c.value, label: c.label }))
          ]}
        />
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600" />
          </div>
          <div className="flex-1">
            <p className="text-body-sm font-medium text-red-700">Error loading trucks</p>
            <p className="text-small text-red-600">{error}</p>
          </div>
          <Button variant="secondary" size="sm" onClick={refetch}>Retry</Button>
        </div>
      )}

      {/* Empty */}
      {!error && trucks.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] p-10 text-center">
          <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-body font-semibold text-text-primary mb-1">
            {allTrucks.length === 0 ? 'No trucks yet' : 'No trucks match your filters'}
          </h3>
          <p className="text-body-sm text-text-secondary mb-4">
            {allTrucks.length === 0 ? 'Add your first truck to get started' : 'Try adjusting your search or filters'}
          </p>
          {allTrucks.length === 0 && (
            <Button onClick={handleAddTruck}>
              <Plus className="w-4 h-4 mr-2" />
              Add Truck
            </Button>
          )}
        </div>
      )}

      {/* List */}
      {!error && trucks.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="divide-y divide-gray-100">
            {trucks.map((truck) => {
              const statusConfig = getStatusConfig(AssetStatusConfig, truck.status);
              const typeConfig = truck.typeConfig || TruckTypeConfig[truck.truck_type];
              const sv = statusConfig.variant;

              return (
                <div
                  key={truck.id}
                  onClick={() => handleTruckClick(truck.id)}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-secondary/60 cursor-pointer transition-colors group"
                >
                  {/* Truck icon avatar */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <Truck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-body font-semibold text-text-primary truncate">
                        Unit #{truck.unit_number}
                      </p>
                      {truck.is_power_only && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                          <Power className="w-2.5 h-2.5" /> Power
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap text-small text-text-secondary">
                      <span className="truncate">
                        {[truck.year, truck.make, truck.model].filter(Boolean).join(' ') || '—'}
                      </span>
                      {typeConfig?.label && <span className="text-text-tertiary">· {typeConfig.label}</span>}
                      {truck.currentDriver && (
                        <span className="flex items-center gap-1 text-text-secondary">
                          <User className="w-3 h-3" />
                          {truck.currentDriver.first_name} {truck.currentDriver.last_name?.[0]}.
                        </span>
                      )}
                      {truck.currentTrailer && (
                        <span className="flex items-center gap-1">
                          <Container className="w-3 h-3" />
                          #{truck.currentTrailer.unit_number}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status pill — same color system as drivers */}
                  <span className={cn(
                    'hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-semibold border whitespace-nowrap',
                    sv === 'green' && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    sv === 'blue'  && 'bg-blue-50 text-blue-700 border-blue-200',
                    (sv === 'amber' || sv === 'yellow') && 'bg-amber-50 text-amber-700 border-amber-200',
                    sv === 'red'   && 'bg-red-50 text-red-700 border-red-200',
                    (!sv || sv === 'gray') && 'bg-surface-secondary text-text-secondary border-surface-tertiary'
                  )}>
                    {truck.status === 'maintenance' && <Wrench className="w-3 h-3" />}
                    {statusConfig.label || truck.status}
                  </span>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TrucksListPage;
