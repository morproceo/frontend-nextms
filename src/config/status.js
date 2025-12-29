/**
 * Status Configuration - Single Source of Truth for UI
 *
 * This module bridges enums with UI concerns (icons, variants).
 * Components should import from here, NOT define their own status configs.
 *
 * Philosophy:
 * - Enums define WHAT statuses exist (in @/enums)
 * - This config defines HOW they appear in the UI (frontend only)
 */

import {
  // Loads
  LoadStatus,
  LoadStatusLabels,
  LoadStatusColors,
  ActiveLoadStatuses,
  CompletedLoadStatuses,
  // Billing
  BillingStatus,
  BillingStatusLabels,
  BillingStatusColors,
  // Drivers
  DriverStatus,
  DriverStatusLabels,
  DriverStatusColors,
  AssignableDriverStatuses,
  ActiveDriverStatuses,
  // Expenses
  ExpenseStatus,
  ExpenseStatusLabels,
  ExpenseStatusColors,
  // Dispatch
  DispatchStatus,
  DispatchStatusLabels,
  DispatchStatusColors,
  // Assets
  AssetStatus,
  AssetStatusLabels,
  AssetStatusColors,
  // Invoices
  InvoiceStatus,
  InvoiceStatusLabels,
  InvoiceStatusColors,
  // Membership
  MembershipStatus,
  MembershipStatusLabels
} from '@/enums';

import {
  Package,
  FileText,
  CheckCircle,
  Truck,
  DollarSign,
  AlertTriangle,
  Clock,
  UserCheck,
  UserX,
  LogOut,
  Send,
  XCircle,
  Pause,
  Play,
  Receipt,
  CreditCard,
  Ban,
  ArrowUpFromLine,
  ArrowDownToLine,
  ArrowLeftRight,
  Container,
  Snowflake,
  Wrench,
  Power,
  Fuel,
  Shield,
  Ticket,
  Building,
  CircleDollarSign,
  Users,
  Boxes
} from 'lucide-react';

// ============================================
// LOAD STATUS CONFIG
// ============================================

const LoadStatusIcons = {
  [LoadStatus.DRAFT]: FileText,
  [LoadStatus.NEW]: Package,
  [LoadStatus.BOOKED]: CheckCircle,
  [LoadStatus.DISPATCHED]: Send,
  [LoadStatus.IN_TRANSIT]: Truck,
  [LoadStatus.DELIVERED]: CheckCircle,
  [LoadStatus.INVOICED]: DollarSign,
  [LoadStatus.PAID]: CheckCircle,
  [LoadStatus.CANCELLED]: AlertTriangle
};

/**
 * Complete load status configuration for UI rendering
 */
export const LoadStatusConfig = Object.fromEntries(
  Object.values(LoadStatus).map(status => [
    status,
    {
      value: status,
      label: LoadStatusLabels[status],
      color: LoadStatusColors[status],
      variant: LoadStatusColors[status], // Alias for Badge component
      icon: LoadStatusIcons[status] || Package
    }
  ])
);

/**
 * Load status flow for step indicators
 */
export const LoadStatusFlow = [
  LoadStatus.NEW,
  LoadStatus.BOOKED,
  LoadStatus.DISPATCHED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.DELIVERED,
  LoadStatus.INVOICED,
  LoadStatus.PAID
].map(status => LoadStatusConfig[status]);

/**
 * Statuses to show in quick filter chips
 */
export const LoadQuickFilterStatuses = [
  LoadStatus.DISPATCHED,
  LoadStatus.IN_TRANSIT,
  LoadStatus.DELIVERED,
  LoadStatus.INVOICED
];

// Re-export for convenience
export { LoadStatus, ActiveLoadStatuses, CompletedLoadStatuses };

// ============================================
// BILLING STATUS CONFIG
// ============================================

