/**
 * FuelPriceTicker - Animated top bar showing key fuel price stats
 * Reusable in dashboard and driver portal
 */

import { Fuel, TrendingUp, TrendingDown, Minus } from 'lucide-react';

export function FuelPriceTicker({ national, orgStats, className = '' }) {
  if (!national) return null;

  const ChangeIndicator = ({ value }) => {
    if (!value) return <Minus className="w-3 h-3 text-text-tertiary" />;
    return value > 0
      ? <TrendingUp className="w-3 h-3 text-red-400" />
      : <TrendingDown className="w-3 h-3 text-green-400" />;
  };

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-3 ${className}`}>
      {/* National Avg */}
      <div className="bg-white rounded-card shadow-card p-4">
        <div className="flex items-center gap-2 mb-1">
          <Fuel className="w-4 h-4 text-accent" />
          <span className="text-small text-text-tertiary">National Avg</span>
        </div>
        <div className="text-title font-semibold text-text-primary">
          ${national.national_avg?.toFixed(3)}
          <span className="text-small text-text-tertiary ml-1">/gal</span>
        </div>
      </div>

      {/* Your Org Average */}
      {orgStats?.avg_ppg && (
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <Fuel className="w-4 h-4 text-blue-500" />
            <span className="text-small text-text-tertiary">Your Avg</span>
          </div>
          <div className="text-title font-semibold text-text-primary">
            ${orgStats.avg_ppg.toFixed(3)}
            <span className="text-small text-text-tertiary ml-1">/gal</span>
          </div>
        </div>
      )}

      {/* Cheapest State */}
      {national.cheapest && (
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingDown className="w-4 h-4 text-green-500" />
            <span className="text-small text-text-tertiary">Cheapest</span>
          </div>
          <div className="text-title font-semibold text-green-600">
            {national.cheapest.state_code} ${national.cheapest.price?.toFixed(3)}
          </div>
        </div>
      )}

      {/* Most Expensive State */}
      {national.priciest && (
        <div className="bg-white rounded-card shadow-card p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-red-500" />
            <span className="text-small text-text-tertiary">Most Expensive</span>
          </div>
          <div className="text-title font-semibold text-red-500">
            {national.priciest.state_code} ${national.priciest.price?.toFixed(3)}
          </div>
        </div>
      )}
    </div>
  );
}

export default FuelPriceTicker;
