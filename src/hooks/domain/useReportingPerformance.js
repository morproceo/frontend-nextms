/**
 * useReportingPerformance - Domain hook for Performance Reporting
 *
 * Fetches loads for a date range, then filters and aggregates client-side
 * by driver, truck, or dispatcher.
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLoadsList, useDriversList, useTrucksList } from '../api';
import { useCostSettings } from '../api/useDispatchApi';
import { useOrg } from '../../contexts/OrgContext';

/**
 * Period preset definitions
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
        pickup_date_from: formatDate(monday),
        pickup_date_to: formatDate(now)
      };
    }
    case 'this_month': {
      const from = new Date(year, month, 1);
      const to = new Date(year, month + 1, 0);
      return {
        pickup_date_from: formatDate(from),
        pickup_date_to: formatDate(to)
      };
    }
    case 'last_month': {
      const from = new Date(year, month - 1, 1);
      const to = new Date(year, month, 0);
      return {
        pickup_date_from: formatDate(from),
        pickup_date_to: formatDate(to)
      };
    }
    case 'ytd': {
      const from = new Date(year, 0, 1);
      return {
        pickup_date_from: formatDate(from),
        pickup_date_to: formatDate(now)
      };
    }
    default:
      return { pickup_date_from: null, pickup_date_to: null };
  }
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

/**
 * useReportingPerformance - Main domain hook for performance reporting
 */
export function useReportingPerformance(options = {}) {
  const { initialPeriod = 'this_month' } = options;

  // Period state
  const [period, setPeriod] = useState(initialPeriod);

  // Filter state
  const [driverId, setDriverId] = useState(null);
  const [truckId, setTruckId] = useState(null);
  const [dispatcherId, setDispatcherId] = useState(null);

  // API hooks
  const loadsHook = useLoadsList();
  const driversHook = useDriversList();
  const trucksHook = useTrucksList();
  const costHook = useCostSettings();
  const { members } = useOrg();

  // Calculate date range
  const dateRange = useMemo(() => getDateRange(period), [period]);

  // Fetch loads when period changes
  useEffect(() => {
    if (dateRange.pickup_date_from || dateRange.pickup_date_to) {
      loadsHook.fetchLoads({
        pickup_date_from: dateRange.pickup_date_from,
        pickup_date_to: dateRange.pickup_date_to
      });
    }
  }, [dateRange.pickup_date_from, dateRange.pickup_date_to]);

  // Fetch reference data once on mount
  useEffect(() => {
    driversHook.fetchDrivers();
    trucksHook.fetchTrucks();
    costHook.fetchCostSettings();
  }, []);

  // Driver lookup map
  const driverMap = useMemo(() => {
    const map = {};
    (driversHook.drivers || []).forEach(d => {
      map[d.id] = d;
    });
    return map;
  }, [driversHook.drivers]);

  // Truck lookup map
  const truckMap = useMemo(() => {
    const map = {};
    (trucksHook.trucks || []).forEach(t => {
      map[t.id] = t;
    });
    return map;
  }, [trucksHook.trucks]);

  // Dispatcher options (members with dispatcher/admin/owner roles)
  const dispatcherOptions = useMemo(() => {
    if (!members || !Array.isArray(members)) return [];
    return members
      .filter(m => ['owner', 'admin', 'dispatcher'].includes(m.role))
      .map(m => ({
        id: m.user_id || m.id,
        label: `${m.first_name || ''} ${m.last_name || ''}`.trim() || m.email,
        sublabel: m.role
      }));
  }, [members]);

  // Driver options for SearchableSelect
  const driverOptions = useMemo(() => {
    return (driversHook.drivers || []).map(d => ({
      id: d.id,
      label: `${d.first_name || ''} ${d.last_name || ''}`.trim() || d.email || 'Unknown',
      sublabel: d.phone || d.status
    }));
  }, [driversHook.drivers]);

  // Truck options for SearchableSelect
  const truckOptions = useMemo(() => {
    return (trucksHook.trucks || []).map(t => ({
      id: t.id,
      label: t.unit_number || t.name || `Truck ${t.id}`,
      sublabel: `${t.year || ''} ${t.make || ''} ${t.model || ''}`.trim()
    }));
  }, [trucksHook.trucks]);

  // Filtered loads — client-side filter by driver/truck/dispatcher
  const filteredLoads = useMemo(() => {
    let loads = loadsHook.loads || [];

    if (driverId) {
      loads = loads.filter(l => l.driver_id === driverId);
    }
    if (truckId) {
      loads = loads.filter(l => l.truck_id === truckId);
    }
    if (dispatcherId) {
      loads = loads.filter(l => l.dispatcher_id === dispatcherId || l.created_by_user_id === dispatcherId);
    }

    return loads;
  }, [loadsHook.loads, driverId, truckId, dispatcherId]);

  // Computed metrics from filtered loads
  const metrics = useMemo(() => {
    const totalLoads = filteredLoads.length;
    const totalRevenue = filteredLoads.reduce((sum, l) => {
      return sum + (Number(l.revenue) || 0);
    }, 0);
    const totalMiles = filteredLoads.reduce((sum, l) => {
      return sum + (Number(l.miles) || 0);
    }, 0);
    const revenuePerMile = totalMiles > 0 ? totalRevenue / totalMiles : 0;
    const costPerMile = costHook.costSettings?.calculatedCostPerMile || 0;
    const netProfitPerMile = revenuePerMile - costPerMile;

    return {
      totalLoads,
      totalRevenue,
      totalMiles,
      revenuePerMile,
      costPerMile,
      netProfitPerMile
    };
  }, [filteredLoads, costHook.costSettings]);

  // Enrich loads with driver/truck names for display
  const enrichedLoads = useMemo(() => {
    return filteredLoads.map(load => {
      // Prefer eager-loaded relations, fall back to lookup maps
      const driverName = load.driver
        ? `${load.driver.first_name || ''} ${load.driver.last_name || ''}`.trim()
        : load.driver_id && driverMap[load.driver_id]
          ? `${driverMap[load.driver_id].first_name || ''} ${driverMap[load.driver_id].last_name || ''}`.trim()
          : '—';

      const truckUnit = load.truck
        ? load.truck.unit_number || load.truck.name
        : load.truck_id && truckMap[load.truck_id]
          ? truckMap[load.truck_id].unit_number || truckMap[load.truck_id].name
          : '—';

      const lane = load.lane
        || `${load.shipper_city || '—'}, ${load.shipper_state || ''} → ${load.consignee_city || '—'}, ${load.consignee_state || ''}`;

      return { ...load, driverName, truckUnit, lane };
    });
  }, [filteredLoads, driverMap, truckMap]);

  // Refetch
  const refetch = useCallback(() => {
    loadsHook.fetchLoads({
      pickup_date_from: dateRange.pickup_date_from,
      pickup_date_to: dateRange.pickup_date_to
    });
    driversHook.fetchDrivers();
    trucksHook.fetchTrucks();
    costHook.fetchCostSettings();
  }, [dateRange]);

  const loading = loadsHook.loading || driversHook.loading || trucksHook.loading || costHook.loading;

  return {
    // Data
    filteredLoads: enrichedLoads,
    metrics,

    // Period
    period,
    setPeriod,
    periodPresets: PERIOD_PRESETS,

    // Filters
    driverId,
    setDriverId,
    truckId,
    setTruckId,
    dispatcherId,
    setDispatcherId,

    // Options for dropdowns
    driverOptions,
    truckOptions,
    dispatcherOptions,

    // State
    loading,
    refetch
  };
}

export default useReportingPerformance;
