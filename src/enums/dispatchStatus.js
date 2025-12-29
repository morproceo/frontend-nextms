/**
 * Dispatch Assignment Status
 */

export const DispatchStatus = Object.freeze({
  PENDING: 'pending',
  ACCEPTED: 'accepted',
  REJECTED: 'rejected',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
});

export const DispatchStatusLabels = Object.freeze({
  [DispatchStatus.PENDING]: 'Pending',
  [DispatchStatus.ACCEPTED]: 'Accepted',
  [DispatchStatus.REJECTED]: 'Rejected',
  [DispatchStatus.IN_PROGRESS]: 'In Progress',
  [DispatchStatus.COMPLETED]: 'Completed',
  [DispatchStatus.CANCELLED]: 'Cancelled'
});

export const DispatchStatusColors = Object.freeze({
  [DispatchStatus.PENDING]: 'yellow',
  [DispatchStatus.ACCEPTED]: 'green',
  [DispatchStatus.REJECTED]: 'red',
  [DispatchStatus.IN_PROGRESS]: 'blue',
  [DispatchStatus.COMPLETED]: 'emerald',
  [DispatchStatus.CANCELLED]: 'gray'
});

export const DispatchStatusTransitions = Object.freeze({
  [DispatchStatus.PENDING]: [DispatchStatus.ACCEPTED, DispatchStatus.REJECTED, DispatchStatus.CANCELLED],
  [DispatchStatus.ACCEPTED]: [DispatchStatus.IN_PROGRESS, DispatchStatus.CANCELLED],
  [DispatchStatus.REJECTED]: [],
  [DispatchStatus.IN_PROGRESS]: [DispatchStatus.COMPLETED, DispatchStatus.CANCELLED],
  [DispatchStatus.COMPLETED]: [],
  [DispatchStatus.CANCELLED]: []
});
