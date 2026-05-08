import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Truck,
  RefreshCw,
  Loader2,
  AlertCircle,
  MapPin,
  ExternalLink
} from 'lucide-react';
import { useOutletContext } from 'react-router-dom';
import spottyApi from '../../api/spotty.api';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../lib/utils';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'active', 'completed', 'canceled'];

export default function SpottyBookingsPage() {
  const { profile } = useOutletContext() || {};
  const isHost = profile?.spotty_role === 'host';

  const [view, setView] = useState('renter'); // 'renter' | 'host'
  const [statusFilter, setStatusFilter] = useState('all');
  const [data, setData] = useState({ loading: true, error: null, bookings: [] });
  const [refreshing, setRefreshing] = useState(false);

  const load = async (opts = {}) => {
    if (opts.silent) setRefreshing(true);
    else setData((s) => ({ ...s, loading: true, error: null }));

    try {
      const fetcher = view === 'host' ? spottyApi.getHostBookings : spottyApi.getBookings;
      const res = await fetcher();
      const bookings = normalizeList(res?.data);
      setData({ loading: false, error: null, bookings });
    } catch (err) {
      const message = extractError(err) || 'Could not load bookings';
      setData({ loading: false, error: message, bookings: [] });
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [view]);

  const visible = useMemo(() => {
    if (statusFilter === 'all') return data.bookings;
    return data.bookings.filter(
      (b) => String(b.status || '').toLowerCase() === statusFilter
    );
  }, [data.bookings, statusFilter]);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-10">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-headline text-text-primary">Bookings</h1>
            <p className="text-body-sm text-text-secondary mt-1">
              {view === 'host' ? 'Reservations on your spots' : 'Your truck parking reservations'}
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

      {/* Host/renter toggle */}
      {isHost && (
        <div className="mt-6 inline-flex p-1 bg-surface-secondary rounded-button">
          {[
            { id: 'renter', label: 'My reservations' },
            { id: 'host', label: 'On my spots' }
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setView(id)}
              className={cn(
                'px-4 py-1.5 rounded-chip text-body-sm transition-colors',
                view === id
                  ? 'bg-white text-text-primary shadow-button'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Status filter chips */}
      <div className="mt-6 flex items-center gap-2 flex-wrap">
        {STATUS_FILTERS.map((s) => {
          const count =
            s === 'all'
              ? data.bookings.length
              : data.bookings.filter((b) => String(b.status || '').toLowerCase() === s).length;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-3 py-1.5 rounded-chip text-body-sm font-medium transition-colors capitalize',
                statusFilter === s
                  ? 'bg-text-primary text-white'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
              )}
            >
              {s} {count > 0 && <span className="ml-1 opacity-60">{count}</span>}
            </button>
          );
        })}
      </div>

      {/* Body */}
      <div className="mt-6">
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
        ) : visible.length === 0 ? (
          <Card className="!p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary">
              {data.bookings.length === 0
                ? 'No bookings yet'
                : `No ${statusFilter} bookings`}
            </h3>
            <p className="text-body-sm text-text-secondary mt-1">
              {data.bookings.length === 0
                ? view === 'host'
                  ? 'Bookings on your listings will appear here.'
                  : 'Reservations you make on Spotty will appear here.'
                : `Try another filter to see other bookings.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map((b) => (
              <BookingRow key={b.id} booking={b} isHost={view === 'host'} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BookingRow({ booking, isHost }) {
  const start = booking.start_time ? new Date(booking.start_time) : null;
  const end = booking.end_time ? new Date(booking.end_time) : null;
  const listing = booking.listing || {};
  const fmt = (d) => d?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const days = start && end ? Math.max(1, Math.round((end - start) / 86400000)) : null;

  return (
    <Card className="!p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-button bg-accent-muted flex items-center justify-center flex-shrink-0">
          <Truck className="w-6 h-6 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-body font-medium text-text-primary truncate">
              {listing.title || `Listing #${booking.listing_id}`}
            </span>
            {booking.status && (
              <Badge variant={statusVariant(booking.status)}>{booking.status}</Badge>
            )}
          </div>

          {(listing.city || listing.state) && (
            <div className="flex items-center gap-1.5 mt-1 text-small text-text-tertiary">
              <MapPin className="w-3.5 h-3.5" />
              {[listing.city, listing.state].filter(Boolean).join(', ')}
            </div>
          )}

          <div className="text-body-sm text-text-secondary mt-2">
            {start && end ? (
              <>
                <span className="font-medium text-text-primary">{fmt(start)}</span>
                <span className="mx-2 text-text-tertiary">→</span>
                <span className="font-medium text-text-primary">{fmt(end)}</span>
                {days && (
                  <span className="ml-2 text-text-tertiary">({days} day{days !== 1 ? 's' : ''})</span>
                )}
              </>
            ) : '—'}
          </div>

          <div className="text-small text-text-tertiary mt-2 space-x-3">
            {booking.driver_name && <span>Driver: {booking.driver_name}</span>}
            {booking.truck_number && <span>Truck #{booking.truck_number}</span>}
            {booking.vehicle_type && <span className="capitalize">{booking.vehicle_type.replace('-', ' + ')}</span>}
          </div>
        </div>

        <div className="text-right flex-shrink-0">
          {booking.amount_paid != null && (
            <div className="text-body font-semibold text-text-primary">
              ${Number(booking.amount_paid).toFixed(2)}
            </div>
          )}
          {listing.slug && (
            <a
              href={`https://www.gospotty.com/spot/${listing.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-small text-accent hover:underline mt-2"
            >
              View on Spotty
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

function CenterRow({ children }) {
  return <div className="flex items-center justify-center py-16">{children}</div>;
}

function normalizeList(data) {
  if (Array.isArray(data)) return data;
  return data?.bookings || data?.data || [];
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
