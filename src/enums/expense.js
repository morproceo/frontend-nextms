/**
 * Expense Enums
 */

export const ExpenseStatus = Object.freeze({
  DRAFT: 'draft',
  PENDING_RECEIPT: 'pending_receipt',
  PENDING_CONFIRMATION: 'pending_confirmation',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  PAID: 'paid',
  REJECTED: 'rejected'
});

export const ExpenseStatusLabels = Object.freeze({
  [ExpenseStatus.DRAFT]: 'Draft',
  [ExpenseStatus.PENDING_RECEIPT]: 'Pending Receipt',
  [ExpenseStatus.PENDING_CONFIRMATION]: 'Pending Confirmation',
  [ExpenseStatus.PENDING_APPROVAL]: 'Pending Approval',
  [ExpenseStatus.APPROVED]: 'Approved',
  [ExpenseStatus.PAID]: 'Paid',
  [ExpenseStatus.REJECTED]: 'Rejected'
});

export const ExpenseStatusColors = Object.freeze({
  [ExpenseStatus.DRAFT]: 'gray',
  [ExpenseStatus.PENDING_RECEIPT]: 'yellow',
  [ExpenseStatus.PENDING_CONFIRMATION]: 'orange',
  [ExpenseStatus.PENDING_APPROVAL]: 'blue',
  [ExpenseStatus.APPROVED]: 'green',
  [ExpenseStatus.PAID]: 'emerald',
  [ExpenseStatus.REJECTED]: 'red'
});

export const ExpenseStatusTransitions = Object.freeze({
  [ExpenseStatus.DRAFT]: [ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.PENDING_RECEIPT, ExpenseStatus.PENDING_CONFIRMATION],
  [ExpenseStatus.PENDING_RECEIPT]: [ExpenseStatus.PENDING_CONFIRMATION, ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.DRAFT],
  [ExpenseStatus.PENDING_CONFIRMATION]: [ExpenseStatus.PENDING_APPROVAL, ExpenseStatus.DRAFT],
  [ExpenseStatus.PENDING_APPROVAL]: [ExpenseStatus.APPROVED, ExpenseStatus.REJECTED],
  [ExpenseStatus.APPROVED]: [ExpenseStatus.PAID],
  [ExpenseStatus.PAID]: [],
  [ExpenseStatus.REJECTED]: [ExpenseStatus.DRAFT, ExpenseStatus.PENDING_APPROVAL]
});

export const EditableExpenseStatuses = Object.freeze([
  ExpenseStatus.DRAFT,
  ExpenseStatus.PENDING_RECEIPT,
  ExpenseStatus.PENDING_CONFIRMATION
]);

export const ActionRequiredExpenseStatuses = Object.freeze([
  ExpenseStatus.PENDING_RECEIPT,
  ExpenseStatus.PENDING_CONFIRMATION,
  ExpenseStatus.PENDING_APPROVAL
]);

export const canTransitionExpenseTo = (currentStatus, newStatus) => {
  const allowed = ExpenseStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};

export const ExpenseCategory = Object.freeze({
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
});

export const ExpenseCategoryLabels = Object.freeze({
  [ExpenseCategory.FUEL]: 'Fuel',
  [ExpenseCategory.MAINTENANCE]: 'Maintenance',
  [ExpenseCategory.REPAIRS]: 'Repairs',
  [ExpenseCategory.INSURANCE]: 'Insurance',
  [ExpenseCategory.PERMITS]: 'Permits & Licenses',
  [ExpenseCategory.TOLLS]: 'Tolls',
  [ExpenseCategory.TIRES]: 'Tires',
  [ExpenseCategory.IFTA]: 'IFTA Tax',
  [ExpenseCategory.LUMPER]: 'Lumper Fee',
  [ExpenseCategory.DETENTION]: 'Detention',
  [ExpenseCategory.SCALE_TICKET]: 'Scale Ticket',
  [ExpenseCategory.DRIVER_PAY]: 'Driver Pay',
  [ExpenseCategory.ADVANCES]: 'Advances',
  [ExpenseCategory.DEDUCTIONS]: 'Deductions',
  [ExpenseCategory.OFFICE]: 'Office Supplies',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.SOFTWARE]: 'Software',
  [ExpenseCategory.RENT]: 'Rent',
  [ExpenseCategory.PROFESSIONAL_SERVICES]: 'Professional Services',
  [ExpenseCategory.OTHER]: 'Other'
});

