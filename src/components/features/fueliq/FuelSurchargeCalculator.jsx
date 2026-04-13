/**
 * FuelSurchargeCalculator - Interactive FSC calculator
 * Reusable in surcharge page and modals
 */

import { useState, useEffect } from 'react';
import { Calculator, DollarSign } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { formatCurrency } from '../../../lib/utils';

export function FuelSurchargeCalculator({
  config,
  nationalAvg,
  onCalculate,
  result = null,
  loading = false
}) {
  const [currentPrice, setCurrentPrice] = useState('');
  const [baseFuelPrice, setBaseFuelPrice] = useState('');
  const [mpg, setMpg] = useState('');
  const [miles, setMiles] = useState('');

  // Pre-fill with config defaults
  useEffect(() => {
    if (config) {
      setBaseFuelPrice(config.base_fuel_price?.toString() || '1.20');
      setMpg(config.default_mpg?.toString() || '6.00');
    }
  }, [config]);

  // Pre-fill current price with national average
  useEffect(() => {
    if (nationalAvg && !currentPrice) {
      setCurrentPrice(nationalAvg.toFixed(3));
    }
  }, [nationalAvg]);

  const handleCalculate = () => {
    if (!currentPrice) return;
    onCalculate({
      current_price: parseFloat(currentPrice),
      base_fuel_price: parseFloat(baseFuelPrice) || undefined,
      mpg: parseFloat(mpg) || undefined,
      miles: parseFloat(miles) || undefined
    });
  };

  return (
    <Card variant="elevated" padding="default">
      <div className="flex items-center gap-2 mb-5">
        <Calculator className="w-5 h-5 text-accent" />
        <h3 className="text-title-sm text-text-primary">Fuel Surcharge Calculator</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="block text-small font-medium text-text-secondary mb-1.5">
            Current Diesel Price ($/gal)
          </label>
          <input
            type="number"
            step="0.001"
            value={currentPrice}
            onChange={(e) => setCurrentPrice(e.target.value)}
            placeholder="4.500"
            className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-text-secondary mb-1.5">
            Base Fuel Price ($/gal)
          </label>
          <input
            type="number"
            step="0.01"
            value={baseFuelPrice}
            onChange={(e) => setBaseFuelPrice(e.target.value)}
            placeholder="1.20"
            className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-text-secondary mb-1.5">
            Truck MPG
          </label>
          <input
            type="number"
            step="0.1"
            value={mpg}
            onChange={(e) => setMpg(e.target.value)}
            placeholder="6.0"
            className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
        <div>
          <label className="block text-small font-medium text-text-secondary mb-1.5">
            Miles (optional)
          </label>
          <input
            type="number"
            value={miles}
            onChange={(e) => setMiles(e.target.value)}
            placeholder="1000"
            className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      </div>

      <Button onClick={handleCalculate} disabled={!currentPrice || loading} className="w-full sm:w-auto">
        {loading ? 'Calculating...' : 'Calculate FSC'}
      </Button>

      {/* Result */}
      {result && (
        <div className="mt-5 p-4 bg-accent/5 rounded-button border border-accent/20">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-small text-text-tertiary">FSC Per Mile</div>
              <div className="text-title text-accent font-semibold">
                ${result.fsc_per_mile?.toFixed(4)}
              </div>
            </div>
            {result.miles > 1 && (
              <div>
                <div className="text-small text-text-tertiary">Total FSC</div>
                <div className="text-title text-accent font-semibold">
                  {formatCurrency(result.total_fsc)}
                </div>
              </div>
            )}
          </div>
          <div className="mt-3 text-caption text-text-tertiary">
            Formula: (${result.current_price?.toFixed(3)} - ${result.base_fuel_price?.toFixed(2)}) / {result.mpg} MPG = ${result.fsc_per_mile?.toFixed(4)}/mi
          </div>
        </div>
      )}
    </Card>
  );
}

export default FuelSurchargeCalculator;
