/**
 * FuelIQ Trip Planner - Calculate fuel costs for loads
 * Shows route map with state segments and cost breakdown
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { useFuelIQTrip } from '../../../hooks/domain/useFuelIQ';
import { useApiState } from '../../../hooks/api/useApiRequest';
import * as loadsApi from '../../../api/loads.api';
import * as trucksApi from '../../../api/trucks.api';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { TripRouteMap } from '../../../components/features/fueliq/TripRouteMap';
import { TripCostBreakdown } from '../../../components/features/fueliq/TripCostBreakdown';
import { TruckMpgSelector } from '../../../components/features/fueliq/TruckMpgSelector';
import {
  ArrowLeft,
  Route,
  Fuel,
  Calculator
} from 'lucide-react';

export function FuelIQTripPlannerPage() {
  const { loadId: urlLoadId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const {
    trip,
    mpgData,
    selectedLoadId,
    selectedTruckId,
    mpgOverride,
    setSelectedLoadId,
    setSelectedTruckId,
    setMpgOverride,
    loading,
    error,
    recalculate
  } = useFuelIQTrip({ loadId: urlLoadId });

  // Fetch loads list for dropdown
  const { data: loadsData, fetch: fetchLoads } = useApiState(() => loadsApi.getLoads({ limit: 100 }));
  const { data: trucksData, fetch: fetchTrucks } = useApiState(() => trucksApi.getTrucks({ limit: 100 }));

  useEffect(() => {
    fetchLoads();
    fetchTrucks();
  }, []);

  const loads = loadsData?.loads || loadsData || [];
  const trucks = trucksData?.trucks || trucksData || [];

  const handleCalculate = () => {
    recalculate();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(orgUrl('/tools/fueliq'))}
          className="p-2 rounded-chip hover:bg-surface-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-headline text-text-primary flex items-center gap-2">
            <Route className="w-6 h-6 text-accent" />
            Trip Fuel Planner
          </h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Calculate fuel costs for any load
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card variant="elevated" padding="default">
        <div className="space-y-4">
          {/* Load Selector */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1.5">
              <Fuel className="w-3.5 h-3.5 inline mr-1" />
              Select Load
            </label>
            <select
              value={selectedLoadId || ''}
              onChange={(e) => setSelectedLoadId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="">Choose a load...</option>
              {(Array.isArray(loads) ? loads : []).map(l => (
                <option key={l.id} value={l.id}>
                  #{l.reference_number || l.id.slice(0, 8)} — {l.shipper_city}, {l.shipper_state} → {l.consignee_city}, {l.consignee_state}
                  {l.miles ? ` (${l.miles} mi)` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Truck & MPG */}
          <TruckMpgSelector
            trucks={Array.isArray(trucks) ? trucks : []}
            selectedTruckId={selectedTruckId}
            onTruckChange={setSelectedTruckId}
            mpg={mpgData?.mpg}
            mpgSource={mpgData?.source}
            mpgOverride={mpgOverride}
            onMpgOverride={setMpgOverride}
          />

          <Button
            onClick={handleCalculate}
            disabled={!selectedLoadId || loading}
            className="w-full sm:w-auto"
          >
            <Calculator className="w-4 h-4 mr-1.5" />
            {loading ? 'Calculating...' : 'Calculate Fuel Cost'}
          </Button>
        </div>
      </Card>

      {/* Error */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-card text-body-sm text-red-600">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && !trip && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      )}

      {/* Results */}
      {trip && (
        <>
          {/* Route Map */}
          <TripRouteMap
            route={trip.route}
            locations={trip.locations}
            suggestedStops={trip.suggested_stops}
            height="400px"
          />

          {/* Cost Breakdown */}
          <TripCostBreakdown trip={trip} />
        </>
      )}
    </div>
  );
}

export default FuelIQTripPlannerPage;
