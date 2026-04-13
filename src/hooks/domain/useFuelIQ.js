/**
 * useFuelIQ - Domain hooks for FuelIQ fuel intelligence
 *
 * Composes API hooks with business logic.
 * Designed to be reusable across pages and modals.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  useFuelIQDashboard,
  useFuelIQStatePrices,
  useFuelIQPriceHistory,
  useFuelIQSurchargeConfig,
  useFuelIQFscTable,
  useFuelIQTripForLoad,
  useFuelIQTruckMpg,
  useFuelIQMutations
} from '../api/useFuelIQApi';

/**
 * Main FuelIQ dashboard hook
 * Used by FuelIQDashboardPage and driver portal
 */
export function useFuelIQ(options = {}) {
  const { autoFetch = true } = options;

  const { dashboard, loading: dashLoading, error: dashError, fetch: fetchDashboard, refetch } = useFuelIQDashboard();
  const { prices, loading: pricesLoading, fetch: fetchPrices } = useFuelIQStatePrices();
  const { history, loading: historyLoading, fetch: fetchHistory } = useFuelIQPriceHistory();
  const { refreshPrices, loading: refreshing } = useFuelIQMutations();

  const [selectedState, setSelectedState] = useState(null);

  useEffect(() => {
    if (autoFetch) {
      fetchDashboard();
      fetchPrices();
    }
  }, [autoFetch]);

  // When a state is selected, fetch its history
  useEffect(() => {
    if (selectedState) {
      fetchHistory(selectedState);
    }
  }, [selectedState]);

  // Price map data: join prices with state info for the choropleth
  const priceMapData = useMemo(() => {
    if (!prices?.prices) return [];
    return prices.prices;
  }, [prices]);

  // National average and extremes
  const national = useMemo(() => dashboard?.national || null, [dashboard]);
  const orgStats = useMemo(() => dashboard?.org_stats || null, [dashboard]);
  const priceMovers = useMemo(() => dashboard?.price_movers || [], [dashboard]);

  const handleRefresh = useCallback(async () => {
    await refreshPrices();
    fetchDashboard();
    fetchPrices();
  }, [refreshPrices, fetchDashboard, fetchPrices]);

  return {
    // Data
    dashboard,
    national,
    orgStats,
    priceMapData,
    priceMovers,
    selectedState,
    priceHistory: history,
    asOf: prices?.asOf,
    stale: prices?.stale,

    // State setters
    setSelectedState,

    // Loading/error
    loading: dashLoading || pricesLoading,
    historyLoading,
    refreshing,
    error: dashError,

    // Actions
    refresh: handleRefresh,
    refetch
  };
}

/**
 * Fuel surcharge calculator hook
 * Used by FuelIQSurchargePage and future modals
 */
export function useFuelIQSurcharge(options = {}) {
  const { autoFetch = true } = options;

  const { config, loading: configLoading, fetch: fetchConfig, refetch } = useFuelIQSurchargeConfig();
  const { table, loading: tableLoading, fetch: fetchTable } = useFuelIQFscTable();
  const { calculateSurcharge, updateSurchargeConfig, loading: mutating } = useFuelIQMutations();

  const [result, setResult] = useState(null);

  useEffect(() => {
    if (autoFetch) {
      fetchConfig();
      fetchTable();
    }
  }, [autoFetch]);

  const calculate = useCallback(async (params) => {
    const data = await calculateSurcharge(params);
    setResult(data);
    return data;
  }, [calculateSurcharge]);

  const updateConfig = useCallback(async (data) => {
    await updateSurchargeConfig(data);
    refetch();
    fetchTable();
  }, [updateSurchargeConfig, refetch, fetchTable]);

  return {
    config,
    fscTable: table,
    result,
    loading: configLoading || tableLoading,
    mutating,
    calculate,
    updateConfig,
    fetchTable
  };
}

/**
 * Trip fuel cost planner hook
 * Used by FuelIQTripPlannerPage, driver portal, and future modals
 */
export function useFuelIQTrip(options = {}) {
  const { loadId: initialLoadId } = options;

  const { trip, loading: tripLoading, error: tripError, fetch: fetchTrip } = useFuelIQTripForLoad();
  const { mpgData, fetch: fetchMpg } = useFuelIQTruckMpg();
  const { calculateTripCost, loading: calculating } = useFuelIQMutations();

  const [selectedLoadId, setSelectedLoadId] = useState(initialLoadId || null);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [mpgOverride, setMpgOverride] = useState(null);

  // Fetch trip when load is selected
  useEffect(() => {
    if (selectedLoadId) {
      const params = {};
      if (selectedTruckId) params.truck_id = selectedTruckId;
      if (mpgOverride) params.mpg = mpgOverride;
      fetchTrip(selectedLoadId, params);
    }
  }, [selectedLoadId]);

  // Fetch truck MPG when truck changes
  useEffect(() => {
    if (selectedTruckId) {
      fetchMpg(selectedTruckId);
    }
  }, [selectedTruckId]);

  const recalculate = useCallback(async () => {
    if (!selectedLoadId) return null;
    const data = await calculateTripCost({
      load_id: selectedLoadId,
      truck_id: selectedTruckId,
      mpg: mpgOverride
    });
    return data;
  }, [selectedLoadId, selectedTruckId, mpgOverride, calculateTripCost]);

  return {
    // Data
    trip,
    mpgData,
    selectedLoadId,
    selectedTruckId,
    mpgOverride,

    // State setters
    setSelectedLoadId,
    setSelectedTruckId,
    setMpgOverride,

    // Loading
    loading: tripLoading || calculating,
    error: tripError,

    // Actions
    recalculate,
    fetchTrip
  };
}
