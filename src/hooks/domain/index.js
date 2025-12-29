/**
 * Domain Hooks - Barrel Export
 *
 * These hooks compose API hooks and add business logic:
 * - Filtering
 * - Sorting
 * - Statistics
 * - Search
 *
 * Philosophy: Hooks think. This is where the thinking happens.
 */

export { useLoads, useLoad } from './useLoads';
export { useDrivers, useDriver } from './useDrivers';
export { useBrokers, useBroker, useFacilities, useFacility, useCustomers } from './useCustomers';
export { useTrucks, useTruck, useTrailers, useTrailer, useAssets } from './useAssets';
export { useExpenses, useExpense } from './useExpenses';
export {
  useDriverPortalDashboard,
  useDriverPortalLoads,
  useDriverPortalLoad,
  useDriverPortalExpenses,
  useDriverPortalExpenseForm,
  useDriverPortalEarnings,
  useDriverPortalSettings,
  useDriverPortalDocuments
} from './useDriverPortal';
