/**
 * DriverExpensesPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalExpenses hook
 * - Component focuses on rendering
 */

import { useNavigate } from 'react-router-dom';
import { useDriverPortalExpenses } from '../../hooks';
import { ExpenseStatusConfig, ExpenseCategoryConfig } from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Plus,
  Receipt,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';

export function DriverExpensesPage() {
  const navigate = useNavigate();

  // All data and logic from the hook
  const {
    expenses,
    allExpenses,
    stats,
    loading,
    error,
    statusFilter,
    setStatusFilter,
    refetch
  } = useDriverPortalExpenses();

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-text-primary">Expenses</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Submit and track your expense reimbursements
          </p>
        </div>
        <Button onClick={() => navigate('/driver/expenses/new')}>
          <Plus className="w-4 h-4 mr-2" />
          New Expense
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-4">
        <Card padding="default" className="text-center">
          <div className="text-2xl font-bold text-accent">{stats.pending}</div>
          <div className="text-small text-text-tertiary">Pending</div>
        </Card>
        <Card padding="default" className="text-center">
          <div className="text-2xl font-bold text-success">{stats.approved}</div>
          <div className="text-small text-text-tertiary">Approved</div>
        </Card>
        <Card padding="default" className="text-center">
          <div className="text-2xl font-bold text-text-primary">{formatCurrency(stats.total)}</div>
          <div className="text-small text-text-tertiary">Total</div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {['all', 'pending_approval', 'approved', 'rejected'].map((status) => {
          const config = ExpenseStatusConfig[status];
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`
                px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors
                ${statusFilter === status
                  ? 'bg-accent text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                }
              `}
            >
              {status === 'all' ? 'All' : config?.label || status}
            </button>
          );
        })}
      </div>

      {/* Error */}
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

      {/* Expense List */}
      <div className="space-y-3">
        {expenses.length === 0 ? (
          <Card padding="default" className="text-center py-12">
            <Receipt className="w-12 h-12 mx-auto text-text-tertiary mb-4" />
            <p className="text-text-secondary">
              {allExpenses.length === 0
                ? 'No expenses yet. Submit your first expense.'
                : 'No expenses match this filter.'}
            </p>
            {allExpenses.length === 0 && (
              <Button onClick={() => navigate('/driver/expenses/new')} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Submit Expense
              </Button>
            )}
          </Card>
        ) : (
          expenses.map((expense) => {
            const statusConfig = expense.statusConfig || ExpenseStatusConfig[expense.status] || { label: expense.status, variant: 'gray' };
            const categoryConfig = expense.categoryConfig || ExpenseCategoryConfig[expense.category];
            const StatusIcon = statusConfig.icon || Clock;

            return (
              <Card
                key={expense.id}
                padding="default"
                className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                onClick={() => navigate(`/driver/expenses/${expense.id}`)}
              >
                <div className="flex items-center gap-4">
                  {/* Receipt Icon */}
                  <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-5 h-5 text-accent" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-text-primary truncate">
                        {expense.vendor || categoryConfig?.label || 'Expense'}
                      </span>
                      <Badge variant={statusConfig.variant} size="sm">
                        <StatusIcon className="w-3 h-3 mr-1" />
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 text-small text-text-tertiary mt-0.5">
                      <span>{formatDate(expense.date)}</span>
                      <span>{categoryConfig?.label || expense.category}</span>
                      {expense.organization?.name && (
                        <span className="truncate">{expense.organization.name}</span>
                      )}
                    </div>
                  </div>

                  {/* Amount & Arrow */}
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-text-primary">
                      {formatCurrency(expense.amount)}
                    </span>
                    <ChevronRight className="w-5 h-5 text-text-tertiary" />
                  </div>
                </div>

                {/* Rejection reason */}
                {expense.status === 'rejected' && expense.rejection_reason && (
                  <div className="mt-3 p-2 bg-error/5 rounded-lg">
                    <p className="text-small text-error">
                      Rejected: {expense.rejection_reason}
                    </p>
                  </div>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}

export default DriverExpensesPage;
