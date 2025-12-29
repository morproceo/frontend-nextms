/**
 * DriverLoadsPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalLoads hook
 * - Component focuses on rendering
 */

import { Link } from 'react-router-dom';
import { useDriverPortalLoads } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import {
  Package,
  MapPin,
  ArrowRight,
  Filter
} from 'lucide-react';
import { formatDate } from '../../lib/utils';

const statusFilters = [
  { value: '', label: 'All Loads' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' }
];

export function DriverLoadsPage() {
  // All data and logic from the hook
  const {
    loads,
    total,
    loading,
    statusFilter,
    setStatusFilter,
    getStatusColor
  } = useDriverPortalLoads();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-headline text-text-primary">My Loads</h1>
          <p className="text-body text-text-secondary mt-1">
            {total} total loads
          </p>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-tertiary" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-body-sm bg-surface-primary border border-surface-tertiary rounded-button px-3 py-2"
          >
            {statusFilters.map(f => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Loads List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[200px]">
          <Spinner size="lg" />
        </div>
      ) : loads.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-title text-text-primary mb-2">No Loads Found</h3>
          <p className="text-body text-text-secondary">
            {statusFilter
              ? `No ${statusFilter} loads found.`
              : "You don't have any loads assigned yet."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {loads.map((load) => (
            <Card key={load.id} className="p-4 hover:shadow-elevated transition-shadow">
              <Link to={`/driver/loads/${load.id}`} className="block">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-body font-semibold text-text-primary">
                        {load.reference_number}
                      </span>
                      <span className={`text-small font-medium px-2 py-0.5 rounded-chip ${getStatusColor(load.status)}`}>
                        {load.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-small text-text-tertiary mt-1">
                      {load.organization?.name}
                    </p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-text-tertiary" />
                </div>

                {/* Route */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-success mt-0.5" />
                    <div>
                      <p className="text-small text-text-tertiary">Pickup</p>
                      <p className="text-body-sm text-text-primary">
                        {load.shipper?.city}, {load.shipper?.state}
                      </p>
                      <p className="text-small text-text-secondary">
                        {formatDate(load.schedule?.pickup_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-4 h-4 text-error mt-0.5" />
                    <div>
                      <p className="text-small text-text-tertiary">Delivery</p>
                      <p className="text-body-sm text-text-primary">
                        {load.consignee?.city}, {load.consignee?.state}
                      </p>
                      <p className="text-small text-text-secondary">
                        {formatDate(load.schedule?.delivery_date)}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default DriverLoadsPage;
