/**
 * Driver Enums
 * Classification, pay, and tax enums for org-owned driver fields
 */

export const DriverType = {
  COMPANY: 'company',
  OWNER_OPERATOR: 'owner_operator',
  LEASE: 'lease',
  TEAM: 'team'
};

export const DriverTypeLabels = {
  [DriverType.COMPANY]: 'Company Driver',
  [DriverType.OWNER_OPERATOR]: 'Owner Operator',
  [DriverType.LEASE]: 'Lease',
  [DriverType.TEAM]: 'Team'
};

export const PayType = {
  PER_MILE: 'per_mile',
  PERCENTAGE: 'percentage',
  FLAT_RATE: 'flat_rate',
  HOURLY: 'hourly'
};

export const PayTypeLabels = {
  [PayType.PER_MILE]: 'Per Mile',
  [PayType.PERCENTAGE]: 'Percentage',
  [PayType.FLAT_RATE]: 'Flat Rate',
  [PayType.HOURLY]: 'Hourly'
};

export const TaxClassification = {
  W2: 'w2',
  _1099: '1099'
};

export const TaxClassificationLabels = {
  [TaxClassification.W2]: 'W-2 Employee',
  [TaxClassification._1099]: '1099 Contractor'
};
