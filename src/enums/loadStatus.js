/**
 * Load Status
 * Defines the lifecycle states of a load/shipment.
 *
 * The forward operational flow (what the UI stepper shows):
 *   new → booked → dispatched → picked_up → in_transit →
 *   delivered → review → invoiced → completed
 *
 * Side states (NOT in the linear stepper):
 *   delayed    — manual exception; only appears if explicitly set
 *   cancelled  — terminal exception
 *   draft      — pre-new authoring state
 *   paid       — legacy/billing terminal kept for back-compat; new flow
 *                uses `completed` as the terminal state
 *
 * Status changes are first-class AI triggers (logged to load_events with
 * actor/source), so the set is intentionally granular + scalable.
 */

export const LoadStatus = Object.freeze({
  DRAFT: 'draft',
  NEW: 'new',
  BOOKED: 'booked',
  DISPATCHED: 'dispatched',
  PICKED_UP: 'picked_up',
  IN_TRANSIT: 'in_transit',
  DELAYED: 'delayed',
  DELIVERED: 'delivered',
  REVIEW: 'review',
  INVOICED: 'invoiced',
  PAID: 'paid',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

export const LoadStatusLabels = Object.freeze({
  [LoadStatus.DRAFT]: 'Draft',
  [LoadStatus.NEW]: 'New',
  [LoadStatus.BOOKED]: 'Booked',
  [LoadStatus.DISPATCHED]: 'Dispatched',
  [LoadStatus.PICKED_UP]: 'Picked Up',
  [LoadStatus.IN_TRANSIT]: 'In Transit',
  [LoadStatus.DELAYED]: 'Delayed',
  [LoadStatus.DELIVERED]: 'Delivered',
  [LoadStatus.REVIEW]: 'Review',
  [LoadStatus.INVOICED]: 'Invoiced',
  [LoadStatus.PAID]: 'Paid',
  [LoadStatus.COMPLETED]: 'Completed',
  [LoadStatus.CANCELLED]: 'Cancelled'
});

export const LoadStatusColors = Object.freeze({
  [LoadStatus.DRAFT]: 'gray',
  [LoadStatus.NEW]: 'blue',
  [LoadStatus.BOOKED]: 'indigo',
  [LoadStatus.DISPATCHED]: 'purple',
  [LoadStatus.PICKED_UP]: 'violet',
  [LoadStatus.IN_TRANSIT]: 'orange',
  [LoadStatus.DELAYED]: 'amber',
  [LoadStatus.DELIVERED]: 'green',
  [LoadStatus.REVIEW]: 'cyan',
  [LoadStatus.INVOICED]: 'teal',
  [LoadStatus.PAID]: 'emerald',
  [LoadStatus.COMPLETED]: 'emerald',
  [LoadStatus.CANCELLED]: 'red'
});

/**
 * Valid status transitions. `delayed` can be entered from any active
 * leg and resumed back into the flow — it's a manual exception, never an
 * auto step. `completed` is the new terminal (gated by required docs in
 * the service layer).
 */
export const LoadStatusTransitions = Object.freeze({
  [LoadStatus.DRAFT]: [LoadStatus.NEW, LoadStatus.BOOKED, LoadStatus.CANCELLED],
  [LoadStatus.NEW]: [LoadStatus.BOOKED, LoadStatus.CANCELLED],
  [LoadStatus.BOOKED]: [LoadStatus.DISPATCHED, LoadStatus.CANCELLED],
  [LoadStatus.DISPATCHED]: [LoadStatus.PICKED_UP, LoadStatus.DELAYED, LoadStatus.CANCELLED],
  [LoadStatus.PICKED_UP]: [LoadStatus.IN_TRANSIT, LoadStatus.DELAYED, LoadStatus.CANCELLED],
  [LoadStatus.IN_TRANSIT]: [LoadStatus.DELIVERED, LoadStatus.DELAYED, LoadStatus.CANCELLED],
  [LoadStatus.DELAYED]: [
    LoadStatus.PICKED_UP, LoadStatus.IN_TRANSIT, LoadStatus.DELIVERED, LoadStatus.CANCELLED
  ],
  [LoadStatus.DELIVERED]: [LoadStatus.REVIEW, LoadStatus.INVOICED],
  [LoadStatus.REVIEW]: [LoadStatus.INVOICED, LoadStatus.DELIVERED],
  [LoadStatus.INVOICED]: [LoadStatus.PAID, LoadStatus.COMPLETED],
  [LoadStatus.PAID]: [LoadStatus.COMPLETED],
  [LoadStatus.COMPLETED]: [],
  [LoadStatus.CANCELLED]: []
});

/** Statuses that indicate the load is active/in-progress. */
export const ActiveLoadStatuses = Object.freeze([
  LoadStatus.BOOKED,
  LoadStatus.DISPATCHED,
  LoadStatus.PICKED_UP,
  LoadStatus.IN_TRANSIT,
  LoadStatus.DELAYED
]);

/** Statuses that indicate the load is completed/closing out. */
export const CompletedLoadStatuses = Object.freeze([
  LoadStatus.DELIVERED,
  LoadStatus.REVIEW,
  LoadStatus.INVOICED,
  LoadStatus.PAID,
  LoadStatus.COMPLETED
]);

/** Linear flow shown in the UI stepper (excludes side/exception states). */
export const LoadStatusFlow = Object.freeze([
  LoadStatus.NEW,
  LoadStatus.BOOKED,
  LoadStatus.DISPATCHED,
  LoadStatus.PICKED_UP,
  LoadStatus.IN_TRANSIT,
  LoadStatus.DELIVERED,
  LoadStatus.REVIEW,
  LoadStatus.INVOICED,
  LoadStatus.COMPLETED
]);

/**
 * Check if a status transition is valid.
 */
export const canTransitionLoadTo = (currentStatus, newStatus) => {
  const allowed = LoadStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};