const BillingStatusIcons = {
  [BillingStatus.PENDING]: Clock,
  [BillingStatus.INVOICED]: Receipt,
  [BillingStatus.PARTIAL]: CreditCard,
  [BillingStatus.PAID]: CheckCircle,
  [BillingStatus.DISPUTED]: AlertTriangle
};

export const BillingStatusConfig = Object.fromEntries(
  Object.values(BillingStatus).map(status => [
    status,
    {
      value: status,
      label: BillingStatusLabels[status],
      color: BillingStatusColors[status],
      variant: BillingStatusColors[status],
      icon: BillingStatusIcons[status] || Clock
    }
  ])
);

export { BillingStatus };

// ============================================
// DRIVER STATUS CONFIG
// ============================================

const DriverStatusIcons = {
  [DriverStatus.AVAILABLE]: UserCheck,
  [DriverStatus.DRIVING]: Truck,
  [DriverStatus.OFF_DUTY]: Pause,
  [DriverStatus.INACTIVE]: UserX
};

export const DriverStatusConfig = Object.fromEntries(
  Object.values(DriverStatus).map(status => [
    status,
    {
      value: status,
      label: DriverStatusLabels[status],
      color: DriverStatusColors[status],
      variant: DriverStatusColors[status],
      icon: DriverStatusIcons[status] || UserCheck
    }
  ])
);

// Re-export for convenience
export { DriverStatus, AssignableDriverStatuses, ActiveDriverStatuses };

// ============================================
// DRIVER ACCOUNT STATUS CONFIG (UI-only)
// These are derived states, not stored in DB
// ============================================

export const DriverAccountStatus = {
  ACTIVE: 'active',
  PENDING: 'pending',
  UNCLAIMED: 'unclaimed',
  LEFT: 'left'
};

export const DriverAccountStatusConfig = {
  [DriverAccountStatus.ACTIVE]: {
    value: DriverAccountStatus.ACTIVE,
    label: 'Active',
    color: 'green',
    variant: 'green',
    icon: UserCheck
  },
  [DriverAccountStatus.PENDING]: {
    value: DriverAccountStatus.PENDING,
    label: 'Invited',
    color: 'yellow',
    variant: 'yellow',
    icon: Clock
  },
  [DriverAccountStatus.UNCLAIMED]: {
    value: DriverAccountStatus.UNCLAIMED,
    label: 'Unclaimed',
    color: 'gray',
    variant: 'gray',
    icon: UserX
  },
  [DriverAccountStatus.LEFT]: {
    value: DriverAccountStatus.LEFT,
    label: 'Left',
    color: 'red',
    variant: 'red',
    icon: LogOut
  }
};

/**
 * Derive account status from driver data
 */
export function getDriverAccountStatus(driver) {
  if (!driver.user_id) {
    if (driver.membership?.status === MembershipStatus.INVITED) {
      return DriverAccountStatus.PENDING;
    }
    return DriverAccountStatus.UNCLAIMED;
  }
  if (driver.membership?.status === MembershipStatus.LEFT) {
    return DriverAccountStatus.LEFT;
  }
  return DriverAccountStatus.ACTIVE;
}

// ============================================
// EXPENSE STATUS CONFIG
// ============================================

const ExpenseStatusIcons = {
  [ExpenseStatus.DRAFT]: FileText,
  [ExpenseStatus.PENDING]: Clock,
  [ExpenseStatus.APPROVED]: CheckCircle,
  [ExpenseStatus.REJECTED]: XCircle,
  [ExpenseStatus.PAID]: DollarSign
};

export const ExpenseStatusConfig = Object.fromEntries(
  Object.values(ExpenseStatus).map(status => [
    status,
    {
      value: status,
      label: ExpenseStatusLabels[status],
      color: ExpenseStatusColors[status],
      variant: ExpenseStatusColors[status],
      icon: ExpenseStatusIcons[status] || Clock
    }
  ])
);

export { ExpenseStatus };

// ============================================
// DISPATCH STATUS CONFIG
// ============================================

