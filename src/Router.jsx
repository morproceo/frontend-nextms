import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
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
import DriverSignupPage from './pages/auth/DriverSignupPage';

// Onboarding
import CreateOrgPage from './pages/onboarding/CreateOrgPage';
import RolePickerPage from './pages/onboarding/RolePickerPage';
import PathPickerPage from './pages/onboarding/PathPickerPage';
import JoinOrgPage from './pages/onboarding/JoinOrgPage';
import DriverStandalonePage from './pages/onboarding/DriverStandalonePage';

// App Pages
import DashboardPage from './pages/dashboard/DashboardPage';

// Drivers
import DriversListPage from './pages/drivers/DriversListPage';
import DriverDetailPage from './pages/drivers/DriverDetailPage';
import DriverFormPage from './pages/drivers/DriverFormPage';
import DriverInviteAcceptPage from './pages/drivers/DriverInviteAcceptPage';
import InviteAcceptPage from './pages/auth/InviteAcceptPage';

// Driver Portal
import { DriverShell } from './components/layout/DriverShell';
import { InvestorShell } from './components/layout/InvestorShell';

// Ecosystem Launcher
import { LauncherShell } from './components/launcher/LauncherShell';
import LauncherPage from './pages/launcher/LauncherPage';

// Account-level chrome (launcher-style settings for org and personal user)
import OrgSettingsShell from './components/account/OrgSettingsShell';
import UserSettingsShell from './components/account/UserSettingsShell';
import OrgGeneralPage from './pages/account/org/GeneralPage';
import OrgMembersPage from './pages/account/org/MembersPage';
import OrgAppsPage from './pages/account/org/AppsPage';
import OrgIntegrationsPage from './pages/account/org/IntegrationsPage';
import UserProfilePage from './pages/account/me/ProfilePage';
import UserSecurityPage from './pages/account/me/SecurityPage';
import UserNotificationsPage from './pages/account/me/NotificationsPage';
import UserDriverPage from './pages/account/me/DriverPage';

// MorPro Direct (in-ecosystem app, Phase 1 + Phase 2)
import DirectShell from './components/direct/DirectShell';
import DirectDashboardPage from './pages/direct/DashboardPage';
import DirectMyProfilePage from './pages/direct/MyProfilePage';
import DirectCarriersPage from './pages/direct/CarriersPage';
import DirectCarrierDetailPage from './pages/direct/CarrierDetailPage';
import DirectVerificationsPage from './pages/direct/admin/VerificationsPage';
import DirectVerificationDetailPage from './pages/direct/admin/VerificationDetailPage';
// Phase 2 — load posting + bidding
import DirectPostLoadPage from './pages/direct/loads/PostLoadPage';
import DirectMyLoadsPage from './pages/direct/loads/MyLoadsPage';
import DirectMyLoadDetailPage from './pages/direct/loads/MyLoadDetailPage';
import DirectCarrierLoadDetailPage from './pages/direct/loads/CarrierLoadDetailPage';
import DirectMyBidsPage from './pages/direct/bids/MyBidsPage';
// Phase 3 — direct requests
import DirectRequestsPage from './pages/direct/requests/RequestsPage';
import DirectRequestDetailPage from './pages/direct/requests/RequestDetailPage';
// Phase 4 — shared command center
import DirectCommandCenterPage from './pages/direct/cc/CommandCenterPage';
// Phase 5 — payments + onboarding + disputes
import DirectOnboardingPage from './pages/direct/onboarding/OnboardingPage';
import DirectVerifyPage from './pages/direct/verify/VerifyPage';
import DirectCarrierVerificationsPage from './pages/direct/admin/CarrierVerificationsPage';
import DirectCarrierVerificationDetailPage from './pages/direct/admin/CarrierVerificationDetailPage';
import DirectPaymentsSetupPage from './pages/direct/payments/PaymentsSetupPage';
import DirectPayoutsPage from './pages/direct/payments/PayoutsPage';
import DirectDisputesPage from './pages/direct/admin/DisputesPage';

