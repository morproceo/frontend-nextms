/**
 * Organization Roles
 */

export const Roles = Object.freeze({
  OWNER: 'owner',
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  DRIVER: 'driver',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer'
});

export const RoleHierarchy = Object.freeze({
  [Roles.OWNER]: 100,
  [Roles.ADMIN]: 80,
  [Roles.DISPATCHER]: 60,
  [Roles.ACCOUNTANT]: 50,
  [Roles.DRIVER]: 40,
  [Roles.VIEWER]: 20
});

export const RoleLabels = Object.freeze({
  [Roles.OWNER]: 'Owner',
  [Roles.ADMIN]: 'Administrator',
  [Roles.DISPATCHER]: 'Dispatcher',
  [Roles.DRIVER]: 'Driver',
  [Roles.ACCOUNTANT]: 'Accountant',
  [Roles.VIEWER]: 'Viewer'
});

export const RoleDescriptions = Object.freeze({
  [Roles.OWNER]: 'Full access to all features and billing',
  [Roles.ADMIN]: 'Full access except billing management',
  [Roles.DISPATCHER]: 'Manage loads, drivers, and dispatch',
  [Roles.DRIVER]: 'View assigned loads and upload documents',
  [Roles.ACCOUNTANT]: 'Access to invoicing and financial reports',
  [Roles.VIEWER]: 'Read-only access to operational data'
});
