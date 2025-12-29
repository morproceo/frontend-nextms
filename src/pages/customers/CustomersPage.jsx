import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { BrokersTab } from '../../components/features/customers/BrokersTab';
import { FacilitiesTab } from '../../components/features/customers/FacilitiesTab';
import { Building2, Warehouse } from 'lucide-react';

export function CustomersPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'brokers';

  const setActiveTab = (tab) => {
    setSearchParams({ tab });
  };

  const tabs = [
    { id: 'brokers', label: 'Brokers', icon: Building2 },
    { id: 'facilities', label: 'Shippers & Receivers', icon: Warehouse }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-title text-text-primary">Customers</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-surface-tertiary">
        <nav className="flex gap-6" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 py-3 px-1 border-b-2 text-body-sm font-medium transition-colors
                  ${isActive
                    ? 'border-accent text-accent'
                    : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-tertiary'
                  }
                `}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'brokers' && (
          <BrokersTab
            onViewBroker={(id) => navigate(orgUrl(`/customers/brokers/${id}`))}
            onAddBroker={() => navigate(orgUrl('/customers/brokers/new'))}
          />
        )}
        {activeTab === 'facilities' && (
          <FacilitiesTab
            onViewFacility={(id) => navigate(orgUrl(`/customers/facilities/${id}`))}
            onAddFacility={() => navigate(orgUrl('/customers/facilities/new'))}
          />
        )}
      </div>
    </div>
  );
}

export default CustomersPage;