export const ExpenseCategoryGroups = Object.freeze({
  VEHICLE: [ExpenseCategory.FUEL, ExpenseCategory.MAINTENANCE, ExpenseCategory.REPAIRS, ExpenseCategory.INSURANCE, ExpenseCategory.PERMITS, ExpenseCategory.TOLLS, ExpenseCategory.TIRES, ExpenseCategory.IFTA],
  LOAD: [ExpenseCategory.LUMPER, ExpenseCategory.DETENTION, ExpenseCategory.SCALE_TICKET],
  DRIVER: [ExpenseCategory.DRIVER_PAY, ExpenseCategory.ADVANCES, ExpenseCategory.DEDUCTIONS],
  ORGANIZATION: [ExpenseCategory.OFFICE, ExpenseCategory.UTILITIES, ExpenseCategory.SOFTWARE, ExpenseCategory.RENT, ExpenseCategory.PROFESSIONAL_SERVICES]
});

export const ExpenseEntityType = Object.freeze({
  ORGANIZATION: 'organization',
  TRUCK: 'truck',
  TRAILER: 'trailer',
  DRIVER: 'driver',
  LOAD: 'load'
});

export const ExpenseEntityTypeLabels = Object.freeze({
  [ExpenseEntityType.ORGANIZATION]: 'Organization',
  [ExpenseEntityType.TRUCK]: 'Truck',
  [ExpenseEntityType.TRAILER]: 'Trailer',
  [ExpenseEntityType.DRIVER]: 'Driver',
  [ExpenseEntityType.LOAD]: 'Load'
});

export const RecurringFrequency = Object.freeze({
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly',
  YEARLY: 'yearly'
});

export const RecurringFrequencyLabels = Object.freeze({
  [RecurringFrequency.WEEKLY]: 'Weekly',
  [RecurringFrequency.BIWEEKLY]: 'Bi-Weekly',
  [RecurringFrequency.MONTHLY]: 'Monthly',
  [RecurringFrequency.QUARTERLY]: 'Quarterly',
  [RecurringFrequency.YEARLY]: 'Yearly'
});

export const RecurringFrequencyDays = Object.freeze({
  [RecurringFrequency.WEEKLY]: 7,
  [RecurringFrequency.BIWEEKLY]: 14,
  [RecurringFrequency.MONTHLY]: 30,
  [RecurringFrequency.QUARTERLY]: 90,
  [RecurringFrequency.YEARLY]: 365
});

export const PaymentMethod = Object.freeze({
  CASH: 'cash',
  CHECK: 'check',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  ACH: 'ach',
  WIRE: 'wire',
  FUEL_CARD: 'fuel_card',
  EFS: 'efs',
  COMCHEK: 'comchek',
  OTHER: 'other'
});

export const PaymentMethodLabels = Object.freeze({
  [PaymentMethod.CASH]: 'Cash',
  [PaymentMethod.CHECK]: 'Check',
  [PaymentMethod.CREDIT_CARD]: 'Credit Card',
  [PaymentMethod.DEBIT_CARD]: 'Debit Card',
  [PaymentMethod.ACH]: 'ACH Transfer',
  [PaymentMethod.WIRE]: 'Wire Transfer',
  [PaymentMethod.FUEL_CARD]: 'Fuel Card',
  [PaymentMethod.EFS]: 'EFS',
  [PaymentMethod.COMCHEK]: 'Comchek',
  [PaymentMethod.OTHER]: 'Other'
});
