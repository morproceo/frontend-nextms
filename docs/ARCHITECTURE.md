# Multi-Tenant TMS (Transportation Management System) - Implementation Plan

## Tech Stack
- **Frontend**: React 18 + Vite + Radix UI + Tailwind CSS
- **Backend**: Node.js + Express + Sequelize
- **Database**: MySQL (MAMP - database: `next`)
- **Auth**: Passwordless OTP (email-based magic links/codes)
- **Driver Model**: Support both claimed and unclaimed drivers

---

## 1. Project Structure

```
/next
├── /backend                    # Express API server
│   ├── /src
│   │   ├── /config            # Environment, database, constants
│   │   │   ├── database.js
│   │   │   ├── constants.js   # Enums, reserved slugs, etc.
│   │   │   └── index.js
│   │   ├── /enums             # Single source of truth for all enums
│   │   │   ├── index.js
│   │   │   ├── roles.enum.js
│   │   │   ├── membershipStatus.enum.js
│   │   │   ├── loadStatus.enum.js
│   │   │   ├── documentType.enum.js
│   │   │   └── permissions.enum.js
│   │   ├── /middleware        # Express middleware
│   │   │   ├── auth.middleware.js
│   │   │   ├── tenant.middleware.js
│   │   │   ├── membership.middleware.js
│   │   │   ├── rbac.middleware.js
│   │   │   └── errorHandler.middleware.js
│   │   ├── /models            # Sequelize models
│   │   │   ├── index.js       # Model loader + associations
│   │   │   ├── user.model.js
│   │   │   ├── organization.model.js
│   │   │   ├── membership.model.js
│   │   │   ├── driver.model.js
│   │   │   ├── load.model.js
│   │   │   ├── loadStop.model.js
│   │   │   ├── truck.model.js
│   │   │   ├── trailer.model.js
│   │   │   ├── document.model.js
│   │   │   ├── invoice.model.js
│   │   │   ├── dispatchAssignment.model.js
│   │   │   ├── notification.model.js
│   │   │   ├── orgSettings.model.js
│   │   │   ├── auditLog.model.js
│   │   │   └── otpCode.model.js
│   │   ├── /repositories      # Scoped data access (enforces org isolation)
│   │   │   ├── base.repository.js
│   │   │   ├── load.repository.js
│   │   │   ├── driver.repository.js
│   │   │   ├── truck.repository.js
│   │   │   └── ...
│   │   ├── /services          # Business logic layer
│   │   │   ├── auth.service.js
│   │   │   ├── organization.service.js
│   │   │   ├── membership.service.js
│   │   │   ├── load.service.js
│   │   │   ├── dispatch.service.js
│   │   │   ├── document.service.js
│   │   │   ├── invoice.service.js
│   │   │   └── email.service.js
│   │   ├── /controllers       # Route handlers
│   │   │   ├── auth.controller.js
│   │   │   ├── organization.controller.js
│   │   │   ├── load.controller.js
│   │   │   ├── driver.controller.js
│   │   │   ├── dispatch.controller.js
│   │   │   └── me.controller.js  # Driver self-service
│   │   ├── /routes            # Express routers
│   │   │   ├── index.js       # Route aggregator
│   │   │   ├── v1/
│   │   │   │   ├── auth.routes.js
│   │   │   │   ├── organizations.routes.js
│   │   │   │   ├── loads.routes.js
│   │   │   │   ├── drivers.routes.js
│   │   │   │   ├── dispatch.routes.js
│   │   │   │   └── me.routes.js
│   │   ├── /utils             # Shared utilities
│   │   │   ├── slug.utils.js
│   │   │   ├── otp.utils.js
│   │   │   ├── jwt.utils.js
│   │   │   └── response.utils.js
│   │   ├── /validators        # Request validation (Joi/Zod)
│   │   │   ├── auth.validator.js
│   │   │   ├── organization.validator.js
│   │   │   └── load.validator.js
│   │   └── app.js             # Express app setup
│   ├── /migrations            # Sequelize migrations
│   ├── /seeders               # Test data seeders
│   ├── .env.example
│   ├── .env
│   └── package.json
│
├── /frontend                   # React SPA
│   ├── /src
│   │   ├── /api               # API client layer
│   │   │   ├── client.js      # Axios instance with interceptors
│   │   │   ├── auth.api.js
│   │   │   ├── organizations.api.js
│   │   │   ├── loads.api.js
│   │   │   └── drivers.api.js
│   │   ├── /components        # Reusable UI components
│   │   │   ├── /ui            # Design system primitives
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── Card.jsx
│   │   │   │   ├── Input.jsx
│   │   │   │   ├── Modal.jsx
│   │   │   │   ├── Table.jsx
│   │   │   │   ├── Toast.jsx
│   │   │   │   ├── CommandPalette.jsx
│   │   │   │   └── ...
│   │   │   ├── /layout        # Layout components
│   │   │   │   ├── AppShell.jsx
│   │   │   │   ├── Sidebar.jsx
│   │   │   │   ├── Header.jsx
│   │   │   │   └── OrgSwitcher.jsx
│   │   │   └── /features      # Feature-specific components
│   │   │       ├── /loads
│   │   │       ├── /dispatch
│   │   │       ├── /drivers
│   │   │       └── /documents
│   │   ├── /contexts          # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   ├── OrgContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── /hooks             # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useOrg.js
│   │   │   ├── useLoads.js
│   │   │   └── usePermissions.js
│   │   ├── /pages             # Page components
│   │   │   ├── /auth
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── VerifyPage.jsx
│   │   │   │   └── SignupPage.jsx
│   │   │   ├── /onboarding
│   │   │   │   ├── CreateOrgPage.jsx
│   │   │   │   └── SetupChecklist.jsx
│   │   │   ├── /dashboard
│   │   │   │   └── DashboardPage.jsx
│   │   │   ├── /loads
│   │   │   │   ├── LoadsListPage.jsx
│   │   │   │   └── LoadDetailPage.jsx
│   │   │   ├── /dispatch
│   │   │   │   └── DispatchBoard.jsx
│   │   │   ├── /drivers
│   │   │   │   └── DriversPage.jsx
│   │   │   └── /settings
│   │   │       └── OrgSettingsPage.jsx
│   │   ├── /enums             # Mirrored from backend (single source of truth)
│   │   │   └── index.js
│   │   ├── /lib               # Utility functions
│   │   │   ├── orgResolver.js # Resolve org from URL
│   │   │   └── formatters.js
│   │   ├── /styles            # Global styles + design tokens
│   │   │   ├── globals.css
│   │   │   └── tokens.css
│   │   ├── App.jsx
│   │   ├── Router.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js     # Design system tokens
│   ├── .env.example
│   └── package.json
│
└── /shared                     # Shared code between front/back
    └── /enums                  # True single source of truth
        ├── index.js
        ├── roles.js
        ├── permissions.js
        ├── loadStatus.js
        └── membershipStatus.js
```

