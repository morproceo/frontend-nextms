/**
 * ExpensesListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useExpenses hook
 * - Component focuses on rendering
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useExpenses } from '../../hooks';
import {
  ExpenseStatusConfig,
  ExpenseCategoryConfig,
  EntityTypeConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Plus,
  Search,
  ChevronUp,
  ChevronDown,
  Receipt,
  AlertTriangle,
  Check,
  X,
  Download,
  ChevronRight,
  Calendar
} from 'lucide-react';

export function ExpensesListPage() {
  const navigate = useNavigate();
  const { orgUrl, hasPermission } = useOrg();

  // All data and logic from the hook
  const {
    expenses,
    allExpenses,
    stats,
    apiStats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    setCategoryFilter,
    handleSort,
    refetch,
    approveExpense,
    rejectExpense,
    exportExpenses,
    exporting,
    workflowLoading
  } = useExpenses();

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
      minimumFractionDigits: 2
    }).format(amount);
  };

  // Handlers
  const handleApprove = async (e, expenseId) => {
    e.stopPropagation();
    try {
      await approveExpense(expenseId);
    } catch (err) {
      console.error('Failed to approve:', err);
    }
  };

  const handleReject = async (e, expenseId) => {
    e.stopPropagation();
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await rejectExpense(expenseId, reason);
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const handleExport = async () => {
    try {
      await exportExpenses();
    } catch (err) {
      console.error('Failed to export:', err);
    }
  };

  // Sort header component
  const SortHeader = ({ field, children }) => (
    <th
      className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider cursor-pointer hover:text-text-primary select-none"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-1">
        {children}
        {filters.sortField === field && (
          filters.sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
        )}
      </div>
    </th>
  );

  // Loading state
  if (loading && allExpenses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const canApprove = hasPermission?.('expenses:approve');

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <h1 className="text-xl sm:text-title text-text-primary">Expenses</h1>
          {stats.pendingApproval > 0 && (
            <Badge variant="blue" size="sm" className="shrink-0">
              {stats.pendingApproval} pending
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Button variant="secondary" size="sm" onClick={handleExport} loading={exporting} className="hidden sm:flex">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => navigate(orgUrl('/expenses/new'))} className="shrink-0">
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">New Expense</span>
          </Button>
        </div>
      </div>

      {/* Mobile Stats Summary */}
      {apiStats && (
        <div className="flex items-center justify-between text-sm lg:hidden bg-white rounded-lg px-4 py-3 border border-surface-tertiary">
          <div>
            <span className="text-text-tertiary">Total: </span>
            <span className="font-semibold text-text-primary">{formatCurrency(apiStats.amounts?.total)}</span>
          </div>
          <div>
            <span className="text-text-tertiary">Pending: </span>
            <span className="font-semibold text-warning">{formatCurrency(apiStats.amounts?.pending)}</span>
          </div>
        </div>
      )}

      {/* Mobile Search */}
      <div className="relative lg:hidden">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search vendor, description..."
          value={filters.search}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-3 bg-white border border-surface-tertiary rounded-xl text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Filters - Horizontal Scroll on Mobile */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
        <select
          value={filters.status}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="all">All Status</option>
          {Object.values(ExpenseStatusConfig).map(config => (
            <option key={config.value} value={config.value}>
              {config.label}
            </option>
          ))}
        </select>

        <select
          value={filters.category}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="all">All Categories</option>
          {Object.values(ExpenseCategoryConfig).map(config => (
            <option key={config.value} value={config.value}>
              {config.label}
            </option>
          ))}
        </select>

        {/* Desktop Stats & Search */}
        <div className="hidden lg:flex flex-1 items-center justify-end gap-4">
          {apiStats && (
            <div className="flex items-center gap-4 text-body-sm">
              <span className="text-text-secondary">
                Total: <span className="font-semibold text-text-primary">{formatCurrency(apiStats.amounts?.total)}</span>
              </span>
              <span className="text-text-secondary">
                Pending: <span className="font-semibold text-warning">{formatCurrency(apiStats.amounts?.pending)}</span>
              </span>
            </div>
          )}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search vendor, description..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>
      </div>

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
        {expenses.length === 0 ? (
          <Card padding="default" className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                <Receipt className="w-6 h-6 text-text-tertiary" />
              </div>
              <p className="text-text-secondary">
                {allExpenses.length === 0 ? 'No expenses yet. Create your first expense.' : 'No expenses match your filters.'}
              </p>
            </div>
          </Card>
        ) : (
          expenses.map((expense) => {
            const statusConfig = expense.statusConfig || getStatusConfig(ExpenseStatusConfig, expense.status);
            const categoryConfig = expense.categoryConfig || ExpenseCategoryConfig[expense.category];

            return (
              <div
                key={expense.id}
                onClick={() => navigate(orgUrl(`/expenses/${expense.id}`))}
                className="bg-white rounded-xl p-4 border border-surface-tertiary active:scale-[0.98] transition-transform cursor-pointer"
              >
                {/* Top Row */}
                <div className="flex items-start justify-between mb-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary truncate">{expense.vendor || 'No vendor'}</p>
                    {expense.description && (
                      <p className="text-small text-text-tertiary truncate">{expense.description}</p>
                    )}
                  </div>
                  <span className="font-semibold text-text-primary ml-3">{formatCurrency(expense.amount)}</span>
                </div>

                {/* Middle Row */}
                <div className="flex items-center gap-3 mb-3 text-small">
                  <div className="flex items-center gap-1 text-text-secondary">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(expense.date)}</span>
                  </div>
                  <span className="text-text-tertiary">•</span>
                  <span className="text-text-secondary">{categoryConfig?.label || expense.category}</span>
                  {expense.has_receipt && (
                    <>
                      <span className="text-text-tertiary">•</span>
                      <Receipt className="w-3.5 h-3.5 text-accent" />
                    </>
                  )}
                </div>

                {/* Bottom Row */}
                <div className="flex items-center justify-between">
                  <Badge variant={statusConfig.variant || 'gray'} size="sm">
                    {statusConfig.label}
                  </Badge>

                  {/* Approval Actions */}
                  {canApprove && expense.status === 'pending_approval' && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => handleApprove(e, expense.id)}
                        className="p-2 bg-success/10 rounded-lg text-success"
                        disabled={workflowLoading}
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => handleReject(e, expense.id)}
                        className="p-2 bg-error/10 rounded-lg text-error"
                        disabled={workflowLoading}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Table */}
      <Card padding="none" className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-surface-tertiary">
              <tr>
                <SortHeader field="date">Date</SortHeader>
                <SortHeader field="vendor">Vendor</SortHeader>
                <SortHeader field="category">Category</SortHeader>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Entity</th>
                <SortHeader field="amount">Amount</SortHeader>
                <SortHeader field="status">Status</SortHeader>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Submitted By</th>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Receipt</th>
                {canApprove && (
                  <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={canApprove ? 9 : 8} className="px-3 py-12 text-center text-text-secondary">
                    {allExpenses.length === 0 ? 'No expenses yet. Create your first expense.' : 'No expenses match your filters.'}
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const statusConfig = expense.statusConfig || getStatusConfig(ExpenseStatusConfig, expense.status);
                  const categoryConfig = expense.categoryConfig || ExpenseCategoryConfig[expense.category];
                  const entityConfig = expense.entityTypeConfig || EntityTypeConfig[expense.entity_type];

                  return (
                    <tr
                      key={expense.id}
                      className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                      onClick={() => navigate(orgUrl(`/expenses/${expense.id}`))}
                    >
                      <td className="px-3 py-3 text-body-sm text-text-secondary">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-3 py-3">
                        <span className="text-text-primary font-medium">
                          {expense.vendor || '-'}
                        </span>
                        {expense.description && (
                          <p className="text-small text-text-tertiary truncate max-w-[200px]">
                            {expense.description}
                          </p>
                        )}
                      </td>
                      <td className="px-3 py-3 text-body-sm text-text-secondary">
                        {categoryConfig?.label || expense.category}
                      </td>
                      <td className="px-3 py-3 text-body-sm text-text-secondary">
                        {expense.entity_type && expense.entity_type !== 'organization' ? (
                          <span>
                            {entityConfig?.label || expense.entity_type}
                            {expense.entity?.unit_number && ` #${expense.entity.unit_number}`}
                            {expense.entity?.reference_number && ` ${expense.entity.reference_number}`}
                            {expense.entity?.first_name && ` ${expense.entity.first_name}`}
                          </span>
                        ) : (
                          <span className="text-text-tertiary">-</span>
                        )}
                      </td>
                      <td className="px-3 py-3 text-body-sm font-medium text-text-primary">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-3 py-3">
                        <Badge variant={statusConfig.variant || 'gray'} size="sm">
                          {statusConfig.label}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-body-sm text-text-secondary">
                        {expense.submittedBy?.email?.split('@')[0] || '-'}
                      </td>
                      <td className="px-3 py-3">
                        {expense.has_receipt && (
                          <Receipt className="w-4 h-4 text-accent" />
                        )}
                      </td>
                      {canApprove && (
                        <td className="px-3 py-3">
                          {expense.status === 'pending_approval' && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleApprove(e, expense.id)}
                                className="p-1 hover:bg-success/10 rounded text-success"
                                title="Approve"
                                disabled={workflowLoading}
                              >
                                <Check className="w-4 h-4" />
                              </button>
                              <button
                                onClick={(e) => handleReject(e, expense.id)}
                                className="p-1 hover:bg-error/10 rounded text-error"
                                title="Reject"
                                disabled={workflowLoading}
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-body-sm text-text-secondary">
        <span>Showing {expenses.length} of {allExpenses.length} expenses</span>
        <span>
          Filtered Total: <span className="font-semibold text-text-primary">{formatCurrency(stats.amounts.filtered)}</span>
        </span>
      </div>
    </div>
  );
}

export default ExpensesListPage;
