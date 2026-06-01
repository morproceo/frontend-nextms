/**
 * EarningAdjustModal
 *
 * Carrier-side modal for appending an adjustment to a driver earning that's
 * already on a settlement. Server-enforced guardrails are mirrored here for
 * fast feedback:
 *   - amount must be a non-zero number
 *   - reason must be ≥15 chars
 *   - net pay can't drop below $0
 *
 * The driver is notified automatically (toast + inbox) — this UI doesn't
 * need to spell that out, just confirm the carrier action.
 */

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import { X, AlertCircle } from 'lucide-react';
import earningsApi from '../../api/earnings.api';
import { useToast } from '../../contexts/ToastContext';

const REASON_MIN = 15;

const formatCurrency = (n) => {
  const num = Number(n) || 0;
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

export function EarningAdjustModal({ open, onClose, loadId, driverId, loadReference, onAdjusted }) {
  const { toast } = useToast();
  const [earning, setEarning] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [lookupError, setLookupError] = useState(null);

  useEffect(() => {
    if (!open || !loadId || !driverId) return;
    let alive = true;
    setLoading(true);
    setLookupError(null);
    earningsApi.lookupEarning({ loadId, driverId })
      .then((res) => { if (alive) setEarning(res.data); })
      .catch((err) => {
        if (!alive) return;
        setLookupError(
          err?.response?.data?.error?.message ||
          'Could not find the underlying earning record for this load.'
        );
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [open, loadId, driverId]);

  useEffect(() => {
    if (!open) {
      setAmount('');
      setReason('');
      setEarning(null);
      setLookupError(null);
    }
  }, [open]);

  const parsedAmount = useMemo(() => {
    const n = Number(amount);
    return Number.isFinite(n) && amount !== '' ? n : null;
  }, [amount]);

  const adjustmentsTotal = useMemo(() => {
    if (!earning) return 0;
    return (earning.adjustments || []).reduce((s, a) => s + Number(a.amount || 0), 0);
  }, [earning]);

  const originalPay = Number(earning?.pay_amount || 0);
  const currentNet = Number(earning?.net_pay ?? (originalPay + adjustmentsTotal));
  const newNet = parsedAmount === null ? currentNet : currentNet + parsedAmount;

  const reasonTrimmed = reason.trim();
  const reasonShort = reasonTrimmed.length < REASON_MIN;
  const amountInvalid = parsedAmount === null || parsedAmount === 0;
  const wouldGoNegative = parsedAmount !== null && newNet < 0;
  const canSubmit = !submitting && !loading && earning && !amountInvalid && !reasonShort && !wouldGoNegative;

  const submit = async (e) => {
    e?.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await earningsApi.adjustEarning(earning.id, { amount: parsedAmount, reason: reasonTrimmed });
      toast({
        title: 'Adjustment recorded',
        description: 'Driver was notified via toast and inbox.',
        variant: 'success'
      });
      onAdjusted?.();
      onClose?.();
    } catch (err) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.message ||
        'Failed to record the adjustment.';
      toast({
        title: 'Adjustment failed',
        description: msg,
        variant: 'error'
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Adjust earning</CardTitle>
            <p className="text-small text-text-tertiary mt-1">
              {loadReference ? `Load ${loadReference}` : 'Selected load'}
            </p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Spinner />
            </div>
          ) : lookupError ? (
            <div className="flex items-start gap-2 p-3 bg-red-50 text-red-700 rounded-card">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <p className="text-body-sm">{lookupError}</p>
            </div>
          ) : earning ? (
            <form onSubmit={submit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-body-sm">
                <Field label="Original pay" value={formatCurrency(originalPay)} />
                <Field label="Adjustments so far" value={formatCurrency(adjustmentsTotal)} />
                <Field label="Current net" value={formatCurrency(currentNet)} />
                <Field
                  label="New net (preview)"
                  value={formatCurrency(newNet)}
                  highlight={parsedAmount !== null && !wouldGoNegative}
                  warn={wouldGoNegative}
                />
              </div>

              <div>
                <label className="text-small font-medium text-text-secondary block mb-1">
                  Amount (use minus to deduct)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="-25.00 or 10.50"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  autoFocus
                />
                {wouldGoNegative && (
                  <p className="text-small text-red-600 mt-1">
                    Net would drop below $0. Use a smaller deduction.
                  </p>
                )}
              </div>

              <div>
                <label className="text-small font-medium text-text-secondary block mb-1">
                  Reason
                </label>
                <textarea
                  className="w-full rounded-card border border-border-subtle p-2 text-body-sm bg-surface-primary focus:outline-none focus:ring-1 focus:ring-accent"
                  rows={3}
                  placeholder="e.g. fuel advance not deducted yet"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  minLength={REASON_MIN}
                />
                <p className={`text-small mt-1 ${reasonShort ? 'text-text-tertiary' : 'text-success'}`}>
                  {reasonTrimmed.length} / {REASON_MIN} chars minimum
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!canSubmit}>
                  {submitting && <Spinner size="sm" className="mr-1" />}
                  Record adjustment
                </Button>
              </div>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, highlight, warn }) {
  return (
    <div>
      <p className="text-text-tertiary text-small">{label}</p>
      <p className={`font-medium ${warn ? 'text-red-600' : highlight ? 'text-success' : 'text-text-primary'}`}>
        {value}
      </p>
    </div>
  );
}

export default EarningAdjustModal;