---

## 2. Core Tenancy Model

### Global vs Tenant Tables

**Global Tables (No organization_id):**
- `users` - Global identity
- `otp_codes` - Auth codes
- `refresh_tokens` - Session management

**Tenant Tables (MUST have organization_id):**
- `organizations`
- `organization_memberships`
- `drivers`
- `trucks`
- `trailers`
- `loads`
- `load_stops`
- `dispatch_assignments`
- `documents`
- `invoices`
- `notifications`
- `org_settings`
- `audit_logs`

### Request Flow (Tenant Resolution)
```
Request → Tenant Middleware → Membership Guard → RBAC → Controller → Scoped Repository → DB
              ↓                    ↓               ↓
         req.org            req.membership    permission check
```

---

## 3. Database Schema (MySQL)

### Global Tables

```sql
-- Users (Global Identity)
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20) UNIQUE,
  email_verified_at TIMESTAMP NULL,
  phone_verified_at TIMESTAMP NULL,
  last_login_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_email (email)
);

-- OTP Codes
CREATE TABLE otp_codes (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36),
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  type ENUM('signup', 'login', 'verify_email') NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_otp_email_code (email, code),
  INDEX idx_otp_expires (expires_at)
);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_refresh_user (user_id),
  INDEX idx_refresh_token (token_hash)
);
```

### Tenant Tables

