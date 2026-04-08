/**
 * DashboardPage - Organization dashboard with financial metrics
 *
 * Shows 6 KPI cards (loads, revenue, rate/mile, cost/mile, net profit/mile,
 * operating margin), a performance trend chart, quick actions, and recent loads.
 *
 * All data sourced via useDashboard domain hook.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDashboard } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { LoadStatusConfig, getStatusConfig } from '../../config/status';
import {
  Package,
  Truck,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  BarChart3,
  Receipt
} from 'lucide-react';

// ── Formatters ──────────────────────────────────────────────

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatRate = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatPercent = (value) => {
  if (!value && value !== 0) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
};

// ── Period Selector ─────────────────────────────────────────

function PeriodSelector({ period, setPeriod, presets }) {
  return (
    <div className="flex bg-surface-secondary rounded-lg p-0.5 overflow-x-auto no-scrollbar">
      {Object.entries(presets).map(([key, label]) => (
        <button
          key={key}
          onClick={() => setPeriod(key)}
          className={`px-3 py-1.5 text-small font-medium rounded-md whitespace-nowrap transition-all ${
            period === key
              ? 'bg-surface shadow-sm text-text-primary'
              : 'text-text-secondary hover:text-text-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Performance Trend (horizontal bar chart) ────────────────

function PerformanceTrend({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <BarChart3 className="w-10 h-10 text-text-tertiary mb-2" />
        <p className="text-body-sm text-text-secondary">No trend data available</p>
        <p className="text-small text-text-tertiary mt-1">
          Complete loads to see monthly performance
        </p>
      </div>
    );
  }

  // Find max value for scaling bars
  const maxValue = Math.max(
    ...trend.map(t => Math.max(Math.abs(t.revenue || 0), Math.abs(t.totalCosts || 0))),
    1
  );

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-accent" />
          <span className="text-small text-text-secondary">Revenue</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-red-500" />
          <span className="text-small text-text-secondary">Costs</span>
        </div>
      </div>

      {/* Bars */}
      <div className="space-y-3">
        {trend.map((item, i) => {
          const revenueWidth = maxValue > 0 ? ((item.revenue || 0) / maxValue) * 100 : 0;
          const costsWidth = maxValue > 0 ? ((item.totalCosts || 0) / maxValue) * 100 : 0;
          const net = (item.revenue || 0) - (item.totalCosts || 0);

          return (
            <div key={item.month || i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-small font-medium text-text-secondary w-16 shrink-0">
                  {item.month || `Month ${i + 1}`}
                </span>
                <span className={`text-small font-medium tabular-nums ${net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatCurrency(net)}
                </span>
              </div>
              <div className="space-y-1">
                <div className="h-4 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(revenueWidth, 100)}%` }}
                  />
                </div>
                <div className="h-4 bg-surface-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(costsWidth, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main Dashboard ──────────────────────────────────────────

export function DashboardPage() {
  const { currentOrg, orgUrl } = useOrg();
  const navigate = useNavigate();

  const {
    metrics,
    trend,
    activeLoadCount,
    availableTruckCount,
    activeDriverCount,
    recentLoads,
    period,
    setPeriod,
    periodPresets,
    loading
  } = useDashboard();

  // Build KPI card definitions
  const kpiCards = useMemo(() => [
    {
      name: 'Total Loads',
      value: loading ? '—' : (metrics.totalLoads || 0).toString(),
      subtitle: `${activeLoadCount} active`,
      icon: Package,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Revenue',
      value: loading ? '—' : formatCurrency(metrics.totalRevenue),
      subtitle: `${(metrics.totalMiles || 0).toLocaleString()} miles`,
      icon: DollarSign,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Rate/Mile',
      value: loading ? '—' : formatRate(metrics.revenuePerMile),
      subtitle: 'Revenue per mile',
      icon: TrendingUp,
      iconBg: metrics.revenuePerMile > metrics.costPerMile ? 'bg-green-500/10' : 'bg-warning/10',
      iconColor: metrics.revenuePerMile > metrics.costPerMile ? 'text-green-500' : 'text-warning'
    },
    {
      name: 'Cost/Mile',
      value: loading ? '—' : formatRate(metrics.costPerMile),
      subtitle: metrics.costPerMileSource === 'settings' ? 'From Settings' : 'From P&L',
      icon: ArrowDownRight,
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500'
    },
    {
      name: 'Net Profit/Mile',
      value: loading ? '—' : formatRate(metrics.netProfitPerMile),
      subtitle: metrics.netProfitPerMile >= 0 ? 'Profitable' : 'Below cost',
      icon: metrics.netProfitPerMile >= 0 ? TrendingUp : TrendingDown,
      iconBg: metrics.netProfitPerMile >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      iconColor: metrics.netProfitPerMile >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      name: 'Operating Margin',
      value: loading ? '—' : formatPercent(metrics.operatingMargin),
      subtitle: 'Net / Revenue',
      icon: BarChart3,
      iconBg: metrics.operatingMargin >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      iconColor: metrics.operatingMargin >= 0 ? 'text-green-500' : 'text-red-500'
    }
  ], [metrics, loading, activeLoadCount]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header + Period Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-title text-text-primary">Dashboard</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Financial overview for {currentOrg?.name}
          </p>
        </div>
        <PeriodSelector
          period={period}
          setPeriod={setPeriod}
          presets={periodPresets}
        />
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {kpiCards.map((card) => (
          <Card key={card.name} padding="compact" className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-body-sm text-text-secondary truncate">{card.name}</p>
                <p className="text-title-sm sm:text-headline text-text-primary mt-0.5 sm:mt-1 tabular-nums">
                  {card.value}
                </p>
                {card.subtitle && (
                  <p className="text-[10px] sm:text-small text-text-tertiary mt-1 sm:mt-2 truncate">
                    {card.subtitle}
                  </p>
                )}
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${card.iconBg} rounded-lg flex items-center justify-center shrink-0`}>
                <card.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${card.iconColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Performance Trend + Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Performance Trend */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && trend.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : (
              <PerformanceTrend trend={trend} />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button
              onClick={() => navigate(orgUrl('/loads/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Package className="w-4 h-4 text-accent" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Create New Load
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/drivers/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-success/10 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-success" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Driver
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/assets/trucks/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-warning/10 rounded-lg flex items-center justify-center">
                <Truck className="w-4 h-4 text-warning" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Truck
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/expenses/new'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <Receipt className="w-4 h-4 text-blue-600" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                Add Expense
              </span>
            </button>
            <button
              onClick={() => navigate(orgUrl('/pnl'))}
              className="w-full flex items-center gap-3 p-3 rounded-button bg-surface-secondary hover:bg-surface-tertiary transition-colors text-left"
            >
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-600" />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                View P&L
              </span>
            </button>
          </CardContent>
        </Card>
      </div>

      {/* Recent Loads - Full Width */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Loads</CardTitle>
            <button
              onClick={() => navigate(orgUrl('/loads'))}
              className="text-small font-medium text-accent hover:text-accent/80 transition-colors"
            >
              View all
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && recentLoads.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : recentLoads.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
              <p className="text-body-sm text-text-secondary">No loads yet</p>
              <button
                onClick={() => navigate(orgUrl('/loads/new'))}
                className="text-small font-medium text-accent hover:text-accent/80 mt-2 inline-block"
              >
                Create your first load
              </button>
            </div>
          ) : (
            <div className="space-y-1">
              {recentLoads.map((load) => {
                const statusConfig = getStatusConfig(LoadStatusConfig, load.status);
                const lane = load.lane || `${load.shipper?.city || '—'}, ${load.shipper?.state || ''} → ${load.consignee?.city || '—'}, ${load.consignee?.state || ''}`;

                return (
                  <div
                    key={load.id}
                    className="flex items-center justify-between py-3 border-b border-surface-tertiary last:border-0 cursor-pointer hover:bg-surface-secondary/50 rounded-lg px-2 -mx-2 transition-colors"
                    onClick={() => navigate(orgUrl(`/loads/${load.id}`))}
                  >
                    <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                      <div className="w-9 h-9 sm:w-10 sm:h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                        <Package className="w-4 h-4 sm:w-5 sm:h-5 text-text-secondary" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-body-sm font-medium text-text-primary truncate">
                          {load.reference_number}
                        </p>
                        <p className="text-small text-text-tertiary truncate">
                          {lane}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {load.financials?.revenue && (
                        <span className="text-small font-medium text-text-primary hidden sm:block tabular-nums">
                          {formatCurrency(load.financials.revenue)}
                        </span>
                      )}
                      <Badge variant={statusConfig?.color || 'gray'}>
                        {statusConfig?.label || load.status}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default DashboardPage;
