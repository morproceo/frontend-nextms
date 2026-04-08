/**
 * ComplianceCommandCenter - Fleet compliance dashboard & management tool
 *
 * Tabs:
 * 1. Dashboard — Overview of all compliance alerts across drivers, trucks, trailers
 * 2. Drivers — Drivers with expiring/expired qualifications
 * 3. Equipment — Trucks & trailers with expiring/expired docs
 * 4. Company Permits — FMCSA permit checklist
 *
 * KPI Stats Strip always visible above tabs.
 */

import { useComplianceCommandCenter } from '../../../hooks';
import { Card } from '../../../components/ui/Card';
import { ComplianceDashboardTab } from '../../../components/features/compliance/ComplianceDashboardTab';
import { ComplianceDriversTab } from '../../../components/features/compliance/ComplianceDriversTab';
import { ComplianceEquipmentTab } from '../../../components/features/compliance/ComplianceEquipmentTab';
import { ComplianceCompanyPermitsTab } from '../../../components/features/compliance/ComplianceCompanyPermitsTab';
import {
  ShieldCheck,
  AlertTriangle,
  Users,
  Truck,
  FileCheck,
  LayoutDashboard,
  Container
} from 'lucide-react';

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'drivers', label: 'Drivers', icon: Users },
  { id: 'equipment', label: 'Equipment', icon: Truck },
  { id: 'permits', label: 'Company Permits', icon: FileCheck }
];

export function ComplianceCommandCenter() {
  const {
    activeTab,
    setActiveTab,
    kpis,
    summary,
    allAlerts,
    driverAlerts,
    truckAlerts,
    trailerAlerts,
    companyPermits,
    saveCompanyPermits,
    saving,
    permitDocuments,
    fetchPermitDocuments,
    uploadPermitDoc,
    deletePermitDoc,
    loading,
    error,
    refetch
  } = useComplianceCommandCenter();

  const statCards = [
    {
      name: 'Total Alerts',
      value: kpis?.totalAlerts?.toString() || '0',
      icon: AlertTriangle,
      color: kpis?.totalAlerts > 0 ? 'error' : 'success'
    },
    {
      name: 'Driver Alerts',
      value: kpis?.driverAlerts?.toString() || '0',
      icon: Users,
      color: kpis?.driverAlerts > 0 ? 'warning' : 'success',
      onClick: () => setActiveTab('drivers')
    },
    {
      name: 'Equipment Alerts',
      value: kpis?.equipmentAlerts?.toString() || '0',
      icon: Truck,
      color: kpis?.equipmentAlerts > 0 ? 'warning' : 'success',
      onClick: () => setActiveTab('equipment')
    },
    {
      name: 'Company Permits',
      value: kpis ? `${kpis.permitsCompliant}/${kpis.permitsTotal}` : '0/0',
      icon: FileCheck,
      color: kpis?.permitsCompliant === kpis?.permitsTotal ? 'success' : 'warning',
      onClick: () => setActiveTab('permits')
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
          <ShieldCheck className="w-5 h-5 text-accent" />
        </div>
        <div>
          <h1 className="text-xl sm:text-title text-text-primary">Compliance Command Center</h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Monitor expiring documents, driver qualifications, and company permits
          </p>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.name}
            padding="compact"
            className={`p-3 sm:p-4 ${stat.onClick ? 'cursor-pointer hover:border-accent/30 transition-colors' : ''}`}
            onClick={stat.onClick}
          >
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-body-sm text-text-secondary truncate">{stat.name}</p>
                <p className="text-title-sm sm:text-headline text-text-primary mt-0.5 sm:mt-1">
                  {loading ? '—' : stat.value}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-${stat.color}/10 rounded-lg flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tab Bar */}
      <div className="border-b border-border">
        <nav className="flex gap-0 -mb-px">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-body-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Error State */}
      {error && (
        <Card padding="compact" className="p-4 border-error/30 bg-error/5">
          <p className="text-body-sm text-error">{error}</p>
        </Card>
      )}

      {/* Tab Content */}
      {activeTab === 'dashboard' && (
        <ComplianceDashboardTab
          alerts={allAlerts}
          summary={summary}
          loading={loading}
        />
      )}

      {activeTab === 'drivers' && (
        <ComplianceDriversTab
          drivers={driverAlerts}
          loading={loading}
        />
      )}

      {activeTab === 'equipment' && (
        <ComplianceEquipmentTab
          trucks={truckAlerts}
          trailers={trailerAlerts}
          loading={loading}
        />
      )}

      {activeTab === 'permits' && (
        <ComplianceCompanyPermitsTab
          permits={companyPermits}
          onSave={saveCompanyPermits}
          saving={saving}
          loading={loading}
          permitDocuments={permitDocuments}
          onFetchDocuments={fetchPermitDocuments}
          onUploadDocument={uploadPermitDoc}
          onDeleteDocument={deletePermitDoc}
        />
      )}
    </div>
  );
}

export default ComplianceCommandCenter;
