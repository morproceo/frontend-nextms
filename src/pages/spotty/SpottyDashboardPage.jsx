import { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Calendar,
  CreditCard,
  Truck,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import spottyApi from '../../api/spotty.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

export default function SpottyDashboardPage() {
  const { profile } = useOutletContext() || {};
  const { orgSlug } = useParams();
  const basePath = `/o/${orgSlug}/spotty`;

  const [data, setData] = useState({ loading: true, error: null, bookings: [], payments: [] });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [bookingsRes, paymentsRes] = await Promise.allSettled([
          spottyApi.getBookings(),
          spottyApi.getPayments()
        ]);
        if (cancelled) return;

        const bookings = normalizeList(
          bookingsRes.status === 'fulfilled' ? bookingsRes.value?.data : null
        );
        const payments = normalizeList(
          paymentsRes.status === 'fulfilled' ? paymentsRes.value?.data : null
        );

        const failures = [bookingsRes, paymentsRes].filter((r) => r.status === 'rejected');
        const error =
          failures.length > 0 ? extractError(failures[0].reason) : null;

        setData({ loading: false, error, bookings, payments });
      } catch (err) {
        if (!cancelled) {
          setData({ loading: false, error: extractError(err), bookings: [], payments: [] });
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const totalSpent = data.payments.reduce((sum, p) => {
    const amt = Number(p.amount ?? p.purchase_price ?? p.amount_paid ?? 0);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);

  const activeBookings = data.bookings.filter((b) =>
    ['confirmed', 'active', 'pending'].includes(String(b.status || '').toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-headline text-text-primary">
          Welcome{profile?.spotty_email ? `, ${profile.spotty_email.split('@')[0]}` : ''}
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Your truck parking, inside the morpro ecosystem.
        </p>
      </motion.div>

      {data.error && (
        <Card className="mt-6 bg-error-muted border border-error/20">
          <div className="flex items-start gap-3 text-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="text-body-sm">{data.error}</div>
          </div>
        </Card>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
        <StatCard
          icon={Calendar}
          label="Active bookings"
          value={data.loading ? '—' : activeBookings.length}
          accent="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Truck}
          label="Total bookings"
          value={data.loading ? '—' : data.bookings.length}
          accent="from-violet-500 to-blue-500"
        />
        <StatCard
          icon={CreditCard}
          label="Spent on Spotty"
          value={data.loading ? '—' : `$${totalSpent.toFixed(2)}`}
          accent="from-emerald-500 to-teal-500"
        />
      </div>

      {/* Recent bookings */}
      <div className="mt-10">
        <SectionHeader
          title="Recent bookings"
          link={data.bookings.length > 0 ? { to: `${basePath}/bookings`, label: 'View all' } : null}
        />
        {data.loading ? (
          <CenterRow>
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          </CenterRow>
        ) : data.bookings.length === 0 ? (
          <EmptyRow
            icon={Calendar}
            title="No bookings yet"
            message="Once you book a truck parking spot on Spotty, it shows up here."
          />
        ) : (
          <div className="space-y-3">
            {data.bookings.slice(0, 5).map((b) => (
              <BookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}
      </div>

      {/* Recent payments */}
      <div className="mt-10">
        <SectionHeader
          title="Recent payments"
          link={data.payments.length > 0 ? { to: `${basePath}/payments`, label: 'View all' } : null}
        />
        {data.loading ? (
          <CenterRow>
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          </CenterRow>
        ) : data.payments.length === 0 ? (
          <EmptyRow
            icon={CreditCard}
            title="No payment history"
            message="Charges from Spotty will appear here once you've booked a spot."
          />
        ) : (
          <div className="space-y-3">
            {data.payments.slice(0, 4).map((p, i) => (
              <PaymentCard key={p.id || i} payment={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, accent }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
    </motion.div>
  );
}

function SectionHeader({ title, link }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-title-sm text-text-primary">{title}</h2>
      {link && (
        <Link
          to={link.to}
          className="inline-flex items-center gap-1 text-body-sm text-accent hover:underline"
        >
          {link.label}
          <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}

function BookingCard({ booking }) {
  const start = booking.start_time ? new Date(booking.start_time) : null;
  const end = booking.end_time ? new Date(booking.end_time) : null;
  return (
    <Card className="!p-4">
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-button bg-accent-muted flex items-center justify-center flex-shrink-0">
          <Truck className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm font-medium text-text-primary truncate">
              {booking.listing?.title || `Listing #${booking.listing_id}`}
            </span>
            {booking.status && (
              <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
            )}
          </div>
          <div className="text-small text-text-secondary mt-0.5 truncate">
            {start && end
              ? `${start.toLocaleDateString()} → ${end.toLocaleDateString()}`
              : '—'}
          </div>
        </div>
        {booking.amount_paid != null && (
          <div className="text-body-sm font-semibold text-text-primary">
            ${Number(booking.amount_paid).toFixed(2)}
          </div>
        )}
      </div>
    </Card>
  );
}

function PaymentCard({ payment }) {
  const amount = payment.amount ?? payment.purchase_price ?? payment.amount_paid ?? null;
  const date = payment.processed_at || payment.created_at || payment.createdAt;
  return (
    <Card className="!p-4">
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-button bg-accent-muted flex items-center justify-center flex-shrink-0">
          <CreditCard className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body-sm font-medium text-text-primary truncate">
              {payment.description || `Booking #${payment.booking_id || payment.id}`}
            </span>
            {payment.status && (
              <Badge variant={statusVariant(payment.status)}>{payment.status}</Badge>
            )}
          </div>
          <div className="text-small text-text-secondary mt-0.5">
            {date ? new Date(date).toLocaleDateString() : '—'}
          </div>
        </div>
        {amount != null && (
          <div className="text-body-sm font-semibold text-text-primary">
            ${Number(amount).toFixed(2)}
          </div>
        )}
      </div>
    </Card>
  );
}

function EmptyRow({ icon: Icon, title, message }) {
  return (
    <Card className="!p-10 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
        <Icon className="w-6 h-6 text-text-tertiary" />
      </div>
      <h3 className="text-body font-medium text-text-primary">{title}</h3>
      <p className="text-body-sm text-text-secondary mt-1">{message}</p>
    </Card>
  );
}

function CenterRow({ children }) {
  return <div className="flex items-center justify-center py-8">{children}</div>;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.bookings || data?.payments || data?.data || [];
}

function statusVariant(status) {
  if (!status) return 'gray';
  const s = String(status).toLowerCase();
  if (s === 'confirmed' || s === 'active' || s === 'paid' || s === 'completed') return 'green';
  if (s === 'pending') return 'yellow';
  if (s === 'canceled' || s === 'cancelled' || s === 'failed' || s === 'refunded') return 'red';
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
