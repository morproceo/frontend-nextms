# Frontend Architecture Refactoring Report

## Project Overview

**Goal:** Refactor the entire frontend codebase to follow the hooks architecture pattern:
```
Components render → Hooks think → APIs speak
```

**Principle:** Components should focus purely on rendering. All business logic, data fetching, and state management should be handled by hooks. Direct API imports in pages/components should be eliminated (with documented exceptions).

---

## Phase Summary

| Phase | Scope | Files Refactored | Status |
|-------|-------|------------------|--------|
| 1-5 | Initial Setup (previous session) | - | ✓ Complete |
| 6 | Driver Portal | 2 | ✓ Complete |
| 7 | Assets Detail/Form | 4 | ✓ Complete |
| 8 | Expenses Detail/Form | 2 | ✓ Complete |
| 9 | Drivers Pages | 3 | ✓ Complete |
| 10 | Loads | 1 | ✓ Complete |
| 11 | Components/Modals | 9 | ✓ Complete |
| 12 | Settings/Contexts | 4 | ✓ Complete |

**Total Files Refactored:** 25+

---

## Phase 6: Driver Portal

### Files Modified
1. **`src/pages/driver-portal/DriverDocumentsPage.jsx`**
   - Removed: Direct API imports
   - Added: `useDriverPortalDocuments` hook

2. **`src/pages/driver-portal/DriverSettingsPage.jsx`**
   - Removed: Direct API imports
   - Added: `useDriverPortalSettings` hook

---

## Phase 7: Assets Detail/Form

### Hooks Created
- `useTruck` - Domain hook for truck detail with mutations, assignments, and `isExpiringSoon` helper
- `useTrailer` - Domain hook for trailer detail with same pattern

### Files Modified
1. **`src/hooks/domain/useAssets.js`**
   - Added `useTruck` and `useTrailer` domain hooks

2. **`src/hooks/domain/index.js`**
   - Added exports for new hooks

3. **`src/hooks/index.js`**
   - Updated main barrel export

4. **`src/pages/assets/TruckDetailPage.jsx`**
   - Before: `trucksApi.getTruck()`, `trucksApi.updateTruck()`
   - After: `useTruck` hook

5. **`src/pages/assets/TruckFormPage.jsx`**
   - Before: Direct `trucksApi` calls
   - After: `useTruck` (edit) + `useTrucks` (create) hooks

6. **`src/pages/assets/TrailerDetailPage.jsx`**
   - Before: `trailersApi.getTrailer()`, `trailersApi.updateTrailer()`
   - After: `useTrailer` hook

7. **`src/pages/assets/TrailerFormPage.jsx`**
   - Before: Direct `trailersApi` calls
   - After: `useTrailer` (edit) + `useTrailers` (create) hooks

---

## Phase 8: Expenses Detail/Form

### Files Modified
1. **`src/pages/expenses/ExpenseDetailPage.jsx`**
   - Before: `expensesApi` direct calls
   - After: `useExpense` hook
   - Added: `ExpenseStatusConfig`, `ExpenseCategoryConfig`, `EntityTypeConfig` from centralized config

2. **`src/pages/expenses/ExpenseFormPage.jsx`**
   - Before: `expensesApi` direct calls, local config objects
   - After: `useExpense`, `useExpenses`, `useExpenseCategories`, `useTrucksList`, `useTrailersList`, `useDriversList`, `useLoadsList` hooks
   - Added: Centralized `ExpenseCategoryConfig`, `EntityTypeConfig`

---

## Phase 9: Drivers Pages

### Files Modified
1. **`src/pages/drivers/DriverDetailPage.jsx`**
   - Before: `driversApi.getDriver()`, `driversApi.inviteDriver()`, local status configs
   - After: `useDriver` hook, `DriverStatusConfig` from centralized config

2. **`src/pages/drivers/DriverFormPage.jsx`**
   - Before: `driversApi` direct calls, hardcoded status options
   - After: `useDriver` (edit) + `useDrivers` (create) hooks, `DriverStatusConfig`

3. **`src/pages/drivers/DriverInviteAcceptPage.jsx`**
   - Before: `driversApi.getDriverInviteInfo()`, `driversApi.acceptDriverInvite()`
   - After: `useDriverInviteAccept` API hook

---

## Phase 10: Loads

### Files Modified
1. **`src/pages/loads/LoadDetailPage.jsx`**
   - Before: `loadsApi`, `driversApi`, `uploadsApi` direct calls, local status arrays
   - After: `useLoad` domain hook, `useDriversList` hook
   - Added: `LoadStatusConfig`, `BillingStatusConfig` from centralized config
   - Exception kept: `uploadsApi.getLoadDocuments()` (simple fetch)

---

## Phase 11: Components/Modals

### Files Modified

1. **`src/components/features/customers/QuickAddFacilityModal.jsx`**
   - Before: `facilitiesApi.createFacility()`
   - After: `useFacilityMutations` hook

