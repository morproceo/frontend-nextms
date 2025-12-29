/**
 * DriverEarningsPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalEarnings hook
 * - Component focuses on rendering
 */

import { Link } from 'react-router-dom';
import { useDriverPortalEarnings } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import {
  DollarSign,
  TrendingUp,
  Package,
  MapPin,
  Truck
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export function DriverEarningsPage() {
  // All data and logic from the hook
  const {
    history,
    summary,
    loading
  } = useDriverPortalEarnings();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline text-text-primary">Earnings</h1>
        <p className="text-body text-text-secondary mt-1">
          Track your earnings and completed loads
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-small text-text-tertiary">This Month</p>
              <p className="text-title text-text-primary">
                {formatCurrency(summary.monthToDate)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-small text-text-tertiary">Year to Date</p>
              <p className="text-title text-text-primary">
                {formatCurrency(summary.yearToDate)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-small text-text-tertiary">Completed Loads</p>
              <p className="text-title text-text-primary">
                {summary.completedLoads}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Truck className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-small text-text-tertiary">Total Miles</p>
              <p className="text-title text-text-primary">
                {summary.totalMiles.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Earnings History */}
      <Card className="p-6">
        <h2 className="text-title text-text-primary mb-4">Recent Earnings</h2>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-body text-text-secondary">
              No completed loads with earnings yet.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((load) => (
              <Link
                key={load.id}
                to={`/driver/loads/${load.id}`}
                className="flex items-center justify-between p-4 bg-surface-secondary rounded-card hover:bg-surface-tertiary/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-surface-primary flex items-center justify-center">
                    <Package className="w-5 h-5 text-text-tertiary" />
                  </div>
                  <div>
                    <p className="text-body font-medium text-text-primary">
                      {load.reference_number}
                    </p>
                    <div className="flex items-center gap-2 text-small text-text-secondary">
                      <MapPin className="w-3 h-3" />
                      <span>
                        {load.shipper_city}, {load.shipper_state} → {load.consignee_city}, {load.consignee_state}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-body font-semibold text-success">
                    {formatCurrency(load.driver_pay)}
                  </p>
                  <p className="text-small text-text-tertiary">
                    {load.miles?.toLocaleString()} mi • {formatDate(load.completed_at)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

export default DriverEarningsPage;