```sql
-- Organizations (Tenant Root)
CREATE TABLE organizations (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(30) UNIQUE NOT NULL,
  timezone VARCHAR(50) DEFAULT 'America/New_York',
  dot_number VARCHAR(20),
  mc_number VARCHAR(20),
  address_line1 VARCHAR(255),
  address_line2 VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  country VARCHAR(50) DEFAULT 'USA',
  created_by_user_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  INDEX idx_org_slug (slug)
);

-- Organization Memberships (User ↔ Org)
CREATE TABLE organization_memberships (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  role ENUM('owner', 'admin', 'dispatcher', 'driver', 'accountant', 'viewer') NOT NULL,
  status ENUM('invited', 'active', 'suspended', 'left') DEFAULT 'invited',
  invited_by_user_id CHAR(36),
  invite_token VARCHAR(255),
  invite_expires_at TIMESTAMP,
  joined_at TIMESTAMP NULL,
  last_active_at TIMESTAMP NULL,
  preferences JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (invited_by_user_id) REFERENCES users(id),
  UNIQUE KEY unique_org_user (organization_id, user_id),
  INDEX idx_membership_org (organization_id),
  INDEX idx_membership_user (user_id),
  INDEX idx_membership_status (organization_id, status)
);

-- Drivers (Tenant - Supports claimed & unclaimed)
CREATE TABLE drivers (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NULL,  -- NULL = unclaimed driver record
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(20),
  license_number VARCHAR(50),
  license_state VARCHAR(10),
  license_expiry DATE,
  medical_card_expiry DATE,
  hire_date DATE,
  status ENUM('available', 'driving', 'off_duty', 'inactive') DEFAULT 'available',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_driver_org (organization_id),
  INDEX idx_driver_user (user_id),
  INDEX idx_driver_status (organization_id, status)
);

-- Trucks (Tenant)
CREATE TABLE trucks (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  vin VARCHAR(17),
  make VARCHAR(50),
  model VARCHAR(50),
  year INT,
  license_plate VARCHAR(20),
  license_state VARCHAR(10),
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_unit (organization_id, unit_number),
  INDEX idx_truck_org (organization_id),
  INDEX idx_truck_status (organization_id, status)
);

-- Trailers (Tenant)
CREATE TABLE trailers (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  unit_number VARCHAR(50) NOT NULL,
  type ENUM('dry_van', 'reefer', 'flatbed', 'step_deck', 'other') DEFAULT 'dry_van',
  length_ft INT,
  license_plate VARCHAR(20),
  license_state VARCHAR(10),
  status ENUM('active', 'maintenance', 'inactive') DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  UNIQUE KEY unique_org_trailer (organization_id, unit_number),
  INDEX idx_trailer_org (organization_id)
);

-- Loads (Tenant)
CREATE TABLE loads (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  reference_number VARCHAR(50) NOT NULL,
  status ENUM('draft', 'posted', 'booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid', 'cancelled') DEFAULT 'draft',

  -- Shipper Info
  shipper_name VARCHAR(255),
  shipper_address VARCHAR(255),
  shipper_city VARCHAR(100),
  shipper_state VARCHAR(50),
  shipper_zip VARCHAR(20),

  -- Consignee Info
  consignee_name VARCHAR(255),
  consignee_address VARCHAR(255),
  consignee_city VARCHAR(100),
  consignee_state VARCHAR(50),
  consignee_zip VARCHAR(20),

  -- Schedule
  pickup_date DATE,
  pickup_time_start TIME,
  pickup_time_end TIME,
  delivery_date DATE,
  delivery_time_start TIME,
  delivery_time_end TIME,

  -- Cargo
  commodity VARCHAR(255),
  weight_lbs INT,
  pieces INT,

  -- Financials
  revenue DECIMAL(10, 2),
  carrier_cost DECIMAL(10, 2),
  miles INT,
  rpm DECIMAL(5, 2) GENERATED ALWAYS AS (IF(miles > 0, revenue / miles, NULL)) STORED,
  margin DECIMAL(10, 2) GENERATED ALWAYS AS (revenue - COALESCE(carrier_cost, 0)) STORED,

  -- Broker Info (if applicable)
  broker_name VARCHAR(255),
  broker_mc VARCHAR(20),

  -- Meta
  notes TEXT,
  created_by_user_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  UNIQUE KEY unique_org_ref (organization_id, reference_number),
  INDEX idx_load_org (organization_id),
  INDEX idx_load_status (organization_id, status),
  INDEX idx_load_pickup (organization_id, pickup_date),
  INDEX idx_load_delivery (organization_id, delivery_date)
);

-- Load Stops (Tenant)
CREATE TABLE load_stops (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  load_id CHAR(36) NOT NULL,
  stop_number INT NOT NULL,
  type ENUM('pickup', 'delivery', 'stop') NOT NULL,
  facility_name VARCHAR(255),
  address VARCHAR(255),
  city VARCHAR(100),
  state VARCHAR(50),
  zip VARCHAR(20),
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  actual_arrival TIMESTAMP NULL,
  actual_departure TIMESTAMP NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE,
  INDEX idx_stop_org (organization_id),
  INDEX idx_stop_load (load_id)
);

-- Dispatch Assignments (Tenant)
CREATE TABLE dispatch_assignments (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  load_id CHAR(36) NOT NULL,
  driver_id CHAR(36) NOT NULL,
  truck_id CHAR(36),
  trailer_id CHAR(36),
  assigned_by_user_id CHAR(36),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  accepted_at TIMESTAMP NULL,
  rejected_at TIMESTAMP NULL,
  rejection_reason TEXT,
  started_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  status ENUM('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE,
  FOREIGN KEY (driver_id) REFERENCES drivers(id),
  FOREIGN KEY (truck_id) REFERENCES trucks(id),
  FOREIGN KEY (trailer_id) REFERENCES trailers(id),
  FOREIGN KEY (assigned_by_user_id) REFERENCES users(id),
  INDEX idx_dispatch_org (organization_id),
  INDEX idx_dispatch_load (load_id),
  INDEX idx_dispatch_driver (driver_id),
  INDEX idx_dispatch_status (organization_id, status)
);

-- Documents (Tenant)
CREATE TABLE documents (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  load_id CHAR(36),
  type ENUM('bol', 'pod', 'rate_con', 'invoice', 'lumper', 'scale_ticket', 'other') NOT NULL,
  file_name VARCHAR(255) NOT NULL,
  storage_path VARCHAR(500) NOT NULL,  -- org/{orgId}/loads/{loadId}/...
  mime_type VARCHAR(100),
  file_size INT,
  extracted_fields JSON,  -- OCR/AI extracted data
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by_user_id CHAR(36),
  approved_at TIMESTAMP NULL,
  uploaded_by_user_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_user_id) REFERENCES users(id),
  FOREIGN KEY (approved_by_user_id) REFERENCES users(id),
  INDEX idx_doc_org (organization_id),
  INDEX idx_doc_load (load_id),
  INDEX idx_doc_type (organization_id, type)
);

-- Invoices (Tenant)
CREATE TABLE invoices (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  load_id CHAR(36),
  invoice_number VARCHAR(50) NOT NULL,
  status ENUM('draft', 'sent', 'viewed', 'paid', 'overdue', 'void') DEFAULT 'draft',
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE,
  sent_at TIMESTAMP NULL,
  paid_at TIMESTAMP NULL,
  paid_amount DECIMAL(10, 2),
  notes TEXT,
  created_by_user_id CHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (load_id) REFERENCES loads(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by_user_id) REFERENCES users(id),
  UNIQUE KEY unique_org_invoice (organization_id, invoice_number),
  INDEX idx_invoice_org (organization_id),
  INDEX idx_invoice_status (organization_id, status),
  INDEX idx_invoice_due (organization_id, due_date)
);

-- Notifications (Tenant)
CREATE TABLE notifications (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36) NOT NULL,
  type ENUM('load_assigned', 'load_updated', 'document_uploaded', 'invoice_sent', 'system') NOT NULL,
  title VARCHAR(255) NOT NULL,
  body TEXT,
  data JSON,
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_notif_org_user (organization_id, user_id),
  INDEX idx_notif_unread (organization_id, user_id, read_at)
);

-- Org Settings (Tenant)
CREATE TABLE org_settings (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL UNIQUE,
  invoice_prefix VARCHAR(10) DEFAULT 'INV-',
  invoice_next_number INT DEFAULT 1001,
  default_payment_terms INT DEFAULT 30,
  settings JSON,  -- Flexible settings storage
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
);

-- Audit Logs (Tenant)
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY,
  organization_id CHAR(36) NOT NULL,
  user_id CHAR(36),
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id CHAR(36),
  old_values JSON,
  new_values JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_audit_org (organization_id),
  INDEX idx_audit_entity (organization_id, entity_type, entity_id),
  INDEX idx_audit_created (organization_id, created_at)
);
```

