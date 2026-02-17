/**
 * DashboardPage - Organization dashboard with real data
 *
 * Pulls live data from:
 * - Load stats API (active loads, revenue)
 * - Loads API (recent loads)
 * - Trucks API (truck count)
 * - Drivers API (driver count)
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useLoadStats, useLoadsList, useTrucksList, useDriversList } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { LoadStatusConfig, getStatusConfig } from '../../config/status';
import {
  Package,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  Plus
} from 'lucide-react';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

export function DashboardPage() {
  const { currentOrg, orgUrl } = useOrg();
  const navigate = useNavigate();

  // API hooks
  const { stats: loadStats, loading: statsLoading, fetchStats } = useLoadStats();
  const { loads, loading: loadsLoading, fetchLoads } = useLoadsList();
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucksList();
  const { drivers, loading: driversLoading, fetchDrivers } = useDriversList();

  // Fetch all data on mount
  useEffect(() => {
    fetchStats();
    fetchLoads();
    fetchTrucks();
    fetchDrivers();
  }, []);

  // Compute stats from real data
  const activeLoadCount = useMemo(() => {
    if (!loadStats?.counts) return 0;
    const c = loadStats.counts;
    return (c.dispatched || 0) + (c.inTransit || 0);
  }, [loadStats]);

  const availableTruckCount = useMemo(() => {
    if (!trucks || !Array.isArray(trucks)) return 0;
    return trucks.filter(t => t.status === 'active' && !t.driver_id).length;
  }, [trucks]);

  const activeDriverCount = useMemo(() => {
    if (!drivers || !Array.isArray(drivers)) return 0;
    return drivers.filter(d => d.status === 'active').length;
  }, [drivers]);

  const revenueMtd = useMemo(() => {
    return loadStats?.revenue?.total || 0;
  }, [loadStats]);

  // Recent loads (latest 5)
  const recentLoads = useMemo(() => {
    if (!loads || !Array.isArray(loads)) return [];
    return loads.slice(0, 5);
  }, [loads]);

  const stats = [
    {
      name: 'Active Loads',
      value: activeLoadCount.toString(),
      subtitle: `${loadStats?.counts?.total || 0} total`,
      icon: Package,
      color: 'accent'
    },
    {
      name: 'Available Trucks',
      value: availableTruckCount.toString(),
      subtitle: `${Array.isArray(trucks) ? trucks.length : 0} total`,
      icon: Truck,
      color: 'warning'
    },
    {
      name: 'Active Drivers',
      value: activeDriverCount.toString(),
      subtitle: `${Array.isArray(drivers) ? drivers.length : 0} total`,
      icon: Users,
      color: 'success'
    },
    {
      name: 'Revenue',
      value: formatCurrency(revenueMtd),
      subtitle: `${loadStats?.revenue?.totalMiles?.toLocaleString() || 0} miles`,
      icon: DollarSign,
      color: 'accent'
    }
  ];

  const loading = statsLoading || loadsLoading || trucksLoading || driversLoading;

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-title text-text-primary">Dashboard</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Welcome back to {currentOrg?.name}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.name} padding="compact" className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-body-sm text-text-secondary truncate">{stat.name}</p>
                <p className="text-title-sm sm:text-headline text-text-primary mt-0.5 sm:mt-1">
                  {loading ? '—' : stat.value}
                </p>
                {stat.subtitle && (
                  <p className="text-[10px] sm:text-small text-text-tertiary mt-1 sm:mt-2">
                    {loading ? '' : stat.subtitle}
                  </p>
                )}
              </div>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-accent/10 rounded-lg flex items-center justify-center shrink-0">
                <stat.icon className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Loads */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Loads</CardTitle>
              <button
                onClick={() => navigate(orgUrl('/loads'))}
                className="text-small font-medium text-accent hover:text-accent/80 transition-colors"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loadsLoading && recentLoads.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : recentLoads.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-body-sm text-text-secondary">No loads yet</p>
                <button
                  onClick={() => navigate(orgUrl('/loads/new'))}
                  className="text-small font-medium text-accent hover:text-accent/80 mt-2 inline-block"
                >
                  Create your first load
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {recentLoads.map((load) => {
                  const statusConfig = getStatusConfig(LoadStatusConfig, load.status);
                  const lane = load.lane || `${load.shipper?.city || '—'}, ${load.shipper?.state || ''} → ${load.consignee?.city || '—'}, ${load.consignee?.state || ''}`;

                  return (
                    <div
                      key={load.id}
                      className="flex items-center justify-between py-3 border-b border-surface-tertiary last:border-0 cursor-pointer hover:bg-surface-secondary/50 rounded-lg px-2 -mx-2 transition-colors"
                      onClick={() => navigate(orgUrl(`/loads/${load.id}`))}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm font-medium text-text-primary truncate">
                            {load.reference_number}
                          </p>
                          <p className="text-small text-text-tertiary truncate">
                            {lane}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        {load.financials?.revenue && (
                          <span className="text-small font-medium text-text-primary hidden sm:block tabular-nums">
                            {formatCurrency(load.financials.revenue)}
                          </span>
                        )}
                        <Badge variant={statusConfig?.color || 'gray'}>
                          {statusConfig?.label || load.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => navigate(orgUrl('/loads/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-accent" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Create New Load
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/drivers/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Driver
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/assets/trucks/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-warning" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Truck
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/expenses/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Expense
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/pnl'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                View P&L
              </span>
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default DashboardPage;
