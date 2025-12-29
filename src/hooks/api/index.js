/**
 * API Hooks - Barrel Export
 *
 * These hooks wrap the API layer and provide consistent
 * loading/error state management.
 */

// Base hooks
export {
  useApiRequest,
  useApiState,
  useMutation
} from './useApiRequest';

// Loads API
export {
  useLoadsList,
  useLoadDetail,
  useLoadMutations,
  useLoadStops,
  useRateConParser,
  useLoadStats,
  useLoadsApi
} from './useLoadsApi';

// Drivers API
export {
  useDriversList,
  useDriverDetail,
  useDriverMutations,
  useDriverInvite,
  useDriverInviteAccept,
  useMyDriverProfiles,
  useDriversApi
} from './useDriversApi';

// Brokers API
export {
  useBrokersList,
  useBrokerDetail,
  useBrokerMutations,
  useFmcsaLookup,
  useBrokersApi
} from './useBrokersApi';

// Facilities API
export {
  useFacilitiesList,
  useFacilityDetail,
  useFacilityMutations,
  useFacilitiesApi
} from './useFacilitiesApi';

// Trucks API
export {
  useTrucksList,
  useTruckDetail,
  useTruckMutations,
  useTruckAssignments,
  useTruckStats,
  useTrucksNeedingAttention,
  useTrucksApi
} from './useTrucksApi';

// Trailers API
export {
  useTrailersList,
  useTrailerDetail,
  useTrailerMutations,
  useTrailerAssignments,
  useTrailerStats,
  useTrailersNeedingAttention,
  useTrailersApi
} from './useTrailersApi';

// Expenses API
export {
  useExpensesList,
  useExpenseDetail,
  useExpenseMutations,
  useExpenseWorkflow,
  useExpenseStats,
  useExpenseSummary,
  useExpenseCategories,
  useReceiptParser,
  useExpenseExport,
  useExpensesApi
} from './useExpensesApi';

// Driver Portal API
export {
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
  useDriverPortalApi
} from './useDriverPortalApi';

// Driver Settings API
export {
  useDriverOrganizations,
  useDriverInvites,
  useDriverDisconnect,
  useDriverSettingsProfiles,
  useDriverSettingsApi
} from './useDriverSettingsApi';
