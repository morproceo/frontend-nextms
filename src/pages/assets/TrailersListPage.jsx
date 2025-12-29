/**
 * TrailersListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useTrailers hook
 * - Component focuses on rendering
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrailers } from '../../hooks';
import {
  AssetStatusConfig,
  TrailerTypeConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Container,
  Plus,
  Search,
  Truck,
  Snowflake,
  ChevronRight,
  AlertTriangle,
  Wrench
} from 'lucide-react';

export function TrailersListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const {
    trailers,
    allTrailers,
    stats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    setTypeFilter,
    refetch
  } = useTrailers();

  // Event handlers
  const handleAddTrailer = () => {
    navigate(orgUrl('/assets/trailers/new'));
  };

  const handleTrailerClick = (trailerId) => {
    navigate(orgUrl(`/assets/trailers/${trailerId}`));
  };

  // Loading state
  if (loading && allTrailers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-title text-text-primary">Trailers</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Manage your fleet's trailers
          </p>
        </div>
        <Button onClick={handleAddTrailer}>
          <Plus className="w-4 h-4 mr-2" />
          Add Trailer
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
              placeholder="Search by unit #, VIN, or make..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* Type Filter */}
          <select
            value={filters.type}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All Types</option>
            {Object.values(TrailerTypeConfig).map(config => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>

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
              <p className="text-body-sm font-medium text-error">Error loading trailers</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && trailers.length === 0 && (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
              <Container className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">
              {allTrailers.length === 0 ? 'No trailers yet' : 'No trailers match your filters'}
            </h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {allTrailers.length === 0
                ? 'Add your first trailer to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {allTrailers.length === 0 && (
              <Button onClick={handleAddTrailer}>
                <Plus className="w-4 h-4 mr-2" />
                Add Trailer
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Trailers List */}
      {!error && trailers.length > 0 && (
        <Card padding="none">
          <div className="divide-y divide-surface-tertiary">
            {trailers.map((trailer) => {
              const statusConfig = getStatusConfig(AssetStatusConfig, trailer.status);
              const typeConfig = trailer.typeConfig || TrailerTypeConfig[trailer.type] || TrailerTypeConfig.other;
              const TypeIcon = typeConfig.icon || Container;

              return (
                <div
                  key={trailer.id}
                  onClick={() => handleTrailerClick(trailer.id)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                >
                  {/* Icon */}
                  <div className="w-12 h-12 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                    {trailer.type === 'reefer' ? (
                      <Snowflake className="w-6 h-6 text-blue-500" />
                    ) : (
                      <Container className="w-6 h-6 text-text-secondary" />
                    )}
                  </div>

                  {/* Trailer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-text-primary">
                        Trailer #{trailer.unit_number}
                      </p>
                      <Badge variant="gray" className="text-xs">
                        {typeConfig.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-small text-text-secondary">
                        {trailer.year} {trailer.make} {trailer.model}
                      </span>
                      {trailer.length_ft && (
                        <span className="text-small text-text-tertiary">
                          {trailer.length_ft}' length
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Assigned Truck */}
                  <div className="hidden sm:flex items-center gap-4 text-small text-text-secondary">
                    {trailer.currentTruck && (
                      <span className="flex items-center gap-1">
                        <Truck className="w-4 h-4" />
                        Unit #{trailer.currentTruck.unit_number}
                      </span>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge variant={statusConfig.variant || 'gray'}>
                    {trailer.status === 'maintenance' && <Wrench className="w-3 h-3 mr-1" />}
                    {statusConfig.label || trailer.status}
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
      {allTrailers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card padding="compact">
            <p className="text-small text-text-secondary">Total Trailers</p>
            <p className="text-headline text-text-primary">{stats.total}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Active</p>
            <p className="text-headline text-success">{stats.active}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Available</p>
            <p className="text-headline text-accent">{stats.available}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Reefers</p>
            <p className="text-headline text-blue-500">{stats.reefers}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default TrailersListPage;
