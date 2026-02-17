/**
 * Frontend Enums
 * All enums used by the frontend
 *
 * NOTE: These enums are duplicated in the backend.
 * If you modify enums here, also update backend/src/enums/
 */

// Roles & Permissions
export {
  Roles,
  RoleHierarchy,
  RoleLabels,
  RoleDescriptions
} from './roles.js';

export {
  Permissions,
  RolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission
} from './permissions.js';

// Membership
export {
  MembershipStatus,
  MembershipStatusLabels,
  MembershipStatusTransitions,
  canTransitionTo
} from './membershipStatus.js';

// Loads
export {
  LoadStatus,
  LoadStatusLabels,
  LoadStatusColors,
  LoadStatusTransitions,
  ActiveLoadStatuses,
  CompletedLoadStatuses,
  canTransitionLoadTo
} from './loadStatus.js';

// Billing
export {
  BillingStatus,
  BillingStatusLabels,
  BillingStatusColors
} from './billingStatus.js';

// Documents
export {
  DocumentType,
  DocumentTypeLabels,
  DocumentTypeShort,
  RequiredForInvoice,
  DocumentApprovalStatus
} from './documentType.js';

// Drivers
export {
  DriverStatus,
  DriverStatusLabels,
  DriverStatusColors,
  AssignableDriverStatuses,
  ActiveDriverStatuses
} from './driverStatus.js';

export {
  DriverType,
  DriverTypeLabels,
  PayType,
  PayTypeLabels,
  TaxClassification,
  TaxClassificationLabels
} from './driver.js';

// Dispatch
export {
  DispatchStatus,
  DispatchStatusLabels,
  DispatchStatusColors,
  DispatchStatusTransitions
} from './dispatchStatus.js';

// Assets (Trucks/Trailers)
export {
  AssetStatus,
  AssetStatusLabels,
  AssetStatusColors,
  TrailerType,
  TrailerTypeLabels
} from './assetStatus.js';

// Invoices
export {
  InvoiceStatus,
  InvoiceStatusLabels,
  InvoiceStatusColors,
  InvoiceStatusTransitions
} from './invoiceStatus.js';

// Expenses
export {
  ExpenseStatus,
  ExpenseStatusLabels,
  ExpenseStatusColors,
  ExpenseStatusTransitions,
  EditableExpenseStatuses,
  ActionRequiredExpenseStatuses,
  canTransitionExpenseTo,
  ExpenseCategory,
  ExpenseCategoryLabels,
  ExpenseCategoryGroups,
  ExpenseEntityType,
  ExpenseEntityTypeLabels,
  RecurringFrequency,
  RecurringFrequencyLabels,
  RecurringFrequencyDays,
  PaymentMethod,
  PaymentMethodLabels
} from './expense.js';