---

## 4. Enums (Single Source of Truth)

Located in `/shared/enums/`:

```javascript
// /shared/enums/roles.js
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

// /shared/enums/permissions.js
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

  // Trucks/Trailers
  ASSETS_CREATE: 'assets:create',
  ASSETS_READ: 'assets:read',
  ASSETS_UPDATE: 'assets:update',
  ASSETS_DELETE: 'assets:delete'
});

// Role → Permissions mapping
export const RolePermissions = Object.freeze({
  [Roles.OWNER]: Object.values(Permissions),
  [Roles.ADMIN]: Object.values(Permissions).filter(p => p !== Permissions.ORG_BILLING),
  [Roles.DISPATCHER]: [
    Permissions.LOADS_CREATE, Permissions.LOADS_READ, Permissions.LOADS_UPDATE,
    Permissions.DISPATCH_ASSIGN, Permissions.DISPATCH_READ,
    Permissions.DRIVERS_READ, Permissions.DRIVERS_UPDATE,
    Permissions.DOCUMENTS_UPLOAD, Permissions.DOCUMENTS_READ,
    Permissions.ASSETS_READ, Permissions.ASSETS_UPDATE
  ],
  [Roles.ACCOUNTANT]: [
    Permissions.LOADS_READ,
    Permissions.DOCUMENTS_READ, Permissions.DOCUMENTS_APPROVE,
    Permissions.INVOICES_CREATE, Permissions.INVOICES_READ,
    Permissions.INVOICES_SEND, Permissions.INVOICES_EXPORT
  ],
  [Roles.DRIVER]: [
    Permissions.LOADS_READ,  // Only assigned loads (enforced in service)
    Permissions.DOCUMENTS_UPLOAD, Permissions.DOCUMENTS_READ
  ],
  [Roles.VIEWER]: [
    Permissions.LOADS_READ, Permissions.DISPATCH_READ,
    Permissions.DRIVERS_READ, Permissions.DOCUMENTS_READ,
    Permissions.ASSETS_READ
  ]
});

// /shared/enums/loadStatus.js
export const LoadStatus = Object.freeze({
  DRAFT: 'draft',
  POSTED: 'posted',
  BOOKED: 'booked',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  INVOICED: 'invoiced',
  PAID: 'paid',
  CANCELLED: 'cancelled'
});

// /shared/enums/membershipStatus.js
export const MembershipStatus = Object.freeze({
  INVITED: 'invited',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  LEFT: 'left'
});

// /shared/enums/documentType.js
export const DocumentType = Object.freeze({
  BOL: 'bol',
  POD: 'pod',
  RATE_CON: 'rate_con',
  INVOICE: 'invoice',
  LUMPER: 'lumper',
  SCALE_TICKET: 'scale_ticket',
  OTHER: 'other'
});

// /shared/enums/driverStatus.js
export const DriverStatus = Object.freeze({
  AVAILABLE: 'available',
  DRIVING: 'driving',
  OFF_DUTY: 'off_duty',
  INACTIVE: 'inactive'
});
```

