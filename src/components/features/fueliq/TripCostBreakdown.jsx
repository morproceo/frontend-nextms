/**
 * TripCostBreakdown - Per-state fuel cost breakdown with recommended stops
 * Reusable in trip planner and modals
 */

import { Fuel, MapPin, DollarSign, Gauge, Route } from 'lucide-react';
import { Card } from '../../ui/Card';
import { formatCurrency } from '../../../lib/utils';

export function TripCostBreakdown({ trip, className = '' }) {
  if (!trip) return null;

  return (
    <div className={className}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <SummaryCard
          icon={Route}
          label="Total Miles"
          value={trip.total_miles?.toLocaleString()}
        />
        <SummaryCard
          icon={Fuel}
          label="Total Gallons"
          value={trip.total_gallons?.toFixed(1)}
        />
        <SummaryCard
          icon={DollarSign}
          label="Fuel Cost"
          value={formatCurrency(trip.total_fuel_cost)}
          highlight
        />
        <SummaryCard
          icon={Gauge}
          label="Cost/Mile"
          value={`$${trip.cost_per_mile?.toFixed(3)}`}
        />
      </div>

      {/* State Breakdown */}
      <Card variant="elevated" padding="default">
        <h3 className="text-title-sm text-text-primary mb-4">State Breakdown</h3>
        <div className="space-y-2">
          {trip.state_segments?.map((seg, i) => {
            const isFuelStop = trip.suggested_stops?.some(s => s.state_code === seg.state_code);
            return (
              <div
                key={`${seg.state_code}-${i}`}
                className={`flex items-center justify-between p-3 rounded-button ${
                  isFuelStop ? 'bg-green-50 border border-green-200' : 'bg-surface-secondary'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col">
                    <span className="text-body font-medium text-text-primary">
                      {seg.state_name || seg.state_code}
                    </span>
                    <span className="text-small text-text-tertiary">
                      {seg.miles?.toFixed(0)} mi @ ${seg.price_per_gallon?.toFixed(3)}/gal
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {isFuelStop && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-chip bg-green-100 text-green-700 text-small font-medium">
                      <Fuel className="w-3 h-3" />
                      Fuel Here
                    </span>
                  )}
                  <span className="text-body font-semibold text-text-primary">
                    {formatCurrency(seg.cost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Suggested Stops */}
      {trip.suggested_stops?.length > 0 && (
        <Card variant="outline" padding="default" className="mt-4">
          <h3 className="text-title-sm text-text-primary mb-3">Recommended Fuel Stops</h3>
          <div className="space-y-2">
            {trip.suggested_stops.map((stop, i) => (
              <div key={i} className="flex items-start gap-3 p-3 bg-surface-secondary rounded-button">
                <div className="p-2 bg-green-100 rounded-chip">
                  <MapPin className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <div className="text-body font-medium text-text-primary">
                    {stop.state_name} — ${stop.price_per_gallon?.toFixed(3)}/gal
                  </div>
                  <div className="text-small text-text-tertiary">
                    ~Mile {stop.at_mile} — {stop.reason}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ icon: Icon, label, value, highlight = false }) {
  return (
    <Card variant="elevated" padding="sm">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${highlight ? 'text-accent' : 'text-text-tertiary'}`} />
        <span className="text-small text-text-tertiary">{label}</span>
      </div>
      <div className={`text-title-sm font-semibold ${highlight ? 'text-accent' : 'text-text-primary'}`}>
        {value}
      </div>
    </Card>
  );
}

export default TripCostBreakdown;
