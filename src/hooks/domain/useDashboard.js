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
  //
  // Phase 1: read everything finance-related from `report.headline` — a single
  // payload from /v1/pnl that uses one consistent definition of "this period"
  // for every card. We no longer fall back to /loads/stats for revenue/loads/
  // miles because that endpoint counts every load regardless of status, which
  // is what produced the -2206% margin (recognized revenue tiny, expenses
  // large, denominator mismatched).
  //
  // The legacy branch is kept only for the brief window where a deployed
  // frontend may run against a backend that hasn't shipped headline yet.
  const metrics = useMemo(() => {
    const report = pnlHook.report;
    const headline = report?.headline;

    if (headline) {
      const shownCostPerMile = headline.costPerMile?.shown === 'configured'
        ? headline.costPerMile.configured
        : headline.costPerMile?.actual ?? 0;

      return {
        // per-mile
        revenuePerMile: headline.ratePerMile || 0,
        costPerMile: shownCostPerMile,
        costPerMileSource: headline.costPerMile?.shown === 'configured' ? 'settings' : 'pnl',
        netProfitPerMile: headline.netProfitPerMile || 0,
        // margins
        operatingMargin: headline.operatingMargin || 0,
        marginDisplay: headline.marginDisplay || null,
        // revenue (recognized is the primary; booked sits beside it)
        recognizedRevenue: headline.recognizedRevenue || 0,
        bookedRevenue: headline.bookedRevenue || 0,
        totalRevenue: headline.recognizedRevenue || 0, // primary card value
        // loads
        totalLoads: headline.totalLoads || 0,
        deliveredLoads: headline.deliveredLoads || 0,
        inFlightLoads: headline.inFlightLoads || 0,
        // miles
        totalMiles: headline.totalMiles || 0,
        rpmMiles: headline.rpmMiles || 0
      };
    }

    // ── Legacy fallback (pre-headline backend) ──────────────────────────
    const settings = costHook.costSettings;
    const stats = statsHook.stats;

    const revenuePerMile = report?.metrics?.revenuePerMile || 0;
    const costPerMileFromSettings = settings?.calculatedCostPerMile;
    const costPerMileFromPnl = report?.metrics?.costPerMile || 0;
    const costPerMile = costPerMileFromSettings || costPerMileFromPnl;
    const costPerMileSource = costPerMileFromSettings ? 'settings' : 'pnl';

    return {
      revenuePerMile,
      costPerMile,
      costPerMileSource,
      netProfitPerMile: revenuePerMile - costPerMile,
      operatingMargin: report?.operatingMargin || 0,
      marginDisplay: null,
      recognizedRevenue: report?.revenue?.loadRevenue || 0,
      bookedRevenue: 0,
      totalRevenue: report?.revenue?.loadRevenue || stats?.revenue?.total || 0,
      totalLoads: report?.revenue?.loadCount || stats?.counts?.total || 0,
      deliveredLoads: report?.revenue?.loadCount || 0,
      inFlightLoads: 0,
      totalMiles: stats?.revenue?.totalMiles || 0,
      rpmMiles: report?.revenue?.rpmMiles || 0
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