---

## 5. Middleware Stack (Tenant Isolation)

### Tenant Resolution Middleware

```javascript
// /backend/src/middleware/tenant.middleware.js
const RESERVED_SLUGS = ['admin', 'api', 'www', 'support', 'help', 'app', 'dashboard'];

export const resolveTenant = async (req, res, next) => {
  try {
    let slug = null;

    // 1. Try subdomain: {slug}.app.com
    const host = req.get('host');
    const baseDomain = process.env.BASE_DOMAIN; // app.com

    if (host && host !== baseDomain && host.endsWith(`.${baseDomain}`)) {
      slug = host.replace(`.${baseDomain}`, '');
    }

    // 2. Fallback to path: /o/{slug}/...
    if (!slug && req.path.startsWith('/o/')) {
      const match = req.path.match(/^\/o\/([a-z0-9-]+)/);
      if (match) slug = match[1];
    }

    // 3. Fallback to header (for API clients)
    if (!slug && req.get('X-Organization-Slug')) {
      slug = req.get('X-Organization-Slug');
    }

    if (!slug) {
      req.org = null; // No org context (allowed for some routes)
      return next();
    }

    // Validate slug format
    if (!/^[a-z0-9-]{3,30}$/.test(slug) || RESERVED_SLUGS.includes(slug)) {
      return res.status(400).json({ error: 'Invalid organization' });
    }

    // Lookup org
    const org = await Organization.findOne({
      where: { slug, deleted_at: null },
      attributes: ['id', 'slug', 'name', 'timezone']
    });

    if (!org) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    req.org = org;
    next();
  } catch (error) {
    next(error);
  }
};
```

