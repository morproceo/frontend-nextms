/**
 * LoadsListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useLoads hook
 * - Component focuses on rendering
 */

import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useLoads } from '../../hooks';
import loadsApi from '../../api/loads.api';
import {
  LoadStatusConfig,
  BillingStatusConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { LoadFormModal } from '../../components/features/loads/LoadFormModal';
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  FileText,
  AlertTriangle,
  MoreHorizontal,
  Package,
  MapPin,
  ArrowRight,
  Calendar,
  ChevronRight,
  X,
  Truck,
  Receipt,
  DollarSign,
  TrendingUp,
  ArrowUpDown,
  ListFilter,
  Camera,
  Sparkles,
  Loader2
} from 'lucide-react';

export function LoadsListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const {
    loads,
    allLoads,
    stats,
    filteredStats,
    quickFilters,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    setSort,
    refetch,
    createLoad
  } = useLoads();

  // Modal state (UI concern, stays in component)
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadPrefill, setLoadPrefill] = useState(null);
  // Add-load bottom sheet (scan rate-con vs manual)
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const rateConInputRef = useRef(null);

  const handleScanRateCon = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanError(null);
    try {
      const result = await loadsApi.parseRateCon(file);
      const extracted = result?.data || result || {};
      setLoadPrefill(extracted);
      setShowAddSheet(false);
      setShowLoadModal(true);
    } catch (err) {
      console.error('Rate-con scan failed:', err);
      setScanError('Could not read that rate confirmation. Try a clearer scan or enter manually.');
    } finally {
      setScanning(false);
    }
  };

  // Event handlers
  const handleLoadClick = (loadId) => {
    navigate(orgUrl(`/loads/${loadId}`));
  };

  const handleBrokerClick = (e, brokerId) => {
    e.stopPropagation();
    navigate(orgUrl(`/customers/brokers/${brokerId}`));
  };

  const handleCreateSuccess = async (load) => {
    setShowLoadModal(false);
    navigate(orgUrl(`/loads/${load.id}`));
  };

  // Formatting helpers
  const formatDate = (date) => {
    if (!date) return '-';
    const d = new Date(typeof date === 'string' && date.length === 10 ? date + 'T12:00:00' : date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const getLocationShort = (loc) => {
    if (!loc) return '-';
    const city = loc.city || '';
    const state = loc.state || '';
    if (city && state) return `${city}, ${state}`;
    return city || state || '-';
  };

  // Sort header component
  const SortHeader = ({ field, children, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none transition-colors ${className}`}
      onClick={() => setSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {filters.sort.field === field && (
          filters.sort.direction === 'asc'
            ? <ChevronUp className="w-3 h-3" />
            : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  // Loading state
  if (loading && allLoads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Operational status buckets — what dispatchers actually scan for.
  // "Active" = anything between booked and delivered; "Ready to bill" =
  // delivered but no invoice yet (or in finance review); "Invoiced" =
  // invoiced or paid; "New" = newly created, not yet booked.
  const byS = stats.byStatus || {};
  const sumOf = (...keys) => keys.reduce((a, k) => a + (byS[k] || 0), 0);
  const metricBuckets = [
    {
      key: 'active',
      label: 'Active',
      icon: Truck,
      tint: '#34CCFF',
      count: sumOf('booked', 'dispatched', 'picked_up', 'in_transit', 'delayed'),
      statuses: ['booked', 'dispatched', 'picked_up', 'in_transit', 'delayed']
    },
    {
      key: 'ready',
      label: 'Ready to bill',
      icon: Receipt,
      tint: '#F59E0B',
      count: sumOf('delivered', 'review'),
      statuses: ['delivered', 'review']
    },
    {
      key: 'invoiced',
      label: 'Invoiced',
      icon: FileText,
      tint: '#8B5CF6',
      count: sumOf('invoiced', 'paid', 'completed'),
      statuses: ['invoiced', 'paid', 'completed']
    },
    {
      key: 'new',
      label: 'New',
      icon: Plus,
      tint: '#10B981',
      count: sumOf('new', 'draft'),
      statuses: ['new', 'draft']
    }
  ];
  // First filter status the bucket maps to (the chip list expects a single
  // value, so we use the head of each bucket as the canonical pick).
  const activeBucket = metricBuckets.find((b) => b.statuses.includes(filters.status))?.key;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Loads</h1>
          <Badge variant="gray" size="sm" className="hidden sm:inline-flex">{stats.total}</Badge>
        </div>

        <Button onClick={() => setShowAddSheet(true)} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Load</span>
        </Button>
      </div>

      {/* ── Metrics row — operational view of the load board ─────────────
          4 status-bucket cards + 2 financial KPIs. The status buckets are
          clickable shortcuts into the existing status filter (clicking the
          same bucket again clears back to "all"). Horizontal scroll on
          mobile so they take ~70px instead of half the screen. */}
      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-2.5">
        {metricBuckets.map((b) => {
          const isActive = activeBucket === b.key;
          const Icon = b.icon;
          return (
            <button
              key={b.key}
              onClick={() => setStatusFilter(isActive ? 'all' : b.statuses[0])}
              className={`group relative rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border transition-all flex flex-col sm:block items-center sm:items-stretch text-center sm:text-left ${
                isActive
                  ? 'border-transparent shadow-card-hover'
                  : 'bg-white border-surface-tertiary hover:border-surface-tertiary hover:shadow-card'
              }`}
              style={isActive ? { backgroundColor: `${b.tint}10`, borderColor: `${b.tint}40` } : undefined}
            >
              <div className="flex items-center justify-between w-full sm:mb-2 mb-1">
                <span
                  className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: `${b.tint}1a`, color: b.tint }}
                >
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
                </span>
                {isActive && (
                  <span className="hidden sm:inline text-[10px] uppercase tracking-wider font-semibold" style={{ color: b.tint }}>
                    Filtered
                  </span>
                )}
              </div>
              <div className="text-base sm:text-2xl font-semibold text-text-primary leading-tight sm:leading-none tabular-nums">
                {b.count}
              </div>
              <div className="text-[9px] sm:text-[11px] text-text-tertiary mt-0.5 sm:mt-1 font-medium uppercase sm:normal-case tracking-wide sm:tracking-normal truncate w-full">
                {b.label}
              </div>
            </button>
          );
        })}

        {/* Revenue (filtered view) */}
        <div className="rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border border-surface-tertiary bg-white flex flex-col sm:block items-center sm:items-stretch text-center sm:text-left">
          <div className="flex items-center justify-between w-full sm:mb-2 mb-1">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
            </span>
          </div>
          <div className="text-base sm:text-2xl font-semibold text-text-primary leading-tight sm:leading-none tabular-nums truncate w-full" title={formatCurrency(filteredStats.totalRevenue)}>
            {formatCurrency(filteredStats.totalRevenue)}
          </div>
          <div className="text-[9px] sm:text-[11px] text-text-tertiary mt-0.5 sm:mt-1 font-medium uppercase sm:normal-case tracking-wide sm:tracking-normal truncate w-full">
            <span className="sm:hidden">Revenue</span>
            <span className="hidden sm:inline">Revenue · {filteredStats.count} {filteredStats.count === 1 ? 'load' : 'loads'}</span>
          </div>
        </div>

        {/* RPM (whole org, not filtered) */}
        <div className="rounded-xl sm:rounded-2xl p-2 sm:p-3.5 border border-surface-tertiary bg-white flex flex-col sm:block items-center sm:items-stretch text-center sm:text-left">
          <div className="flex items-center justify-between w-full sm:mb-2 mb-1">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" strokeWidth={2} />
            </span>
          </div>
          <div className="text-base sm:text-2xl font-semibold text-text-primary leading-tight sm:leading-none tabular-nums">
            ${(stats.rpm || 0).toFixed(2)}
          </div>
          <div className="text-[9px] sm:text-[11px] text-text-tertiary mt-0.5 sm:mt-1 font-medium uppercase sm:normal-case tracking-wide sm:tracking-normal truncate w-full">
            <span className="sm:hidden">RPM</span>
            <span className="hidden sm:inline">RPM · all loads</span>
          </div>
        </div>
      </div>

      {/* ── Smart search bar ────────────────────────────────────────────
          Wider, pill-style, with inline clear-X and a sort dropdown right
          next to it. Searches load #, customer PO, broker, shipper/consignee
          names — same fields useLoads already filters by client-side. */}
      <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search load #, PO, broker, shipper or consignee…"
            value={filters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 bg-white border border-surface-tertiary rounded-xl text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center text-text-tertiary hover:bg-surface-secondary"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="relative">
          <select
            value={`${filters.sort.field}:${filters.sort.direction}`}
            onChange={(e) => {
              const [field, direction] = e.target.value.split(':');
              setSort(field, direction);
            }}
            className="appearance-none pl-9 pr-8 py-3 bg-white border border-surface-tertiary rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 cursor-pointer"
          >
            <option value="created_at:desc">Newest first</option>
            <option value="created_at:asc">Oldest first</option>
            <option value="pickup_date:asc">Pickup soonest</option>
            <option value="pickup_date:desc">Pickup latest</option>
            <option value="revenue:desc">Revenue ↓</option>
            <option value="revenue:asc">Revenue ↑</option>
            <option value="miles:desc">Miles ↓</option>
            <option value="status:asc">Status</option>
          </select>
          <ArrowUpDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        </div>
      </div>

      {/* Status chips (kept — second-tier exact-status filter) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap">
        <ListFilter className="hidden sm:block w-3.5 h-3.5 text-text-tertiary shrink-0" />
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
            filters.status === 'all'
              ? 'bg-text-primary text-white'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          All · {stats.total}
        </button>

        {quickFilters.map(({ status, count }) => {
          const config = LoadStatusConfig[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                filters.status === status
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {config.label} · {count}
            </button>
          );
        })}
      </div>

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-sm text-error">{error}</p>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {loads.length === 0 ? (
          <Card padding="default" className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                <Package className="w-6 h-6 text-text-tertiary" />
              </div>
              <div>
                <p className="text-text-primary font-medium">
                  {allLoads.length === 0 ? 'No loads yet' : 'No loads match your filters'}
                </p>
                <p className="text-sm text-text-tertiary mt-1">
                  {allLoads.length === 0 ? 'Create your first load to get started' : 'Try adjusting your search or filters'}
                </p>
              </div>
              {allLoads.length === 0 && (
                <Button onClick={() => setShowAddSheet(true)} className="mt-2">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Load
                </Button>
              )}
            </div>
          </Card>
        ) : (
          loads.map((load) => {
            const status = getStatusConfig(LoadStatusConfig, load.status, {
              label: load.status,
              variant: 'gray',
              icon: Package
            });
            const StatusIcon = status.icon;

            return (
              <div
                key={load.id}
                onClick={() => handleLoadClick(load.id)}
                className="bg-white rounded-xl p-4 border border-surface-tertiary active:scale-[0.98] transition-transform cursor-pointer"
              >
                {/* Top Row: Load # and Status */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-accent text-lg">
                      #{load.reference_number?.replace('LD-', '') || '-'}
                    </span>
                    {load.attachments?.length > 0 && (
                      <FileText className="w-4 h-4 text-text-tertiary" />
                    )}
                  </div>
                  <Badge variant={status.variant} size="sm" className="gap-1">
                    <StatusIcon className="w-3 h-3" />
                    {status.label}
                  </Badge>
                </div>

                {/* Route: Origin → Destination */}
                <div className="flex items-center gap-2 mb-3 text-sm">
                  <MapPin className="w-4 h-4 text-success shrink-0" />
                  <span className="text-text-primary truncate">{getLocationShort(load.shipper)}</span>
                  <ArrowRight className="w-4 h-4 text-text-tertiary shrink-0" />
                  <MapPin className="w-4 h-4 text-error shrink-0" />
                  <span className="text-text-primary truncate">{getLocationShort(load.consignee)}</span>
                </div>

                {/* Info Row */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-text-secondary">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(load.schedule?.pickup_date)}</span>
                    </div>
                    {load.driver && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center">
                          <span className="text-[10px] font-semibold text-accent">
                            {load.driver.first_name?.[0]}{load.driver.last_name?.[0]}
                          </span>
                        </div>
                        <span className="text-text-secondary">{load.driver.first_name}</span>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-text-primary">
                    {formatCurrency(load.financials?.revenue)}
                  </span>
                </div>

                {/* Broker Info */}
                {(load.broker?.name || load.broker_name) && (
                  <div className="mt-2 pt-2 border-t border-surface-tertiary">
                    <p className="text-xs text-text-tertiary truncate">
                      Broker: {load.broker?.name || load.broker_name}
                    </p>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <Card padding="none" className="overflow-hidden border border-surface-tertiary hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary/50">
              <tr>
                <SortHeader field="reference_number" className="w-24">Load #</SortHeader>
                <SortHeader field="pickup_date" className="w-28">Pickup</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider w-36">Origin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider w-36">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider w-40">Broker</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider w-32">Driver</th>
                <SortHeader field="revenue" className="w-24 text-right">Rate</SortHeader>
                <SortHeader field="status" className="w-28">Status</SortHeader>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider w-24">Billing</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {loads.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                        <Package className="w-6 h-6 text-text-tertiary" />
                      </div>
                      <div>
                        <p className="text-text-primary font-medium">
                          {allLoads.length === 0 ? 'No loads yet' : 'No loads match your filters'}
                        </p>
                        <p className="text-sm text-text-tertiary mt-1">
                          {allLoads.length === 0 ? 'Create your first load to get started' : 'Try adjusting your search or filters'}
                        </p>
                      </div>
                      {allLoads.length === 0 && (
                        <Button onClick={() => setShowAddSheet(true)} className="mt-2">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Load
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                loads.map((load) => {
                  const status = getStatusConfig(LoadStatusConfig, load.status, {
                    label: load.status,
                    variant: 'gray',
                    icon: Package
                  });
                  const billing = getStatusConfig(BillingStatusConfig, load.billing_status, {
                    label: '-',
                    variant: 'gray'
                  });
                  const StatusIcon = status.icon;
                  const hasDocuments = load.attachments?.length > 0;

                  return (
                    <tr
                      key={load.id}
                      className="group hover:bg-accent/5 cursor-pointer transition-colors"
                      onClick={() => handleLoadClick(load.id)}
                    >
                      {/* Load # */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-semibold text-accent">
                            {load.reference_number?.replace('LD-', '') || '-'}
                          </span>
                          {hasDocuments && (
                            <FileText className="w-3.5 h-3.5 text-text-tertiary" />
                          )}
                        </div>
                      </td>

                      {/* Pickup Date */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary">
                          {formatDate(load.schedule?.pickup_date)}
                        </span>
                      </td>

                      {/* Origin */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary">
                          {getLocationShort(load.shipper)}
                        </span>
                      </td>

                      {/* Destination */}
                      <td className="px-4 py-3">
                        <span className="text-sm text-text-primary">
                          {getLocationShort(load.consignee)}
                        </span>
                      </td>

                      {/* Broker */}
                      <td className="px-4 py-3">
                        <div className="truncate max-w-[150px]">
                          {load.broker?.id || load.broker_id ? (
                            <button
                              onClick={(e) => handleBrokerClick(e, load.broker?.id || load.broker_id)}
                              className="text-sm text-accent hover:underline font-medium text-left truncate block"
                            >
                              {load.broker?.name || load.broker_name}
                            </button>
                          ) : load.broker_name ? (
                            <span className="text-sm text-text-primary">{load.broker_name}</span>
                          ) : (
                            <span className="text-sm text-text-tertiary">-</span>
                          )}
                          {load.customer_load_number && (
                            <p className="text-xs text-text-tertiary truncate">
                              PO: {load.customer_load_number}
                            </p>
                          )}
                        </div>
                      </td>

                      {/* Driver */}
                      <td className="px-4 py-3">
                        {load.driver ? (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                              <span className="text-xs font-semibold text-accent">
                                {load.driver.first_name?.[0]}{load.driver.last_name?.[0]}
                              </span>
                            </div>
                            <span className="text-sm text-text-primary truncate">
                              {load.driver.first_name} {load.driver.last_name?.[0]}.
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-text-tertiary">Unassigned</span>
                        )}
                      </td>

                      {/* Rate */}
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-semibold text-text-primary">
                          {formatCurrency(load.financials?.revenue)}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} size="sm" className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </td>

                      {/* Billing */}
                      <td className="px-4 py-3">
                        <Badge variant={billing.variant || 'gray'} size="sm">
                          {billing.label}
                        </Badge>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleLoadClick(load.id);
                          }}
                          className="p-1 rounded hover:bg-surface-secondary text-text-tertiary opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer */}
      <div className="flex items-center justify-between text-sm text-text-tertiary">
        <span>
          Showing {loads.length} of {stats.total} loads
        </span>
        {loads.length > 0 && (
          <span>
            {loads.length} loads • {formatCurrency(filteredStats.totalRevenue)} total
          </span>
        )}
      </div>

      {/* New Load Modal */}
      <LoadFormModal
        isOpen={showLoadModal}
        onClose={() => { setShowLoadModal(false); setLoadPrefill(null); }}
        onSuccess={handleCreateSuccess}
        prefill={loadPrefill}
      />

      {/* ── New Load bottom sheet — scan rate-con vs manual ───────────── */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowAddSheet(false); setScanError(null); }}
          />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text-primary text-center mb-1">New Load</h2>
              <p className="text-small text-text-tertiary text-center mb-6">How would you like to add it?</p>

              {scanError && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-small text-error">{scanError}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Scan Rate Confirmation (AI) */}
                <button
                  onClick={() => rateConInputRef.current?.click()}
                  disabled={scanning}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    {scanning
                      ? <Loader2 className="w-6 h-6 text-accent animate-spin" />
                      : <Camera className="w-6 h-6 text-accent" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{scanning ? 'Scanning...' : 'Scan Rate Confirmation'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <p className="text-small text-text-secondary mt-0.5">
                      {scanning ? 'AI is reading your rate-con' : 'Upload or photograph — AI fills the load form'}
                    </p>
                  </div>
                </button>

                <input
                  ref={rateConInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanRateCon(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* Manual Entry */}
                <button
                  onClick={() => {
                    setShowAddSheet(false);
                    setLoadPrefill(null);
                    setShowLoadModal(true);
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-surface-tertiary hover:border-gray-300 hover:bg-surface-secondary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Manual Entry</span>
                    <p className="text-small text-text-secondary mt-0.5">Fill in load details yourself</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => { setShowAddSheet(false); setScanError(null); }}
                className="w-full mt-4 py-3 text-body-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default LoadsListPage;
