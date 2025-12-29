/**
 * ExpenseDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports (except for receipt URL - simple one-time fetch)
 * - Business logic delegated to useExpense hook
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useExpense } from '../../hooks';
import { ExpenseStatusConfig, ExpenseCategoryConfig, EntityTypeConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import uploadsApi from '../../api/uploads.api';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Check,
  X,
  Send,
  DollarSign,
  Receipt,
  Calendar,
  Store,
  Tag,
  User,
  Truck,
  Package,
  Building2,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';

// Icon mappings for entity types
const entityTypeIcons = {
  organization: Building2,
  truck: Truck,
  trailer: Package,
  driver: User,
  load: Package
};

export function ExpenseDetailPage() {
  const { expenseId } = useParams();
  const navigate = useNavigate();
  const { orgUrl, hasPermission } = useOrg();

  // All data and logic from the hook
  const {
    expense,
    loading,
    error,
    refetch,
    deleteExpense,
    submitForApproval,
    approveExpense,
    rejectExpense,
    markAsPaid,
    mutating: actionLoading
  } = useExpense(expenseId);

  // Local state
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [localError, setLocalError] = useState(null);

  // Fetch receipt URL when expense loads
  useEffect(() => {
    if (expense?.has_receipt && expense?.receipt_storage_path) {
      uploadsApi.getDocumentUrl(expense.id)
        .then(res => setReceiptUrl(res.data?.url))
        .catch(err => console.error('Failed to get receipt URL:', err));
    }
  }, [expense?.id, expense?.has_receipt, expense?.receipt_storage_path]);

  const handleSubmitForApproval = async () => {
    try {
      await submitForApproval();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleApprove = async () => {
    try {
      await approveExpense();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleReject = async () => {
    const reason = window.prompt('Rejection reason:');
    if (reason === null) return;
    try {
      await rejectExpense(reason);
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleMarkPaid = async () => {
    try {
      await markAsPaid();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleDelete = async () => {
    try {
      await deleteExpense();
      navigate(orgUrl('/expenses'));
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
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

  if (error && !expense) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/expenses'))} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Expenses
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!expense) return null;

  // Get configs from centralized config or use enriched expense
  const statusConfig = expense.statusConfig || ExpenseStatusConfig[expense.status] || { label: expense.status, variant: 'gray' };
  const categoryConfig = expense.categoryConfig || ExpenseCategoryConfig[expense.category];
  const entityTypeConfig = expense.entityTypeConfig || EntityTypeConfig[expense.entity_type];
  const StatusIcon = statusConfig.icon || FileText;
  const EntityIcon = entityTypeIcons[expense.entity_type] || Building2;
  const canApprove = hasPermission?.('expenses:approve');
  const canEdit = expense.status === 'draft' || expense.status === 'rejected';
  const canDelete = expense.status === 'draft';
  const displayError = localError || error;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(orgUrl('/expenses'))} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Expenses
      </Button>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-title text-text-primary">
              {expense.vendor || 'Expense'}
            </h1>
            <Badge variant={statusConfig.variant} size="lg">
              <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
              {statusConfig.label}
            </Badge>
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            {categoryConfig?.label || expense.category} • {formatDate(expense.date)}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canEdit && (
            <Button
              variant="secondary"
              onClick={() => navigate(orgUrl(`/expenses/${expenseId}/edit`))}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          )}
          {expense.status === 'draft' && (
            <Button onClick={handleSubmitForApproval} disabled={actionLoading}>
              <Send className="w-4 h-4 mr-2" />
              Submit for Approval
            </Button>
          )}
          {canApprove && expense.status === 'pending_approval' && (
            <>
              <Button variant="secondary" onClick={handleReject} disabled={actionLoading}>
                <X className="w-4 h-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={actionLoading}>
                <Check className="w-4 h-4 mr-2" />
                Approve
              </Button>
            </>
          )}
          {canApprove && expense.status === 'approved' && (
            <Button onClick={handleMarkPaid} disabled={actionLoading}>
              <DollarSign className="w-4 h-4 mr-2" />
              Mark as Paid
            </Button>
          )}
        </div>
      </div>

      {/* Error */}
      {displayError && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{displayError}</p>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Amount Card */}
          <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-text-secondary mb-1">Amount</p>
                  <p className="text-3xl font-bold text-accent">
                    {formatCurrency(expense.amount)}
                  </p>
                </div>
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                  <DollarSign className="w-8 h-8 text-accent" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Expense Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-small text-text-tertiary mb-1">Vendor</p>
                  <div className="flex items-center gap-2">
                    <Store className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">{expense.vendor || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">{formatDate(expense.date)}</p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Category</p>
                  <div className="flex items-center gap-2">
                    <Tag className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">
                      {categoryConfig?.label || expense.category}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Payment Method</p>
                  <p className="text-body-sm text-text-primary">
                    {expense.payment_method?.replace('_', ' ') || '-'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-small text-text-tertiary mb-1">Description</p>
                  <p className="text-body-sm text-text-primary">
                    {expense.description || '-'}
                  </p>
                </div>
                {expense.reference_number && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Reference Number</p>
                    <p className="text-body-sm text-text-primary">{expense.reference_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Entity Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Assigned To</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                  <EntityIcon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {entityTypeConfig?.label || expense.entity_type}
                  </p>
                  {expense.entity && (
                    <p className="text-small text-text-secondary">
                      {expense.entity.unit_number && `#${expense.entity.unit_number}`}
                      {expense.entity.first_name && `${expense.entity.first_name} ${expense.entity.last_name || ''}`}
                      {expense.entity.reference_number && expense.entity.reference_number}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {expense.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
                  {expense.notes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Rejection Reason */}
          {expense.status === 'rejected' && expense.rejection_reason && (
            <Card className="bg-error/5 border border-error/20">
              <CardHeader>
                <CardTitle className="text-error">Rejection Reason</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-text-primary">
                  {expense.rejection_reason}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Receipt */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              {expense.has_receipt ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                    <Receipt className="w-5 h-5 text-accent" />
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary truncate">
                        {expense.receipt_file_name || 'Receipt'}
                      </p>
                      <p className="text-small text-text-tertiary">
                        {expense.receipt_mime_type}
                      </p>
                    </div>
                  </div>
                  {receiptUrl && (
                    <a
                      href={receiptUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-accent text-accent hover:bg-accent/5 transition-colors text-body-sm font-medium"
                    >
                      <ExternalLink className="w-4 h-4" />
                      View Receipt
                    </a>
                  )}
                </div>
              ) : (
                <div className="text-center py-6 text-text-tertiary">
                  <Receipt className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-small">No receipt attached</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Created */}
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-surface-secondary flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-text-secondary" />
                  </div>
                  <div>
                    <p className="text-body-sm text-text-primary">Created</p>
                    <p className="text-small text-text-tertiary">
                      {formatDateTime(expense.created_at)}
                    </p>
                    {expense.submittedBy && (
                      <p className="text-small text-text-secondary">
                        by {expense.submittedBy.email}
                      </p>
                    )}
                  </div>
                </div>

                {/* Submitted */}
                {expense.submitted_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Send className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-body-sm text-text-primary">Submitted for Approval</p>
                      <p className="text-small text-text-tertiary">
                        {formatDateTime(expense.submitted_at)}
                      </p>
                    </div>
                  </div>
                )}

                {/* Approved/Rejected */}
                {expense.approved_at && (
                  <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                      expense.status === 'rejected' ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      {expense.status === 'rejected' ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-body-sm text-text-primary">
                        {expense.status === 'rejected' ? 'Rejected' : 'Approved'}
                      </p>
                      <p className="text-small text-text-tertiary">
                        {formatDateTime(expense.approved_at)}
                      </p>
                      {expense.approvedBy && (
                        <p className="text-small text-text-secondary">
                          by {expense.approvedBy.email}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Paid */}
                {expense.status === 'paid' && expense.paid_at && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                      <DollarSign className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-body-sm text-text-primary">Marked as Paid</p>
                      <p className="text-small text-text-tertiary">
                        {formatDateTime(expense.paid_at)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Delete */}
          {canDelete && (
            <Card className="border-error/20">
              <CardContent>
                {showDeleteConfirm ? (
                  <div className="space-y-3">
                    <p className="text-body-sm text-text-primary">
                      Are you sure you want to delete this expense?
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={handleDelete}
                        disabled={actionLoading}
                        className="flex-1 text-error hover:bg-error/10"
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full flex items-center justify-center gap-2 py-2 text-error hover:bg-error/5 rounded-lg transition-colors text-body-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Expense
                  </button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

export default ExpenseDetailPage;
