import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  CreditCard,
  RefreshCw,
  Loader2,
  AlertCircle,
  TrendingUp,
  Calendar
} from 'lucide-react';
import spottyApi from '../../api/spotty.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

export default function SpottyPaymentsPage() {
  const [data, setData] = useState({ loading: true, error: null, payments: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = async (opts = {}) => {
    if (opts.silent) setRefreshing(true);
    else setData((s) => ({ ...s, loading: true, error: null }));

    try {
      const res = await spottyApi.getPayments();
      const payments = normalizeList(res?.data);
      setData({ loading: false, error: null, payments });
    } catch (err) {
      const message = extractError(err) || 'Could not load payments';
      setData({ loading: false, error: message, payments: [] });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const stats = useMemo(() => {
    const total = data.payments.reduce((sum, p) => sum + amountOf(p), 0);
    const successful = data.payments.filter(
      (p) => ['paid', 'succeeded', 'completed'].includes(String(p.status || '').toLowerCase())
    ).length;
    return { total, successful, count: data.payments.length };
  }, [data.payments]);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-headline text-text-primary">Payments</h1>
            <p className="text-body-sm text-text-secondary mt-1">
              Charges from your Spotty bookings.
            </p>
          </div>
          <button
            onClick={() => load({ silent: true })}
            disabled={refreshing || data.loading}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-button text-body-sm text-text-secondary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', refreshing && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <StatCard
          icon={TrendingUp}
          label="Total spent"
          value={data.loading ? '—' : `$${stats.total.toFixed(2)}`}
          accent="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={CreditCard}
          label="Total payments"
          value={data.loading ? '—' : stats.count}
          accent="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Calendar}
          label="Successful"
          value={data.loading ? '—' : stats.successful}
          accent="from-violet-500 to-blue-500"
        />
      </div>

      <div className="mt-10">
        {data.error && (
          <Card className="mb-4 bg-error-muted border border-error/20">
            <div className="flex items-start gap-3 text-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-body-sm">{data.error}</div>
            </div>
          </Card>
        )}

        {data.loading ? (
          <CenterRow>
            <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
          </CenterRow>
        ) : data.payments.length === 0 ? (
          <Card className="!p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
              <CreditCard className="w-6 h-6 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary">No payment history</h3>
            <p className="text-body-sm text-text-secondary mt-1">
              Charges from Spotty will appear here once you've booked a spot.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {data.payments.map((p, i) => (
              <PaymentRow key={p.id || i} payment={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <Card className="!p-5">
      <div className="flex items-center gap-4">
        <div
          className={cn(
            'w-11 h-11 rounded-button bg-gradient-to-br flex items-center justify-center flex-shrink-0',
            accent
          )}
        >
          <Icon className="w-5 h-5 text-white" strokeWidth={1.75} />
        </div>
        <div>
          <div className="text-small text-text-tertiary">{label}</div>
          <div className="text-title-sm font-semibold text-text-primary mt-0.5">
            {value}
          </div>
        </div>
      </div>
    </Card>
  );
}

function PaymentRow({ payment }) {
  const amount = amountOf(payment);
  const date = payment.processed_at || payment.created_at || payment.createdAt;
  const status = payment.status;
  return (
    <Card className="!p-5">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-button bg-accent-muted flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body font-medium text-text-primary truncate">
              {payment.description ||
                payment.booking?.listing?.title ||
                `Booking #${payment.booking_id || payment.id}`}
            </span>
            {status && <Badge variant={statusVariant(status)}>{status}</Badge>}
          </div>
          <div className="text-small text-text-tertiary mt-1 space-x-3">
            {date && <span>{new Date(date).toLocaleString()}</span>}
            {payment.stripe_charge_id && (
              <span className="font-mono">{payment.stripe_charge_id.slice(0, 14)}…</span>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-body font-semibold text-text-primary">
            ${Number(amount).toFixed(2)}
          </div>
        </div>
      </div>
    </Card>
  );
}

function CenterRow({ children }) {
  return <div className="flex items-center justify-center py-16">{children}</div>;
}

function amountOf(payment) {
  const a = payment.amount ?? payment.purchase_price ?? payment.amount_paid ?? 0;
  const n = Number(a);
  return Number.isFinite(n) ? n : 0;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.payments || data?.data || [];
}

function statusVariant(status) {
  if (!status) return 'gray';
  const s = String(status).toLowerCase();
  if (s === 'paid' || s === 'succeeded' || s === 'completed') return 'green';
  if (s === 'pending') return 'yellow';
  if (s === 'failed' || s === 'refunded' || s === 'canceled') return 'red';
  return 'gray';
}

function extractError(err) {
  if (!err) return null;
  return (
    err.response?.data?.error?.message ||
    err.response?.data?.error ||
    err.response?.data?.message ||
    err.message
  );
}
