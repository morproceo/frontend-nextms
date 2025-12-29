# TMS - Multi-Tenant Transportation Management System

A premium, modern Transportation Management System built with React, Express, MySQL, and a multi-tenant architecture.

## Tech Stack

- **Frontend**: React 18 + Vite + Radix UI + Tailwind CSS
- **Backend**: Node.js + Express + Sequelize
- **Database**: MySQL (via MAMP)
- **Auth**: Passwordless OTP (email-based)

## Prerequisites

- Node.js 18+
- MAMP with MySQL running
- MySQL database named `next`

## Quick Start

### 1. Start MAMP
Make sure MAMP is running with MySQL on port 8889.

### 2. Install Dependencies

```bash
# Backend
cd backend && npm install

# Frontend
cd frontend && npm install
```

### 3. Configure Environment

Backend `.env` is pre-configured for MAMP defaults:
- Host: localhost
- Port: 8889
- User: root
- Password: root
- Database: next

### 4. Start the Backend

```bash
cd backend
npm run dev
```

The backend will:
- Connect to MySQL
- Auto-create tables (Sequelize sync)
- Start on http://localhost:3001

### 5. Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on http://localhost:5173

## Project Structure

```
/next
├── /backend          # Express API
│   ├── /src
│   │   ├── /config       # Database, constants
│   │   ├── /enums        # Re-exports from shared
│   │   ├── /middleware   # Auth, tenant, RBAC
│   │   ├── /models       # Sequelize models
│   │   ├── /repositories # Scoped data access
│   │   ├── /services     # Business logic
│   │   ├── /controllers  # Route handlers
│   │   └── /routes       # API routes
│   └── app.js
│
├── /frontend         # React SPA
│   └── /src
│       ├── /api          # API client
│       ├── /components   # UI components
│       ├── /contexts     # Auth, Org contexts
│       ├── /pages        # Page components
│       └── /styles       # Tailwind + globals
│
└── /shared           # Shared enums (single source of truth)
    └── /enums
```

## Architecture Highlights

### Multi-Tenant Isolation

1. **Tenant Resolution**: Middleware extracts org from subdomain/path/header
2. **Membership Guard**: Verifies user belongs to org
3. **RBAC**: Role-based permission checks
4. **Scoped Repository**: Every query includes organization_id

### Auth Flow (Passwordless OTP)

1. User enters email → OTP sent
2. User enters OTP → JWT tokens returned
3. Access token (15m) + Refresh token (7d)
4. Auto-refresh on 401

### Vanity URLs

- Subdomain: `{slug}.tms.app/dashboard`
- Path fallback: `tms.app/o/{slug}/dashboard`

## API Endpoints

### Auth
- `POST /v1/auth/login` - Request OTP
- `POST /v1/auth/verify` - Verify OTP
- `POST /v1/auth/refresh` - Refresh token
- `GET /v1/auth/me` - Get current user

### Organizations
- `GET /v1/organizations` - List user's orgs
- `POST /v1/organizations` - Create org
- `GET /v1/organizations/:id/members` - List members
- `POST /v1/organizations/:id/invitations` - Invite member

## Design System

Apple + Tesla inspired minimal design:
- Clean typography (SF Pro)
- Generous spacing
- Subtle shadows
- Fast animations

See `tailwind.config.js` for full design tokens.

## Development

```bash
# Backend with hot reload
cd backend && npm run dev

# Frontend with hot reload
cd frontend && npm run dev
```

## Next Steps (MVP Roadmap)

- [x] Auth + Organizations + Memberships
- [ ] Loads CRUD + Stops
- [ ] Drivers CRUD (claimed/unclaimed)
- [ ] Dispatch assignments
- [ ] Document uploads
- [ ] Invoicing
- [ ] Dashboard analytics