### Membership Guard Middleware

```javascript
// /backend/src/middleware/membership.middleware.js
export const requireMembership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!req.org) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const membership = await OrganizationMembership.findOne({
      where: {
        organization_id: req.org.id,
        user_id: req.user.id,
        status: MembershipStatus.ACTIVE
      }
    });

    if (!membership) {
      return res.status(403).json({ error: 'Not a member of this organization' });
    }

    req.membership = membership;
    next();
  } catch (error) {
    next(error);
  }
};
```

### RBAC Middleware

```javascript
// /backend/src/middleware/rbac.middleware.js
import { RolePermissions } from '@shared/enums';

export const requirePermission = (...requiredPermissions) => {
  return (req, res, next) => {
    if (!req.membership) {
      return res.status(403).json({ error: 'Membership required' });
    }

    const userPermissions = RolePermissions[req.membership.role] || [];
    const hasPermission = requiredPermissions.every(p => userPermissions.includes(p));

    if (!hasPermission) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};
```

### Scoped Repository Pattern

```javascript
// /backend/src/repositories/base.repository.js
export class ScopedRepository {
  constructor(model, orgId) {
    if (!orgId) throw new Error('Organization ID is required');
    this.model = model;
    this.orgId = orgId;
  }

  async findAll(options = {}) {
    return this.model.findAll({
      ...options,
      where: {
        ...options.where,
        organization_id: this.orgId,
        deleted_at: null
      }
    });
  }

  async findById(id) {
    return this.model.findOne({
      where: { id, organization_id: this.orgId, deleted_at: null }
    });
  }

  async create(data) {
    return this.model.create({
      ...data,
      organization_id: this.orgId
    });
  }

  async update(id, data) {
    const [count] = await this.model.update(data, {
      where: { id, organization_id: this.orgId }
    });
    return count > 0;
  }

  async softDelete(id) {
    return this.update(id, { deleted_at: new Date() });
  }
}

// Usage in controller:
const loadRepo = new ScopedRepository(Load, req.org.id);
const loads = await loadRepo.findAll({ where: { status: 'dispatched' } });
```

---

## 6. API Endpoints (REST v1)

### Auth Endpoints
```
POST /v1/auth/signup          - Create account, send OTP
POST /v1/auth/verify          - Verify OTP, get tokens
POST /v1/auth/login           - Request login OTP
POST /v1/auth/refresh         - Refresh access token
POST /v1/auth/logout          - Revoke refresh token
```

### Organization Endpoints
```
POST   /v1/organizations                     - Create organization
GET    /v1/organizations                     - List user's organizations
GET    /v1/organizations/resolve?slug=       - Resolve org by slug
GET    /v1/organizations/:orgId              - Get org details (requires membership)
PATCH  /v1/organizations/:orgId              - Update org (requires org:settings)
POST   /v1/organizations/:orgId/invitations  - Invite member (requires org:invite)
POST   /v1/invitations/:token/accept         - Accept invitation
GET    /v1/organizations/:orgId/members      - List members
PATCH  /v1/organizations/:orgId/members/:id  - Update member role/status
DELETE /v1/organizations/:orgId/members/:id  - Remove member
```

### Load Endpoints (Require org context)
```
GET    /v1/loads                 - List loads (filterable)
POST   /v1/loads                 - Create load
GET    /v1/loads/:id             - Get load details
PATCH  /v1/loads/:id             - Update load
DELETE /v1/loads/:id             - Soft delete load
POST   /v1/loads/:id/stops       - Add stop to load
PATCH  /v1/loads/:id/stops/:sid  - Update stop
DELETE /v1/loads/:id/stops/:sid  - Remove stop
POST   /v1/loads/:id/assign      - Assign to driver
POST   /v1/loads/:id/documents   - Upload document
```

### Driver Endpoints (Require org context)
```
GET    /v1/drivers               - List drivers
POST   /v1/drivers               - Create driver record
GET    /v1/drivers/:id           - Get driver details
PATCH  /v1/drivers/:id           - Update driver
DELETE /v1/drivers/:id           - Soft delete driver
POST   /v1/drivers/:id/invite    - Invite driver to claim account
```

