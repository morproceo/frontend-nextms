/**
 * CurrentTripCard
 * Floating overlay on the Find My Truck map. Shows the pickup info for the
 * currently selected truck's active load and a Start button so the driver
 * can flip the dispatch into IN_PROGRESS.
 *
 * The backend computes `can_start` per truck — it's true only when the
 * caller IS the assigned driver AND the assignment is in 'accepted'
 * (not yet started). Dispatchers see the card but the button is disabled.
 */

import { useState } from 'react';
import api from '../../../api/client';
import {
  Package, MapPin, Calendar, Truck as TruckIcon, Loader2, Play, Navigation,
  CheckCircle2, AlertCircle, X
} from 'lucide-react';

function formatTime(timeStr) {
  if (!timeStr) return null;
  // scheduled_time_start is TIME ('HH:MM:SS')
  const [h, m] = String(timeStr).split(':');
  if (!h) return null;
  const hourNum = parseInt(h, 10);
  const ampm = hourNum >= 12 ? 'pm' : 'am';
  const hr12 = hourNum % 12 === 0 ? 12 : hourNum % 12;
  return `${hr12}:${m || '00'} ${ampm}`;
}

function formatDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function buildPickupAddress(pickup) {
  if (!pickup) return null;
  const cityState = [pickup.city, pickup.state].filter(Boolean).join(', ');
  const cityZip = [cityState, pickup.zip].filter(Boolean).join(' ');
  return [pickup.address, cityZip].filter(Boolean).join(' · ');
}

function googleMapsHref(pickup) {
  if (!pickup) return null;
  const q = [pickup.address, pickup.city, pickup.state, pickup.zip]
    .filter(Boolean).join(', ');
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(q)}`;
}

export function CurrentTripCard({ truck, onClose, onTripStarted }) {
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const dispatch = truck?.current_dispatch;
  if (!dispatch) return null;

  const load = dispatch.load || {};
  const pickup = dispatch.pickup;
  const canStart = !!dispatch.can_start;
  const started = !!dispatch.started || dispatch.status === 'in_progress';

  const startTrip = async () => {
    setStarting(true); setError(null); setMsg(null);
    try {
      await api.post(`/v1/dispatch/${dispatch.id}/start`);
      setMsg('Trip started');
      onTripStarted?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Could not start trip');
    } finally {
      setStarting(false);
    }
  };

  const pickupAddr = buildPickupAddress(pickup);
  const directionsUrl = googleMapsHref(pickup);
  const pickupDate = formatDate(pickup?.scheduled_date || load.pickup_date);
  const pickupTime = formatTime(pickup?.scheduled_time_start);

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100vw-2rem)] sm:w-[420px] max-w-[420px]">
      <div className="bg-white rounded-card border border-surface-tertiary shadow-lg overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between bg-surface-secondary/40">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-md bg-accent/10 flex items-center justify-center flex-shrink-0">
              <Package className="w-3.5 h-3.5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="text-body-sm font-semibold text-text-primary truncate">
                Current trip
                {load.reference_number ? ` · ${load.reference_number}` : ''}
              </p>
              <p className="text-[11px] text-text-tertiary truncate">
                Unit #{truck.unit_number}
                {load.broker_name ? ` · ${load.broker_name}` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-tertiary text-text-tertiary hover:text-text-secondary flex-shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3">
          {/* Pickup address */}
          <div className="flex items-start gap-2.5">
            <MapPin className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Pickup</p>
              {pickup?.facility_name && (
                <p className="text-body-sm font-medium text-text-primary truncate">
                  {pickup.facility_name}
                </p>
              )}
              {pickupAddr ? (
                <p className="text-small text-text-secondary break-words">{pickupAddr}</p>
              ) : (
                <p className="text-small text-text-tertiary italic">No pickup address on file</p>
              )}
            </div>
          </div>

          {/* Appointment */}
          {(pickupDate || pickupTime) && (
            <div className="flex items-start gap-2.5">
              <Calendar className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">Appointment</p>
                <p className="text-body-sm text-text-primary">
                  {[pickupDate, pickupTime].filter(Boolean).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* Meta row */}
          {(load.miles != null || load.revenue != null) && (
            <div className="flex items-center gap-4 text-small text-text-tertiary pt-1 border-t border-surface-tertiary">
              {load.miles != null && (
                <span className="inline-flex items-center gap-1">
                  <TruckIcon className="w-3.5 h-3.5" />
                  {Math.round(load.miles).toLocaleString()} mi
                </span>
              )}
              {load.revenue != null && (
                <span className="inline-flex items-center gap-1">
                  ${load.revenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              )}
            </div>
          )}

          {/* Banners */}
          {error && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-error/5 border border-error/20">
              <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
              <p className="text-small text-error">{error}</p>
            </div>
          )}
          {msg && (
            <div className="flex items-start gap-2 px-2.5 py-2 rounded-md bg-emerald-500/5 border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
              <p className="text-small text-emerald-700">{msg}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={startTrip}
              disabled={starting || started || !canStart}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-button text-body-sm font-medium transition-colors ${
                started
                  ? 'bg-emerald-500/10 text-emerald-700 cursor-default'
                  : canStart
                    ? 'bg-accent text-white hover:bg-accent/90 disabled:opacity-60'
                    : 'bg-surface-secondary text-text-tertiary cursor-not-allowed'
              }`}
              title={
                started ? 'Trip already in progress'
                : canStart ? 'Start this trip'
                : 'Only the assigned driver can start'
              }
            >
              {starting
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : started
                  ? <CheckCircle2 className="w-4 h-4" />
                  : <Play className="w-4 h-4" />}
              {starting ? 'Starting…' : started ? 'In transit' : 'Start trip'}
            </button>

            {directionsUrl && (
              <a
                href={directionsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-button border border-surface-tertiary text-body-sm font-medium text-text-secondary hover:bg-surface-secondary"
                title="Open in Google Maps"
              >
                <Navigation className="w-4 h-4" />
                Navigate
              </a>
            )}
          </div>

          {!canStart && !started && (
            <p className="text-[11px] text-text-tertiary text-center">
              Only the assigned driver can start this trip.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default CurrentTripCard;
