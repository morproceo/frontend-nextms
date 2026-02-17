/**
 * Hooks - Main Barrel Export
 *
 * Import hooks from here rather than individual files.
 *
 * Architecture:
 *   api/      - Wrap API calls with loading/error state
 *   domain/   - Business logic (filtering, sorting, stats)
 *   pages/    - Page-specific composition (coming soon)
 *
 * Philosophy:
 *   Components render.
 *   Hooks think.
 *   APIs speak.
 */

// ============================================
// API HOOKS
// Low-level hooks that wrap API calls
// ============================================

export {
  // Base
  useApiRequest,
  useApiState,
  useMutation,

  // Loads
  useLoadsList,
  useLoadDetail,
  useLoadMutations,
  useLoadStops,
  useRateConParser,
  useLoadStats,
  useLoadsApi,

  // Drivers
  useDriversList,
  useDriverDetail,
  useDriverMutations,
  useDriverInvite,
  useDriverInviteAccept,
  useMyDriverProfiles,
  useDriversApi,

  // Brokers
  useBrokersList,
  useBrokerDetail,
  useBrokerMutations,
  useFmcsaLookup,
  useBrokersApi,

  // Facilities
  useFacilitiesList,
  useFacilityDetail,
  useFacilityMutations,
  useFacilitiesApi,

  // Trucks
  useTrucksList,
  useTruckDetail,
  useTruckMutations,
  useTruckAssignments,
  useTruckStats,
  useTrucksNeedingAttention,
  useTrucksApi,

  // Trailers
  useTrailersList,
  useTrailerDetail,
  useTrailerMutations,
  useTrailerAssignments,
  useTrailerStats,
  useTrailersNeedingAttention,
  useTrailersApi,

  // Expenses
  useExpensesList,
  useExpenseDetail,
  useExpenseMutations,
  useExpenseWorkflow,
  useExpenseStats,
  useExpenseSummary,
  useExpenseCategories,
  useReceiptParser,
  useExpenseExport,
  useExpensesApi,

  // P&L
  usePnlReport,
  usePnlTrend,

  // Driver Portal
  useDriverProfiles,
  useDriverDashboard,
  useDriverLoads,
  useDriverLoad,
  useDriverLoadActions,
  useDriverEarnings,
  useDriverExpenses,
  useDriverExpense,
  useDriverExpenseMutations,
  useDriverLocation,
  useDriverPortalApi,

  // Driver Settings
  useDriverOrganizations,
  useDriverInvites,
  useDriverDisconnect,
  useDriverSettingsProfiles,
  useDriverSettingsApi
} from './api';

// ============================================
// DOMAIN HOOKS
// Business logic hooks with filtering/sorting
// ============================================

export {
  useLoads,
  useLoad,
  useDrivers,
  useDriver,
  useBrokers,
  useBroker,
  useFacilities,
  useFacility,
  useCustomers,
  useTrucks,
  useTruck,
  useTrailers,
  useTrailer,
  useAssets,
  useExpenses,
  useExpense,
  usePnl,
  useDriverPortalDashboard,
  useDriverPortalLoads,
  useDriverPortalLoad,
  useDriverPortalExpenses,
  useDriverPortalExpenseForm,
  useDriverPortalEarnings,
  useDriverPortalSettings,
  useDriverPortalDocuments
} from './domain';

// ============================================
// PAGE HOOKS (Coming Soon)
// Page-specific composition hooks
// ============================================

// export { useLoadsListPage } from './pages/useLoadsListPage';
// export { useLoadDetailPage } from './pages/useLoadDetailPage';