// Spotty (in-ecosystem app)
import SpottyShell from './components/spotty/SpottyShell';
import WrenchShell from './components/wrench/WrenchShell';
// Genie Suite (six-agent AI team — separate ecosystem app)
import GenieShell from './components/genie/GenieShell';
import GenieTeamPage from './pages/genie/TeamPage';
import GenieActivityFeedPage from './pages/genie/ActivityFeedPage';
import GenieAgentPage from './pages/genie/AgentPage';
import GenieHirePage from './pages/genie/HirePage';
import GenieSettingsPage from './pages/genie/SettingsPage';
import WrenchCommandCenterPage from './pages/wrench/CommandCenterPage';
import WrenchTrucksPage from './pages/wrench/TrucksPage';
import WrenchTruckDetailPage from './pages/wrench/TruckDetailPage';
import WrenchMaintenancePage from './pages/wrench/MaintenancePage';
import WrenchConnectionsPage from './pages/wrench/ConnectionsPage';
import WrenchStubPage from './pages/wrench/StubPage';
import SpottyDashboardPage from './pages/spotty/SpottyDashboardPage';
import SpottyBookingsPage from './pages/spotty/SpottyBookingsPage';
import SpottyPaymentsPage from './pages/spotty/SpottyPaymentsPage';
import SpottyBrowsePage from './pages/spotty/SpottyBrowsePage';
import SpottyListingDetailPage from './pages/spotty/SpottyListingDetailPage';

// Investor Portal
import InvestorDashboard from './pages/investor/InvestorDashboard';
import InvestorLoadsPage from './pages/investor/InvestorLoadsPage';
import InvestorLoadDetailPage from './pages/investor/InvestorLoadDetailPage';
import InvestorFleetPage from './pages/investor/InvestorFleetPage';
import InvestorFinancialsPage from './pages/investor/InvestorFinancialsPage';
import InvestorSettingsPage from './pages/investor/InvestorSettingsPage';
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

// Dispatch
import DispatchCommandCenter from './pages/dispatch/DispatchCommandCenter';

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

// Settlements
import SettlementsListPage from './pages/settlements/SettlementsListPage';
import SettlementFormPage from './pages/settlements/SettlementFormPage';

// Fuel
import FuelDashboardPage from './pages/fuel/FuelDashboardPage';
import FuelCardsPage from './pages/fuel/FuelCardsPage';
import FuelTransactionsPage from './pages/fuel/FuelTransactionsPage';
import FuelTransactionFormPage from './pages/fuel/FuelTransactionFormPage';
import FuelTransactionDetailPage from './pages/fuel/FuelTransactionDetailPage';
import FuelImportPage from './pages/fuel/FuelImportPage';
import FuelCardDetailPage from './pages/fuel/FuelCardDetailPage';

// P&L
import PnlPage from './pages/pnl/PnlPage';

// Reporting
import ReportingSummaryPage from './pages/reporting/ReportingSummaryPage';
import ReportingPerformancePage from './pages/reporting/ReportingPerformancePage';
import ReportingFinancialsPage from './pages/reporting/ReportingFinancialsPage';

// Settings
import SettingsPage from './pages/settings/SettingsPage';
import BillingPage from './pages/settings/BillingPage';
import ScoringConfigPage from './pages/settings/ScoringConfigPage';

