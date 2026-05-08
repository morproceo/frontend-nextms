import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  CardElement,
  useStripe,
  useElements
} from '@stripe/react-stripe-js';
import {
  ArrowLeft,
  MapPin,
  Loader2,
  AlertCircle,
  ExternalLink,
  Truck,
  CheckCircle2,
  Calendar,
  CreditCard
} from 'lucide-react';
import spottyApi from '../../api/spotty.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { MAPBOX_TOKEN } from '../../services/map/config';
import { cn } from '../../lib/utils';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Stripe — uses Spotty's TEST publishable key. The booking widget collects
// card details client-side via Stripe Elements; the resulting payment_method
// id is forwarded to NextMS proxy → Spotty's POST /api/v1/bookings.
const SPOTTY_STRIPE_PK = import.meta.env.VITE_SPOTTY_STRIPE_PUBLIC_KEY;
const stripePromise = SPOTTY_STRIPE_PK ? loadStripe(SPOTTY_STRIPE_PK) : null;

const STRIPE_CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '15px',
      color: '#1D1D1F',
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif',
      '::placeholder': { color: '#86868B' }
    },
    invalid: { color: '#FF3B30' }
  }
};

const VEHICLE_OPTIONS = [
  { id: 'truck-trailer', label: 'Truck + Trailer' },
  { id: 'truck-only', label: 'Truck only' },
  { id: 'trailer-only', label: 'Trailer only' },
  { id: 'other', label: 'Other' }
];

export default function SpottyListingDetailPage() {
  return (
    <Elements stripe={stripePromise}>
      <SpottyListingDetailInner />
    </Elements>
  );
}

