/**
 * ExpensesListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useExpenses hook
 * - Component focuses on rendering
 */

import { useMemo, useState, useRef } from 'react';
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
import expensesApi from '../../api/expenses.api';
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
  Calendar,
  Camera,
  FileText,
  Sparkles,
  Loader2,
  Trash2
} from 'lucide-react';

export function ExpensesListPage() {
  const navigate = useNavigate();
  const { orgUrl, hasPermission } = useOrg();
  const [showAddModal, setShowAddModal] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(null);
  const fileInputRef = useRef(null);

  const handleScanReceipt = async (file) => {
    if (!file) return;
    setScanning(true);
    setScanError(null);
    try {
      const result = await expensesApi.parseReceipt(file);
      const extracted = result?.data?.formData || result?.formData || {};
      // Navigate to new expense form with pre-filled data
      navigate(orgUrl('/expenses/new'), { state: { prefill: extracted, receiptFile: file.name } });
    } catch (err) {
      console.error('Receipt scan failed:', err);
      setScanError('Failed to scan receipt. Try again or enter manually.');
      setScanning(false);
    }
  };

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
    deleteExpense,
    exportExpenses,
    exporting,
    workflowLoading,
    mutating
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

  const handleDelete = async (e, expense) => {
    e.stopPropagation();
    const warning = expense.status === 'paid' || expense.status === 'approved' || expense.status === 'reimbursed'
      ? `This expense (${expense.status}) counted toward your P&L. Deleting will remove it from totals and cannot be undone from the UI. Continue?`
      : 'Delete this expense? This cannot be undone from the UI.';
    if (!window.confirm(warning)) return;
    try {
      await deleteExpense(expense.id);
      await refetch();
    } catch (err) {
      console.error('Failed to delete:', err);
      window.alert(err?.response?.data?.error?.message || err?.message || 'Failed to delete expense');
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
  const canDelete = hasPermission?.('expenses:delete');
  const showActionsColumn = canApprove || canDelete;

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
          <Button onClick={() => setShowAddModal(true)} className="shrink-0">
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

                  {/* Row Actions (approval + delete) */}
                  {(canApprove || canDelete) && (
                    <div className="flex items-center gap-2">
                      {canApprove && expense.status === 'pending_approval' && (
                        <>
                          <button
                            onClick={(e) => handleApprove(e, expense.id)}
                            className="p-2 bg-success/10 rounded-lg text-success"
                            disabled={workflowLoading}
                            title="Approve"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleReject(e, expense.id)}
                            className="p-2 bg-error/10 rounded-lg text-error"
                            disabled={workflowLoading}
                            title="Reject"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </>
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDelete(e, expense)}
                          className="p-2 bg-error/10 rounded-lg text-error"
                          disabled={mutating}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
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
                {showActionsColumn && (
                  <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={showActionsColumn ? 9 : 8} className="px-3 py-12 text-center text-text-secondary">
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
                      {showActionsColumn && (
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            {canApprove && expense.status === 'pending_approval' && (
                              <>
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
                              </>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => handleDelete(e, expense)}
                                className="p-1 hover:bg-error/10 rounded text-error"
                                title="Delete"
                                disabled={mutating}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
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

      {/* Add Expense Modal / Bottom Sheet */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowAddModal(false); setScanError(null); }}
          />

          {/* Sheet */}
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            {/* Handle bar (mobile) */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="p-6">
              <h2 className="text-lg font-semibold text-text-primary text-center mb-1">New Expense</h2>
              <p className="text-small text-text-tertiary text-center mb-6">How would you like to add it?</p>

              {scanError && (
                <div className="mb-4 p-3 bg-error/10 border border-error/20 rounded-lg">
                  <p className="text-small text-error">{scanError}</p>
                </div>
              )}

              <div className="space-y-3">
                {/* Scan Receipt (AI) */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={scanning}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/40 transition-all text-left"
                >
                  {scanning ? (
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Loader2 className="w-6 h-6 text-accent animate-spin" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                      <Camera className="w-6 h-6 text-accent" />
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">{scanning ? 'Scanning...' : 'Scan Receipt'}</span>
                      <Sparkles className="w-3.5 h-3.5 text-accent" />
                    </div>
                    <p className="text-small text-text-secondary mt-0.5">
                      {scanning ? 'AI is reading your receipt' : 'Take a photo or upload — AI fills in the details'}
                    </p>
                  </div>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  capture="environment"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleScanReceipt(file);
                    e.target.value = '';
                  }}
                  className="hidden"
                />

                {/* Manual Entry */}
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    navigate(orgUrl('/expenses/new'));
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-surface-tertiary hover:border-gray-300 hover:bg-surface-secondary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                    <FileText className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Manual Entry</span>
                    <p className="text-small text-text-secondary mt-0.5">Fill in expense details yourself</p>
                  </div>
                </button>
              </div>

              {/* Cancel */}
              <button
                onClick={() => { setShowAddModal(false); setScanError(null); }}
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

export default ExpensesListPage;
