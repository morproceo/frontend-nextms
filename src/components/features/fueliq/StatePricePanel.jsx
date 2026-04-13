/**
 * StatePricePanel - Slide-out panel showing state price details and trend
 * Reusable in dashboard and modals
 */

import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';

export function StatePricePanel({
  stateCode,
  stateName,
  currentPrice,
  change,
  history = [],
  loading = false,
  onClose
}) {
  if (!stateCode) return null;

  const maxPrice = history.length
    ? Math.max(...history.map(h => h.price))
    : currentPrice || 5;
  const minPrice = history.length
    ? Math.min(...history.map(h => h.price))
    : currentPrice || 3;
  const priceRange = maxPrice - minPrice || 0.5;

  const changeIcon = change > 0
    ? <TrendingUp className="w-4 h-4 text-red-400" />
    : change < 0
      ? <TrendingDown className="w-4 h-4 text-green-400" />
      : <Minus className="w-4 h-4 text-text-tertiary" />;

  const changeColor = change > 0 ? 'text-red-400' : change < 0 ? 'text-green-400' : 'text-text-tertiary';

  return (
    <div className="bg-white rounded-card shadow-elevated p-6 w-full max-w-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-title-sm text-text-primary">{stateName || stateCode}</h3>
          <span className="text-small text-text-tertiary">{stateCode}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-chip hover:bg-surface-secondary transition-colors"
        >
          <X className="w-4 h-4 text-text-tertiary" />
        </button>
      </div>

      {/* Current Price */}
      <div className="mb-6">
        <div className="text-display text-text-primary">
          ${currentPrice?.toFixed(3)}
          <span className="text-body text-text-tertiary ml-1">/gal</span>
        </div>
        <div className={`flex items-center gap-1 mt-1 ${changeColor}`}>
          {changeIcon}
          <span className="text-body-sm font-medium">
            {change > 0 ? '+' : ''}{change?.toFixed(3) || '0.000'} this week
          </span>
        </div>
      </div>

      {/* Price Trend Chart */}
      <div>
        <h4 className="text-body-sm font-medium text-text-secondary mb-3">12-Week Trend</h4>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Spinner size="sm" />
          </div>
        ) : history.length > 0 ? (
          <div className="flex items-end gap-1 h-32">
            {history.map((h, i) => {
              const heightPct = ((h.price - minPrice) / priceRange) * 80 + 10;
              const isLatest = i === history.length - 1;
              return (
                <div key={h.date} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className={`w-full rounded-t transition-all ${
                      isLatest ? 'bg-accent' : 'bg-accent/40'
                    }`}
                    style={{ height: `${heightPct}%` }}
                    title={`${h.date}: $${h.price.toFixed(3)}`}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex items-center justify-center h-32 text-text-tertiary text-small">
            No history available
          </div>
        )}
        {history.length > 0 && (
          <div className="flex justify-between mt-2 text-caption text-text-tertiary">
            <span>{history[0]?.date}</span>
            <span>{history[history.length - 1]?.date}</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default StatePricePanel;
