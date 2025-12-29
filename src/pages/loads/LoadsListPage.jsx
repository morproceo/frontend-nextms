/**
 * LoadsListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useLoads hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useLoads } from '../../hooks';
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
  Package
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
    return new Date(date).toLocaleDateString('en-US', {
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

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-text-primary">Loads</h1>
          <Badge variant="gray" size="sm">{stats.total}</Badge>
        </div>

        <Button onClick={() => setShowLoadModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Load
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setStatusFilter('all')}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            filters.status === 'all'
              ? 'bg-accent text-white'
              : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
          }`}
        >
          All ({stats.total})
        </button>

        {quickFilters.map(({ status, count }) => {
          const config = LoadStatusConfig[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                filters.status === status
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              }`}
            >
              {config.label} ({count})
            </button>
          );
        })}

        {/* Search & Total */}
        <div className="flex-1" />
        <div className="flex items-center gap-4">
          <div className="text-sm">
            <span className="text-text-tertiary">Revenue: </span>
            <span className="font-semibold text-text-primary">
              {formatCurrency(filteredStats.totalRevenue)}
            </span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search loads..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-56 pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
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

      {/* Table */}
      <Card padding="none" className="overflow-hidden border border-surface-tertiary">
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
                        <Button onClick={() => setShowLoadModal(true)} className="mt-2">
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
                        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                          billing.variant === 'green' ? 'bg-success/10 text-success' :
                          billing.variant === 'blue' ? 'bg-accent/10 text-accent' :
                          billing.variant === 'yellow' ? 'bg-warning/10 text-warning' :
                          billing.variant === 'red' ? 'bg-error/10 text-error' :
                          'bg-surface-secondary text-text-tertiary'
                        }`}>
                          {billing.label}
                        </span>
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
        onClose={() => setShowLoadModal(false)}
        onSuccess={handleCreateSuccess}
      />
    </div>
  );
}

export default LoadsListPage;
