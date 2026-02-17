/**
 * PnlPage - Profit & Loss Statement
 *
 * The master financial view where all confirmed/approved data converges.
 * Shows standard income statement: Revenue → COGS → Gross Profit → OpEx → Net Income
 */

import { useMemo } from 'react';
import { usePnl } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Calendar,
  RefreshCw
} from 'lucide-react';

// ============================================
// HELPERS
// ============================================

const formatCurrency = (amount) => {
  if (amount == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatPercent = (value) => {
  if (value == null) return '0.0%';
  return `${value.toFixed(1)}%`;
};

const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month, 10) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
};

// ============================================
// KPI CARD
// ============================================

function KpiCard({ label, value, subtitle, icon: Icon, color = 'accent' }) {
  const colorClasses = {
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-50 text-green-600',
    red: 'bg-red-50 text-red-600',
    blue: 'bg-blue-50 text-blue-600'
  };

  return (
    <Card variant="elevated" padding="default">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-small font-medium text-text-secondary">{label}</p>
          <p className="text-title mt-1 text-text-primary truncate">{value}</p>
          {subtitle && (
            <p className="text-small text-text-tertiary mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${colorClasses[color]} flex-shrink-0`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </Card>
  );
}

// ============================================
// INCOME STATEMENT TABLE
// ============================================

function IncomeStatement({ report }) {
  if (!report) return null;

  const {
    revenue,
    costOfRevenue,
    grossProfit,
    grossMargin,
    operatingExpenses,
    netIncome,
    operatingMargin
  } = report;

  return (
    <Card variant="elevated" padding="none">
      <div className="px-6 py-4 border-b border-surface-tertiary">
        <h2 className="text-title-sm text-text-primary">Income Statement</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[400px]">
          <thead>
            <tr className="border-b border-surface-tertiary">
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">
                Account
              </th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">
                Amount
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-tertiary">
            {/* REVENUE */}
            <SectionHeader label="REVENUE" />
            <LineItem label="Load Revenue" amount={revenue.loadRevenue} indent={1} />
            <SubtotalRow label="Total Revenue" amount={revenue.loadRevenue} />

            {/* COST OF REVENUE */}
            <SectionHeader label="COST OF REVENUE" />
            {costOfRevenue.items.map(item => (
              <LineItem
                key={item.category}
                label={item.label}
                amount={item.amount}
                indent={1}
              />
            ))}
            {costOfRevenue.items.length === 0 && (
              <EmptyRow label="No cost of revenue items" />
            )}
            <SubtotalRow label="Total Cost of Revenue" amount={costOfRevenue.total} />

            {/* GROSS PROFIT */}
            <HighlightRow
              label="GROSS PROFIT"
              amount={grossProfit}
              percent={grossMargin}
            />

            {/* OPERATING EXPENSES */}
            <SectionHeader label="OPERATING EXPENSES" />
            {operatingExpenses.items.map(item => (
              <LineItem
                key={item.category}
                label={item.label}
                amount={item.amount}
                indent={1}
              />
            ))}
            {operatingExpenses.items.length === 0 && (
              <EmptyRow label="No operating expenses" />
            )}
            <SubtotalRow label="Total Operating Expenses" amount={operatingExpenses.total} />

            {/* NET INCOME */}
            <NetIncomeRow
              label="NET INCOME"
              amount={netIncome}
              percent={operatingMargin}
            />
          </tbody>
        </table>
      </div>
    </Card>
  );
}

function SectionHeader({ label }) {
  return (
    <tr>
      <td colSpan={2} className="px-6 py-3 text-small font-semibold text-text-secondary uppercase tracking-wider bg-surface-secondary">
        {label}
      </td>
    </tr>
  );
}

function LineItem({ label, amount, indent = 0 }) {
  return (
    <tr className="hover:bg-surface-secondary/50">
      <td className="px-6 py-2.5 text-body-sm text-text-primary" style={{ paddingLeft: `${1.5 + indent * 1.5}rem` }}>
        {label}
      </td>
      <td className="px-6 py-2.5 text-body-sm text-text-primary text-right tabular-nums">
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}

function EmptyRow({ label }) {
  return (
    <tr>
      <td colSpan={2} className="px-6 py-2.5 text-body-sm text-text-tertiary italic" style={{ paddingLeft: '3rem' }}>
        {label}
      </td>
    </tr>
  );
}

function SubtotalRow({ label, amount }) {
  return (
    <tr className="border-t border-surface-tertiary">
      <td className="px-6 py-2.5 text-body-sm font-medium text-text-primary">
        {label}
      </td>
      <td className="px-6 py-2.5 text-body-sm font-medium text-text-primary text-right tabular-nums">
        {formatCurrency(amount)}
      </td>
    </tr>
  );
}

function HighlightRow({ label, amount, percent }) {
  return (
    <tr className="bg-green-50/50 border-y border-green-100">
      <td className="px-6 py-3 text-body-sm font-semibold text-green-700">
        {label}
      </td>
      <td className="px-6 py-3 text-body-sm font-semibold text-green-700 text-right tabular-nums">
        {formatCurrency(amount)}
        {percent != null && (
          <span className="text-small font-normal text-green-600 ml-2">
            ({formatPercent(percent)})
          </span>
        )}
      </td>
    </tr>
  );
}

function NetIncomeRow({ label, amount, percent }) {
  const isPositive = amount >= 0;
  const colorClass = isPositive ? 'text-green-700' : 'text-red-600';
  const bgClass = isPositive ? 'bg-green-50' : 'bg-red-50';
  const borderClass = isPositive ? 'border-green-200' : 'border-red-200';

  return (
    <tr className={`${bgClass} border-t-2 ${borderClass}`}>
      <td className={`px-6 py-3 text-body font-bold ${colorClass}`}>
        {label}
      </td>
      <td className={`px-6 py-3 text-body font-bold ${colorClass} text-right tabular-nums`}>
        {formatCurrency(amount)}
        {percent != null && (
          <span className="text-body-sm font-semibold ml-2">
            ({formatPercent(percent)})
          </span>
        )}
      </td>
    </tr>
  );
}

// ============================================
// TREND CHART (Simple bar chart)
// ============================================

function TrendChart({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <Card variant="elevated" padding="default">
        <h2 className="text-title-sm text-text-primary mb-4">Monthly Trend</h2>
        <div className="flex items-center justify-center h-48 text-text-tertiary text-body-sm">
          No trend data available for this period
        </div>
      </Card>
    );
  }

  const maxValue = Math.max(...trend.map(t => Math.max(t.revenue, t.totalCosts)), 1);

  return (
    <Card variant="elevated" padding="default">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-title-sm text-text-primary">Monthly Trend</h2>
        <div className="flex items-center gap-4 text-small">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-accent" />
            <span className="text-text-secondary">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-red-400" />
            <span className="text-text-secondary">Total Costs</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {trend.map(month => (
          <div key={month.month} className="space-y-1">
            <div className="flex items-center justify-between text-small">
              <span className="text-text-secondary font-medium w-24 flex-shrink-0">
                {formatMonth(month.month)}
              </span>
              <span className={`font-medium tabular-nums ${month.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(month.netIncome)}
              </span>
            </div>
            <div className="flex gap-1 h-5">
              <div
                className="bg-accent rounded-sm transition-all duration-300"
                style={{ width: `${(month.revenue / maxValue) * 100}%`, minWidth: month.revenue > 0 ? '2px' : '0' }}
                title={`Revenue: ${formatCurrency(month.revenue)}`}
              />
              <div
                className="bg-red-400 rounded-sm transition-all duration-300"
                style={{ width: `${(month.totalCosts / maxValue) * 100}%`, minWidth: month.totalCosts > 0 ? '2px' : '0' }}
                title={`Costs: ${formatCurrency(month.totalCosts)}`}
              />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ============================================
// PERIOD SELECTOR
// ============================================

function PeriodSelector({ period, setPeriod, periodPresets, customDateFrom, setCustomDateFrom, customDateTo, setCustomDateTo, onRefresh, loading }) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-text-secondary" />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="text-body-sm border border-surface-tertiary rounded-button px-3 py-2 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          {Object.entries(periodPresets).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>

      {period === 'custom' && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customDateFrom}
            onChange={(e) => setCustomDateFrom(e.target.value)}
            className="text-body-sm border border-surface-tertiary rounded-button px-3 py-2 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <span className="text-text-tertiary">to</span>
          <input
            type="date"
            value={customDateTo}
            onChange={(e) => setCustomDateTo(e.target.value)}
            className="text-body-sm border border-surface-tertiary rounded-button px-3 py-2 bg-white text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>
      )}

      <button
        onClick={onRefresh}
        disabled={loading}
        className="p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
        title="Refresh"
      >
        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
      </button>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export function PnlPage() {
  const {
    report,
    trend,
    loading,
    error,
    period,
    setPeriod,
    periodPresets,
    customDateFrom,
    setCustomDateFrom,
    customDateTo,
    setCustomDateTo,
    refetch
  } = usePnl();

  // Derive KPI values from report
  const kpis = useMemo(() => {
    if (!report) return null;
    return {
      totalRevenue: report.revenue.loadRevenue,
      grossProfit: report.grossProfit,
      grossMargin: report.grossMargin,
      netIncome: report.netIncome,
      operatingMargin: report.operatingMargin,
      loadCount: report.revenue.loadCount,
      revenuePerMile: report.metrics.revenuePerMile,
      costPerMile: report.metrics.costPerMile
    };
  }, [report]);

  // Loading state (first load)
  if (loading && !report) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-title text-text-primary">Profit & Loss</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Financial overview from completed loads and approved expenses
          </p>
        </div>
        <PeriodSelector
          period={period}
          setPeriod={setPeriod}
          periodPresets={periodPresets}
          customDateFrom={customDateFrom}
          setCustomDateFrom={setCustomDateFrom}
          customDateTo={customDateTo}
          setCustomDateTo={setCustomDateTo}
          onRefresh={refetch}
          loading={loading}
        />
      </div>

      {/* Error */}
      {error && (
        <Card variant="outline" padding="default" className="border-red-200 bg-red-50">
          <p className="text-body-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            label="Total Revenue"
            value={formatCurrency(kpis.totalRevenue)}
            subtitle={`${kpis.loadCount} loads`}
            icon={DollarSign}
            color="accent"
          />
          <KpiCard
            label="Gross Profit"
            value={formatCurrency(kpis.grossProfit)}
            subtitle={`${formatPercent(kpis.grossMargin)} margin`}
            icon={TrendingUp}
            color="green"
          />
          <KpiCard
            label="Net Income"
            value={formatCurrency(kpis.netIncome)}
            subtitle={`${formatPercent(kpis.operatingMargin)} margin`}
            icon={kpis.netIncome >= 0 ? TrendingUp : TrendingDown}
            color={kpis.netIncome >= 0 ? 'green' : 'red'}
          />
          <KpiCard
            label="Revenue/Mile"
            value={`$${kpis.revenuePerMile.toFixed(2)}`}
            subtitle={`$${kpis.costPerMile.toFixed(2)} cost/mile`}
            icon={BarChart3}
            color="blue"
          />
        </div>
      )}

      {/* Income Statement + Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <IncomeStatement report={report} />
        </div>
        <div className="lg:col-span-1">
          <TrendChart trend={trend} />
        </div>
      </div>
    </div>
  );
}

export default PnlPage;
