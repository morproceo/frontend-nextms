import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { useOrg } from './contexts/OrgContext';
import { LoadingScreen } from './components/ui/Spinner';
import { AppShell } from './components/layout/AppShell';

// Marketing Pages
import HomePage from './pages/marketing/HomePage';
import AIPage from './pages/marketing/AIPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import VerifyPage from './pages/auth/VerifyPage';

// Onboarding
import CreateOrgPage from './pages/onboarding/CreateOrgPage';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Drivers
import DriversListPage from './pages/drivers/DriversListPage';
import DriverDetailPage from './pages/drivers/DriverDetailPage';
import DriverFormPage from './pages/drivers/DriverFormPage';
import DriverInviteAcceptPage from './pages/drivers/DriverInviteAcceptPage';

// Driver Portal
import { DriverShell } from './components/layout/DriverShell';
import {
  DriverDashboard,
  DriverLoadsPage,
  DriverLoadDetailPage,
  DriverDocumentsPage,
  DriverEarningsPage,
  DriverExpensesPage,
  DriverExpenseFormPage,
  DriverSettingsPage
} from './pages/driver';

// Assets
import TrucksListPage from './pages/assets/TrucksListPage';
import TruckDetailPage from './pages/assets/TruckDetailPage';
import TruckFormPage from './pages/assets/TruckFormPage';
import TrailersListPage from './pages/assets/TrailersListPage';
import TrailerDetailPage from './pages/assets/TrailerDetailPage';
import TrailerFormPage from './pages/assets/TrailerFormPage';

// Loads
import LoadsListPage from './pages/loads/LoadsListPage';
import LoadFormPage from './pages/loads/LoadFormPage';
import LoadDetailPage from './pages/loads/LoadDetailPage';

// Customers
import CustomersPage from './pages/customers/CustomersPage';
import BrokerFormPage from './pages/customers/BrokerFormPage';
import BrokerDetailPage from './pages/customers/BrokerDetailPage';
import FacilityFormPage from './pages/customers/FacilityFormPage';
import FacilityDetailPage from './pages/customers/FacilityDetailPage';

// Expenses
import ExpensesListPage from './pages/expenses/ExpensesListPage';
import ExpenseFormPage from './pages/expenses/ExpenseFormPage';
import ExpenseDetailPage from './pages/expenses/ExpenseDetailPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';
import BillingPage from './pages/settings/BillingPage';

// Tools
import { AvaPage, AvaTruckDetailPage, AvaSettingsPage } from './pages/tools';

/**
 * Protected Route wrapper
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children || <Outlet />;
}

/**
 * Public Route wrapper
 * Redirects to dashboard if already authenticated
 */
function PublicRoute({ children }) {
  const { isAuthenticated, loading, organizations, isDriverOnly } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Driver-only users go to driver portal
    if (isDriverOnly) {
      return <Navigate to="/driver" replace />;
    }
    // Redirect to first org or create-org
    if (organizations.length > 0) {
      return <Navigate to={`/o/${organizations[0].slug}/dashboard`} replace />;
    }
    return <Navigate to="/create-org" replace />;
  }

  return children || <Outlet />;
}

/**
 * Org Route wrapper
 * Ensures user has org context and admin access
 */
function OrgRoute({ children }) {
  const { hasOrg, loading } = useOrg();
  const { organizations, isDriverOnly } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Driver-only users cannot access admin routes
  if (isDriverOnly) {
    return <Navigate to="/driver" replace />;
  }

  if (!hasOrg) {
    if (organizations.length === 0) {
      return <Navigate to="/create-org" replace />;
    }
    // Redirect to first org
    return <Navigate to={`/o/${organizations[0].slug}/dashboard`} replace />;
  }

  return children || <Outlet />;
}

/**
 * Admin Only Route wrapper
 * Blocks driver-only users from accessing admin-only routes like create-org
 */
function AdminOnlyRoute({ children }) {
  const { isDriverOnly, loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  // Driver-only users cannot access admin-only routes
  if (isDriverOnly) {
    return <Navigate to="/driver" replace />;
  }

  return children || <Outlet />;
}

/**
 * Home Route wrapper
 * Redirects authenticated users to appropriate dashboard
 */
function HomeRoute() {
  const { isAuthenticated, loading, organizations, isDriverOnly } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Driver-only users go to driver portal
    if (isDriverOnly) {
      return <Navigate to="/driver" replace />;
    }
    // Admin users go to their org dashboard
    if (organizations.length > 0) {
      return <Navigate to={`/o/${organizations[0].slug}/dashboard`} replace />;
    }
    return <Navigate to="/create-org" replace />;
  }

  return <HomePage />;
}

/**
 * Placeholder pages for routes not yet implemented
 */
