/**
 * TrucksListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useTrucks hook
 * - Component focuses on rendering
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrucks } from '../../hooks';
import {
  AssetStatusConfig,
  TruckTypeConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Truck,
  Plus,
  Search,
  User,
  Container,
  ChevronRight,
  AlertTriangle,
  Wrench,
  Power
} from 'lucide-react';

export function TrucksListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const {
    trucks,
    allTrucks,
    stats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    refetch
  } = useTrucks();

  // Event handlers
  const handleAddTruck = () => {
    navigate(orgUrl('/assets/trucks/new'));
  };

  const handleTruckClick = (truckId) => {
    navigate(orgUrl(`/assets/trucks/${truckId}`));
  };

  // Loading state
  if (loading && allTrucks.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title text-text-primary">Trucks</h1>
          <p className="text-body-sm text-text-secondary mt-1 hidden sm:block">
            Manage your fleet's trucks and power units
          </p>
        </div>
        <Button onClick={handleAddTruck} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Truck</span>
        </Button>
      </div>

      {/* Filters */}
      <Card padding="compact">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search by unit #, VIN, make, or model..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All Statuses</option>
            {Object.values(AssetStatusConfig).map(config => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-error">Error loading trucks</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && trucks.length === 0 && (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
              <Truck className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">
              {allTrucks.length === 0 ? 'No trucks yet' : 'No trucks match your filters'}
            </h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {allTrucks.length === 0
                ? 'Add your first truck to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {allTrucks.length === 0 && (
              <Button onClick={handleAddTruck}>
                <Plus className="w-4 h-4 mr-2" />
                Add Truck
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Trucks List */}
      {!error && trucks.length > 0 && (
        <Card padding="none">
          <div className="divide-y divide-surface-tertiary">
            {trucks.map((truck) => {
              const statusConfig = getStatusConfig(AssetStatusConfig, truck.status);
              const typeConfig = truck.typeConfig || TruckTypeConfig[truck.truck_type];

              return (
                <div
                  key={truck.id}
                  onClick={() => handleTruckClick(truck.id)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    <Truck className="w-6 h-6 text-text-secondary" />
                  </div>

                  {/* Truck Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-text-primary">
                        Unit #{truck.unit_number}
                      </p>
                      {truck.is_power_only && (
                        <Badge variant="blue" className="text-xs">
                          <Power className="w-3 h-3 mr-1" />
                          Power Only
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-small text-text-secondary">
                        {truck.year} {truck.make} {truck.model}
                      </span>
                      {typeConfig && (
                        <span className="text-small text-text-tertiary">
                          {typeConfig.label}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assignments */}
                  <div className="hidden sm:flex items-center gap-4 text-small text-text-secondary">
                    {truck.currentDriver && (
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {truck.currentDriver.first_name} {truck.currentDriver.last_name?.[0]}.
                      </span>
                    )}
                    {truck.currentTrailer && (
                      <span className="flex items-center gap-1">
                        <Container className="w-4 h-4" />
                        #{truck.currentTrailer.unit_number}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge variant={statusConfig.variant || 'gray'}>
                    {truck.status === 'maintenance' && <Wrench className="w-3 h-3 mr-1" />}
                    {statusConfig.label || truck.status}
                  </Badge>

                  {/* Chevron */}
                  <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary transition-colors" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      {allTrucks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="compact">
            <p className="text-small text-text-secondary">Total Trucks</p>
            <p className="text-headline text-text-primary">{stats.total}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Active</p>
            <p className="text-headline text-success">{stats.active}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">In Maintenance</p>
            <p className="text-headline text-warning">{stats.maintenance}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Assigned Drivers</p>
            <p className="text-headline text-accent">{stats.withDrivers}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TrucksListPage;