// Tools
import { AvaPage, AvaTruckDetailPage, AvaSettingsPage, ComplianceCommandCenter } from './pages/tools';
import FindMyTruckPage from './pages/tools/FindMyTruckPage';
import {
  AtlasDashboardPage,
  AtlasConnectionsPage,
  AtlasOpportunitiesPage,
  AtlasOpportunityDetailPage,
  AtlasSettingsPage
} from './pages/tools/atlas';
import {
  FuelIQDashboardPage,
  FuelIQTripPlannerPage,
  FuelIQSurchargePage
} from './pages/tools/fueliq';
import DriverFuelIQPage from './pages/driver/DriverFuelIQPage';

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
  const { isAuthenticated, loading, organizations, isDriverOnly, isInvestorOnly } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Check for redirect param (e.g. from invite flow)
    const params = new URLSearchParams(location.search);
    const redirect = params.get('redirect');
    if (redirect && redirect.startsWith('/')) {
      return <Navigate to={redirect} replace />;
    }

    // Driver-only users go to driver portal
    if (isDriverOnly) {
      return <Navigate to="/driver" replace />;
    }
    // Investor-only users go to investor portal
    if (isInvestorOnly) {
      return <Navigate to="/investor" replace />;
    }
    // Redirect to first org or create-org
    if (organizations.length > 0) {
      return <Navigate to={`/o/${organizations[0].slug}/launcher`} replace />;
    }
    return <Navigate to="/onboarding/role" replace />;
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
      return <Navigate to="/onboarding/role" replace />;
    }
    // Redirect to first org
    return <Navigate to={`/o/${organizations[0].slug}/launcher`} replace />;
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
  const { isAuthenticated, loading, organizations, isDriverOnly, isInvestorOnly } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  if (isAuthenticated) {
    // Driver-only users go to driver portal
    if (isDriverOnly) {
      return <Navigate to="/driver" replace />;
    }
    // Investor-only users go to investor portal
    if (isInvestorOnly) {
      return <Navigate to="/investor" replace />;
    }
    // Admin users go to the ecosystem launcher
    if (organizations.length > 0) {
      return <Navigate to={`/o/${organizations[0].slug}/launcher`} replace />;
    }
    return <Navigate to="/onboarding/role" replace />;
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
          <Route path="/driver-signup" element={<DriverSignupPage />} />
        </Route>

        {/* Organization invite acceptance */}
        <Route path="/invitations/:token/accept" element={<InviteAcceptPage />} />

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
            <Route path="fueliq" element={<DriverFuelIQPage />} />
            <Route path="settings" element={<DriverSettingsPage />} />
          </Route>
        </Route>

        {/* Investor Portal (protected, uses InvestorShell) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/investor" element={<InvestorShell />}>
            <Route index element={<InvestorDashboard />} />
            <Route path="loads" element={<InvestorLoadsPage />} />
            <Route path="loads/:loadId" element={<InvestorLoadDetailPage />} />
            <Route path="fleet" element={<InvestorFleetPage />} />
            <Route path="financials" element={<InvestorFinancialsPage />} />
            <Route path="expenses" element={<ExpensesListPage />} />
            <Route path="expenses/:expenseId" element={<ExpenseDetailPage />} />
            <Route path="fuel" element={<FuelDashboardPage />} />
            <Route path="fuel/transactions" element={<FuelTransactionsPage />} />
            <Route path="settings" element={<InvestorSettingsPage />} />
          </Route>
        </Route>

        {/* Protected routes (require auth) */}
        <Route element={<ProtectedRoute />}>
          {/* Multi-step onboarding for new signups.
              role → path → (create | join | driver-standalone)
              VerifyPage routes here when the user has no orgs + isn't a driver. */}
          <Route path="/onboarding/role" element={<RolePickerPage />} />
          <Route path="/onboarding/path" element={<PathPickerPage />} />
          <Route path="/onboarding/join" element={<JoinOrgPage />} />
          <Route path="/onboarding/driver" element={<DriverStandalonePage />} />

          {/* Create org. Admin-only (drivers can't create orgs). Takes a
              ?role=carrier|shipper query param when routed from PathPicker. */}
          <Route path="/create-org" element={<AdminOnlyRoute><CreateOrgPage /></AdminOnlyRoute>} />

          {/* Ecosystem launcher (org-scoped, slim chrome — separate from AppShell) */}
          <Route path="/o/:orgSlug/launcher" element={<OrgRoute><LauncherShell /></OrgRoute>}>
            <Route index element={<LauncherPage />} />
          </Route>

          {/* Organization settings (launcher-level chrome, NOT inside NextMS).
              Subscription is per-org and gates every app, so billing lives
              here, not under the NextMS app shell. */}
          <Route path="/o/:orgSlug/settings" element={<OrgRoute><OrgSettingsShell /></OrgRoute>}>
            <Route index element={<OrgGeneralPage />} />
            <Route path="billing" element={<BillingPage />} />
            <Route path="apps" element={<OrgAppsPage />} />
            <Route path="integrations" element={<OrgIntegrationsPage />} />
            <Route path="members" element={<OrgMembersPage />} />
            {/* Back-compat: any other /settings/* under AppShell used to live
                here; redirect to the new General page so old links don't break. */}
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>

          {/* Personal user settings (launcher-level chrome, no org sidebar). */}
          <Route path="/me" element={<ProtectedRoute><UserSettingsShell /></ProtectedRoute>}>
            <Route index element={<UserProfilePage />} />
            <Route path="security" element={<UserSecurityPage />} />
            <Route path="notifications" element={<UserNotificationsPage />} />
            <Route path="driver" element={<UserDriverPage />} />
            <Route path="*" element={<Navigate to="." replace />} />
          </Route>

          {/* Org-scoped routes */}
          <Route path="/o/:orgSlug" element={<OrgRoute><AppShell /></OrgRoute>}>
            <Route index element={<Navigate to="launcher" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="loads" element={<LoadsListPage />} />
            <Route path="loads/new" element={<LoadFormPage />} />
            <Route path="loads/:loadId" element={<LoadDetailPage />} />
            <Route path="loads/:loadId/edit" element={<LoadFormPage />} />
            <Route path="dispatch" element={<DispatchCommandCenter />} />
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
            <Route path="settlements" element={<SettlementsListPage />} />
            <Route path="settlements/new" element={<SettlementFormPage />} />
            <Route path="settlements/:settlementId" element={<SettlementFormPage />} />
            <Route path="fuel" element={<FuelDashboardPage />} />
            <Route path="fuel/cards" element={<FuelCardsPage />} />
            <Route path="fuel/cards/:cardId" element={<FuelCardDetailPage />} />
            <Route path="fuel/transactions" element={<FuelTransactionsPage />} />
            <Route path="fuel/transactions/new" element={<FuelTransactionFormPage />} />
            <Route path="fuel/transactions/import" element={<FuelImportPage />} />
            <Route path="fuel/transactions/:transactionId" element={<FuelTransactionDetailPage />} />
            <Route path="fuel/transactions/:transactionId/edit" element={<FuelTransactionFormPage />} />
            <Route path="documents" element={<PlaceholderPage title="Documents" />} />
            <Route path="invoices" element={<PlaceholderPage title="Invoices" />} />
            <Route path="pnl" element={<PnlPage />} />
            <Route path="reporting" element={<ReportingSummaryPage />} />
            <Route path="reporting/performance" element={<ReportingPerformancePage />} />
            <Route path="reporting/financials" element={<ReportingFinancialsPage />} />
            {/* Settings + billing moved to launcher-level chrome at
                /o/:slug/settings (above this AppShell block). The standalone
                route shadows any /settings/* child here, so we drop them.
                ScoringConfig was at /settings/scoring-config; it's a NextMS
                dispatch-tuning tool, not org-level config, so we keep it
                inside the NextMS chrome but move it out of /settings/. */}
            <Route path="dispatch/scoring-config" element={<ScoringConfigPage />} />
            <Route path="tools/ava" element={<AvaPage />} />
            <Route path="tools/ava/settings" element={<AvaSettingsPage />} />
            <Route path="tools/find-my-truck" element={<FindMyTruckPage />} />
            <Route path="tools/ava/:truckId" element={<AvaTruckDetailPage />} />
            <Route path="tools/atlas" element={<AtlasDashboardPage />} />
            <Route path="tools/atlas/connections" element={<AtlasConnectionsPage />} />
            <Route path="tools/atlas/opportunities" element={<AtlasOpportunitiesPage />} />
            <Route path="tools/atlas/opportunities/:opportunityId" element={<AtlasOpportunityDetailPage />} />
            <Route path="tools/atlas/settings" element={<AtlasSettingsPage />} />
            <Route path="tools/compliance" element={<ComplianceCommandCenter />} />
            <Route path="tools/fueliq" element={<FuelIQDashboardPage />} />
            <Route path="tools/fueliq/trip" element={<FuelIQTripPlannerPage />} />
            <Route path="tools/fueliq/trip/:loadId" element={<FuelIQTripPlannerPage />} />
            <Route path="tools/fueliq/surcharge" element={<FuelIQSurchargePage />} />

          </Route>

          {/* MorPro Direct — Phase 1. Tile is gated by the per-org feature
              flag in apps.js. Same chrome pattern as Spotty (slim shell,
              outside AppShell), with role-aware sidebar that shows the
              "Verifications" item only when the current org is morpro_super_admin. */}
          <Route path="/o/:orgSlug/direct" element={<OrgRoute><DirectShell /></OrgRoute>}>
            <Route index element={<DirectDashboardPage />} />
            <Route path="me/profile" element={<DirectMyProfilePage />} />
            <Route path="carriers" element={<DirectCarriersPage />} />
            <Route path="carriers/:carrierSlug" element={<DirectCarrierDetailPage />} />
            <Route path="admin/verifications" element={<DirectVerificationsPage />} />
            <Route path="admin/verifications/:orgId" element={<DirectVerificationDetailPage />} />
            {/* Phase 2 — load posting + bidding */}
            <Route path="loads" element={<DirectMyLoadsPage />} />
            <Route path="loads/new" element={<DirectPostLoadPage />} />
            <Route path="loads/:id" element={<DirectMyLoadDetailPage />} />
            <Route path="loads/:id/view" element={<DirectCarrierLoadDetailPage />} />
            <Route path="bids" element={<DirectMyBidsPage />} />
            {/* Phase 3 — direct requests */}
            <Route path="requests" element={<DirectRequestsPage />} />
            <Route path="requests/:id" element={<DirectRequestDetailPage />} />
            {/* Phase 4 — shared command center */}
            <Route path="cc/:loadId" element={<DirectCommandCenterPage />} />
            {/* Phase 5 — payments + onboarding + disputes */}
            <Route path="onboarding" element={<DirectOnboardingPage />} />
            {/* Carrier verification wizard. DirectShell renders without sidebar
                on this route + redirects unverified carriers here. */}
            <Route path="verify" element={<DirectVerifyPage />} />
            <Route path="payments/setup" element={<DirectPaymentsSetupPage />} />
            <Route path="payments/payouts" element={<DirectPayoutsPage />} />
            <Route path="admin/disputes" element={<DirectDisputesPage />} />
            {/* Carrier-onboarding admin queue (separate from the older
                profile-based verification admin pages above) */}
            <Route path="admin/carrier-verifications" element={<DirectCarrierVerificationsPage />} />
            <Route path="admin/carrier-verifications/:orgId" element={<DirectCarrierVerificationDetailPage />} />
          </Route>

          {/* Spotty — in-ecosystem app with its own slim shell + sidebar.
              Sits outside AppShell (different chrome), but inside the
              org-scoped tree so OrgRoute still validates org access. */}
          <Route path="/o/:orgSlug/spotty" element={<OrgRoute><SpottyShell /></OrgRoute>}>
            <Route index element={<SpottyDashboardPage />} />
            <Route path="browse" element={<SpottyBrowsePage />} />
            <Route path="listings/:id" element={<SpottyListingDetailPage />} />
            <Route path="bookings" element={<SpottyBookingsPage />} />
            <Route path="payments" element={<SpottyPaymentsPage />} />
          </Route>

          {/* MorPro Wrench — AI fleet mechanic. Same slim-shell pattern as
              Direct/Spotty. Phase A ships only the shell + a placeholder
              command center; Phases B-F fill in trucks, diagnoses,
              maintenance, connections, and the sync worker. */}
          <Route path="/o/:orgSlug/wrench" element={<OrgRoute><WrenchShell /></OrgRoute>}>
            <Route index element={<WrenchCommandCenterPage />} />
            <Route path="trucks" element={<WrenchTrucksPage />} />
            <Route path="trucks/:id" element={<WrenchTruckDetailPage />} />
            <Route path="diagnoses" element={<WrenchStubPage title="Fault codes" subtitle="Active and recent fault codes across the fleet." />} />
            <Route path="maintenance" element={<WrenchMaintenancePage />} />
            <Route path="insights" element={<WrenchStubPage title="Insights" subtitle="Recurring faults, maintenance due, and other patterns." />} />
            <Route path="connections" element={<WrenchConnectionsPage />} />
            <Route path="settings" element={<WrenchStubPage title="Settings" />} />
          </Route>

          {/* Genie Suite — the six-agent AI team. Shell is free to open;
              individual agents inside are hired via the agent_catalog flow
              (or via the genie-suite bundle SKU). Team page is the default
              landing surface — not chat. */}
          <Route path="/o/:orgSlug/genie" element={<OrgRoute><GenieShell /></OrgRoute>}>
            <Route index element={<GenieTeamPage />} />
            <Route path="activity" element={<GenieActivityFeedPage />} />
            <Route path="hire" element={<GenieHirePage />} />
            <Route path="settings" element={<GenieSettingsPage />} />
            <Route path="agents/:agentSlug" element={<GenieAgentPage />} />
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
