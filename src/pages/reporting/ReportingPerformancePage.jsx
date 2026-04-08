/**
 * ReportingPerformancePage - Performance Report with entity filtering
 *
 * Uses useReportingPerformance hook. Filter by driver, truck, or dispatcher.
 * KPIs recompute instantly on filter change (client-side).
 */

import { useMemo } from 'react';
import { useReportingPerformance } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { LoadStatusConfig, getStatusConfig } from '../../config/status';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Package,
  DollarSign,
  TrendingUp,
  MapPin,
  Download,
  RefreshCw,
  X
} from 'lucide-react';

// ── Formatters ──────────────────────────────────────────────

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatRate = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// ── Period Selector ─────────────────────────────────────────

function PeriodSelector({ period, setPeriod, presets }) {
  return (
    <div className="flex bg-surface-secondary rounded-lg p-0.5 overflow-x-auto no-scrollbar">
      {Object.entries(presets).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={`px-3 py-1.5 text-small font-medium rounded-md whitespace-nowrap transition-all ${
            period === key
              ? 'bg-surface shadow-sm text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Loads Table (Desktop) ───────────────────────────────────

function LoadsTable({ loads }) {
  if (!loads || loads.length === 0) {
    return (
      <Card variant="elevated" padding="default">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Package className="w-10 h-10 text-text-tertiary mb-2" />
          <p className="text-body-sm text-text-secondary">No loads found</p>
          <p className="text-small text-text-tertiary mt-1">
            Try adjusting your filters or date range
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="none">
      <div className="px-6 py-4 border-b border-surface-tertiary">
        <h2 className="text-title-sm text-text-primary">
          Loads ({loads.length})
        </h2>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full min-w-[700px]">
          <thead>
            <tr className="border-b border-surface-tertiary">
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Ref #</th>
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Lane</th>
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Driver</th>
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Truck</th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Miles</th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Revenue</th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">RPM</th>
              <th className="px-6 py-3 text-center text-small font-medium text-text-secondary uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-tertiary">
            {loads.map((load) => {
              const revenue = Number(load.revenue) || 0;
              const miles = Number(load.miles) || 0;
              const rpm = miles > 0 ? revenue / miles : 0;
              const statusConfig = getStatusConfig(LoadStatusConfig, load.status);

              return (
                <tr key={load.id} className="hover:bg-surface-secondary/50">
                  <td className="px-6 py-3 text-body-sm font-medium text-text-primary">
                    {load.reference_number || '—'}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-secondary max-w-[200px] truncate">
                    {load.lane}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary">
                    {load.driverName}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-secondary">
                    {load.truckUnit}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary text-right tabular-nums">
                    {miles > 0 ? miles.toLocaleString() : '—'}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary text-right tabular-nums">
                    {formatCurrency(revenue)}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary text-right tabular-nums">
                    {rpm > 0 ? formatRate(rpm) : '—'}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <Badge variant={statusConfig?.color || 'gray'}>
                      {statusConfig?.label || load.status}
                    </Badge>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden divide-y divide-surface-tertiary">
        {loads.map((load) => {
          const revenue = Number(load.revenue) || 0;
          const miles = Number(load.miles) || 0;
          const rpm = miles > 0 ? revenue / miles : 0;
          const statusConfig = getStatusConfig(LoadStatusConfig, load.status);

          return (
            <div key={load.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-body-sm font-medium text-text-primary">
                  {load.reference_number || '—'}
                </span>
                <Badge variant={statusConfig?.color || 'gray'}>
                  {statusConfig?.label || load.status}
                </Badge>
              </div>
              <p className="text-small text-text-secondary truncate">{load.lane}</p>
              <div className="flex items-center justify-between text-small">
                <span className="text-text-tertiary">{load.driverName}</span>
                <span className="text-text-primary font-medium tabular-nums">
                  {formatCurrency(revenue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-small">
                <span className="text-text-tertiary">{miles > 0 ? `${miles.toLocaleString()} mi` : '—'}</span>
                <span className="text-text-tertiary tabular-nums">
                  {rpm > 0 ? `${formatRate(rpm)}/mi` : ''}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

// ── Main Page ───────────────────────────────────────────────

export function ReportingPerformancePage() {
  const {
    filteredLoads,
    metrics,
    period,
    setPeriod,
    periodPresets,
    driverId,
    setDriverId,
    truckId,
    setTruckId,
    dispatcherId,
    setDispatcherId,
    driverOptions,
    truckOptions,
    dispatcherOptions,
    loading,
    refetch
  } = useReportingPerformance();

  const hasFilters = driverId || truckId || dispatcherId;

  const clearFilters = () => {
    setDriverId(null);
    setTruckId(null);
    setDispatcherId(null);
  };

  // KPI cards
  const kpiCards = useMemo(() => [
    {
      name: 'Total Loads',
      value: loading ? '—' : metrics.totalLoads.toString(),
      icon: Package,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Revenue',
      value: loading ? '—' : formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Total Miles',
      value: loading ? '—' : (metrics.totalMiles || 0).toLocaleString(),
      icon: MapPin,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      name: 'Rate/Mile',
      value: loading ? '—' : formatRate(metrics.revenuePerMile),
      icon: TrendingUp,
      iconBg: metrics.revenuePerMile > metrics.costPerMile ? 'bg-green-500/10' : 'bg-warning/10',
      iconColor: metrics.revenuePerMile > metrics.costPerMile ? 'text-green-500' : 'text-warning'
    }
  ], [metrics, loading]);

  // Export filtered loads as CSV
  const handleExport = () => {
    if (!filteredLoads || filteredLoads.length === 0) return;
    exportToCSV(
      filteredLoads,
      [
        { label: 'Reference #', accessor: row => row.reference_number || '' },
        { label: 'Lane', accessor: row => row.lane || '' },
        { label: 'Driver', accessor: row => row.driverName || '' },
        { label: 'Truck', accessor: row => row.truckUnit || '' },
        { label: 'Miles', accessor: row => Number(row.miles) || 0 },
        { label: 'Revenue', accessor: row => Number(row.revenue) || 0 },
        { label: 'RPM', accessor: row => {
          const rev = Number(row.revenue) || 0;
          const mi = Number(row.miles) || 0;
          return mi > 0 ? (rev / mi).toFixed(2) : '0.00';
        }},
        { label: 'Status', accessor: row => row.status || '' }
      ],
      'performance-report'
    );
  };

  if (loading && filteredLoads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-title text-text-primary">Performance Report</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Load performance filtered by driver, truck, or dispatcher
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            period={period}
            setPeriod={setPeriod}
            presets={periodPresets}
          />
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={filteredLoads.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-button text-body-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <Card variant="elevated" padding="default">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-small font-medium text-text-secondary mb-1 block">Driver</label>
            <SearchableSelect
              value={driverId}
              onChange={(opt) => setDriverId(opt?.id || null)}
              options={driverOptions}
              placeholder="All Drivers"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-small font-medium text-text-secondary mb-1 block">Truck</label>
            <SearchableSelect
              value={truckId}
              onChange={(opt) => setTruckId(opt?.id || null)}
              options={truckOptions}
              placeholder="All Trucks"
            />
          </div>
          <div className="flex-1 w-full sm:w-auto">
            <label className="text-small font-medium text-text-secondary mb-1 block">Dispatcher</label>
            <SearchableSelect
              value={dispatcherId}
              onChange={(opt) => setDispatcherId(opt?.id || null)}
              options={dispatcherOptions}
              placeholder="All Dispatchers"
            />
          </div>
          {hasFilters && (
            <div className="sm:self-end">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 px-3 py-2 text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary rounded-button transition-colors"
              >
                <X className="w-4 h-4" />
                Clear
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* 4 KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <Card key={card.name} padding="compact" className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-body-sm text-text-secondary truncate">{card.name}</p>
                <p className="text-title-sm sm:text-headline text-text-primary mt-0.5 sm:mt-1 tabular-nums">
                  {card.value}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Loads Table */}
      <LoadsTable loads={filteredLoads} />
    </div>
  );
}

export default ReportingPerformancePage;
