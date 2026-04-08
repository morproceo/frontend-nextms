/**
 * useDashboard - Domain hook for Organization Dashboard
 *
 * Composes multiple API hooks to provide financial metrics,
 * performance trends, and operational stats for the dashboard.
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoadStats, useLoadsList, useTrucksList, useDriversList } from '../api';
import { usePnlReport, usePnlTrend } from '../api/usePnlApi';
import { useCostSettings } from '../api/useDispatchApi';

/**
 * Period preset definitions (no custom option)
 */
const PERIOD_PRESETS = {
  this_week: 'This Week',
  this_month: 'This Month',
  last_month: 'Last Month',
  ytd: 'Year to Date'
};

/**
 * Calculate date range from a period preset
 */
function getDateRange(preset) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  switch (preset) {
    case 'this_week': {
      const day = now.getDay();
      const diffToMonday = day === 0 ? 6 : day - 1;
      const monday = new Date(now);
      monday.setDate(now.getDate() - diffToMonday);
      return {
        date_from: formatDate(monday),
        date_to: formatDate(now)
      };
    }
    case 'this_month': {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return {
        date_from: formatDate(from),
        date_to: formatDate(to)
      };
    }
    case 'last_month': {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0);
      return {
        date_from: formatDate(from),
        date_to: formatDate(to)
      };
    }
    case 'ytd': {
      const from = new Date(year, 0, 1);
      return {
        date_from: formatDate(from),
        date_to: formatDate(now)
      };
    }
    default:
      return { date_from: null, date_to: null };
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * useDashboard - Main domain hook for the organization dashboard
 */
export function useDashboard(options = {}) {
  const { initialPeriod = 'this_month' } = options;

  // Period state
  const [period, setPeriod] = useState(initialPeriod);

  // API hooks
  const statsHook = useLoadStats();
  const pnlHook = usePnlReport();
  const trendHook = usePnlTrend();
  const costHook = useCostSettings();
  const trucksHook = useTrucksList();
  const driversHook = useDriversList();
  const loadsHook = useLoadsList();

  // Calculate effective date range
  const dateRange = useMemo(() => {
    return getDateRange(period);
  }, [period]);

  // Fetch date-dependent data when range changes
  useEffect(() => {
    if (dateRange.date_from || dateRange.date_to) {
      // Load stats uses from/to
      statsHook.fetchStats({ from: dateRange.date_from, to: dateRange.date_to });
      // P&L uses date_from/date_to
      pnlHook.fetchPnl({ date_from: dateRange.date_from, date_to: dateRange.date_to });
      trendHook.fetchTrend({ date_from: dateRange.date_from, date_to: dateRange.date_to });
    }
  }, [dateRange.date_from, dateRange.date_to]);

  // Fetch non-date-dependent data once on mount
  useEffect(() => {
    costHook.fetchCostSettings();
    trucksHook.fetchTrucks();
    driversHook.fetchDrivers();
    loadsHook.fetchLoads();
  }, []);

  // Derived metrics
  const metrics = useMemo(() => {
    const report = pnlHook.report;
    const settings = costHook.costSettings;
    const stats = statsHook.stats;

    const revenuePerMile = report?.metrics?.revenuePerMile || 0;

    // Cost/mile: prefer saved cost settings, fall back to P&L
    const costPerMileFromSettings = settings?.calculatedCostPerMile;
    const costPerMileFromPnl = report?.metrics?.costPerMile || 0;
    const costPerMile = costPerMileFromSettings || costPerMileFromPnl;
    const costPerMileSource = costPerMileFromSettings ? 'settings' : 'pnl';

    const netProfitPerMile = revenuePerMile - costPerMile;
    const operatingMargin = report?.operatingMargin || 0;
    const totalRevenue = report?.totalRevenue || stats?.revenue?.total || 0;
    const totalLoads = report?.loadCount || stats?.counts?.total || 0;
    const totalMiles = stats?.revenue?.totalMiles || 0;

    return {
      revenuePerMile,
      costPerMile,
      costPerMileSource,
      netProfitPerMile,
      operatingMargin,
      totalRevenue,
      totalLoads,
      totalMiles
    };
  }, [pnlHook.report, costHook.costSettings, statsHook.stats]);

  // Active load count
  const activeLoadCount = useMemo(() => {
    if (!statsHook.stats?.counts) return 0;
    const c = statsHook.stats.counts;
    return (c.dispatched || 0) + (c.inTransit || 0);
  }, [statsHook.stats]);

  // Available truck count
  const availableTruckCount = useMemo(() => {
    const trucks = trucksHook.trucks;
    if (!trucks || !Array.isArray(trucks)) return 0;
    return trucks.filter(t => t.status === 'active' && !t.driver_id).length;
  }, [trucksHook.trucks]);

  // Active driver count
  const activeDriverCount = useMemo(() => {
    const drivers = driversHook.drivers;
    if (!drivers || !Array.isArray(drivers)) return 0;
    return drivers.filter(d => d.status === 'active').length;
  }, [driversHook.drivers]);

  // Recent loads (latest 5)
  const recentLoads = useMemo(() => {
    const loads = loadsHook.loads;
    if (!loads || !Array.isArray(loads)) return [];
    return loads.slice(0, 5);
  }, [loadsHook.loads]);

  // Trend data
  const trend = trendHook.trend || [];

  // Refetch all date-dependent data
  const refetch = useCallback(() => {
    statsHook.fetchStats({ from: dateRange.date_from, to: dateRange.date_to });
    pnlHook.fetchPnl({ date_from: dateRange.date_from, date_to: dateRange.date_to });
    trendHook.fetchTrend({ date_from: dateRange.date_from, date_to: dateRange.date_to });
    costHook.fetchCostSettings();
    trucksHook.fetchTrucks();
    driversHook.fetchDrivers();
    loadsHook.fetchLoads();
  }, [dateRange]);

  const loading = statsHook.loading || pnlHook.loading || trendHook.loading ||
    costHook.loading || trucksHook.loading || driversHook.loading || loadsHook.loading;

  return {
    // Financial metrics
    metrics,
    trend,

    // Operational counts
    activeLoadCount,
    availableTruckCount,
    activeDriverCount,

    // Recent loads
    recentLoads,

    // Period controls
    period,
    setPeriod,
    periodPresets: PERIOD_PRESETS,

    // State
    loading,

    // Actions
    refetch
  };
}

export default useDashboard;