function SpottyListingDetailInner() {
  const { orgSlug, id } = useParams();
  const navigate = useNavigate();
  const { profile } = useOutletContext() || {};
  const stripe = useStripe();
  const elements = useElements();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Booking form state
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86400000);
  const [startDate, setStartDate] = useState(today.toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(tomorrow.toISOString().slice(0, 10));
  const [vehicleType, setVehicleType] = useState('truck-trailer');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [driverEmail, setDriverEmail] = useState(profile?.spotty_email || '');
  const [truckNumber, setTruckNumber] = useState('');
  const [trailerNumber, setTrailerNumber] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [confirmation, setConfirmation] = useState(null);

  const mapContainer = useRef(null);
  const mapRef = useRef(null);

  // Load listing
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await spottyApi.getListing(id);
        const data = unwrap(res?.data);
        if (!cancelled) setListing(data);
      } catch (err) {
        if (!cancelled) setError(extractError(err) || 'Listing not found');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [id]);

  // Mount/refresh map when listing arrives
  useEffect(() => {
    if (!listing || !mapContainer.current || mapRef.current) return;
    const lat = Number(listing.latitude);
    const lng = Number(listing.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

    mapRef.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [lng, lat],
      zoom: 13
    });
    mapRef.current.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

    const el = document.createElement('div');
    el.style.cssText =
      'width:36px;height:36px;border-radius:50%;'
      + 'background:linear-gradient(135deg,#22d3ee,#2563eb);'
      + 'border:3px solid white; box-shadow:0 6px 18px rgba(37,99,235,0.55);';
    new mapboxgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [listing]);

  // Price calc
  const totals = useMemo(() => {
    if (!listing || !startDate || !endDate) return null;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      return null;
    }
    const days = Math.max(1, Math.ceil((end - start) / 86400000));
    const ratePerDay =
      vehicleType === 'truck-only'
        ? listing.daily_price_truck ?? listing.daily_price
        : vehicleType === 'trailer-only'
        ? listing.daily_price_trailer ?? listing.daily_price
        : listing.daily_price;
    const subtotal = days * Number(ratePerDay || 0);
    const platformFee = subtotal * 0.05;  // 5% — illustrative
    const total = subtotal + platformFee;
    return { days, ratePerDay, subtotal, platformFee, total };
  }, [listing, startDate, endDate, vehicleType]);

  const handleBook = async (e) => {
    e.preventDefault();
    if (!listing || !totals) return;
    if (!stripe || !elements) {
      setSubmitError('Payment system not ready yet — try again in a moment.');
      return;
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setSubmitError('Card details are required.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);

    try {
      // Step 1: tokenize the card with Stripe.js (client-side, never hits our servers)
      const { paymentMethod, error: pmError } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
        billing_details: {
          name: driverName,
          email: driverEmail || undefined,
          phone: driverPhone || undefined
        }
      });
      if (pmError) {
        setSubmitError(pmError.message || 'Card could not be validated.');
        setSubmitting(false);
        return;
      }

      // Step 2: send booking to NextMS proxy → Spotty
      const res = await spottyApi.createBooking({
        listing_id: listing.id,
        start_time: new Date(startDate).toISOString(),
        end_time: new Date(endDate).toISOString(),
        amount_paid: totals.total,
        vehicle_type: vehicleType,
        driver_name: driverName,
        driver_phone: driverPhone,
        driver_email: driverEmail || undefined,
        truck_number: truckNumber || undefined,
        trailer_number: trailerNumber || undefined,
        payment_method_id: paymentMethod.id
      });

      const data = res?.data || {};

      // Step 3: handle 3DS / SCA if Stripe asked the cardholder to authenticate.
      if (data.requires_action && data.payment_intent?.client_secret) {
        const { error: confirmErr, paymentIntent: confirmedPi } = await stripe.confirmCardPayment(
          data.payment_intent.client_secret
        );
        if (confirmErr) {
          setSubmitError(confirmErr.message || '3DS authentication failed');
          setSubmitting(false);
          return;
        }
        if (confirmedPi?.status !== 'succeeded') {
          setSubmitError(`Payment status: ${confirmedPi?.status || 'unknown'}`);
          setSubmitting(false);
          return;
        }
        // Authenticated. Booking is currently 'pending' on Spotty's side;
        // the payment_intent.succeeded webhook will flip it to 'confirmed'.
        setConfirmation({ ...data, awaiting_webhook: true });
      } else {
        setConfirmation(data);
      }
      cardElement.clear();
    } catch (err) {
      setSubmitError(extractError(err) || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-16 text-center">
        <div className="w-12 h-12 rounded-full bg-error-muted flex items-center justify-center mx-auto mb-3">
          <AlertCircle className="w-6 h-6 text-error" />
        </div>
        <h2 className="text-title text-text-primary">Couldn't load this listing</h2>
        <p className="text-body-sm text-text-secondary mt-2">{error}</p>
        <Link
          to={`/o/${orgSlug}/spotty/browse`}
          className="inline-flex items-center gap-1 text-accent hover:underline mt-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to browse
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8">
      <button
        onClick={() => navigate(`/o/${orgSlug}/spotty/browse`)}
        className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> All spots
      </button>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-elevated flex-shrink-0">
            <Truck className="w-7 h-7 text-white" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-headline text-text-primary">{listing.title}</h1>
            <div className="flex items-center gap-1.5 mt-1 text-body-sm text-text-secondary">
              <MapPin className="w-4 h-4" />
              {listing.address}, {listing.city}, {listing.state} {listing.zip_code}
            </div>
          </div>
          {listing.slug && (
            <a
              href={`https://www.gospotty.com/spot/${listing.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              View on Spotty
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6 mt-6">
        {/* Left: details */}
        <div className="space-y-6">
          <div ref={mapContainer} className="w-full h-[280px] rounded-card bg-[#0e1422] overflow-hidden border border-surface-tertiary" />

          <Card>
            <h2 className="text-title-sm text-text-primary mb-2">About this spot</h2>
            <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-line">
              {listing.description || 'No description provided.'}
            </p>
          </Card>

          {Array.isArray(listing.amenities) && listing.amenities.length > 0 && (
            <Card>
              <h2 className="text-title-sm text-text-primary mb-3">Amenities</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {listing.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-2 text-body-sm text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                    <span className="capitalize">{String(a).replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="text-title-sm text-text-primary mb-3">Pricing</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
              <PriceCell label="Truck + Trailer" daily={listing.daily_price} weekly={listing.weekly_price} monthly={listing.monthly_price} />
              <PriceCell label="Truck only" daily={listing.daily_price_truck} weekly={listing.weekly_price_truck} monthly={listing.monthly_price_truck} />
              <PriceCell label="Trailer only" daily={listing.daily_price_trailer} weekly={listing.weekly_price_trailer} monthly={listing.monthly_price_trailer} />
            </div>
          </Card>
        </div>

        {/* Right: booking widget */}
        <div className="lg:sticky lg:top-20 lg:self-start">
          <Card className="!p-5">
            <div className="flex items-baseline justify-between mb-4">
              <div>
                <span className="text-title text-text-primary font-semibold">
                  ${Number(listing.daily_price).toFixed(0)}
                </span>
                <span className="text-text-tertiary text-body-sm ml-1">/day</span>
              </div>
              <Badge variant="green">
                {listing.spots_available ?? listing.spots} open
              </Badge>
            </div>

            {confirmation ? (
              <ConfirmationView confirmation={confirmation} orgSlug={orgSlug} />
            ) : (
              <form onSubmit={handleBook} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <Field label="From">
                    <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  </Field>
                  <Field label="To">
                    <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                  </Field>
                </div>

                <Field label="Vehicle">
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 rounded-input border border-surface-tertiary bg-white text-body-sm text-text-primary"
                  >
                    {VEHICLE_OPTIONS.map((opt) => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </Field>

                <Field label="Driver name">
                  <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Full name" required />
                </Field>
                <Field label="Driver phone">
                  <Input value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} placeholder="(555) 555-5555" required />
                </Field>
                <Field label="Driver email (optional)">
                  <Input type="email" value={driverEmail} onChange={(e) => setDriverEmail(e.target.value)} />
                </Field>

                <div className="grid grid-cols-2 gap-2">
                  <Field label="Truck #">
                    <Input value={truckNumber} onChange={(e) => setTruckNumber(e.target.value)} />
                  </Field>
                  <Field label="Trailer #">
                    <Input value={trailerNumber} onChange={(e) => setTrailerNumber(e.target.value)} />
                  </Field>
                </div>

                {SPOTTY_STRIPE_PK ? (
                  <Field label="Card details">
                    <div className="px-3 py-3 rounded-input border border-surface-tertiary bg-white">
                      <CardElement
                        options={STRIPE_CARD_ELEMENT_OPTIONS}
                        onChange={(e) => setCardComplete(e.complete)}
                      />
                    </div>
                    <p className="text-small text-text-tertiary mt-1.5 flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5" />
                      Test card: <code className="font-mono">4242 4242 4242 4242</code> · any future expiry · any CVC
                    </p>
                  </Field>
                ) : (
                  <div className="flex items-start gap-2 p-3 rounded-card bg-warning-muted border border-warning/20 text-body-sm text-warning">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <span>
                      Stripe isn't configured for the ecosystem. Set{' '}
                      <code>VITE_SPOTTY_STRIPE_PUBLIC_KEY</code> in NextMS frontend and reload.
                    </span>
                  </div>
                )}

                {totals && (
                  <div className="border-t border-surface-tertiary pt-3 space-y-1.5 text-body-sm">
                    <Row label={`$${totals.ratePerDay.toFixed(0)} × ${totals.days} day${totals.days === 1 ? '' : 's'}`}>
                      ${totals.subtotal.toFixed(2)}
                    </Row>
                    <Row label="Platform fee">${totals.platformFee.toFixed(2)}</Row>
                    <Row label="Total" bold>${totals.total.toFixed(2)}</Row>
                  </div>
                )}

                {submitError && (
                  <div className="flex items-start gap-2 p-3 rounded-card bg-error-muted border border-error/20 text-body-sm text-error">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <div>
                      <div>{submitError}</div>
                      {/payment|stripe|customer/i.test(submitError) && listing.slug && (
                        <a
                          href={`https://www.gospotty.com/spot/${listing.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-accent hover:underline inline-flex items-center gap-1 mt-1"
                        >
                          Add payment on gospotty.com
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <Button
                  type="submit"
                  disabled={
                    !totals
                    || submitting
                    || !driverName
                    || !driverPhone
                    || (SPOTTY_STRIPE_PK && (!cardComplete || !stripe))
                  }
                  className="w-full"
                >
                  {submitting ? 'Booking…' : totals ? `Book — $${totals.total.toFixed(2)}` : 'Book this spot'}
                </Button>

                <p className="text-small text-text-tertiary text-center">
                  Booking through morpro · powered by Spotty
                </p>
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function ConfirmationView({ confirmation, orgSlug }) {
  const awaitingWebhook = !!confirmation?.awaiting_webhook;
  return (
    <div className="text-center py-2">
      <div className="w-12 h-12 rounded-full bg-success-muted flex items-center justify-center mx-auto mb-3">
        <CheckCircle2 className="w-6 h-6 text-success" />
      </div>
      <h3 className="text-title-sm text-text-primary">
        {awaitingWebhook ? 'Authenticated — confirming…' : 'Booking submitted'}
      </h3>
      {confirmation?.booking?.id && (
        <p className="text-body-sm text-text-secondary mt-1">
          Reference #{confirmation.booking.id}
          {awaitingWebhook && ' (status will update once payment finalizes)'}
        </p>
      )}
      <Link
        to={`/o/${orgSlug}/spotty/bookings`}
        className="inline-flex items-center gap-1 text-accent hover:underline mt-4 text-body-sm"
      >
        <Calendar className="w-4 h-4" />
        View my bookings
      </Link>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-small font-medium text-text-secondary mb-1">{label}</span>
      {children}
    </label>
  );
}

function Row({ label, bold, children }) {
  return (
    <div className={cn('flex justify-between', bold && 'font-semibold text-text-primary text-body')}>
      <span className={cn(!bold && 'text-text-secondary')}>{label}</span>
      <span>{children}</span>
    </div>
  );
}

function PriceCell({ label, daily, weekly, monthly }) {
  return (
    <div className="rounded-card bg-surface-secondary p-3">
      <div className="text-small text-text-tertiary">{label}</div>
      <div className="text-body font-semibold text-text-primary mt-1">
        ${Number(daily ?? 0).toFixed(0)}
        <span className="text-small font-normal text-text-tertiary ml-1">/day</span>
      </div>
      {(weekly || monthly) && (
        <div className="text-small text-text-tertiary mt-1 space-x-1">
          {weekly && <span>${Number(weekly).toFixed(0)}/wk</span>}
          {monthly && <span>· ${Number(monthly).toFixed(0)}/mo</span>}
        </div>
      )}
    </div>
  );
}

function unwrap(data) {
  return data?.listing || data?.data || data || null;
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