const DispatchStatusIcons = {
  [DispatchStatus.PENDING]: Clock,
  [DispatchStatus.ACCEPTED]: CheckCircle,
  [DispatchStatus.REJECTED]: XCircle,
  [DispatchStatus.IN_PROGRESS]: Truck,
  [DispatchStatus.COMPLETED]: CheckCircle,
  [DispatchStatus.CANCELLED]: Ban
};

export const DispatchStatusConfig = Object.fromEntries(
  Object.values(DispatchStatus).map(status => [
    status,
    {
      value: status,
      label: DispatchStatusLabels[status],
      color: DispatchStatusColors[status],
      variant: DispatchStatusColors[status],
      icon: DispatchStatusIcons[status] || Clock
    }
  ])
);

export { DispatchStatus };

// ============================================
// ASSET STATUS CONFIG
// ============================================

const AssetStatusIcons = {
  [AssetStatus.AVAILABLE]: CheckCircle,
  [AssetStatus.IN_USE]: Truck,
  [AssetStatus.MAINTENANCE]: AlertTriangle,
  [AssetStatus.OUT_OF_SERVICE]: XCircle
};

export const AssetStatusConfig = Object.fromEntries(
  Object.values(AssetStatus).map(status => [
    status,
    {
      value: status,
      label: AssetStatusLabels[status],
      color: AssetStatusColors[status],
      variant: AssetStatusColors[status],
      icon: AssetStatusIcons[status] || CheckCircle
    }
  ])
);

export { AssetStatus };

// ============================================
// INVOICE STATUS CONFIG
// ============================================

const InvoiceStatusIcons = {
  [InvoiceStatus.DRAFT]: FileText,
  [InvoiceStatus.SENT]: Send,
  [InvoiceStatus.VIEWED]: FileText,
  [InvoiceStatus.PARTIAL]: CreditCard,
  [InvoiceStatus.PAID]: CheckCircle,
  [InvoiceStatus.OVERDUE]: AlertTriangle,
  [InvoiceStatus.VOID]: XCircle
};

export const InvoiceStatusConfig = Object.fromEntries(
  Object.values(InvoiceStatus).map(status => [
    status,
    {
      value: status,
      label: InvoiceStatusLabels[status],
      color: InvoiceStatusColors[status],
      variant: InvoiceStatusColors[status],
      icon: InvoiceStatusIcons[status] || FileText
    }
  ])
);

export { InvoiceStatus };

// ============================================
// FACILITY TYPE CONFIG
// ============================================

export const FacilityType = {
  SHIPPER: 'shipper',
  RECEIVER: 'receiver',
  BOTH: 'both'
};

export const FacilityTypeConfig = {
  [FacilityType.SHIPPER]: {
    value: FacilityType.SHIPPER,
    label: 'Shipper',
    color: 'blue',
    variant: 'blue',
    icon: ArrowUpFromLine
  },
  [FacilityType.RECEIVER]: {
    value: FacilityType.RECEIVER,
    label: 'Receiver',
    color: 'green',
    variant: 'green',
    icon: ArrowDownToLine
  },
  [FacilityType.BOTH]: {
    value: FacilityType.BOTH,
    label: 'Both',
    color: 'purple',
    variant: 'purple',
    icon: ArrowLeftRight
  }
};

// ============================================
// TRUCK TYPE CONFIG
// ============================================

export const TruckType = {
  DAY_CAB: 'day_cab',
  SLEEPER: 'sleeper',
  STRAIGHT: 'straight',
  BOX: 'box'
};

export const TruckTypeConfig = {
  [TruckType.DAY_CAB]: {
    value: TruckType.DAY_CAB,
    label: 'Day Cab',
    icon: Truck
  },
  [TruckType.SLEEPER]: {
    value: TruckType.SLEEPER,
    label: 'Sleeper',
    icon: Truck
  },
  [TruckType.STRAIGHT]: {
    value: TruckType.STRAIGHT,
    label: 'Straight Truck',
    icon: Truck
  },
  [TruckType.BOX]: {
    value: TruckType.BOX,
    label: 'Box Truck',
    icon: Truck
  }
};

