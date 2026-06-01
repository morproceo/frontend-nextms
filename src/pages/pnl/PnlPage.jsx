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
    <Card variant="elevated" padding="compact" className="p-3 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] sm:text-small font-medium text-text-secondary truncate">{label}</p>
          <p className="text-title-sm sm:text-headline mt-0.5 sm:mt-1 text-text-primary tabular-nums truncate">{value}</p>
          {subtitle && (
            <p className="text-[10px] sm:text-small text-text-tertiary mt-0.5 sm:mt-1 truncate">{subtitle}</p>
          )}
        </div>
        <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg ${colorClasses[color]} flex-shrink-0 flex items-center justify-center`}>
          <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
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

  // Shared row data — feeds both the desktop table and the mobile
  // stacked list so the two views can't drift.
  const sections = [
    {
      label: 'REVENUE',
      items: [{ label: 'Load Revenue', amount: revenue.loadRevenue, indent: 1 }],
      subtotal: { label: 'Total Revenue', amount: revenue.loadRevenue }
    },
    {
      label: 'COST OF REVENUE',
      items: costOfRevenue.items.flatMap((i) => {
        const row = { label: i.label, amount: i.amount, indent: 1 };
        // Show the base + adjustment breakdown for the driver-pay line
        // when there's been at least one carrier adjustment, so the math
        // is visible instead of just a single number.
        if (i.category === 'load_driver_pay' && i.adjustments_count > 0) {
          const adjLabel = i.adjustments_total === 0
            ? `Earnings adjustments (${i.adjustments_count} · net $0)`
            : `Earnings adjustments (${i.adjustments_count})`;
          return [
            { label: 'Base settlement pay', amount: i.base_amount, indent: 2, subtle: true },
            { label: adjLabel, amount: i.adjustments_total, indent: 2, subtle: true },
            row
          ];
        }
        return [row];
      }),
      emptyLabel: 'No cost of revenue items',
      subtotal: { label: 'Total Cost of Revenue', amount: costOfRevenue.total }
    },
    {
      highlight: { label: 'GROSS PROFIT', amount: grossProfit, percent: grossMargin }
    },
    {
      label: 'OPERATING EXPENSES',
      items: operatingExpenses.items.map((i) => ({ label: i.label, amount: i.amount, indent: 1 })),
      emptyLabel: 'No operating expenses',
      subtotal: { label: 'Total Operating Expenses', amount: operatingExpenses.total }
    },
    {
      net: { label: 'NET INCOME', amount: netIncome, percent: operatingMargin }
    }
  ];

  return (
    <Card variant="elevated" padding="none">
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-surface-tertiary">
        <h2 className="text-body sm:text-title-sm font-semibold text-text-primary">Income Statement</h2>
      </div>

      {/* Desktop / tablet — the existing table. */}
      <div className="hidden md:block">
        <table className="w-full">
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
            {sections.map((s, i) => (
              <SectionRows key={i} section={s} />
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone — stacked card rows. Tighter padding + larger touch
          targets for amounts. Hidden visually from md+ to keep the
          file's only source of section data the shared array. */}
      <div className="md:hidden">
        {sections.map((s, i) => (
          <MobileSection key={i} section={s} />
        ))}
      </div>
    </Card>
  );
}

function SectionRows({ section }) {
  if (section.highlight) {
    return <HighlightRow {...section.highlight} />;
  }
  if (section.net) {
    return <NetIncomeRow {...section.net} />;
  }
  return (
    <>
      <SectionHeader label={section.label} />
      {section.items.map((it, idx) => (
        <LineItem key={idx} label={it.label} amount={it.amount} indent={it.indent || 0} subtle={it.subtle} />
      ))}
      {section.items.length === 0 && section.emptyLabel && (
        <EmptyRow label={section.emptyLabel} />
      )}
      {section.subtotal && <SubtotalRow {...section.subtotal} />}
    </>
  );
}

function MobileSection({ section }) {
  if (section.highlight) {
    return (
      <div className="px-4 py-3 bg-green-50/60 border-y border-green-100 flex items-baseline justify-between gap-3">
        <span className="text-body-sm font-semibold text-green-700">{section.highlight.label}</span>
        <span className="text-right">
          <div className="text-body font-semibold text-green-700 tabular-nums">
            {formatCurrency(section.highlight.amount)}
          </div>
          {section.highlight.percent != null && (
            <div className="text-[11px] font-normal text-green-600">
              {formatPercent(section.highlight.percent)} margin
            </div>
          )}
        </span>
      </div>
    );
  }
  if (section.net) {
    const isPos = section.net.amount >= 0;
    return (
      <div className={`px-4 py-3 border-t-2 ${isPos ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} flex items-baseline justify-between gap-3`}>
        <span className={`text-body font-bold ${isPos ? 'text-green-700' : 'text-red-600'}`}>{section.net.label}</span>
        <span className="text-right">
          <div className={`text-body font-bold tabular-nums ${isPos ? 'text-green-700' : 'text-red-600'}`}>
            {formatCurrency(section.net.amount)}
          </div>
          {section.net.percent != null && (
            <div className={`text-[11px] font-semibold ${isPos ? 'text-green-600' : 'text-red-500'}`}>
              {formatPercent(section.net.percent)} margin
            </div>
          )}
        </span>
      </div>
    );
  }
  // Regular section.
  return (
    <div>
      <div className="px-4 py-2 bg-surface-secondary text-[10px] uppercase tracking-wider font-semibold text-text-secondary">
        {section.label}
      </div>
      <div className="divide-y divide-surface-tertiary">
        {section.items.length === 0 && section.emptyLabel && (
          <div className="px-4 py-2 text-body-sm text-text-tertiary italic">{section.emptyLabel}</div>
        )}
        {section.items.map((it, idx) => (
          <div key={idx} className={`px-4 py-2 flex items-baseline justify-between gap-3 ${it.subtle ? 'pl-8' : ''}`}>
            <span className={`truncate ${it.subtle ? 'text-small text-text-tertiary' : 'text-body-sm text-text-primary'}`}>{it.label}</span>
            <span className={`tabular-nums flex-shrink-0 ${it.subtle ? 'text-small text-text-tertiary' : 'text-body-sm text-text-primary'}`}>
              {formatCurrency(it.amount)}
            </span>
          </div>
        ))}
        {section.subtotal && (
          <div className="px-4 py-2 flex items-baseline justify-between gap-3 bg-surface-secondary/40">
            <span className="text-body-sm font-semibold text-text-primary">{section.subtotal.label}</span>
            <span className="text-body-sm font-semibold text-text-primary tabular-nums">
              {formatCurrency(section.subtotal.amount)}
            </span>
          </div>
        )}
      </div>
    </div>
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

function LineItem({ label, amount, indent = 0, subtle = false }) {
  const textClass = subtle ? 'text-text-tertiary text-small' : 'text-text-primary text-body-sm';
  return (
    <tr className="hover:bg-surface-secondary/50">
      <td className={`px-6 py-2 ${textClass}`} style={{ paddingLeft: `${1.5 + indent * 1.5}rem` }}>
        {label}
      </td>
      <td className={`px-6 py-2 ${textClass} text-right tabular-nums`}>
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
    <Card variant="elevated" padding="compact" className="p-4 sm:p-6">
      <div className="flex items-start sm:items-center justify-between mb-3 sm:mb-4 gap-2 flex-wrap">
        <h2 className="text-body sm:text-title-sm font-semibold text-text-primary">Monthly Trend</h2>
        <div className="flex items-center gap-3 sm:gap-4 text-[11px] sm:text-small">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-accent" />
            <span className="text-text-secondary">Revenue</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-sm bg-red-400" />
            <span className="text-text-secondary">Costs</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5 sm:space-y-3">
        {trend.map(month => (
          <div key={month.month} className="space-y-1">
            <div className="flex items-center justify-between text-[11px] sm:text-small gap-2">
              <span className="text-text-secondary font-medium w-16 sm:w-24 flex-shrink-0 truncate">
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-title text-text-primary">Profit &amp; Loss</h1>
          <p className="text-[11px] sm:text-body-sm text-text-secondary mt-0.5 sm:mt-1">
            Completed loads and approved expenses
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
        <Card variant="outline" padding="compact" className="border-red-200 bg-red-50 p-3 sm:p-4">
          <p className="text-body-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* KPI Cards */}
      {kpis && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
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
