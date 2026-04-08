/**
 * DispatchCommandCenter - Enhanced dispatch page with tabbed interface
 *
 * Tabs:
 * 1. Timeline — Load Timeline + LogIQ (load profitability analyzer)
 * 2. Map — Multi-route Mapbox map showing active load routes
 * 3. Finances — Cost-per-mile calculator with save to org settings
 *
 * KPI Stats Strip always visible above tabs.
 */

import { useDispatchCommandCenter } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { LoadTimeline } from '../../components/features/dispatch/LoadTimeline';
import { LogIQ } from '../../components/features/dispatch/LoadJudge';
import { DispatchMap } from '../../components/features/dispatch/DispatchMap';
import { CostCalculator } from '../../components/features/dispatch/CostCalculator';
import { MarketData } from '../../components/features/dispatch/MarketData';
import { LoadFormModal } from '../../components/features/loads/LoadFormModal';
import {
  Radio,
  Truck,
  MapPin,
  DollarSign,
  List,
  Map,
  Wallet,
  Target,
  BarChart3
} from 'lucide-react';

const TABS = [
  { id: 'timeline', label: 'Timeline', icon: List },
  { id: 'map', label: 'Map', icon: Map },
  { id: 'market', label: 'Market', icon: BarChart3 },
  { id: 'finances', label: 'Finances', icon: Wallet }
];

export function DispatchCommandCenter() {
  const {
    // Tabs
    activeTab,
    setActiveTab,
    // Timeline
    timeline,
    timelineLoading,
    timelineDays,
    setTimelineDays,
    // KPIs
    kpis,
    kpisLoading,
    // Map
    mapLocations,
    // Cost Calculator
    costForm,
    updateCostForm,
    costPerMile,
    savingCost,
    saveCost,
    costSaved,
    costSettings,
    // LogIQ
    judgeForm,
    updateJudgeForm,
    judgeResult,
    judgeLoad,
    judging,
    judgeError,
    resetJudge,
    createLoadFromJudge,
    showCreateLoadModal,
    createLoadPrefill,
    closeCreateLoadModal,
    orgCostPerMile
  } = useDispatchCommandCenter();

  const statCards = [
    {
      name: 'Active Loads',
      value: kpis?.activeLoads?.toString() || '0',
      icon: Radio,
      color: 'accent'
    },
    {
      name: 'In Transit',
      value: kpis?.inTransit?.toString() || '0',
      icon: Truck,
      color: 'warning'
    },
    {
      name: 'Delivered',
      value: kpis?.delivered?.toString() || '0',
      icon: MapPin,
      color: 'success'
    },
    {
      name: 'Avg $/Mile',
      value: kpis ? `$${kpis.avgRpm}` : '$0.00',
      icon: DollarSign,
      color: 'accent'
    },
    {
      name: 'Your Cost/Mile',
      value: orgCostPerMile > 0 ? `$${orgCostPerMile.toFixed(2)}` : null,
      icon: Target,
      color: 'success',
      onClick: orgCostPerMile <= 0 ? () => setActiveTab('finances') : undefined,
      emptyLabel: 'Not set'
    }
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl sm:text-title text-text-primary">Dispatch Command Center</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Monitor active loads, visualize routes, and manage operating costs
        </p>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
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
                  {kpisLoading ? '—' : (stat.value || (
                    <span className="text-body-sm text-text-tertiary italic">
                      {stat.emptyLabel}
                    </span>
                  ))}
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

      {/* Tab Content */}
      {activeTab === 'timeline' && (
        <div className="space-y-4 sm:space-y-6">
          {/* LogIQ — full width horizontal */}
          <LogIQ
            form={judgeForm}
            onUpdateForm={updateJudgeForm}
            result={judgeResult}
            onJudge={judgeLoad}
            judging={judging}
            error={judgeError}
            onReset={resetJudge}
            onCreateLoad={createLoadFromJudge}
          />

          {/* Load Timeline — full width */}
          <LoadTimeline
            timeline={timeline}
            loading={timelineLoading}
            days={timelineDays}
            onDaysChange={setTimelineDays}
          />
        </div>
      )}

      {activeTab === 'map' && (
        <DispatchMap loads={mapLocations} />
      )}

      {activeTab === 'market' && (
        <MarketData />
      )}

      {activeTab === 'finances' && (
        <CostCalculator
          costForm={costForm}
          onUpdateForm={updateCostForm}
          costPerMile={costPerMile}
          saving={savingCost}
          onSave={saveCost}
          saved={costSaved}
          costSettings={costSettings}
        />
      )}

      {/* Create Load Modal (from LogIQ) */}
      <LoadFormModal
        isOpen={showCreateLoadModal}
        onClose={closeCreateLoadModal}
        onSuccess={closeCreateLoadModal}
        prefill={createLoadPrefill}
      />
    </div>
  );
}

export default DispatchCommandCenter;
