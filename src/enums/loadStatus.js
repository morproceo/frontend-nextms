/**
 * Load Status
 */

export const LoadStatus = Object.freeze({
  DRAFT: 'draft',
  NEW: 'new',
  BOOKED: 'booked',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  INVOICED: 'invoiced',
  PAID: 'paid',
  CANCELLED: 'cancelled'
});

export const LoadStatusLabels = Object.freeze({
  [LoadStatus.DRAFT]: 'Draft',
  [LoadStatus.NEW]: 'New',
  [LoadStatus.BOOKED]: 'Booked',
  [LoadStatus.DISPATCHED]: 'Dispatched',
  [LoadStatus.IN_TRANSIT]: 'In Transit',
  [LoadStatus.DELIVERED]: 'Delivered',
  [LoadStatus.INVOICED]: 'Invoiced',
  [LoadStatus.PAID]: 'Paid',
  [LoadStatus.CANCELLED]: 'Cancelled'
});

export const LoadStatusColors = Object.freeze({
  [LoadStatus.DRAFT]: 'gray',
  [LoadStatus.NEW]: 'blue',
  [LoadStatus.BOOKED]: 'indigo',
  [LoadStatus.DISPATCHED]: 'purple',
  [LoadStatus.IN_TRANSIT]: 'orange',
  [LoadStatus.DELIVERED]: 'green',
  [LoadStatus.INVOICED]: 'teal',
  [LoadStatus.PAID]: 'emerald',
  [LoadStatus.CANCELLED]: 'red'
});

export const LoadStatusTransitions = Object.freeze({
  [LoadStatus.DRAFT]: [LoadStatus.NEW, LoadStatus.BOOKED, LoadStatus.CANCELLED],
  [LoadStatus.NEW]: [LoadStatus.BOOKED, LoadStatus.CANCELLED],
  [LoadStatus.BOOKED]: [LoadStatus.DISPATCHED, LoadStatus.CANCELLED],
  [LoadStatus.DISPATCHED]: [LoadStatus.IN_TRANSIT, LoadStatus.CANCELLED],
  [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.CANCELLED],
  [LoadStatus.DELIVERED]: [LoadStatus.INVOICED],
  [LoadStatus.INVOICED]: [LoadStatus.PAID],
  [LoadStatus.PAID]: [],
  [LoadStatus.CANCELLED]: []
});

export const ActiveLoadStatuses = Object.freeze([
  LoadStatus.BOOKED,
  LoadStatus.DISPATCHED,
  LoadStatus.IN_TRANSIT
]);

export const CompletedLoadStatuses = Object.freeze([
  LoadStatus.DELIVERED,
  LoadStatus.INVOICED,
  LoadStatus.PAID
]);

export const canTransitionLoadTo = (currentStatus, newStatus) => {
  const allowed = LoadStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};
