/**
 * FuelTransactionDetailPage - Detail view for a fuel transaction
 *
 * Uses hooks architecture:
 * - useFuelTransaction for data and workflow actions
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFuelTransaction } from '../../hooks';
import {
  FuelTransactionStatusLabels,
  FuelTransactionStatusColors,
  FuelTypeLabels
} from '../../enums/fuel';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Edit,
  Send,
  Check,
  ShieldCheck,
  Flag,
  X,
  DollarSign,
  Fuel,
  MapPin,
  Calendar,
  CreditCard,
  User,
  Truck,
  Package,
  FileText,
  AlertTriangle,
  Gauge
} from 'lucide-react';

export function FuelTransactionDetailPage() {
  const { transactionId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const {
    transaction,
    loading,
    error,
    refetch,
    submitForVerification,
    verify,
    confirm: confirmTxn,
    flag,
    reject,
    mutating: actionLoading,
    workflowLoading
  } = useFuelTransaction(transactionId);

  // Local state
  const [localError, setLocalError] = useState(null);
  const [showFlagInput, setShowFlagInput] = useState(false);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [reasonText, setReasonText] = useState('');

  // Format helpers
  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
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

  // Workflow handlers
  const handleSubmitForVerification = async () => {
    try {
      setLocalError(null);
      await submitForVerification();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleVerify = async () => {
    try {
      setLocalError(null);
      await verify();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleConfirm = async () => {
    try {
      setLocalError(null);
      await confirmTxn();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleFlag = async () => {
    if (!reasonText.trim()) return;
    try {
      setLocalError(null);
      await flag(reasonText.trim());
      setShowFlagInput(false);
      setReasonText('');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleReject = async () => {
    if (!reasonText.trim()) return;
    try {
      setLocalError(null);
      await reject(reasonText.trim());
      setShowRejectInput(false);
      setReasonText('');
    } catch (err) {
      setLocalError(err.message);
    }
  };

  const handleResubmit = async () => {
    try {
      setLocalError(null);
      await submitForVerification();
    } catch (err) {
      setLocalError(err.message);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (no data)
  if (error && !transaction) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/fuel/transactions'))} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Transactions
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

  if (!transaction) return null;

  const displayError = localError || error;
  const status = transaction.status;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(orgUrl('/fuel/transactions'))} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Transactions
      </Button>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-body-sm text-text-secondary mb-1">
                {formatDate(transaction.transaction_date)}
                {transaction.transaction_time && ` at ${transaction.transaction_time}`}
              </p>
              <h1 className="text-xl sm:text-title text-text-primary font-bold">
                {transaction.merchant_name || 'Fuel Transaction'}
              </h1>
              {(transaction.city || transaction.state) && (
                <p className="text-body-sm text-text-secondary mt-1">
                  {transaction.city}{transaction.state ? `, ${transaction.state}` : ''}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-accent">
                {formatCurrency(transaction.total_amount)}
              </p>
              <Badge
                variant={FuelTransactionStatusColors[status] || 'gray'}
                size="lg"
                className="mt-2"
              >
                {FuelTransactionStatusLabels[status] || status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {displayError && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{displayError}</p>
        </Card>
      )}

      {/* Main Content - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Transaction Details */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-small text-text-tertiary mb-1">Transaction Date</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">{formatDate(transaction.transaction_date)}</p>
                  </div>
                </div>
                {transaction.transaction_time && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Time</p>
                    <p className="text-body-sm text-text-primary">{transaction.transaction_time}</p>
                  </div>
                )}
                {transaction.reference_number && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Reference Number</p>
                    <p className="text-body-sm text-text-primary">{transaction.reference_number}</p>
                  </div>
                )}
                {transaction.invoice_number && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Invoice Number</p>
                    <p className="text-body-sm text-text-primary">{transaction.invoice_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle>Location</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <p className="text-small text-text-tertiary mb-1">Merchant</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">{transaction.merchant_name || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">City</p>
                  <p className="text-body-sm text-text-primary">{transaction.city || '-'}</p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">State</p>
                  <p className="text-body-sm text-text-primary">{transaction.state || '-'}</p>
                </div>
                {transaction.zip && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">ZIP</p>
                    <p className="text-body-sm text-text-primary">{transaction.zip}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Fuel Details */}
          <Card>
            <CardHeader>
              <CardTitle>Fuel Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <p className="text-small text-text-tertiary mb-1">Fuel Type</p>
                  <div className="flex items-center gap-2">
                    <Fuel className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">{FuelTypeLabels[transaction.fuel_type] || transaction.fuel_type || '-'}</p>
                  </div>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Gallons</p>
                  <p className="text-body-sm text-text-primary font-medium tabular-nums">{formatGallons(transaction.gallons)}</p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Price Per Gallon</p>
                  <p className="text-body-sm text-text-primary tabular-nums">{formatPPG(transaction.price_per_gallon)}</p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Fuel Amount</p>
                  <p className="text-body-sm text-text-primary font-medium tabular-nums">{formatCurrency(transaction.fuel_amount)}</p>
                </div>
              </div>

              {/* DEF section if present */}
              {(transaction.def_gallons || transaction.def_amount) && (
                <div className="mt-4 pt-4 border-t border-surface-tertiary">
                  <p className="text-body-sm font-medium text-text-primary mb-3">DEF</p>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-small text-text-tertiary mb-1">DEF Gallons</p>
                      <p className="text-body-sm text-text-primary tabular-nums">{formatGallons(transaction.def_gallons)}</p>
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary mb-1">DEF PPG</p>
                      <p className="text-body-sm text-text-primary tabular-nums">{formatPPG(transaction.def_price_per_gallon)}</p>
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary mb-1">DEF Amount</p>
                      <p className="text-body-sm text-text-primary tabular-nums">{formatCurrency(transaction.def_amount)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Reefer section if present */}
              {(transaction.reefer_gallons || transaction.reefer_amount) && (
                <div className="mt-4 pt-4 border-t border-surface-tertiary">
                  <p className="text-body-sm font-medium text-text-primary mb-3">Reefer</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-small text-text-tertiary mb-1">Reefer Gallons</p>
                      <p className="text-body-sm text-text-primary tabular-nums">{formatGallons(transaction.reefer_gallons)}</p>
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary mb-1">Reefer Amount</p>
                      <p className="text-body-sm text-text-primary tabular-nums">{formatCurrency(transaction.reefer_amount)}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totals Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Totals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-text-secondary">Fuel Amount</span>
                  <span className="text-text-primary tabular-nums">{formatCurrency(transaction.fuel_amount)}</span>
                </div>
                {transaction.def_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">DEF Amount</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.def_amount)}</span>
                  </div>
                )}
                {transaction.reefer_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Reefer Amount</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.reefer_amount)}</span>
                  </div>
                )}
                {transaction.merchandise_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Merchandise</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.merchandise_amount)}</span>
                  </div>
                )}
                {transaction.cash_advance_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Cash Advance</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.cash_advance_amount)}</span>
                  </div>
                )}
                {transaction.subtotal > 0 && (
                  <div className="flex items-center justify-between text-body-sm pt-2 border-t border-surface-tertiary">
                    <span className="text-text-secondary font-medium">Subtotal</span>
                    <span className="text-text-primary font-medium tabular-nums">{formatCurrency(transaction.subtotal)}</span>
                  </div>
                )}
                {transaction.tax_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Tax</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.tax_amount)}</span>
                  </div>
                )}
                {transaction.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Discount</span>
                    <span className="text-success tabular-nums">-{formatCurrency(transaction.discount_amount)}</span>
                  </div>
                )}
                {transaction.fees_amount > 0 && (
                  <div className="flex items-center justify-between text-body-sm">
                    <span className="text-text-secondary">Fees</span>
                    <span className="text-text-primary tabular-nums">{formatCurrency(transaction.fees_amount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-body pt-3 border-t-2 border-surface-tertiary">
                  <span className="text-text-primary font-bold">Total</span>
                  <span className="text-text-primary font-bold text-lg tabular-nums">{formatCurrency(transaction.total_amount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vehicle Info */}
          {(transaction.odometer || transaction.miles_since_last_fill || transaction.mpg) && (
            <Card>
              <CardHeader>
                <CardTitle>Vehicle Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  {transaction.odometer && (
                    <div>
                      <p className="text-small text-text-tertiary mb-1">Odometer</p>
                      <div className="flex items-center gap-2">
                        <Gauge className="w-4 h-4 text-text-secondary" />
                        <p className="text-body-sm text-text-primary">{Number(transaction.odometer).toLocaleString()} mi</p>
                      </div>
                    </div>
                  )}
                  {transaction.miles_since_last_fill && (
                    <div>
                      <p className="text-small text-text-tertiary mb-1">Miles Since Last Fill</p>
                      <p className="text-body-sm text-text-primary">{Number(transaction.miles_since_last_fill).toLocaleString()} mi</p>
                    </div>
                  )}
                  {transaction.mpg && (
                    <div>
                      <p className="text-small text-text-tertiary mb-1">MPG</p>
                      <p className="text-body-sm text-text-primary">{Number(transaction.mpg).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {transaction.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
                  {transaction.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Status & Workflow Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Status & Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-center">
                  <Badge
                    variant={FuelTransactionStatusColors[status] || 'gray'}
                    size="lg"
                  >
                    {FuelTransactionStatusLabels[status] || status}
                  </Badge>
                </div>

                {/* Draft actions */}
                {status === 'draft' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleSubmitForVerification}
                      disabled={workflowLoading}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit for Verification
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={() => navigate(orgUrl(`/fuel/transactions/${transactionId}/edit`))}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                )}

                {/* Pending Verification actions */}
                {status === 'pending_verification' && (
                  <div className="space-y-2">
                    <Button
                      className="w-full"
                      onClick={handleVerify}
                      disabled={workflowLoading}
                    >
                      <Check className="w-4 h-4 mr-2" />
                      Verify
                    </Button>

                    {showFlagInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-warning/20"
                          placeholder="Reason for flagging..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-warning"
                            onClick={handleFlag}
                            disabled={workflowLoading || !reasonText.trim()}
                          >
                            Flag
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => { setShowFlagInput(false); setReasonText(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full text-warning"
                        onClick={() => { setShowFlagInput(true); setShowRejectInput(false); setReasonText(''); }}
                        disabled={workflowLoading}
                      >
                        <Flag className="w-4 h-4 mr-2" />
                        Flag
                      </Button>
                    )}

                    {showRejectInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-error/20"
                          placeholder="Reason for rejection..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-error"
                            onClick={handleReject}
                            disabled={workflowLoading || !reasonText.trim()}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => { setShowRejectInput(false); setReasonText(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full text-error"
                        onClick={() => { setShowRejectInput(true); setShowFlagInput(false); setReasonText(''); }}
                        disabled={workflowLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
                )}

                {/* Verified actions */}
                {status === 'verified' && (
                  <Button
                    className="w-full"
                    onClick={handleConfirm}
                    disabled={workflowLoading}
                  >
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Confirm
                  </Button>
                )}

                {/* Flagged actions */}
                {status === 'flagged' && (
                  <div className="space-y-3">
                    {transaction.flag_reason && (
                      <div className="p-3 bg-warning/10 border border-warning/20 rounded-lg">
                        <p className="text-small font-medium text-warning mb-1">Flag Reason</p>
                        <p className="text-body-sm text-text-primary">{transaction.flag_reason}</p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={handleResubmit}
                      disabled={workflowLoading}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Resubmit
                    </Button>
                    {showRejectInput ? (
                      <div className="space-y-2">
                        <textarea
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-error/20"
                          placeholder="Reason for rejection..."
                        />
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="flex-1 text-error"
                            onClick={handleReject}
                            disabled={workflowLoading || !reasonText.trim()}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="flex-1"
                            onClick={() => { setShowRejectInput(false); setReasonText(''); }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <Button
                        variant="secondary"
                        className="w-full text-error"
                        onClick={() => { setShowRejectInput(true); setReasonText(''); }}
                        disabled={workflowLoading}
                      >
                        <X className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    )}
                  </div>
                )}

                {/* Rejected */}
                {status === 'rejected' && (
                  <div className="space-y-3">
                    {transaction.rejection_reason && (
                      <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
                        <p className="text-small font-medium text-error mb-1">Rejection Reason</p>
                        <p className="text-body-sm text-text-primary">{transaction.rejection_reason}</p>
                      </div>
                    )}
                    <Button
                      className="w-full"
                      onClick={() => navigate(orgUrl(`/fuel/transactions/${transactionId}/edit`))}
                    >
                      <Edit className="w-4 h-4 mr-2" />
                      Edit & Resubmit
                    </Button>
                  </div>
                )}

                {/* Confirmed - no actions */}
                {status === 'confirmed' && (
                  <div className="text-center py-2">
                    <Badge variant="emerald" size="lg">
                      <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                      Confirmed
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment Card */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                    <User className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Driver</p>
                    <p className="text-body-sm font-medium text-text-primary">
                      {transaction.driver
                        ? `${transaction.driver.first_name} ${transaction.driver.last_name}`
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                    <Truck className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Truck</p>
                    <p className="text-body-sm font-medium text-text-primary">
                      {transaction.truck
                        ? `#${transaction.truck.unit_number}${transaction.truck.make ? ` - ${transaction.truck.make} ${transaction.truck.model || ''}` : ''}`
                        : '-'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <p className="text-small text-text-tertiary">Fuel Card</p>
                    <p className="text-body-sm font-medium text-text-primary">
                      {transaction.fuel_card
                        ? `****${transaction.fuel_card.card_number_last4 || ''} (${transaction.fuel_card.card_provider || ''})`
                        : '-'}
                    </p>
                  </div>
                </div>

                {transaction.load && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <Package className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary">Load</p>
                      <p className="text-body-sm font-medium text-text-primary">
                        {transaction.load.reference_number || transaction.load.id?.substring(0, 8)}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Receipt Card */}
          <Card>
            <CardHeader>
              <CardTitle>Receipt</CardTitle>
            </CardHeader>
            <CardContent>
              {transaction.has_receipt ? (
                <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg">
                  <FileText className="w-5 h-5 text-accent" />
                  <div className="flex-1 min-w-0">
                    <p className="text-body-sm font-medium text-text-primary truncate">
                      {transaction.receipt_file_name || 'Receipt'}
                    </p>
                    {transaction.receipt_mime_type && (
                      <p className="text-small text-text-tertiary">
                        {transaction.receipt_mime_type}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-text-tertiary">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-small">No receipt attached</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default FuelTransactionDetailPage;