### Driver Self-Service (Me Endpoints)
```
GET    /v1/me/assigned-loads     - Driver's assigned loads
GET    /v1/me/current-load       - Current active load
POST   /v1/me/status             - Update driver status
POST   /v1/me/location           - Update location
POST   /v1/me/documents          - Upload document for current load
GET    /v1/me/notifications      - Driver notifications
```

### Asset Endpoints
```
GET/POST/PATCH/DELETE /v1/trucks
GET/POST/PATCH/DELETE /v1/trailers
```

### Document Endpoints
```
GET    /v1/documents             - List documents
POST   /v1/documents/presign     - Get presigned upload URL
PATCH  /v1/documents/:id         - Update document
POST   /v1/documents/:id/approve - Approve document
```

### Invoice Endpoints
```
GET    /v1/invoices              - List invoices
POST   /v1/invoices              - Create invoice
GET    /v1/invoices/:id          - Get invoice
PATCH  /v1/invoices/:id          - Update invoice
POST   /v1/invoices/:id/send     - Send invoice
```

---

## 7. Vanity URL Implementation

### URL Patterns
- **Subdomain**: `https://{slug}.tms.app/dashboard`
- **Path fallback**: `https://tms.app/o/{slug}/dashboard`

### Frontend Routing
```javascript
// Router.jsx - Detect org from URL
const getOrgSlug = () => {
  // Check subdomain
  const host = window.location.host;
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN;

  if (host !== baseDomain && host.endsWith(`.${baseDomain}`)) {
    return host.replace(`.${baseDomain}`, '');
  }

  // Check path
  const match = window.location.pathname.match(/^\/o\/([a-z0-9-]+)/);
  return match ? match[1] : null;
};
```

### Security Controls
1. Validate host header against allowlist
2. Reject malformed slugs
3. Prevent `slug.tms.app.evil.com` attacks
4. Reserved slug blocklist

---

## 8. Apple + Tesla Design System

### Design Tokens (Tailwind Config)

```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // Neutral palette (Tesla-inspired)
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#F5F5F7',
          tertiary: '#E8E8ED',
          inverse: '#1D1D1F'
        },
        text: {
          primary: '#1D1D1F',
          secondary: '#6E6E73',
          tertiary: '#86868B',
          inverse: '#FFFFFF'
        },
        accent: {
          DEFAULT: '#0071E3',  // Apple blue
          hover: '#0077ED',
          muted: '#E8F4FD'
        },
        success: '#34C759',
        warning: '#FF9500',
        error: '#FF3B30'
      },
      fontFamily: {
        sans: ['-apple-system', 'SF Pro Display', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'display': ['48px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'headline': ['32px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'title': ['24px', { lineHeight: '1.3' }],
        'body': ['17px', { lineHeight: '1.5' }],
        'caption': ['14px', { lineHeight: '1.4' }],
        'small': ['12px', { lineHeight: '1.3' }]
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem'
      },
      borderRadius: {
        'card': '16px',
        'button': '12px',
        'input': '10px',
        'chip': '8px'
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.08)',
        'elevated': '0 8px 32px rgba(0,0,0,0.12)',
        'modal': '0 24px 80px rgba(0,0,0,0.2)'
      },
      backdropBlur: {
        'glass': '20px'
      }
    }
  }
};
```

### Component Library Structure
```
/components/ui/
  Button.jsx       - Primary, secondary, ghost, danger variants
  Card.jsx         - Clean container with subtle shadow
  Input.jsx        - Floating label, validation states
  Select.jsx       - Radix-based custom select
  Modal.jsx        - Centered, backdrop blur
  Table.jsx        - Dense data display, sortable
  Badge.jsx        - Status indicators
  Toast.jsx        - Bottom-right notifications
  CommandPalette.jsx - ⌘K quick actions (Tesla-style)
  Tabs.jsx         - Clean horizontal navigation
  Dropdown.jsx     - Action menus
  Avatar.jsx       - User/driver photos
  Skeleton.jsx     - Loading states
```

### Key Screen Layouts

1. **Auth Pages**: Full-screen, centered card, minimal
2. **Org Switcher**: Top-left dropdown, shows role badge
3. **Dashboard**: 4-column KPI grid, activity feed, quick actions
4. **Dispatch Board**: Kanban columns OR list view toggle
5. **Load Detail**: Timeline left, docs/invoice right, actions top
6. **Driver Mobile**: Large touch targets, swipe actions, offline indicator

---

## 9. Implementation Phases

