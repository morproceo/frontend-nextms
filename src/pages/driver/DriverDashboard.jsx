/**
 * DriverDashboard - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useDriverPortalDashboard hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDriverPortalDashboard, useDriverLoadActions, useDriverInvites } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Spinner } from '../../components/ui/Spinner';
import {
  Package,
  MapPin,
  Calendar,
  DollarSign,
  CheckCircle,
  Clock,
  ArrowRight,
  Play,
  Truck,
  Building2,
  X,
  CheckCircle2
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

export function DriverDashboard() {
  // All data and logic from the hook
  const {
    dashboard,
    currentLoad,
    upcomingLoads,
    stats,
    driverName,
    loading,
    error,
    hasNoOrgs,
    refetch
  } = useDriverPortalDashboard();

  // Invite handling (local state for form)
  const invites = useDriverInvites();
  const [inviteCode, setInviteCode] = useState('');

  // Trip actions
  const loadActions = useDriverLoadActions();

  const handleAcceptInviteByCode = async (e) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    try {
      await invites.acceptInviteByCode(inviteCode.trim());
      setInviteCode('');
      // Refresh dashboard after joining
      setTimeout(() => {
        refetch();
      }, 1500);
    } catch (err) {
      // Error handled in hook
    }
  };

  const handleStartTrip = async (loadId) => {
    try {
      await loadActions.startTrip(loadId);
      refetch();
    } catch (err) {
      console.error('Failed to start trip:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-body text-error">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  // Empty state - no organizations
  if (hasNoOrgs) {
    return (
      <div className="max-w-lg mx-auto py-8">
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-6">
            <Building2 className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-headline text-text-primary mb-2">Welcome to TMS</h1>
          <p className="text-body text-text-secondary">
            You're not connected to any organization yet. Enter an invite code to get started.
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleAcceptInviteByCode} className="space-y-4">
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                Enter Invite Code
              </label>
              <p className="text-small text-text-secondary mb-4">
                Ask your dispatcher or fleet manager for an 8-character invite code.
              </p>
              <div className="flex gap-3">
                <Input
                  value={inviteCode}
                  onChange={(e) => {
                    setInviteCode(e.target.value.toUpperCase());
                    invites.clearMessages();
                  }}
                  placeholder="Enter code (e.g., DRV7X2K9)"
                  maxLength={8}
                  className="font-mono text-lg tracking-widest uppercase"
                />
                <Button type="submit" loading={invites.loading} disabled={inviteCode.length !== 8}>
                  Join
                </Button>
              </div>
            </div>

            {invites.error && (
              <p className="text-body-sm text-error flex items-center gap-2">
                <X className="w-4 h-4" />
                {invites.error}
              </p>
            )}

            {invites.success && (
              <p className="text-body-sm text-success flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                {invites.success}
              </p>
            )}
          </form>
        </Card>

        <div className="mt-8 text-center">
          <p className="text-small text-text-tertiary">
            Already have an invite email?{' '}
            <span className="text-text-secondary">
              Click the link in your email to join automatically.
            </span>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link
            to="/driver/settings"
            className="text-body-sm text-accent hover:underline"
          >
            Go to Settings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-xl sm:text-headline text-text-primary">
          Welcome back, {driverName}
        </h1>
        <p className="text-body-sm sm:text-body text-text-secondary mt-1">
          Here's your overview for today
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-success" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] sm:text-small text-text-tertiary">This Week</p>
              <p className="text-body sm:text-title text-text-primary font-semibold truncate">
                {formatCurrency(stats?.earningsThisWeek || 0)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-warning" />
            </div>
            <div>
              <p className="text-[10px] sm:text-small text-text-tertiary">Pending</p>
              <p className="text-body sm:text-title text-text-primary font-semibold">
                {stats?.pendingLoads || 0}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-3 sm:p-4">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 text-center sm:text-left">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
            <div>
              <p className="text-[10px] sm:text-small text-text-tertiary">Done</p>
              <p className="text-body sm:text-title text-text-primary font-semibold">
                {stats?.completedThisWeek || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Current Load */}
      {currentLoad ? (
        <Card className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-accent" />
              <h2 className="text-body sm:text-title font-semibold text-text-primary">Current Load</h2>
            </div>
            <span className="text-[10px] sm:text-small font-medium text-accent bg-accent/10 px-2 py-1 rounded-chip">
              {currentLoad.status?.replace('_', ' ').toUpperCase()}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:gap-6">
            {/* Route */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-success" />
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Pickup</p>
                  <p className="text-body font-medium text-text-primary">
                    {currentLoad.shipper?.city}, {currentLoad.shipper?.state}
                  </p>
                  <p className="text-small text-text-secondary">
                    {currentLoad.shipper?.name}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-error" />
                </div>
                <div>
                  <p className="text-small text-text-tertiary">Delivery</p>
                  <p className="text-body font-medium text-text-primary">
                    {currentLoad.consignee?.city}, {currentLoad.consignee?.state}
                  </p>
                  <p className="text-small text-text-secondary">
                    {currentLoad.consignee?.name}
                  </p>
                </div>
              </div>
            </div>

            {/* Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-body-sm">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <span className="text-text-secondary">Pickup:</span>
                <span className="text-text-primary font-medium">
                  {formatDate(currentLoad.schedule?.pickup_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-body-sm">
                <Calendar className="w-4 h-4 text-text-tertiary" />
                <span className="text-text-secondary">Delivery:</span>
                <span className="text-text-primary font-medium">
                  {formatDate(currentLoad.schedule?.delivery_date)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-body-sm">
                <Package className="w-4 h-4 text-text-tertiary" />
                <span className="text-text-secondary">Reference:</span>
                <span className="text-text-primary font-medium">
                  {currentLoad.reference_number}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6 pt-4 border-t border-surface-tertiary">
            {currentLoad.status === 'dispatched' && (
              <Button onClick={() => handleStartTrip(currentLoad.id)} loading={loadActions.loading}>
                <Play className="w-4 h-4 mr-2" />
                Start Trip
              </Button>
            )}
            <Button variant="secondary" asChild>
              <Link to={`/driver/loads/${currentLoad.id}`} className="inline-flex items-center">
                View Details
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Card>
      ) : (
        <Card className="p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-4">
            <Truck className="w-8 h-8 text-text-tertiary" />
          </div>
          <h3 className="text-title text-text-primary mb-2">No Active Load</h3>
          <p className="text-body text-text-secondary mb-4">
            You don't have any loads in progress right now.
          </p>
          <Button variant="secondary" asChild>
            <Link to="/driver/loads">View All Loads</Link>
          </Button>
        </Card>
      )}

      {/* Upcoming Loads */}
      {upcomingLoads?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-title text-text-primary">Upcoming Loads</h2>
            <Link to="/driver/loads" className="text-body-sm text-accent hover:underline">
              View all
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingLoads.map((load) => (
              <Card key={load.id} className="p-4">
                <Link to={`/driver/loads/${load.id}`} className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <Package className="w-5 h-5 text-text-tertiary" />
                    </div>
                    <div>
                      <p className="text-body font-medium text-text-primary">
                        {load.reference_number}
                      </p>
                      <p className="text-small text-text-secondary">
                        {load.shipper?.city}, {load.shipper?.state} → {load.consignee?.city}, {load.consignee?.state}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-body-sm font-medium text-text-primary">
                      {formatDate(load.schedule?.pickup_date)}
                    </p>
                    <p className="text-small text-text-tertiary">
                      {load.organization?.name}
                    </p>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