// ============================================
// TRAILER TYPE CONFIG
// ============================================

export const TrailerType = {
  DRY_VAN: 'dry_van',
  REEFER: 'reefer',
  FLATBED: 'flatbed',
  STEP_DECK: 'step_deck',
  LOWBOY: 'lowboy',
  TANKER: 'tanker',
  HOPPER: 'hopper',
  LIVESTOCK: 'livestock',
  AUTO_CARRIER: 'auto_carrier',
  INTERMODAL: 'intermodal',
  OTHER: 'other'
};

export const TrailerTypeConfig = {
  [TrailerType.DRY_VAN]: {
    value: TrailerType.DRY_VAN,
    label: 'Dry Van',
    icon: Container
  },
  [TrailerType.REEFER]: {
    value: TrailerType.REEFER,
    label: 'Reefer',
    icon: Snowflake,
    color: 'blue'
  },
  [TrailerType.FLATBED]: {
    value: TrailerType.FLATBED,
    label: 'Flatbed',
    icon: Container
  },
  [TrailerType.STEP_DECK]: {
    value: TrailerType.STEP_DECK,
    label: 'Step Deck',
    icon: Container
  },
  [TrailerType.LOWBOY]: {
    value: TrailerType.LOWBOY,
    label: 'Lowboy',
    icon: Container
  },
  [TrailerType.TANKER]: {
    value: TrailerType.TANKER,
    label: 'Tanker',
    icon: Container
  },
  [TrailerType.HOPPER]: {
    value: TrailerType.HOPPER,
    label: 'Hopper',
    icon: Container
  },
  [TrailerType.LIVESTOCK]: {
    value: TrailerType.LIVESTOCK,
    label: 'Livestock',
    icon: Container
  },
  [TrailerType.AUTO_CARRIER]: {
    value: TrailerType.AUTO_CARRIER,
    label: 'Auto Carrier',
    icon: Container
  },
  [TrailerType.INTERMODAL]: {
    value: TrailerType.INTERMODAL,
    label: 'Intermodal',
    icon: Container
  },
  [TrailerType.OTHER]: {
    value: TrailerType.OTHER,
    label: 'Other',
    icon: Container
  }
};

// ============================================
// EXPENSE CATEGORY CONFIG
// ============================================

export const ExpenseCategory = {
  FUEL: 'fuel',
  MAINTENANCE: 'maintenance',
  REPAIRS: 'repairs',
  INSURANCE: 'insurance',
  PERMITS: 'permits',
  TOLLS: 'tolls',
  TIRES: 'tires',
  IFTA: 'ifta',
  LUMPER: 'lumper',
  DETENTION: 'detention',
  SCALE_TICKET: 'scale_ticket',
  DRIVER_PAY: 'driver_pay',
  ADVANCES: 'advances',
  DEDUCTIONS: 'deductions',
  OFFICE: 'office',
  UTILITIES: 'utilities',
  SOFTWARE: 'software',
  RENT: 'rent',
  PROFESSIONAL_SERVICES: 'professional_services',
  OTHER: 'other'
};

