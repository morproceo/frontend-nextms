/**
 * Driver Status
 */

export const DriverStatus = Object.freeze({
  AVAILABLE: 'available',
  DRIVING: 'driving',
  OFF_DUTY: 'off_duty',
  INACTIVE: 'inactive'
});

export const DriverStatusLabels = Object.freeze({
  [DriverStatus.AVAILABLE]: 'Available',
  [DriverStatus.DRIVING]: 'Driving',
  [DriverStatus.OFF_DUTY]: 'Off Duty',
  [DriverStatus.INACTIVE]: 'Inactive'
});

export const DriverStatusColors = Object.freeze({
  [DriverStatus.AVAILABLE]: 'green',
  [DriverStatus.DRIVING]: 'blue',
  [DriverStatus.OFF_DUTY]: 'gray',
  [DriverStatus.INACTIVE]: 'red'
});

export const AssignableDriverStatuses = Object.freeze([
  DriverStatus.AVAILABLE
]);

export const ActiveDriverStatuses = Object.freeze([
  DriverStatus.AVAILABLE,
  DriverStatus.DRIVING,
  DriverStatus.OFF_DUTY
]);
