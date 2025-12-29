/**
 * DriversListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useDrivers hook
 * - Component focuses on rendering
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDrivers } from '../../hooks';
import {
  DriverStatusConfig,
  DriverAccountStatusConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  Users,
  Plus,
  Search,
  UserX,
  Mail,
  Phone,
  ChevronRight
} from 'lucide-react';

export function DriversListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const {
    drivers,
    allDrivers,
    stats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    setAccountFilter,
    refetch
  } = useDrivers();

  // Event handlers
  const handleAddDriver = () => {
    navigate(orgUrl('/drivers/new'));
  };

  const handleDriverClick = (driverId) => {
    navigate(orgUrl(`/drivers/${driverId}`));
  };

  // Loading state
  if (loading && allDrivers.length === 0) {
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
          <h1 className="text-title text-text-primary">Drivers</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Manage your organization's driver profiles
          </p>
        </div>
        <Button onClick={handleAddDriver}>
          <Plus className="w-4 h-4 mr-2" />
          Add Driver
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
              placeholder="Search drivers..."
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
            {Object.values(DriverStatusConfig).map(config => (
              <option key={config.value} value={config.value}>
                {config.label}
              </option>
            ))}
          </select>

          {/* Account Status Filter */}
          <select
            value={filters.account}
            onChange={(e) => setAccountFilter(e.target.value)}
            className="px-4 py-2 bg-surface-secondary border-0 rounded-input text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
          >
            <option value="all">All Accounts</option>
            {Object.values(DriverAccountStatusConfig).map(config => (
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
              <UserX className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-error">Error loading drivers</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && drivers.length === 0 && (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">
              {allDrivers.length === 0 ? 'No drivers yet' : 'No drivers match your filters'}
            </h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {allDrivers.length === 0
                ? 'Add your first driver to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {allDrivers.length === 0 && (
              <Button onClick={handleAddDriver}>
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Drivers List */}
      {!error && drivers.length > 0 && (
        <Card padding="none">
          <div className="divide-y divide-surface-tertiary">
            {drivers.map((driver) => {
              const statusConfig = getStatusConfig(DriverStatusConfig, driver.status);
              const AccountIcon = driver.accountStatusConfig?.icon;

              return (
                <div
                  key={driver.id}
                  onClick={() => handleDriverClick(driver.id)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-12 h-12 bg-surface-secondary rounded-full flex items-center justify-center flex-shrink-0">
                    {driver.user?.avatar_url ? (
                      <img
                        src={driver.user.avatar_url}
                        alt={`${driver.first_name} ${driver.last_name}`}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <span className="text-body font-medium text-text-secondary">
                        {driver.first_name?.[0]}{driver.last_name?.[0]}
                      </span>
                    )}
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-body font-medium text-text-primary truncate">
                        {driver.first_name} {driver.last_name}
                      </p>
                      {AccountIcon && (
                        <AccountIcon
                          className={`w-4 h-4 ${driver.accountStatusConfig.color} flex-shrink-0`}
                          title={driver.accountStatusConfig.label}
                        />
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      {driver.email && (
                        <span className="flex items-center gap-1 text-small text-text-secondary truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {driver.email}
                        </span>
                      )}
                      {driver.phone && (
                        <span className="flex items-center gap-1 text-small text-text-secondary">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {driver.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status Badge */}
                  <Badge variant={statusConfig.variant || 'gray'}>
                    {statusConfig.label || driver.status}
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
      {allDrivers.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
          <Card padding="compact">
            <p className="text-small text-text-secondary">Total Drivers</p>
            <p className="text-headline text-text-primary">{stats.total}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Active</p>
            <p className="text-headline text-success">{stats.active}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Invited</p>
            <p className="text-headline text-warning">{stats.pending}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Unclaimed</p>
            <p className="text-headline text-text-tertiary">{stats.unclaimed}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Left</p>
            <p className="text-headline text-error">{stats.left}</p>
          </Card>
          <Card padding="compact">
            <p className="text-small text-text-secondary">Driving Now</p>
            <p className="text-headline text-accent">{stats.driving}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DriversListPage;
