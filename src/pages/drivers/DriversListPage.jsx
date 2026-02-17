/**
 * DriversListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useDrivers hook
 * - Component focuses on rendering
 */

import { useState, useEffect, useCallback } from 'react';
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
import driverConnectionApi from '../../api/driverConnection.api';
import {
  Users,
  Plus,
  Search,
  UserX,
  Mail,
  Phone,
  ChevronRight,
  Bell,
  Check,
  X,
  Database,
  Globe,
  Send,
  Shield
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

  // Connection requests state
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);

  useEffect(() => {
    driverConnectionApi.getPendingRequests()
      .then(res => setConnectionRequests(res.data || []))
      .catch(() => {});
  }, []);

  const handleApproveRequest = useCallback(async (requestId) => {
    try {
      await driverConnectionApi.approveRequest(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
      refetch();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  }, [refetch]);

  const handleRejectRequest = useCallback(async (requestId) => {
    try {
      await driverConnectionApi.rejectRequest(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  }, []);

  // Network search state
  const [showNetworkSearch, setShowNetworkSearch] = useState(false);
  const [networkQuery, setNetworkQuery] = useState('');
  const [networkResults, setNetworkResults] = useState([]);
  const [networkSearching, setNetworkSearching] = useState(false);
  const [networkError, setNetworkError] = useState(null);
  const [invitingId, setInvitingId] = useState(null);

  const handleNetworkSearch = useCallback(async () => {
    if (!networkQuery.trim() || networkQuery.trim().length < 2) return;
    setNetworkSearching(true);
    setNetworkError(null);
    try {
      const response = await driverConnectionApi.searchDriverNetwork(networkQuery.trim());
      setNetworkResults(response.data || []);
    } catch (err) {
      setNetworkError(err.response?.data?.message || 'Search failed');
    } finally {
      setNetworkSearching(false);
    }
  }, [networkQuery]);

  const handleInviteDriver = useCallback(async (userId) => {
    setInvitingId(userId);
    try {
      await driverConnectionApi.inviteDriver(userId);
      setNetworkResults(prev => prev.filter(d => d.id !== userId));
    } catch (err) {
      setNetworkError(err.response?.data?.message || 'Failed to send invitation');
    } finally {
      setInvitingId(null);
    }
  }, []);

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
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title text-text-primary">Drivers</h1>
          <p className="text-body-sm text-text-secondary mt-1 hidden sm:block">
            Manage your organization's driver profiles
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant={showNetworkSearch ? 'primary' : 'secondary'}
            onClick={() => setShowNetworkSearch(!showNetworkSearch)}
          >
            <Globe className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Search Network</span>
          </Button>
          {connectionRequests.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowRequests(!showRequests)}
              className="relative"
            >
              <Bell className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Requests</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center">
                {connectionRequests.length}
              </span>
            </Button>
          )}
          <Button onClick={handleAddDriver}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Driver</span>
          </Button>
        </div>
      </div>

      {/* Search Driver Network */}
      {showNetworkSearch && (
        <Card className="p-4 border-accent/30 bg-accent/5">
          <h3 className="text-body font-medium text-text-primary mb-3 flex items-center gap-2">
            <Globe className="w-4 h-4 text-accent" />
            Search Driver Network
          </h3>
          <p className="text-small text-text-secondary mb-3">
            Find registered drivers on the platform and invite them to your organization.
          </p>
          <div className="flex gap-3 mb-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                type="text"
                placeholder="Search by username..."
                value={networkQuery}
                onChange={(e) => setNetworkQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleNetworkSearch()}
                className="w-full pl-9 pr-4 py-2 bg-surface-primary border border-surface-tertiary rounded-input text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <Button
              onClick={handleNetworkSearch}
              loading={networkSearching}
              disabled={!networkQuery.trim() || networkQuery.trim().length < 2}
            >
              <Search className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Search</span>
            </Button>
          </div>

          {networkError && (
            <p className="text-body-sm text-error flex items-center gap-2 mb-3">
              <X className="w-4 h-4" />
              {networkError}
            </p>
          )}

          {networkResults.length > 0 && (
            <div className="space-y-2">
              {networkResults.map((driver) => (
                <div key={driver.id} className="flex items-center justify-between p-3 bg-surface-primary rounded-lg border border-surface-tertiary">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 bg-surface-secondary rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-body-sm font-medium text-text-secondary">
                        {driver.first_name?.[0]}{driver.last_name?.[0]}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-sm font-medium text-text-primary">
                        @{driver.username}
                        <span className="ml-2 text-text-secondary font-normal">
                          {driver.first_name} {driver.last_name}
                        </span>
                      </p>
                      <div className="flex items-center gap-3 text-small text-text-secondary">
                        {driver.email && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {driver.email}
                          </span>
                        )}
                        {driver.license_number && (
                          <span>CDL: {driver.license_number}</span>
                        )}
                        {driver.license_state && (
                          <span>({driver.license_state})</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleInviteDriver(driver.id)}
                    loading={invitingId === driver.id}
                    disabled={invitingId !== null}
                  >
                    <Send className="w-4 h-4 mr-1" />
                    Invite
                  </Button>
                </div>
              ))}
            </div>
          )}

          {!networkSearching && networkResults.length === 0 && networkQuery.trim().length >= 2 && !networkError && (
            <p className="text-body-sm text-text-tertiary text-center py-4">
              No results found. Try a different search term.
            </p>
          )}
        </Card>
      )}

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

      {/* Connection Requests Panel */}
      {showRequests && connectionRequests.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <h3 className="text-body font-medium text-text-primary mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            Driver Connection Requests
          </h3>
          <div className="space-y-3">
            {connectionRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-surface-primary rounded-lg">
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {request.user?.first_name} {request.user?.last_name}
                  </p>
                  <p className="text-small text-text-secondary">
                    {request.user?.email}
                    {request.user?.license_number && ` · CDL: ${request.user.license_number}`}
                    {request.user?.license_state && ` (${request.user.license_state})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                    className="text-error hover:bg-error/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

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

                  {/* Data Source Badge */}
                  {driver.data_source && driver.data_source !== 'manual' && (
                    <Badge variant={driver.data_source === 'synced' ? 'blue' : 'gray'}>
                      <Database className="w-3 h-3 mr-1" />
                      {driver.data_source === 'synced' ? 'Synced' : 'Snapshot'}
                    </Badge>
                  )}

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
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-4">
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Total</p>
            <p className="text-title-sm sm:text-headline text-text-primary">{stats.total}</p>
          </Card>
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Active</p>
            <p className="text-title-sm sm:text-headline text-success">{stats.active}</p>
          </Card>
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Invited</p>
            <p className="text-title-sm sm:text-headline text-warning">{stats.pending}</p>
          </Card>
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Unclaimed</p>
            <p className="text-title-sm sm:text-headline text-text-tertiary">{stats.unclaimed}</p>
          </Card>
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Left</p>
            <p className="text-title-sm sm:text-headline text-error">{stats.left}</p>
          </Card>
          <Card padding="compact" className="text-center sm:text-left">
            <p className="text-[10px] sm:text-small text-text-secondary">Driving</p>
            <p className="text-title-sm sm:text-headline text-accent">{stats.driving}</p>
          </Card>
        </div>
      )}
    </div>
  );
}

export default DriversListPage;
