/**
 * usePnl - Domain hook for P&L reporting
 *
 * Composes usePnlReport + usePnlTrend with period presets
 * and auto-fetch on period change.
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { usePnlReport, usePnlTrend } from '../api/usePnlApi';

/**
 * Period preset definitions
 */
const PERIOD_PRESETS = {
  this_month: 'This Month',
  last_month: 'Last Month',
  this_quarter: 'This Quarter',
  ytd: 'Year to Date',
  custom: 'Custom'
};

/**
 * Calculate date range from a period preset
 */
function getDateRange(preset) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  switch (preset) {
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
    case 'this_quarter': {
      const quarterStart = Math.floor(month / 3) * 3;
      const from = new Date(year, quarterStart, 1);
      const to = new Date(year, quarterStart + 3, 0);
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
 * usePnl - Main domain hook for P&L page
 */
export function usePnl(options = {}) {
  const { initialPeriod = 'this_month' } = options;

  // Period state
  const [period, setPeriod] = useState(initialPeriod);
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');

  // API hooks
  const reportHook = usePnlReport();
  const trendHook = usePnlTrend();

  // Calculate effective date range
  const dateRange = useMemo(() => {
    if (period === 'custom') {
      return {
        date_from: customDateFrom || null,
        date_to: customDateTo || null
      };
    }
    return getDateRange(period);
  }, [period, customDateFrom, customDateTo]);

  // Fetch data when date range changes
  useEffect(() => {
    if (dateRange.date_from || dateRange.date_to) {
      reportHook.fetchPnl(dateRange);
      trendHook.fetchTrend(dateRange);
    }
  }, [dateRange.date_from, dateRange.date_to]);

  // Refetch
  const refetch = useCallback(() => {
    reportHook.fetchPnl(dateRange);
    trendHook.fetchTrend(dateRange);
  }, [dateRange, reportHook, trendHook]);

  return {
    // Data
    report: reportHook.report,
    trend: trendHook.trend,

    // State
    loading: reportHook.loading || trendHook.loading,
    error: reportHook.error || trendHook.error,

    // Period controls
    period,
    setPeriod,
    periodPresets: PERIOD_PRESETS,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    dateRange,

    // Actions
    refetch
  };
}

export default usePnl;
