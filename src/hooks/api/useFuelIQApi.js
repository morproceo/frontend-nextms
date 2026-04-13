/**
 * useFuelIQApi - API hooks for FuelIQ fuel intelligence
 *
 * Wraps fueliq.api.js with useApiState/useMutation for
 * automatic loading/error state management.
 */

import { useCallback } from 'react';
import { useApiState, useMutation } from './useApiRequest';
import * as fueliqApi from '../../api/fueliq.api';

/**
 * Fetch FuelIQ dashboard data
 */
export function useFuelIQDashboard() {
  const { data: dashboard, loading, error, fetch, refetch } = useApiState(
    () => fueliqApi.getDashboard()
  );
  return { dashboard, loading, error, fetch, refetch };
}

/**
 * Fetch state fuel prices for the map
 */
export function useFuelIQStatePrices() {
  const { data: prices, loading, error, fetch, refetch } = useApiState(
    () => fueliqApi.getStatePrices()
  );
  return { prices, loading, error, fetch, refetch };
}

/**
 * Fetch price history for a specific state
 */
export function useFuelIQPriceHistory() {
  const { data: history, loading, error, fetch } = useApiState(
    (stateCode, weeks) => fueliqApi.getPriceHistory(stateCode, weeks)
  );
  return { history, loading, error, fetch };
}

/**
 * Fetch surcharge config
 */
export function useFuelIQSurchargeConfig() {
  const { data: config, loading, error, fetch, refetch } = useApiState(
    () => fueliqApi.getSurchargeConfig()
  );
  return { config, loading, error, fetch, refetch };
}

/**
 * Fetch FSC lookup table
 */
export function useFuelIQFscTable() {
  const { data: table, loading, error, fetch } = useApiState(
    (params) => fueliqApi.getFscTable(params)
  );
  return { table, loading, error, fetch };
}

/**
 * Fetch trip cost for a load
 */
export function useFuelIQTripForLoad() {
  const { data: trip, loading, error, fetch } = useApiState(
    (loadId, params) => fueliqApi.getTripForLoad(loadId, params)
  );
  return { trip, loading, error, fetch };
}

/**
 * Fetch truck MPG
 */
export function useFuelIQTruckMpg() {
  const { data: mpgData, loading, error, fetch } = useApiState(
    (truckId) => fueliqApi.getTruckMpg(truckId)
  );
  return { mpgData, loading, error, fetch };
}

/**
 * Mutations for FuelIQ (calculate, update, refresh)
 */
export function useFuelIQMutations() {
  const { mutate, loading, error } = useMutation();

  const calculateSurcharge = useCallback((data) =>
    mutate(() => fueliqApi.calculateSurcharge(data)),
    [mutate]
  );

  const updateSurchargeConfig = useCallback((data) =>
    mutate(() => fueliqApi.updateSurchargeConfig(data)),
    [mutate]
  );

  const calculateTripCost = useCallback((data) =>
    mutate(() => fueliqApi.calculateTripCost(data)),
    [mutate]
  );

  const updateTruckMpg = useCallback((truckId, mpg) =>
    mutate(() => fueliqApi.updateTruckMpg(truckId, mpg)),
    [mutate]
  );

  const refreshPrices = useCallback(() =>
    mutate(() => fueliqApi.refreshPrices()),
    [mutate]
  );

  return {
    calculateSurcharge,
    updateSurchargeConfig,
    calculateTripCost,
    updateTruckMpg,
    refreshPrices,
    loading,
    error
  };
}
