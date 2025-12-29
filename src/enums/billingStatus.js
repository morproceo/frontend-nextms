/**
 * Billing Status
 */

export const BillingStatus = Object.freeze({
  PENDING: 'pending',
  INVOICED: 'invoiced',
  PARTIAL: 'partial',
  PAID: 'paid',
  DISPUTED: 'disputed'
});

export const BillingStatusLabels = Object.freeze({
  [BillingStatus.PENDING]: 'Pending',
  [BillingStatus.INVOICED]: 'Invoiced',
  [BillingStatus.PARTIAL]: 'Partial Payment',
  [BillingStatus.PAID]: 'Paid',
  [BillingStatus.DISPUTED]: 'Disputed'
});

export const BillingStatusColors = Object.freeze({
  [BillingStatus.PENDING]: 'gray',
  [BillingStatus.INVOICED]: 'blue',
  [BillingStatus.PARTIAL]: 'yellow',
  [BillingStatus.PAID]: 'green',
  [BillingStatus.DISPUTED]: 'red'
});