### Phase 1: Foundation
- [ ] Initialize backend (Express + Sequelize + MySQL)
- [ ] Initialize frontend (Vite + React + Tailwind + Radix)
- [ ] Set up shared enums package
- [ ] Create database migrations
- [ ] Implement User + OTP auth flow
- [ ] Implement Organization CRUD
- [ ] Implement Membership + invitations
- [ ] Build tenant middleware stack
- [ ] Build auth context + org context (frontend)
- [ ] Build login/signup/verify pages
- [ ] Build create organization flow
- [ ] Build org switcher component

### Phase 2: Core Operations
- [ ] Implement Loads CRUD
- [ ] Implement Load Stops
- [ ] Implement Drivers CRUD (claimed/unclaimed)
- [ ] Implement Trucks + Trailers CRUD
- [ ] Build loads list page with filters
- [ ] Build load detail page
- [ ] Build drivers page
- [ ] Build assets (trucks/trailers) page

### Phase 3: Dispatch
- [ ] Implement Dispatch Assignments
- [ ] Build dispatch board (kanban/list)
- [ ] Implement driver assignment flow
- [ ] Build driver mobile view
- [ ] Implement /me endpoints for drivers
- [ ] Add real-time status updates

### Phase 4: Documents & Invoicing
- [ ] Set up file storage (local/S3)
- [ ] Implement document upload/management
- [ ] Build document viewer component
- [ ] Implement invoice generation
- [ ] Build invoice page

### Phase 5: Polish & Launch
- [ ] Implement notifications
- [ ] Add audit logging
- [ ] Build settings page
- [ ] Implement dashboard KPIs
- [ ] Add command palette
- [ ] Performance optimization
- [ ] Security audit

---

## 10. Acceptance Criteria

### Multi-Tenancy
- [ ] Cannot access another org's data even with guessed IDs
- [ ] Org switching is instant and reliable
- [ ] Vanity URL works for every org
- [ ] All queries include organization_id scope

### Auth & Access
- [ ] OTP login flow works end-to-end
- [ ] Users can belong to multiple orgs
- [ ] RBAC enforced on all endpoints
- [ ] Drivers see only assigned loads

### UX
- [ ] 2-click max for common actions
- [ ] Mobile-friendly driver views
- [ ] Responsive across devices
- [ ] Fast load times (<200ms API responses)

---

## Files to Create (Phase 1)

### Backend
1. `backend/package.json`
2. `backend/src/app.js`
3. `backend/src/config/database.js`
4. `backend/src/config/constants.js`
5. `backend/src/enums/index.js`
6. `backend/src/models/index.js`
7. `backend/src/models/user.model.js`
8. `backend/src/models/organization.model.js`
9. `backend/src/models/membership.model.js`
10. `backend/src/models/otpCode.model.js`
11. `backend/src/models/refreshToken.model.js`
12. `backend/src/middleware/auth.middleware.js`
13. `backend/src/middleware/tenant.middleware.js`
14. `backend/src/middleware/membership.middleware.js`
15. `backend/src/middleware/rbac.middleware.js`
16. `backend/src/services/auth.service.js`
17. `backend/src/services/organization.service.js`
18. `backend/src/controllers/auth.controller.js`
19. `backend/src/controllers/organization.controller.js`
20. `backend/src/routes/v1/auth.routes.js`
21. `backend/src/routes/v1/organizations.routes.js`
22. `backend/src/routes/index.js`

### Frontend
1. `frontend/package.json`
2. `frontend/vite.config.js`
3. `frontend/tailwind.config.js`
4. `frontend/src/main.jsx`
5. `frontend/src/App.jsx`
6. `frontend/src/Router.jsx`
7. `frontend/src/api/client.js`
8. `frontend/src/contexts/AuthContext.jsx`
9. `frontend/src/contexts/OrgContext.jsx`
10. `frontend/src/pages/auth/LoginPage.jsx`
11. `frontend/src/pages/auth/VerifyPage.jsx`
12. `frontend/src/pages/onboarding/CreateOrgPage.jsx`
13. `frontend/src/components/ui/Button.jsx`
14. `frontend/src/components/ui/Input.jsx`
15. `frontend/src/components/ui/Card.jsx`
16. `frontend/src/components/layout/OrgSwitcher.jsx`

### Shared
1. `shared/enums/index.js`
2. `shared/enums/roles.js`
3. `shared/enums/permissions.js`
4. `shared/enums/membershipStatus.js`