export const ExpenseCategoryConfig = {
  [ExpenseCategory.FUEL]: {
    value: ExpenseCategory.FUEL,
    label: 'Fuel',
    icon: Fuel
  },
  [ExpenseCategory.MAINTENANCE]: {
    value: ExpenseCategory.MAINTENANCE,
    label: 'Maintenance',
    icon: Wrench
  },
  [ExpenseCategory.REPAIRS]: {
    value: ExpenseCategory.REPAIRS,
    label: 'Repairs',
    icon: Wrench
  },
  [ExpenseCategory.INSURANCE]: {
    value: ExpenseCategory.INSURANCE,
    label: 'Insurance',
    icon: Shield
  },
  [ExpenseCategory.PERMITS]: {
    value: ExpenseCategory.PERMITS,
    label: 'Permits',
    icon: FileText
  },
  [ExpenseCategory.TOLLS]: {
    value: ExpenseCategory.TOLLS,
    label: 'Tolls',
    icon: Ticket
  },
  [ExpenseCategory.TIRES]: {
    value: ExpenseCategory.TIRES,
    label: 'Tires',
    icon: Container
  },
  [ExpenseCategory.IFTA]: {
    value: ExpenseCategory.IFTA,
    label: 'IFTA',
    icon: FileText
  },
  [ExpenseCategory.LUMPER]: {
    value: ExpenseCategory.LUMPER,
    label: 'Lumper',
    icon: Users
  },
  [ExpenseCategory.DETENTION]: {
    value: ExpenseCategory.DETENTION,
    label: 'Detention',
    icon: Clock
  },
  [ExpenseCategory.SCALE_TICKET]: {
    value: ExpenseCategory.SCALE_TICKET,
    label: 'Scale Ticket',
    icon: Ticket
  },
  [ExpenseCategory.DRIVER_PAY]: {
    value: ExpenseCategory.DRIVER_PAY,
    label: 'Driver Pay',
    icon: CircleDollarSign
  },
  [ExpenseCategory.ADVANCES]: {
    value: ExpenseCategory.ADVANCES,
    label: 'Advances',
    icon: DollarSign
  },
  [ExpenseCategory.DEDUCTIONS]: {
    value: ExpenseCategory.DEDUCTIONS,
    label: 'Deductions',
    icon: DollarSign
  },
  [ExpenseCategory.OFFICE]: {
    value: ExpenseCategory.OFFICE,
    label: 'Office',
    icon: Building
  },
  [ExpenseCategory.UTILITIES]: {
    value: ExpenseCategory.UTILITIES,
    label: 'Utilities',
    icon: Building
  },
  [ExpenseCategory.SOFTWARE]: {
    value: ExpenseCategory.SOFTWARE,
    label: 'Software',
    icon: FileText
  },
  [ExpenseCategory.RENT]: {
    value: ExpenseCategory.RENT,
    label: 'Rent',
    icon: Building
  },
  [ExpenseCategory.PROFESSIONAL_SERVICES]: {
    value: ExpenseCategory.PROFESSIONAL_SERVICES,
    label: 'Professional Services',
    icon: Users
  },
  [ExpenseCategory.OTHER]: {
    value: ExpenseCategory.OTHER,
    label: 'Other',
    icon: Boxes
  }
};

// ============================================
// ENTITY TYPE CONFIG (for expense associations)
// ============================================

export const EntityType = {
  ORGANIZATION: 'organization',
  TRUCK: 'truck',
  TRAILER: 'trailer',
  DRIVER: 'driver',
  LOAD: 'load'
};

export const EntityTypeConfig = {
  [EntityType.ORGANIZATION]: {
    value: EntityType.ORGANIZATION,
    label: 'Organization',
    icon: Building
  },
  [EntityType.TRUCK]: {
    value: EntityType.TRUCK,
    label: 'Truck',
    icon: Truck
  },
  [EntityType.TRAILER]: {
    value: EntityType.TRAILER,
    label: 'Trailer',
    icon: Container
  },
  [EntityType.DRIVER]: {
    value: EntityType.DRIVER,
    label: 'Driver',
    icon: UserCheck
  },
  [EntityType.LOAD]: {
    value: EntityType.LOAD,
    label: 'Load',
    icon: Package
  }
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get status config with fallback for unknown statuses
 */
export function getStatusConfig(configMap, status, fallback = { label: status, variant: 'gray' }) {
  return configMap[status] || { ...fallback, value: status };
}

/**
 * Generate options array for select inputs
 */
export function statusToOptions(configMap) {
  return Object.values(configMap).map(config => ({
    value: config.value,
    label: config.label
  }));
}

/**
 * Filter config entries by status values
 */
export function filterStatuses(configMap, statuses) {
  return statuses.map(status => configMap[status]).filter(Boolean);
}
