/**
 * FacilitiesTab - Refactored to use hooks architecture
 *
 * This component demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useFacilities hook
 * - Component focuses on rendering
 */

import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { useFacilities } from '../../../hooks';
import { FacilityTypeConfig } from '../../../config/status';
import {
  Plus,
  Search,
  Warehouse,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export function FacilitiesTab({ onViewFacility, onAddFacility }) {
  // All data and logic from the hook
  const {
    facilities,
    allFacilities,
    loading,
    error,
    filters,
    setSearchQuery,
    setTypeFilter,
    refetch
  } = useFacilities();

  // Loading state
  if (loading && allFacilities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search facilities..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All Types</option>
            <option value="shipper">Shippers</option>
            <option value="receiver">Receivers</option>
          </select>
        </div>
        <Button onClick={onAddFacility}>
          <Plus className="w-4 h-4 mr-2" />
          Add Facility
        </Button>
      </div>

      {/* Facilities List */}
      {error ? (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
          <Button variant="secondary" size="sm" onClick={refetch} className="mt-2">
            Retry
          </Button>
        </Card>
      ) : facilities.length === 0 ? (
        <Card padding="default" className="text-center py-12">
          <Warehouse className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-body text-text-secondary">
            {allFacilities.length === 0 ? 'No facilities yet' : 'No facilities match your search'}
          </p>
          {allFacilities.length === 0 && (
            <Button onClick={onAddFacility} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Facility
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {facilities.map((facility) => {
            // Use enriched typeConfig from hook or fallback to config
            const typeConfig = facility.typeConfig || FacilityTypeConfig[facility.facility_type] || FacilityTypeConfig.both;
            const TypeIcon = typeConfig.icon;

            return (
              <Card
                key={facility.id}
                padding="default"
                className="cursor-pointer hover:shadow-card transition-shadow"
                onClick={() => onViewFacility(facility.id)}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-body font-medium text-text-primary">{facility.company_name}</h3>
                      {(facility.address?.city || facility.address?.state) && (
                        <p className="text-small text-text-secondary">
                          {[facility.address.city, facility.address.state].filter(Boolean).join(', ')}
                        </p>
                      )}
                    </div>
                    <Badge variant={typeConfig.color} size="sm">
                      <TypeIcon className="w-3 h-3 mr-1" />
                      {typeConfig.label}
                    </Badge>
                  </div>

                  <div className="space-y-1.5 text-small">
                    {facility.address?.line1 && (
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        <span className="truncate">{facility.address.line1}</span>
                      </div>
                    )}
                    {facility.contact?.name && (
                      <p className="text-text-secondary">{facility.contact.name}</p>
                    )}
                    {facility.contact?.phone && (
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{facility.contact.phone}</span>
                      </div>
                    )}
                    {facility.contact?.email && (
                      <div className="flex items-center gap-2 text-text-tertiary">
                        <Mail className="w-3.5 h-3.5" />
                        <span className="truncate">{facility.contact.email}</span>
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FacilitiesTab;