2. **`src/components/features/customers/QuickAddBrokerModal.jsx`**
   - Before: `brokersApi.createBroker()`, `brokersApi.fmcsaLookup()`
   - After: `useBrokerMutations` hook
   - Exception kept: `brokersApi.fmcsaLookup()` (no hook exists)

3. **`src/components/features/loads/StopsManager.jsx`**
   - Before: `facilitiesApi.getFacilities()`
   - After: `useFacilitiesList` hook

4. **`src/components/features/loads/LoadWizard/index.jsx`**
   - Before: `loadsApi`, `brokersApi`, `facilitiesApi` direct calls
   - After: `useLoadDetail`, `useLoadMutations`, `useBrokersList`, `useBrokerMutations`, `useFacilitiesList`, `useFacilityMutations` hooks

5. **`src/components/features/loads/LoadWizard/RateConUpload.jsx`**
   - Documented exception: `loadsApi.parseRateCon()` (AI parsing operation)

6. **`src/components/features/dispatch/AssignDriverModal.jsx`**
   - Before: `driversApi`, `trucksApi`, `trailersApi`, `loadsApi` direct calls
   - After: `useDriversList`, `useTrucksList`, `useTrailersList`, `useLoadMutations` hooks

7. **`src/components/features/expenses/ReceiptUpload.jsx`**
   - Before: `expensesApi.parseReceipt()`, local `categoryLabels`
   - After: `ExpenseCategoryConfig` from centralized config
   - Exception kept: `expensesApi.parseReceipt()` (AI parsing operation)

8. **`src/components/features/documents/DocumentUploadModal.jsx`**
   - Documented exception: `uploadsApi.uploadDocument()` (simple upload operation)

9. **`src/components/map/LoadRouteMap.jsx`**
   - Documented exception: `mapApi.getLoadRoute()` (specialized mapping operation)

---

## Phase 12: Settings/Contexts

### Files Reviewed & Documented

1. **`src/contexts/AuthContext.jsx`**
   - Status: Documented Exception
   - Reason: Foundational context that PROVIDES `useAuth` hook - can't use hooks inside a hook provider

2. **`src/contexts/OrgContext.jsx`**
   - Status: Documented Exception
   - Reason: Foundational context that PROVIDES `useOrg` hook - can't use hooks inside a hook provider

3. **`src/pages/settings/SettingsPage.jsx`**
   - Status: Documented Exception
   - Reason: Uses `organizationsApi` for member management (removeMember, updateMember) not exposed via context

4. **`src/pages/settings/BillingPage.jsx`**
   - Status: Documented Exception
   - Reason: Specialized Stripe billing domain with no hooks needed

---

## Centralized Configurations Used

All status/type configurations were moved to `src/config/status.js`:

| Config | Used In |
|--------|---------|
| `LoadStatusConfig` | LoadDetailPage, LoadWizard |
| `BillingStatusConfig` | LoadDetailPage |
| `DriverStatusConfig` | DriverDetailPage, DriverFormPage |
| `ExpenseStatusConfig` | ExpenseDetailPage |
| `ExpenseCategoryConfig` | ExpenseFormPage, ReceiptUpload |
| `EntityTypeConfig` | ExpenseFormPage |

---

## Documented Exceptions

These files intentionally use direct API imports with documented reasons:

### Foundational Contexts (Can't Use Hooks)
| File | API | Reason |
|------|-----|--------|
| `AuthContext.jsx` | `authApi` | Provides `useAuth` hook |
| `OrgContext.jsx` | `organizationsApi` | Provides `useOrg` hook |

### AI/ML Operations (Specialized)
| File | API Call | Reason |
|------|----------|--------|
| `RateConUpload.jsx` | `loadsApi.parseRateCon()` | AI document parsing |
| `ReceiptUpload.jsx` | `expensesApi.parseReceipt()` | AI receipt parsing |

### Upload Operations (Simple One-Time)
| File | API Call | Reason |
|------|----------|--------|
| `DocumentUploadModal.jsx` | `uploadsApi.uploadDocument()` | Simple file upload |
| `LoadDetailPage.jsx` | `uploadsApi.getLoadDocuments()` | Simple document fetch |
| `ExpenseFormPage.jsx` | `uploadsApi.getReceiptUrl()` | Simple receipt URL fetch |

### Specialized Domains
| File | API | Reason |
|------|-----|--------|
| `LoadRouteMap.jsx` | `mapApi` | Mapping/routing operations |
| `BillingPage.jsx` | `billingApi` | Stripe integration |
| `QuickAddBrokerModal.jsx` | `brokersApi.fmcsaLookup()` | FMCSA database lookup |

### Not Exposed via Context
| File | API Calls | Reason |
|------|-----------|--------|
| `SettingsPage.jsx` | `organizationsApi.removeMember()`, `updateMember()` | Not in OrgContext |

