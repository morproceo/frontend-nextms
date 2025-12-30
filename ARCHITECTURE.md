# Next TMS - Architecture & Data Model Documentation

**Last Updated:** December 30, 2025
**Version:** 1.2.0

---

## Table of Contents

1. [Overview](#overview)
2. [Tech Stack](#tech-stack)
3. [Architecture](#architecture)
4. [Multi-Tenancy](#multi-tenancy)
5. [Authentication & Authorization](#authentication--authorization)
6. [Data Models](#data-models)
7. [API Structure](#api-structure)
8. [Frontend Structure](#frontend-structure)
9. [Key Features](#key-features)
10. [Enums & Status Values](#enums--status-values)

---

## Overview

Next TMS is a modern Transportation Management System (TMS) designed for trucking companies. It provides:

- **Load Management** - Create, track, and manage freight loads
- **Driver Management** - Driver profiles with invite/claim system
- **Fleet Management** - Trucks and trailers tracking
- **Dispatch** - Assign drivers to loads
- **Customer Management** - Brokers and facilities
- **Expense Tracking** - Categorized expenses with approval workflow
- **Driver Portal** - Dedicated mobile-friendly portal for drivers
- **AI Features** - AI teammates (ALEX, NOVA, SAGE) for automation
- **AVA AI Mechanic** - Truck diagnostics via Motive ELD integration

---

## Tech Stack

### Backend
| Technology | Purpose |
|------------|---------|
| Node.js | Runtime (v24.x) |
| Express.js | Web framework |
| Sequelize | ORM |
| MySQL | Database |
| JWT | Authentication tokens |
| Bcrypt | Password hashing |
| AWS S3 | File storage |
| Stripe | Billing & subscriptions |
| SendGrid/Resend | Email delivery |

### Frontend
| Technology | Purpose |
|------------|---------|
| React 18 | UI framework |
| Vite | Build tool |
| React Router v6 | Routing |
| Tailwind CSS | Styling |
| Framer Motion | Animations |
| Lucide React | Icons |
| Axios | HTTP client |

### Deployment
| Service | Component |
|---------|-----------|
| Heroku | Backend API |
| Vercel | Frontend SPA |
| PlanetScale/AWS RDS | MySQL database |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (Vercel)                        │
│  React SPA - Vite - Tailwind CSS                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │   Admin UI   │ │ Driver Portal│ │  Marketing   │             │
│  │  /o/:slug/*  │ │   /driver/*  │ │    /ai, /    │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTPS (REST API)
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND (Heroku)                         │
│  Express.js - Node.js                                           │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │   Routes     │ │ Controllers  │ │   Services   │             │
│  │   /api/v1/*  │ │              │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐             │
│  │  Middleware  │ │    Models    │ │    Enums     │             │
│  │  Auth/RBAC   │ │  Sequelize   │ │              │             │
│  └──────────────┘ └──────────────┘ └──────────────┘             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Sequelize ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATABASE (MySQL)                           │
│  Organizations, Users, Drivers, Loads, etc.                      │
└─────────────────────────────────────────────────────────────────┘
```

### Backend Structure

```
backend/src/
├── config/           # Database, environment config
├── controllers/      # Route handlers
├── enums/            # Status values, roles, permissions
├── middleware/       # Auth, RBAC, error handling
├── models/           # Sequelize models
├── routes/           # API route definitions
│   └── v1/           # Versioned routes
├── services/         # Business logic
├── utils/            # Helpers, response utils
└── index.js          # App entry point
```

### Frontend Structure

```
frontend/src/
├── api/              # API client & endpoint modules
├── components/       # Reusable UI components
│   ├── features/     # Domain-specific components
│   ├── layout/       # AppShell, DriverShell
│   ├── marketing/    # Landing page components
│   └── ui/           # Generic UI (Button, Card, etc.)
├── config/           # Status configs, constants
├── contexts/         # React contexts (Auth, Org)
├── enums/            # Mirrored backend enums
├── hooks/            # Custom hooks
│   ├── api/          # API hooks (useApiRequest, etc.)
│   ├── domain/       # Domain hooks (useLoads, useDrivers)
│   └── pages/        # Page-specific hooks
├── pages/            # Route components
│   ├── auth/         # Login, Verify
│   ├── dashboard/    # Dashboard
│   ├── drivers/      # Driver CRUD
│   ├── driver/       # Driver portal pages
│   ├── loads/        # Load CRUD
│   ├── marketing/    # Home, AI page
│   └── ...
└── Router.jsx        # Route definitions
```

---

## Multi-Tenancy

The system uses **organization-based multi-tenancy**:

```
User (1) ──── has many ────> Membership (N) ──── belongs to ────> Organization (1)
```

### Key Concepts

1. **Organization** - A trucking company (tenant)
2. **Membership** - Links a user to an organization with a role
3. **Org-scoped data** - Most data belongs to an organization

### URL Structure

```
/o/:orgSlug/dashboard     # Admin dashboard
/o/:orgSlug/loads         # Loads list
/o/:orgSlug/drivers       # Drivers list
/driver                   # Driver portal (no org in URL)
```

### Data Isolation

All org-scoped queries filter by `organization_id`:

```javascript
// Every service method receives orgId
const loads = await Load.findAll({
  where: { organization_id: orgId }
});
```

---

## Authentication & Authorization

### Authentication Flow

```
1. User enters email
2. Backend sends OTP via email
3. User enters OTP
4. Backend returns JWT tokens (access + refresh)
5. Frontend stores tokens and uses for API calls
```

### Token Structure

| Token | Lifetime | Purpose |
|-------|----------|---------|
| Access Token | 15 min | API authentication |
| Refresh Token | 7 days | Get new access token |

### Roles & Permissions

```javascript
Roles = {
  OWNER: 'owner',       // Full access, can delete org
  ADMIN: 'admin',       // Full access except delete org
  DISPATCHER: 'dispatcher', // Manage loads, drivers
  ACCOUNTANT: 'accountant', // View loads, manage invoices
  VIEWER: 'viewer',     // Read-only access
  DRIVER: 'driver'      // Driver portal only
}
```

### RBAC Middleware

```javascript
// Route protection example
router.post('/loads',
  requireAuth,          // Must be logged in
  requireMembership,    // Must belong to org
  requirePermission('loads:create'),  // Must have permission
  loadsController.create
);
```

---

## Data Models

### Entity Relationship Diagram

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│    User     │────────<│  Membership  │>────────│ Organization │
└─────────────┘         └──────────────┘         └──────────────┘
      │                                                 │
      │                                    ┌────────────┼────────────┐
      │                                    │            │            │
      ▼                                    ▼            ▼            ▼
┌─────────────┐                      ┌─────────┐ ┌─────────┐ ┌─────────┐
│   Driver    │                      │  Load   │ │  Truck  │ │ Trailer │
└─────────────┘                      └─────────┘ └─────────┘ └─────────┘
      │                                   │
      │                                   │
      └───────────────────────────────────┤
                                          │
                    ┌─────────────────────┼─────────────────────┐
                    │                     │                     │
                    ▼                     ▼                     ▼
              ┌──────────┐         ┌──────────┐         ┌──────────┐
              │ LoadStop │         │  Broker  │         │ Facility │
              └──────────┘         └──────────┘         └──────────┘
```

### Core Models

#### User
```javascript
{
  id: UUID,
  email: STRING (unique),
  password_hash: STRING,
  first_name: STRING,
  last_name: STRING,
  avatar_url: STRING,
  email_verified_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Organization
```javascript
{
  id: UUID,
  slug: STRING (unique),      // URL-friendly identifier
  name: STRING,
  timezone: STRING,           // e.g., 'America/Chicago'
  dot_number: STRING,
  mc_number: STRING,
  address: STRING,
  city: STRING,
  state: STRING,
  zip: STRING,
  phone: STRING,
  email: STRING,
  stripe_customer_id: STRING,
  stripe_subscription_id: STRING,
  subscription_status: STRING,
  created_by_user_id: UUID,
  deleted_at: DATE,           // Soft delete
  created_at: DATE,
  updated_at: DATE
}
```

#### Membership
```javascript
{
  id: UUID,
  organization_id: UUID,
  user_id: UUID,
  role: ENUM,                 // owner, admin, dispatcher, etc.
  status: ENUM,               // active, invited, left
  invited_by_user_id: UUID,
  invite_token: STRING,       // For email invites
  invite_code: STRING,        // 6-digit code
  invite_expires_at: DATE,
  joined_at: DATE,
  left_at: DATE,
  left_reason: STRING,
  last_active_at: DATE,
  preferences: JSON,
  created_at: DATE,
  updated_at: DATE
}
```

#### Driver
```javascript
{
  id: UUID,
  organization_id: UUID,
  user_id: UUID,              // Null until claimed
  first_name: STRING,
  last_name: STRING,
  email: STRING,
  phone: STRING,
  license_number: STRING,
  license_state: STRING,
  license_expiry: DATE,
  medical_card_expiry: DATE,
  hire_date: DATE,
  status: ENUM,               // available, driving, off_duty, inactive
  notes: TEXT,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Load
```javascript
{
  id: UUID,
  organization_id: UUID,
  load_number: STRING,        // Auto-generated: LD-0001
  reference_number: STRING,   // Customer reference
  status: ENUM,               // new, booked, dispatched, in_transit, delivered, invoiced, paid
  billing_status: ENUM,       // pending, invoiced, partial, paid

  // Assignments
  driver_id: UUID,
  truck_id: UUID,
  trailer_id: UUID,
  dispatcher_id: UUID,

  // Route
  shipper_facility_id: UUID,
  consignee_facility_id: UUID,
  pickup_date: DATE,
  delivery_date: DATE,

  // Addresses (denormalized for quick access)
  shipper_name: STRING,
  shipper_address: STRING,
  shipper_city: STRING,
  shipper_state: STRING,
  shipper_zip: STRING,
  consignee_name: STRING,
  consignee_address: STRING,
  consignee_city: STRING,
  consignee_state: STRING,
  consignee_zip: STRING,

  // Financials
  rate: DECIMAL,
  rate_type: ENUM,            // flat, per_mile
  distance_miles: INTEGER,
  weight_lbs: INTEGER,

  // Broker
  broker_id: UUID,
  broker_name: STRING,
  broker_mc_number: STRING,

  // Metadata
  commodity: STRING,
  equipment_type: STRING,
  special_instructions: TEXT,
  internal_notes: TEXT,

  created_by_user_id: UUID,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### LoadStop
```javascript
{
  id: UUID,
  organization_id: UUID,
  load_id: UUID,
  type: ENUM,                 // pickup, delivery, stop
  sequence: INTEGER,          // Order of stop
  facility_id: UUID,
  facility_name: STRING,
  address: STRING,
  city: STRING,
  state: STRING,
  zip: STRING,
  scheduled_date: DATE,
  scheduled_time: TIME,
  actual_arrival: DATETIME,
  actual_departure: DATETIME,
  notes: TEXT,
  created_at: DATE,
  updated_at: DATE
}
```

#### Truck
```javascript
{
  id: UUID,
  organization_id: UUID,
  unit_number: STRING,        // Fleet number
  vin: STRING,
  make: STRING,
  model: STRING,
  year: INTEGER,
  license_plate: STRING,
  license_state: STRING,
  status: ENUM,               // available, in_use, maintenance, out_of_service
  current_driver_id: UUID,
  current_trailer_id: UUID,
  current_location: JSON,     // { lat, lng, updated_at }
  motive_vehicle_id: STRING,  // ELD integration
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Trailer
```javascript
{
  id: UUID,
  organization_id: UUID,
  unit_number: STRING,
  trailer_type: ENUM,         // dry_van, reefer, flatbed, etc.
  vin: STRING,
  make: STRING,
  model: STRING,
  year: INTEGER,
  license_plate: STRING,
  license_state: STRING,
  status: ENUM,               // available, in_use, maintenance, out_of_service
  current_truck_id: UUID,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Broker
```javascript
{
  id: UUID,
  organization_id: UUID,
  name: STRING,
  mc_number: STRING,
  contact_name: STRING,
  email: STRING,
  phone: STRING,
  address: STRING,
  city: STRING,
  state: STRING,
  zip: STRING,
  payment_terms: INTEGER,     // Net days
  notes: TEXT,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Facility
```javascript
{
  id: UUID,
  organization_id: UUID,
  name: STRING,
  facility_type: ENUM,        // shipper, receiver, both
  address: STRING,
  city: STRING,
  state: STRING,
  zip: STRING,
  contact_name: STRING,
  contact_phone: STRING,
  contact_email: STRING,
  hours: STRING,
  notes: TEXT,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

#### Expense
```javascript
{
  id: UUID,
  organization_id: UUID,
  expense_number: STRING,     // Auto: EXP-0001
  description: STRING,
  amount: DECIMAL,
  category: ENUM,             // fuel, maintenance, tolls, etc.
  category_id: UUID,          // Custom category
  status: ENUM,               // draft, pending, approved, rejected, paid
  expense_date: DATE,

  // Polymorphic association
  entity_type: ENUM,          // organization, truck, trailer, driver, load
  entity_id: UUID,

  // Workflow
  submitted_by_user_id: UUID,
  approved_by_user_id: UUID,
  approved_at: DATE,
  rejection_reason: STRING,

  // Receipt
  receipt_url: STRING,
  receipt_filename: STRING,

  // Recurring
  is_recurring: BOOLEAN,
  recurring_frequency: ENUM,
  parent_expense_id: UUID,

  // Payment
  payment_method: ENUM,
  vendor: STRING,
  reference_number: STRING,

  notes: TEXT,
  created_by_user_id: UUID,
  deleted_at: DATE,
  created_at: DATE,
  updated_at: DATE
}
```

---

## API Structure

### Base URL
```
Production: https://morpro-next-tms-6994b3b1e790.herokuapp.com/api
Development: http://localhost:3000/api
```

### Endpoints

#### Auth (`/v1/auth`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/send-code` | Send OTP to email |
| POST | `/verify-code` | Verify OTP, get tokens |
| POST | `/refresh` | Refresh access token |
| POST | `/logout` | Invalidate refresh token |

#### Organizations (`/v1/organizations`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/` | Create organization |
| GET | `/` | List user's organizations |
| GET | `/:slug` | Get organization by slug |
| PATCH | `/:slug` | Update organization |

#### Drivers (`/v1/drivers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List drivers |
| POST | `/` | Create driver |
| GET | `/:id` | Get driver |
| PATCH | `/:id` | Update driver |
| DELETE | `/:id` | Soft delete driver |
| POST | `/:id/invite` | Send invite email |
| GET | `/:id/invite-status` | Get invite status |
| POST | `/:id/resend-invite` | Resend invite |

#### Driver Invite (`/v1/driver-invite`) - Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/:token` | Get invite info |
| POST | `/:token/accept` | Accept invite, create password |

#### Loads (`/v1/loads`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List loads (with filters) |
| POST | `/` | Create load |
| GET | `/:id` | Get load with relations |
| PATCH | `/:id` | Update load |
| DELETE | `/:id` | Soft delete load |
| PATCH | `/:id/status` | Update load status |
| POST | `/:id/stops` | Add stop to load |
| PATCH | `/:id/stops/:stopId` | Update stop |
| DELETE | `/:id/stops/:stopId` | Remove stop |
| POST | `/:id/stops/reorder` | Reorder stops |

#### Trucks (`/v1/trucks`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List trucks |
| POST | `/` | Create truck |
| GET | `/:id` | Get truck |
| PATCH | `/:id` | Update truck |
| DELETE | `/:id` | Soft delete truck |

#### Trailers (`/v1/trailers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List trailers |
| POST | `/` | Create trailer |
| GET | `/:id` | Get trailer |
| PATCH | `/:id` | Update trailer |
| DELETE | `/:id` | Soft delete trailer |

#### Brokers (`/v1/brokers`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List brokers |
| POST | `/` | Create broker |
| GET | `/:id` | Get broker |
| PATCH | `/:id` | Update broker |
| DELETE | `/:id` | Soft delete broker |

#### Facilities (`/v1/facilities`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List facilities |
| POST | `/` | Create facility |
| GET | `/:id` | Get facility |
| PATCH | `/:id` | Update facility |
| DELETE | `/:id` | Soft delete facility |

#### Expenses (`/v1/expenses`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List expenses |
| POST | `/` | Create expense |
| GET | `/:id` | Get expense |
| PATCH | `/:id` | Update expense |
| DELETE | `/:id` | Soft delete expense |
| POST | `/:id/approve` | Approve expense |
| POST | `/:id/reject` | Reject expense |

#### Driver Portal (`/v1/driver-portal`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Driver dashboard data |
| GET | `/loads` | Driver's assigned loads |
| GET | `/loads/:id` | Load detail for driver |
| PATCH | `/loads/:id/status` | Update load status |
| GET | `/expenses` | Driver's expenses |
| POST | `/expenses` | Submit expense |
| GET | `/earnings` | Earnings summary |
| GET | `/documents` | Personal documents |

#### AVA AI Mechanic (`/v1/ava`)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/trucks` | Trucks with diagnostics |
| GET | `/trucks/:id` | Truck diagnostic detail |
| POST | `/settings/connect` | Connect Motive ELD |
| POST | `/sync` | Sync diagnostics from Motive |

---

## Frontend Structure

### Contexts

#### AuthContext
```javascript
{
  user: User | null,
  organizations: Organization[],
  isAuthenticated: boolean,
  isDriverOnly: boolean,
  loading: boolean,
  login: (tokens) => void,
  logout: () => void
}
```

#### OrgContext
```javascript
{
  currentOrg: Organization | null,
  orgSlug: string,
  hasOrg: boolean,
  loading: boolean,
  orgUrl: (path) => string  // Helper: orgUrl('/loads') => '/o/acme/loads'
}
```

### Hook Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         COMPONENTS                               │
│  Pages and UI components                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Use domain hooks
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DOMAIN HOOKS                                │
│  useLoads, useDrivers, useDriver, useExpenses                   │
│  - Business logic                                                │
│  - Filtering, searching                                          │
│  - Statistics calculation                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Compose API hooks
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API HOOKS                                 │
│  useApiRequest, useApiState, useMutation                        │
│  - Loading/error state                                           │
│  - Request execution                                             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Call API functions
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API MODULES                                 │
│  loads.api.js, drivers.api.js, etc.                             │
│  - Axios calls                                                   │
│  - URL construction                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Route Structure

```javascript
// Public routes
/                     // Marketing homepage (redirects if logged in)
/ai                   // AI features page
/login                // Login page
/signup               // Signup page (same as login)
/verify               // OTP verification
/driver-invite/:token // Driver invite acceptance

// Driver Portal (protected)
/driver               // Driver dashboard
/driver/loads         // Driver's loads
/driver/loads/:id     // Load detail
/driver/expenses      // Expenses
/driver/earnings      // Earnings
/driver/documents     // Documents
/driver/settings      // Settings

// Admin Portal (protected, org-scoped)
/o/:orgSlug/dashboard        // Dashboard
/o/:orgSlug/loads            // Loads list
/o/:orgSlug/loads/new        // Create load
/o/:orgSlug/loads/:id        // Load detail
/o/:orgSlug/drivers          // Drivers list
/o/:orgSlug/drivers/new      // Add driver
/o/:orgSlug/drivers/:id      // Driver detail
/o/:orgSlug/assets/trucks    // Trucks
/o/:orgSlug/assets/trailers  // Trailers
/o/:orgSlug/customers        // Brokers & Facilities
/o/:orgSlug/expenses         // Expenses
/o/:orgSlug/settings         // Organization settings
/o/:orgSlug/tools/ava        // AVA AI Mechanic
```

---

## Key Features

### 1. Driver Invite System

```
Admin creates driver profile (unclaimed)
        │
        ▼
Admin sends invitation (email + code)
        │
        ▼
Driver clicks link → /driver-invite/:token
        │
        ▼
Driver creates password → Account created
        │
        ▼
Driver profile linked to user account
        │
        ▼
Driver can access Driver Portal
```

### 2. Load Lifecycle

```
NEW → BOOKED → DISPATCHED → IN_TRANSIT → DELIVERED → INVOICED → PAID
```

Each status transition triggers:
- UI updates
- Notification possibilities
- Audit logging

### 3. Multi-Stop Loads

Loads support multiple pickups and deliveries:
- Stop types: `pickup`, `delivery`, `stop`
- Orderable sequence
- Facility linking
- Scheduled times

### 4. Expense Workflow

```
DRAFT → PENDING → APPROVED → PAID
                ↓
             REJECTED
```

Expenses can be associated with:
- Organization (general)
- Truck
- Trailer
- Driver
- Load

### 5. AI Teammates

| Agent | Purpose | Status |
|-------|---------|--------|
| ALEX | Email → Load conversion | Available |
| NOVA | Smart dispatch matching | Available |
| SAGE | Onboarding assistant | Coming Soon |

### 6. AVA AI Mechanic

Integrates with Motive ELD to:
- Pull truck diagnostics
- Track fault codes
- Provide maintenance insights

---

## Enums & Status Values

### Load Status
```javascript
LoadStatus = {
  DRAFT: 'draft',
  NEW: 'new',
  BOOKED: 'booked',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  INVOICED: 'invoiced',
  PAID: 'paid',
  CANCELLED: 'cancelled'
}
```

### Driver Status
```javascript
DriverStatus = {
  AVAILABLE: 'available',
  DRIVING: 'driving',
  OFF_DUTY: 'off_duty',
  INACTIVE: 'inactive'
}
```

### Asset Status
```javascript
AssetStatus = {
  AVAILABLE: 'available',
  IN_USE: 'in_use',
  MAINTENANCE: 'maintenance',
  OUT_OF_SERVICE: 'out_of_service'
}
```

### Membership Status
```javascript
MembershipStatus = {
  ACTIVE: 'active',
  INVITED: 'invited',
  LEFT: 'left'
}
```

### Expense Status
```javascript
ExpenseStatus = {
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PAID: 'paid'
}
```

### Roles
```javascript
Roles = {
  OWNER: 'owner',
  ADMIN: 'admin',
  DISPATCHER: 'dispatcher',
  ACCOUNTANT: 'accountant',
  VIEWER: 'viewer',
  DRIVER: 'driver'
}
```

---

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=mysql://user:pass@host:3306/db

# Auth
JWT_SECRET=your-jwt-secret
JWT_REFRESH_SECRET=your-refresh-secret

# Email
SENDGRID_API_KEY=your-key
# or
RESEND_API_KEY=your-key

# AWS S3
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret
AWS_S3_BUCKET=your-bucket
AWS_REGION=us-east-1

# Stripe
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Motive ELD
MOTIVE_API_KEY=your-key

# App
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://your-frontend.vercel.app
```

### Frontend (.env)
```bash
VITE_API_URL=https://your-backend.herokuapp.com/api
VITE_APP_NAME=Next TMS
```

---

## Development Commands

### Backend
```bash
cd backend
npm install
npm run dev          # Development with nodemon
npm start            # Production
npm run db:sync      # Sync database schema
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run preview      # Preview production build
```

---

## Deployment

### Backend to Heroku
```bash
cd backend
git push heroku main
```

### Frontend to Vercel
```bash
cd frontend
git push origin main  # Auto-deploys via Vercel
```

---

## Summary

Next TMS is a full-featured trucking management system with:

- **Multi-tenant architecture** with organization-based isolation
- **Role-based access control** with granular permissions
- **Passwordless auth** using email OTP
- **Driver invite system** for onboarding drivers
- **Comprehensive load management** with multi-stop support
- **Fleet tracking** for trucks and trailers
- **Expense management** with approval workflows
- **Separate Driver Portal** for mobile-friendly driver access
- **AI features** for automation (ALEX, NOVA, SAGE)
- **ELD integration** via Motive for truck diagnostics

The codebase follows a clean architecture with:
- Backend: Express + Sequelize with service layer pattern
- Frontend: React + hooks architecture with domain/API separation
- Shared enums between frontend and backend for consistency
