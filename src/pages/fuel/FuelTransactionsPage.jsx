/**
 * FuelTransactionsPage - List page for fuel transactions
 *
 * Uses hooks architecture:
 * - Business logic delegated to useFuelTransactions hook
 * - Status/type configs from fuel enums
 * - Component focuses on rendering
 */

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFuelTransactions, useFuelCardsList, useDriversList, useTrucksList } from '../../hooks';
import {
  FuelTransactionStatus,
  FuelTransactionStatusLabels,
  FuelTransactionStatusColors,
  FuelType,
  FuelTypeLabels
} from '../../enums/fuel';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Plus,
  Upload,
  Search,
  Download,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Fuel,
  AlertTriangle,
  CheckSquare,
  Square,
  Check,
  ShieldCheck
} from 'lucide-react';

export function FuelTransactionsPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // Data and logic from hooks
  const {
    transactions,
    total,
    loading,
    error,
    filters,
    setFilter,
    setStatusFilter,
    setSearchQuery,
    handleSort,
    refetch,
    bulkVerify,
    bulkConfirm,
    exportTransactions,
    workflowLoading
  } = useFuelTransactions();

  const { drivers } = useDriversList();
  const { trucks } = useTrucksList();

  // Local state
  const [selectedIds, setSelectedIds] = useState([]);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  // Format helpers
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatGallons = (val) => {
    if (!val && val !== 0) return '-';
    return Number(val).toFixed(3);
  };

  const formatPPG = (val) => {
    if (!val && val !== 0) return '-';
    return '$' + Number(val).toFixed(4);
  };

  const getNetPPG = (txn) => {
    const gallons = Number(txn.gallons) || 0;
    if (gallons <= 0) return null;
    const fuelAmount = Number(txn.fuel_amount) || 0;
    const discount = Number(txn.discount_amount) || 0;
    return (fuelAmount - discount) / gallons;
  };

  // Selection handlers
  const allSelected = transactions.length > 0 && transactions.every(t => selectedIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds([]);
    } else {
      setSelectedIds(transactions.map(t => t.id));
    }
  };

  const toggleSelect = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleBulkVerify = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkVerify(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk verify failed:', err);
    }
  };

  const handleBulkConfirm = async () => {
    if (selectedIds.length === 0) return;
    try {
      await bulkConfirm(selectedIds);
      setSelectedIds([]);
    } catch (err) {
      console.error('Bulk confirm failed:', err);
    }
  };

  const handleExport = async () => {
    try {
      await exportTransactions(filters);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  // Pagination
  const totalPages = Math.ceil((total || transactions.length) / pageSize);

  // Sort header component
  const SortHeader = ({ field, children }) => (
    <th
      className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {filters.sort_by === field && (
          filters.sort_order === 'ASC' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  // Loading state
  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-title text-text-primary">Fuel Transactions</h1>
        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={handleExport} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
          <Button variant="secondary" onClick={() => navigate(orgUrl('/fuel/transactions/import'))} className="hidden sm:flex">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => navigate(orgUrl('/fuel/transactions/new'))} className="shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Transaction</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <select
          value={filters.status}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Statuses</option>
          {Object.values(FuelTransactionStatus).map(status => (
            <option key={status} value={status}>
              {FuelTransactionStatusLabels[status]}
            </option>
          ))}
        </select>

        <input
          type="date"
          value={filters.date_from}
          onChange={(e) => setFilter('date_from', e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
          placeholder="From"
        />
        <input
          type="date"
          value={filters.date_to}
          onChange={(e) => setFilter('date_to', e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
          placeholder="To"
        />

        <select
          value={filters.driver_id}
          onChange={(e) => setFilter('driver_id', e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Drivers</option>
          {(drivers || []).map(d => (
            <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
          ))}
        </select>

        <select
          value={filters.truck_id}
          onChange={(e) => setFilter('truck_id', e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Trucks</option>
          {(trucks || []).map(t => (
            <option key={t.id} value={t.id}>#{t.unit_number}</option>
          ))}
        </select>

        <select
          value={filters.fuel_type}
          onChange={(e) => setFilter('fuel_type', e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Fuel Types</option>
          {Object.values(FuelType).map(ft => (
            <option key={ft} value={ft}>{FuelTypeLabels[ft]}</option>
          ))}
        </select>

        <div className="hidden lg:flex flex-1 items-center justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search merchant, city..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

      {/* Mobile Search */}
      <div className="relative lg:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search merchant, city..."
          value={filters.search}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-3 bg-white border border-surface-tertiary rounded-xl text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 bg-accent/5 border border-accent/20 rounded-lg">
          <span className="text-body-sm text-text-primary font-medium">
            {selectedIds.length} selected
          </span>
          <Button size="sm" variant="secondary" onClick={handleBulkVerify} disabled={workflowLoading}>
            <Check className="w-4 h-4 mr-1" />
            Bulk Verify
          </Button>
          <Button size="sm" variant="secondary" onClick={handleBulkConfirm} disabled={workflowLoading}>
            <ShieldCheck className="w-4 h-4 mr-1" />
            Bulk Confirm
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setSelectedIds([])}>
            Clear
          </Button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-body-sm text-error">{error}</p>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {transactions.length === 0 ? (
          <Card padding="default" className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                <Fuel className="w-6 h-6 text-text-tertiary" />
              </div>
              <p className="text-text-secondary">
                {total === 0 ? 'No fuel transactions yet.' : 'No transactions match your filters.'}
              </p>
            </div>
          </Card>
        ) : (
          transactions.map((txn) => (
            <div
              key={txn.id}
              onClick={() => navigate(orgUrl(`/fuel/transactions/${txn.id}`))}
              className="bg-white rounded-xl p-4 border border-surface-tertiary active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary truncate">{txn.merchant_name || 'Unknown Merchant'}</p>
                  <p className="text-small text-text-tertiary truncate">
                    {txn.city}{txn.state ? `, ${txn.state}` : ''}
                  </p>
                </div>
                <span className="font-semibold text-text-primary ml-3">{formatCurrency(txn.total_amount)}</span>
              </div>
              <div className="flex items-center gap-3 mb-3 text-small">
                <span className="text-text-secondary">{formatDate(txn.transaction_date)}</span>
                <span className="text-text-tertiary">|</span>
                <span className="text-text-secondary">{FuelTypeLabels[txn.fuel_type] || txn.fuel_type}</span>
                <span className="text-text-tertiary">|</span>
                <span className="text-text-secondary">{formatGallons(txn.gallons)} gal</span>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant={FuelTransactionStatusColors[txn.status] || 'gray'} size="sm">
                  {FuelTransactionStatusLabels[txn.status] || txn.status}
                </Badge>
                {txn.driver && (
                  <span className="text-small text-text-secondary">
                    {txn.driver.first_name} {txn.driver.last_name}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card padding="none" className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-surface-tertiary">
              <tr>
                <th className="px-3 py-3 text-left">
                  <button onClick={toggleSelectAll} className="text-text-secondary hover:text-text-primary">
                    {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                  </button>
                </th>
                <SortHeader field="transaction_date">Date</SortHeader>
                <SortHeader field="merchant_name">Merchant</SortHeader>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">City/State</th>
                <SortHeader field="fuel_type">Fuel Type</SortHeader>
                <SortHeader field="gallons">Gallons</SortHeader>
                <th className="px-3 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Retail PPG</th>
                <th className="px-3 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Discount</th>
                <th className="px-3 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Net PPG</th>
                <SortHeader field="total_amount">Total</SortHeader>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Driver</th>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Truck</th>
                <SortHeader field="status">Status</SortHeader>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-12 text-center text-text-secondary">
                    {total === 0 ? 'No fuel transactions yet. Add your first transaction.' : 'No transactions match your filters.'}
                  </td>
                </tr>
              ) : (
                transactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(orgUrl(`/fuel/transactions/${txn.id}`))}
                  >
                    <td className="px-3 py-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => toggleSelect(txn.id)} className="text-text-secondary hover:text-text-primary">
                        {selectedIds.includes(txn.id) ? <CheckSquare className="w-4 h-4 text-accent" /> : <Square className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary whitespace-nowrap">
                      {formatDate(txn.transaction_date)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-text-primary font-medium">{txn.merchant_name || '-'}</span>
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary whitespace-nowrap">
                      {txn.city}{txn.state ? `, ${txn.state}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary">
                      {FuelTypeLabels[txn.fuel_type] || txn.fuel_type || '-'}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-primary text-right tabular-nums">
                      {formatGallons(txn.gallons)}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary text-right tabular-nums">
                      {formatPPG(txn.price_per_gallon)}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-success text-right tabular-nums">
                      {txn.discount_amount ? `-${formatCurrency(txn.discount_amount)}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-body-sm font-medium text-text-primary text-right tabular-nums">
                      {formatPPG(getNetPPG(txn))}
                    </td>
                    <td className="px-3 py-3 text-body-sm font-medium text-text-primary text-right tabular-nums">
                      {formatCurrency(txn.total_amount)}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary">
                      {txn.driver ? `${txn.driver.first_name} ${txn.driver.last_name}` : '-'}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary">
                      {txn.truck ? `#${txn.truck.unit_number}` : '-'}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={FuelTransactionStatusColors[txn.status] || 'gray'} size="sm">
                        {FuelTransactionStatusLabels[txn.status] || txn.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination & Summary */}
      <div className="flex items-center justify-between text-body-sm text-text-secondary">
        <span>Showing {transactions.length} of {total || transactions.length} transactions</span>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-body-sm text-text-primary">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="ghost"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default FuelTransactionsPage;