---

## Hook Architecture Summary

### API Hooks Layer (`src/hooks/api/`)
Wrap raw API calls with loading/error state:
- `useLoadsList`, `useLoadDetail`, `useLoadMutations`, `useLoadStops`
- `useDriversList`, `useDriverDetail`, `useDriverMutations`
- `useTrucksList`, `useTruckDetail`, `useTruckMutations`
- `useTrailersList`, `useTrailerDetail`, `useTrailerMutations`
- `useFacilitiesList`, `useFacilityDetail`, `useFacilityMutations`
- `useBrokersList`, `useBrokerDetail`, `useBrokerMutations`
- `useExpensesList`, `useExpenseDetail`, `useExpenseMutations`
- etc.

### Domain Hooks Layer (`src/hooks/domain/`)
Add business logic on top of API hooks:
- `useLoads`, `useLoad` - Load management with filtering, stats
- `useDrivers`, `useDriver` - Driver management with invite support
- `useTrucks`, `useTruck` - Truck management with assignments
- `useTrailers`, `useTrailer` - Trailer management with assignments
- `useExpenses`, `useExpense` - Expense management with approval workflow
- `useBrokers`, `useBroker` - Broker management
- `useFacilities`, `useFacility` - Facility management
- `useAssets` - Combined truck/trailer management

---

## Best Practices Established

1. **Components render, Hooks think, APIs speak**
   - Components focus on UI rendering
   - Hooks handle all business logic and state
   - APIs are only called through hooks (with documented exceptions)

2. **Centralized Status Configurations**
   - All status/type configs in `src/config/status.js`
   - Provides consistent labels, colors, and variants
   - Single source of truth for UI display

3. **Domain Hooks Pattern**
   - API hooks for raw data access
   - Domain hooks for business logic enrichment
   - Auto-fetch on mount with `autoFetch` option

4. **Documented Exceptions**
   - All exceptions have inline comments explaining why
   - Clear reasoning prevents future confusion
   - Maintains architectural intent while being practical

---

## Files Changed Summary

```
src/
├── hooks/
│   ├── domain/
│   │   ├── useAssets.js          # Added useTruck, useTrailer
│   │   └── index.js              # Updated exports
│   └── index.js                  # Updated barrel exports
├── pages/
│   ├── assets/
│   │   ├── TruckDetailPage.jsx   # Refactored
│   │   ├── TruckFormPage.jsx     # Refactored
│   │   ├── TrailerDetailPage.jsx # Refactored
│   │   └── TrailerFormPage.jsx   # Refactored
│   ├── drivers/
│   │   ├── DriverDetailPage.jsx  # Refactored
│   │   ├── DriverFormPage.jsx    # Refactored
│   │   └── DriverInviteAcceptPage.jsx # Refactored
│   ├── driver-portal/
│   │   ├── DriverDocumentsPage.jsx # Refactored
│   │   └── DriverSettingsPage.jsx  # Refactored
│   ├── expenses/
│   │   ├── ExpenseDetailPage.jsx # Refactored
│   │   └── ExpenseFormPage.jsx   # Refactored
│   ├── loads/
│   │   └── LoadDetailPage.jsx    # Refactored
│   └── settings/
│       ├── SettingsPage.jsx      # Documented
│       └── BillingPage.jsx       # Documented
├── components/
│   ├── features/
│   │   ├── customers/
│   │   │   ├── QuickAddFacilityModal.jsx # Refactored
│   │   │   └── QuickAddBrokerModal.jsx   # Refactored
│   │   ├── dispatch/
│   │   │   └── AssignDriverModal.jsx     # Refactored
│   │   ├── documents/
│   │   │   └── DocumentUploadModal.jsx   # Documented
│   │   ├── expenses/
│   │   │   └── ReceiptUpload.jsx         # Refactored
│   │   └── loads/
│   │       ├── StopsManager.jsx          # Refactored
│   │       └── LoadWizard/
│   │           ├── index.jsx             # Refactored
│   │           └── RateConUpload.jsx     # Documented
│   └── map/
│       └── LoadRouteMap.jsx              # Documented
└── contexts/
    ├── AuthContext.jsx           # Documented
    └── OrgContext.jsx            # Documented
```

---

## Conclusion

The frontend architecture refactoring is complete. The codebase now follows a consistent pattern where:

1. **All pages and components** use hooks for data fetching and mutations
2. **Centralized configurations** eliminate duplicate status/type definitions
3. **Documented exceptions** clearly explain why certain files still use direct API calls
4. **Domain hooks** provide rich business logic on top of API hooks

This architecture improves:
- **Maintainability** - Logic is centralized in hooks
- **Testability** - Hooks can be tested independently
- **Consistency** - Single patterns across the codebase
- **Developer Experience** - Clear mental model for where code belongs
