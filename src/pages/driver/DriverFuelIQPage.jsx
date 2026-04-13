/**
 * Driver FuelIQ Page - Simplified fuel intelligence for drivers
 * Mobile-first, focused on what matters: fuel map + trip cost for current load
 */

import { useState, useEffect } from 'react';
import { useFuelIQ, useFuelIQTrip } from '../../hooks/domain/useFuelIQ';
import { useApiState } from '../../hooks/api/useApiRequest';
import * as driverPortalApi from '../../api/driverPortal.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { FuelPriceMap } from '../../components/features/fueliq/FuelPriceMap';
import { FuelPriceTicker } from '../../components/features/fueliq/FuelPriceTicker';
import { TripCostBreakdown } from '../../components/features/fueliq/TripCostBreakdown';
import { TripRouteMap } from '../../components/features/fueliq/TripRouteMap';
import {
  Fuel,
  RefreshCw,
  Route,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

export function DriverFuelIQPage() {
  const {
    national,
    priceMapData,
    selectedState,
    setSelectedState,
    loading: pricesLoading,
    refreshing,
    refresh
  } = useFuelIQ();

  // Fetch driver's loads
  const { data: loadsData, fetch: fetchLoads } = useApiState(() => driverPortalApi.getLoads());

  useEffect(() => {
    fetchLoads();
  }, []);

  const loads = loadsData?.loads || loadsData || [];

  // Trip planner for selected load
  const {
    trip,
    selectedLoadId,
    setSelectedLoadId,
    loading: tripLoading
  } = useFuelIQTrip();

  const [showMap, setShowMap] = useState(true);

  // Auto-select first active load
  useEffect(() => {
    if (loads.length > 0 && !selectedLoadId) {
      const activeLoad = loads.find(l =>
        ['dispatched', 'in_transit', 'booked'].includes(l.status)
      );
      if (activeLoad) {
        setSelectedLoadId(activeLoad.id);
      }
    }
  }, [loads, selectedLoadId]);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-text-primary flex items-center gap-2">
            <Fuel className="w-5 h-5 text-accent" />
            FuelIQ
          </h1>
          <p className="text-small text-text-secondary">Fuel prices & trip costs</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={refresh}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Price Stats */}
      <FuelPriceTicker national={national} />

      {/* Fuel Price Map (collapsible on mobile) */}
      <Card variant="elevated" padding="none">
        <button
          onClick={() => setShowMap(!showMap)}
          className="w-full flex items-center justify-between p-4"
        >
          <span className="text-body font-medium text-text-primary">State Fuel Prices</span>
          {showMap ? <ChevronUp className="w-4 h-4 text-text-tertiary" /> : <ChevronDown className="w-4 h-4 text-text-tertiary" />}
        </button>
        {showMap && (
          <FuelPriceMap
            prices={priceMapData}
            selectedState={selectedState}
            onStateClick={setSelectedState}
            height="350px"
          />
        )}
      </Card>

      {/* Trip Cost for My Load */}
      <Card variant="elevated" padding="default">
        <div className="flex items-center gap-2 mb-4">
          <Route className="w-5 h-5 text-accent" />
          <h2 className="text-title-sm text-text-primary">My Trip Fuel Cost</h2>
        </div>

        {/* Load Selector */}
        <select
          value={selectedLoadId || ''}
          onChange={(e) => setSelectedLoadId(e.target.value || null)}
          className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent mb-4"
        >
          <option value="">Select a load...</option>
          {(Array.isArray(loads) ? loads : []).map(l => (
            <option key={l.id} value={l.id}>
              #{l.reference_number || l.id.slice(0, 8)} — {l.shipper_city}, {l.shipper_state} → {l.consignee_city}, {l.consignee_state}
            </option>
          ))}
        </select>

        {tripLoading && (
          <div className="flex items-center justify-center py-8">
            <Spinner size="md" />
          </div>
        )}

        {trip && !tripLoading && (
          <div className="space-y-4">
            <TripRouteMap
              route={trip.route}
              locations={trip.locations}
              suggestedStops={trip.suggested_stops}
              height="300px"
            />
            <TripCostBreakdown trip={trip} />
          </div>
        )}

        {!trip && !tripLoading && selectedLoadId && (
          <div className="text-center py-8 text-text-tertiary text-body-sm">
            Could not calculate fuel cost for this load.
            Make sure it has pickup and delivery addresses.
          </div>
        )}
      </Card>
    </div>
  );
}

export default DriverFuelIQPage;