function PlaceholderPage({ title }) {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center">
        <h1 className="text-title text-text-primary">{title}</h1>
        <p className="text-body-sm text-text-secondary mt-2">
          This page is coming soon.
        </p>
      </div>
    </div>
  );
}

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes (redirect if authenticated) */}
        <Route element={<PublicRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
        </Route>

        {/* Driver invite acceptance (public - creates account) */}
        <Route path="/driver-invite/:token" element={<DriverInviteAcceptPage />} />

        {/* Driver Portal (protected, uses DriverShell) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/driver" element={<DriverShell />}>
            <Route index element={<DriverDashboard />} />
            <Route path="loads" element={<DriverLoadsPage />} />
            <Route path="loads/:loadId" element={<DriverLoadDetailPage />} />
            <Route path="documents" element={<DriverDocumentsPage />} />
            <Route path="expenses" element={<DriverExpensesPage />} />
            <Route path="expenses/new" element={<DriverExpenseFormPage />} />
            <Route path="expenses/:expenseId" element={<DriverExpenseFormPage />} />
            <Route path="earnings" element={<DriverEarningsPage />} />
            <Route path="settings" element={<DriverSettingsPage />} />
          </Route>
        </Route>

        {/* Protected routes (require auth) */}
        <Route element={<ProtectedRoute />}>
          {/* Create org (admin only - drivers can't create orgs) */}
          <Route path="/create-org" element={<AdminOnlyRoute><CreateOrgPage /></AdminOnlyRoute>} />

          {/* Org-scoped routes */}
          <Route path="/o/:orgSlug" element={<OrgRoute><AppShell /></OrgRoute>}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="loads" element={<LoadsListPage />} />
            <Route path="loads/new" element={<LoadFormPage />} />
            <Route path="loads/:loadId" element={<LoadDetailPage />} />
            <Route path="loads/:loadId/edit" element={<LoadFormPage />} />
            <Route path="dispatch" element={<PlaceholderPage title="Dispatch Board" />} />
            <Route path="drivers" element={<DriversListPage />} />
            <Route path="drivers/new" element={<DriverFormPage />} />
            <Route path="drivers/:driverId" element={<DriverDetailPage />} />
            <Route path="drivers/:driverId/edit" element={<DriverFormPage />} />
            <Route path="assets/trucks" element={<TrucksListPage />} />
            <Route path="assets/trucks/new" element={<TruckFormPage />} />
            <Route path="assets/trucks/:truckId" element={<TruckDetailPage />} />
            <Route path="assets/trucks/:truckId/edit" element={<TruckFormPage />} />
            <Route path="assets/trailers" element={<TrailersListPage />} />
            <Route path="assets/trailers/new" element={<TrailerFormPage />} />
            <Route path="assets/trailers/:trailerId" element={<TrailerDetailPage />} />
            <Route path="assets/trailers/:trailerId/edit" element={<TrailerFormPage />} />
            <Route path="customers" element={<CustomersPage />} />
            <Route path="customers/brokers/new" element={<BrokerFormPage />} />
            <Route path="customers/brokers/:brokerId" element={<BrokerDetailPage />} />
            <Route path="customers/brokers/:brokerId/edit" element={<BrokerFormPage />} />
            <Route path="customers/facilities/new" element={<FacilityFormPage />} />
            <Route path="customers/facilities/:facilityId" element={<FacilityDetailPage />} />
            <Route path="customers/facilities/:facilityId/edit" element={<FacilityFormPage />} />
            <Route path="expenses" element={<ExpensesListPage />} />
            <Route path="expenses/new" element={<ExpenseFormPage />} />
            <Route path="expenses/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="expenses/:expenseId/edit" element={<ExpenseFormPage />} />
            <Route path="documents" element={<PlaceholderPage title="Documents" />} />
            <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="settings/billing" element={<BillingPage />} />
            <Route path="tools/ava" element={<AvaPage />} />
            <Route path="tools/ava/settings" element={<AvaSettingsPage />} />
            <Route path="tools/ava/:truckId" element={<AvaTruckDetailPage />} />
          </Route>
        </Route>

        {/* Marketing Homepage - redirect authenticated users */}
        <Route path="/" element={<HomeRoute />} />

        {/* Marketing Pages - Public */}
        <Route path="/ai" element={<AIPage />} />

        {/* 404 */}
        <Route path="*" element={
          <div className="min-h-screen flex items-center justify-center bg-surface-secondary">
            <div className="text-center">
              <h1 className="text-display text-text-primary">404</h1>
              <p className="text-body text-text-secondary mt-2">Page not found</p>
              <a href="/" className="text-accent hover:underline mt-4 inline-block">
                Go home
              </a>
            </div>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default Router;
