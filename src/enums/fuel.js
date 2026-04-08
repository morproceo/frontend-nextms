/**
 * Fuel Management Enums (Frontend mirror of backend)
 */

// Fuel Transaction Status
export const FuelTransactionStatus = Object.freeze({
  DRAFT: 'draft',
  PENDING_VERIFICATION: 'pending_verification',
  VERIFIED: 'verified',
  CONFIRMED: 'confirmed',
  FLAGGED: 'flagged',
  REJECTED: 'rejected'
});

export const FuelTransactionStatusLabels = Object.freeze({
  [FuelTransactionStatus.DRAFT]: 'Draft',
  [FuelTransactionStatus.PENDING_VERIFICATION]: 'Pending Verification',
  [FuelTransactionStatus.VERIFIED]: 'Verified',
  [FuelTransactionStatus.CONFIRMED]: 'Confirmed',
  [FuelTransactionStatus.FLAGGED]: 'Flagged',
  [FuelTransactionStatus.REJECTED]: 'Rejected'
});

export const FuelTransactionStatusColors = Object.freeze({
  [FuelTransactionStatus.DRAFT]: 'gray',
  [FuelTransactionStatus.PENDING_VERIFICATION]: 'blue',
  [FuelTransactionStatus.VERIFIED]: 'green',
  [FuelTransactionStatus.CONFIRMED]: 'emerald',
  [FuelTransactionStatus.FLAGGED]: 'orange',
  [FuelTransactionStatus.REJECTED]: 'red'
});

export const FuelTransactionStatusTransitions = Object.freeze({
  [FuelTransactionStatus.DRAFT]: [FuelTransactionStatus.PENDING_VERIFICATION],
  [FuelTransactionStatus.PENDING_VERIFICATION]: [FuelTransactionStatus.VERIFIED, FuelTransactionStatus.FLAGGED, FuelTransactionStatus.REJECTED],
  [FuelTransactionStatus.VERIFIED]: [FuelTransactionStatus.CONFIRMED],
  [FuelTransactionStatus.CONFIRMED]: [],
  [FuelTransactionStatus.FLAGGED]: [FuelTransactionStatus.PENDING_VERIFICATION, FuelTransactionStatus.REJECTED],
  [FuelTransactionStatus.REJECTED]: [FuelTransactionStatus.DRAFT]
});

export const EditableFuelStatuses = Object.freeze([
  FuelTransactionStatus.DRAFT,
  FuelTransactionStatus.FLAGGED,
  FuelTransactionStatus.REJECTED
]);

export const canTransitionFuelTo = (currentStatus, newStatus) => {
  const allowed = FuelTransactionStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};

// Fuel Card Status
export const FuelCardStatus = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  SUSPENDED: 'suspended',
  LOST: 'lost',
  CANCELLED: 'cancelled'
});

export const FuelCardStatusLabels = Object.freeze({
  [FuelCardStatus.ACTIVE]: 'Active',
  [FuelCardStatus.INACTIVE]: 'Inactive',
  [FuelCardStatus.SUSPENDED]: 'Suspended',
  [FuelCardStatus.LOST]: 'Lost',
  [FuelCardStatus.CANCELLED]: 'Cancelled'
});

export const FuelCardStatusColors = Object.freeze({
  [FuelCardStatus.ACTIVE]: 'green',
  [FuelCardStatus.INACTIVE]: 'gray',
  [FuelCardStatus.SUSPENDED]: 'yellow',
  [FuelCardStatus.LOST]: 'orange',
  [FuelCardStatus.CANCELLED]: 'red'
});

// Fuel Card Provider
export const FuelCardProvider = Object.freeze({
  EFS: 'efs',
  COMDATA: 'comdata',
  WEX: 'wex',
  FUELMAN: 'fuelman',
  PILOT_RBF: 'pilot_rbf',
  LOVES: 'loves',
  TA_PETRO: 'ta_petro',
  FLEET_ONE: 'fleet_one',
  OTHER: 'other'
});

export const FuelCardProviderLabels = Object.freeze({
  [FuelCardProvider.EFS]: 'EFS',
  [FuelCardProvider.COMDATA]: 'Comdata',
  [FuelCardProvider.WEX]: 'WEX',
  [FuelCardProvider.FUELMAN]: 'Fuelman',
  [FuelCardProvider.PILOT_RBF]: 'Pilot RBF',
  [FuelCardProvider.LOVES]: "Love's",
  [FuelCardProvider.TA_PETRO]: 'TA/Petro',
  [FuelCardProvider.FLEET_ONE]: 'Fleet One',
  [FuelCardProvider.OTHER]: 'Other'
});

// Fuel Type
export const FuelType = Object.freeze({
  DIESEL: 'diesel',
  DEF: 'def',
  UNLEADED_REGULAR: 'unleaded_regular',
  UNLEADED_MID: 'unleaded_mid',
  UNLEADED_PREMIUM: 'unleaded_premium',
  BIODIESEL: 'biodiesel',
  CNG: 'cng',
  LNG: 'lng',
  OTHER: 'other'
});

export const FuelTypeLabels = Object.freeze({
  [FuelType.DIESEL]: 'Diesel',
  [FuelType.DEF]: 'DEF',
  [FuelType.UNLEADED_REGULAR]: 'Unleaded Regular',
  [FuelType.UNLEADED_MID]: 'Unleaded Mid-Grade',
  [FuelType.UNLEADED_PREMIUM]: 'Unleaded Premium',
  [FuelType.BIODIESEL]: 'Biodiesel',
  [FuelType.CNG]: 'CNG',
  [FuelType.LNG]: 'LNG',
  [FuelType.OTHER]: 'Other'
});

// Import Source
export const FuelImportSource = Object.freeze({
  MANUAL: 'manual',
  CSV_IMPORT: 'csv_import',
  API: 'api',
  RECEIPT_SCAN: 'receipt_scan'
});

export const FuelImportSourceLabels = Object.freeze({
  [FuelImportSource.MANUAL]: 'Manual Entry',
  [FuelImportSource.CSV_IMPORT]: 'CSV Import',
  [FuelImportSource.API]: 'API',
  [FuelImportSource.RECEIPT_SCAN]: 'Receipt Scan'
});
