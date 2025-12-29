/**
 * Permissions
 * Granular permission definitions and role mappings
 */

import { Roles } from './roles.js';

export const Permissions = Object.freeze({
  // Loads
  LOADS_CREATE: 'loads:create',
  LOADS_READ: 'loads:read',
  LOADS_UPDATE: 'loads:update',
  LOADS_DELETE: 'loads:delete',

  // Dispatch
  DISPATCH_ASSIGN: 'dispatch:assign',
  DISPATCH_READ: 'dispatch:read',

  // Drivers
  DRIVERS_CREATE: 'drivers:create',
  DRIVERS_READ: 'drivers:read',
  DRIVERS_UPDATE: 'drivers:update',
  DRIVERS_DELETE: 'drivers:delete',
  DRIVERS_INVITE: 'drivers:invite',

  // Documents
  DOCUMENTS_UPLOAD: 'documents:upload',
  DOCUMENTS_READ: 'documents:read',
  DOCUMENTS_APPROVE: 'documents:approve',
  DOCUMENTS_DELETE: 'documents:delete',

  // Invoices
  INVOICES_CREATE: 'invoices:create',
  INVOICES_READ: 'invoices:read',
  INVOICES_SEND: 'invoices:send',
  INVOICES_EXPORT: 'invoices:export',

  // Organization
  ORG_INVITE: 'org:invite',
  ORG_MANAGE_MEMBERS: 'org:manage_members',
  ORG_SETTINGS: 'org:settings',
  ORG_BILLING: 'org:billing',

  // Trucks/Trailers (Assets)
  ASSETS_CREATE: 'assets:create',
  ASSETS_READ: 'assets:read',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_DELETE: 'assets:delete',

  // Expenses
  EXPENSES_CREATE: 'expenses:create',
  EXPENSES_READ: 'expenses:read',
  EXPENSES_UPDATE: 'expenses:update',
  EXPENSES_DELETE: 'expenses:delete',
  EXPENSES_APPROVE: 'expenses:approve',
  EXPENSES_EXPORT: 'expenses:export',
  EXPENSES_CATEGORIES_MANAGE: 'expenses:categories:manage'
});

/**
 * Role to Permissions mapping
 */
export const RolePermissions = Object.freeze({
  [Roles.OWNER]: Object.values(Permissions),

  [Roles.ADMIN]: Object.values(Permissions).filter(
    p => p !== Permissions.ORG_BILLING
  ),

  [Roles.DISPATCHER]: [
    Permissions.LOADS_CREATE,
    Permissions.LOADS_READ,
    Permissions.LOADS_UPDATE,
    Permissions.DISPATCH_ASSIGN,
    Permissions.DISPATCH_READ,
    Permissions.DRIVERS_READ,
    Permissions.DRIVERS_UPDATE,
    Permissions.DOCUMENTS_UPLOAD,
    Permissions.DOCUMENTS_READ,
    Permissions.ASSETS_READ,
    Permissions.ASSETS_UPDATE,
    Permissions.EXPENSES_CREATE,
    Permissions.EXPENSES_READ
  ],

  [Roles.ACCOUNTANT]: [
    Permissions.LOADS_READ,
    Permissions.DOCUMENTS_READ,
    Permissions.DOCUMENTS_APPROVE,
    Permissions.INVOICES_CREATE,
    Permissions.INVOICES_READ,
    Permissions.INVOICES_SEND,
    Permissions.INVOICES_EXPORT,
    Permissions.EXPENSES_CREATE,
    Permissions.EXPENSES_READ,
    Permissions.EXPENSES_UPDATE,
    Permissions.EXPENSES_APPROVE,
    Permissions.EXPENSES_EXPORT
  ],

  [Roles.DRIVER]: [
    Permissions.LOADS_READ,
    Permissions.DOCUMENTS_UPLOAD,
    Permissions.DOCUMENTS_READ,
    Permissions.EXPENSES_CREATE,
    Permissions.EXPENSES_READ
  ],

  [Roles.VIEWER]: [
    Permissions.LOADS_READ,
    Permissions.DISPATCH_READ,
    Permissions.DRIVERS_READ,
    Permissions.DOCUMENTS_READ,
    Permissions.ASSETS_READ,
    Permissions.EXPENSES_READ
  ]
});

export const hasPermission = (role, permission) => {
  const permissions = RolePermissions[role] || [];
  return permissions.includes(permission);
};

export const hasAllPermissions = (role, requiredPermissions) => {
  return requiredPermissions.every(p => hasPermission(role, p));
};

export const hasAnyPermission = (role, requiredPermissions) => {
  return requiredPermissions.some(p => hasPermission(role, p));
};
