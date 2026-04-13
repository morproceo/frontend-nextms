/**
 * FuelIQ Dashboard - Main fuel intelligence page
 * Map, price stats, price movers, quick actions
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { useFuelIQ } from '../../../hooks/domain/useFuelIQ';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { FuelPriceMap } from '../../../components/features/fueliq/FuelPriceMap';
import { StatePricePanel } from '../../../components/features/fueliq/StatePricePanel';
import { FuelPriceTicker } from '../../../components/features/fueliq/FuelPriceTicker';
import {
  Fuel,
  RefreshCw,
  Route,
  Calculator,
  TrendingUp,
  TrendingDown,
  Clock
} from 'lucide-react';

export function FuelIQDashboardPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const {
    national,
    orgStats,
    priceMapData,
    priceMovers,
    selectedState,
    setSelectedState,
    priceHistory,
    asOf,
    stale,
    loading,
    historyLoading,
    refreshing,
    refresh
  } = useFuelIQ();

  // Find current price for selected state
  const selectedPriceData = priceMapData.find(p => p.state_code === selectedState);

  if (loading && !priceMapData.length) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-headline text-text-primary flex items-center gap-2">
            <Fuel className="w-6 h-6 text-accent" />
            FuelIQ
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Fuel intelligence for your fleet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {asOf && (
            <span className="text-small text-text-tertiary flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {asOf}
              {stale && <span className="text-yellow-500">(stale)</span>}
            </span>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={refresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Price Ticker */}
      <FuelPriceTicker national={national} orgStats={orgStats} />

      {/* Map + State Panel */}
      <div className="flex gap-4">
        <div className="flex-1">
          <FuelPriceMap
            prices={priceMapData}
            selectedState={selectedState}
            onStateClick={setSelectedState}
            height="500px"
          />
        </div>
        {selectedState && (
          <div className="hidden lg:block">
            <StatePricePanel
              stateCode={selectedState}
              stateName={selectedPriceData?.state_name}
              currentPrice={selectedPriceData?.price_per_gallon}
              change={selectedPriceData?.change}
              history={priceHistory?.history || []}
              loading={historyLoading}
              onClose={() => setSelectedState(null)}
            />
          </div>
        )}
      </div>

      {/* Mobile state panel */}
      {selectedState && (
        <div className="lg:hidden">
          <StatePricePanel
            stateCode={selectedState}
            stateName={selectedPriceData?.state_name}
            currentPrice={selectedPriceData?.price_per_gallon}
            change={selectedPriceData?.change}
            history={priceHistory?.history || []}
            loading={historyLoading}
            onClose={() => setSelectedState(null)}
          />
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card
          variant="elevated"
          padding="default"
          className="cursor-pointer hover:shadow-elevated transition-shadow"
          onClick={() => navigate(orgUrl('/tools/fueliq/trip'))}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-accent/10 rounded-card">
              <Route className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-body font-semibold text-text-primary">Trip Fuel Planner</h3>
              <p className="text-small text-text-tertiary">Calculate fuel costs for any load</p>
            </div>
          </div>
        </Card>

        <Card
          variant="elevated"
          padding="default"
          className="cursor-pointer hover:shadow-elevated transition-shadow"
          onClick={() => navigate(orgUrl('/tools/fueliq/surcharge'))}
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-100 rounded-card">
              <Calculator className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-body font-semibold text-text-primary">FSC Calculator</h3>
              <p className="text-small text-text-tertiary">Fuel surcharge rates and tables</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Price Movers */}
      {priceMovers.length > 0 && (
        <Card variant="elevated" padding="default">
          <h2 className="text-title-sm text-text-primary mb-4">Price Movers</h2>
          <div className="space-y-2">
            {priceMovers.map((p) => (
              <div
                key={p.state_code}
                className="flex items-center justify-between p-3 bg-surface-secondary rounded-button cursor-pointer hover:bg-surface-tertiary transition-colors"
                onClick={() => setSelectedState(p.state_code)}
              >
                <div className="flex items-center gap-3">
                  <span className="text-body font-medium text-text-primary w-6">{p.state_code}</span>
                  <span className="text-body text-text-secondary">${p.price_per_gallon?.toFixed(3)}/gal</span>
                </div>
                <div className={`flex items-center gap-1 text-body-sm font-medium ${
                  p.change > 0 ? 'text-red-500' : p.change < 0 ? 'text-green-500' : 'text-text-tertiary'
                }`}>
                  {p.change > 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : p.change < 0 ? (
                    <TrendingDown className="w-4 h-4" />
                  ) : null}
                  {p.change > 0 ? '+' : ''}{p.change?.toFixed(3)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default FuelIQDashboardPage;
