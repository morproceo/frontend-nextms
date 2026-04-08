/**
 * ReportingSummaryPage - Reporting Summary with KPIs, trend, and monthly breakdown
 *
 * Uses the existing useDashboard hook. Same KPIs + trend as Dashboard
 * but in a dedicated reporting context with export support.
 */

import { useMemo } from 'react';
import { useOrg } from '../../contexts/OrgContext';
import { useDashboard } from '../../hooks';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { exportToCSV } from '../../utils/exportCsv';
import {
  Package,
  DollarSign,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  BarChart3,
  Download,
  RefreshCw
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

const formatMonth = (monthStr) => {
  if (!monthStr) return '';
  const [year, month] = monthStr.split('-');
  const date = new Date(year, parseInt(month, 10) - 1);
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
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

// ── Performance Trend Chart ─────────────────────────────────

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

  const maxValue = Math.max(
    ...trend.map(t => Math.max(Math.abs(t.revenue || 0), Math.abs(t.totalCosts || 0))),
    1
  );

  return (
    <div>
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

      <div className="space-y-3">
        {trend.map((item, i) => {
          const revenueWidth = maxValue > 0 ? ((item.revenue || 0) / maxValue) * 100 : 0;
          const costsWidth = maxValue > 0 ? ((item.totalCosts || 0) / maxValue) * 100 : 0;
          const net = (item.revenue || 0) - (item.totalCosts || 0);

          return (
            <div key={item.month || i} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-small font-medium text-text-secondary w-16 shrink-0">
                  {formatMonth(item.month) || `Month ${i + 1}`}
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

// ── Monthly Breakdown Table ─────────────────────────────────

function MonthlyBreakdownTable({ trend }) {
  if (!trend || trend.length === 0) {
    return (
      <Card variant="elevated" padding="default">
        <h2 className="text-title-sm text-text-primary mb-4">Monthly Breakdown</h2>
        <div className="flex items-center justify-center h-32 text-text-tertiary text-body-sm">
          No data available for this period
        </div>
      </Card>
    );
  }

  return (
    <Card variant="elevated" padding="none">
      <div className="px-6 py-4 border-b border-surface-tertiary">
        <h2 className="text-title-sm text-text-primary">Monthly Breakdown</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[500px]">
          <thead>
            <tr className="border-b border-surface-tertiary">
              <th className="px-6 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">
                Month
              </th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">
                Revenue
              </th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">
                Costs
              </th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">
                Net
              </th>
              <th className="px-6 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">
                Margin
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-tertiary">
            {trend.map((row, i) => {
              const net = (row.revenue || 0) - (row.totalCosts || 0);
              const margin = row.revenue > 0 ? (net / row.revenue) * 100 : 0;

              return (
                <tr key={row.month || i} className="hover:bg-surface-secondary/50">
                  <td className="px-6 py-3 text-body-sm text-text-primary font-medium">
                    {formatMonth(row.month)}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary text-right tabular-nums">
                    {formatCurrency(row.revenue)}
                  </td>
                  <td className="px-6 py-3 text-body-sm text-text-primary text-right tabular-nums">
                    {formatCurrency(row.totalCosts)}
                  </td>
                  <td className={`px-6 py-3 text-body-sm font-medium text-right tabular-nums ${net >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(net)}
                  </td>
                  <td className={`px-6 py-3 text-body-sm text-right tabular-nums ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatPercent(margin)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Main Page ───────────────────────────────────────────────

export function ReportingSummaryPage() {
  const { currentOrg } = useOrg();
  const {
    metrics,
    trend,
    period,
    setPeriod,
    periodPresets,
    loading,
    refetch
  } = useDashboard();

  // KPI cards
  const kpiCards = useMemo(() => [
    {
      name: 'Total Loads',
      value: loading ? '—' : (metrics.totalLoads || 0).toString(),
      icon: Package,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Revenue',
      value: loading ? '—' : formatCurrency(metrics.totalRevenue),
      icon: DollarSign,
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent'
    },
    {
      name: 'Rate/Mile',
      value: loading ? '—' : formatRate(metrics.revenuePerMile),
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
      icon: metrics.netProfitPerMile >= 0 ? TrendingUp : TrendingDown,
      iconBg: metrics.netProfitPerMile >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      iconColor: metrics.netProfitPerMile >= 0 ? 'text-green-500' : 'text-red-500'
    },
    {
      name: 'Op. Margin',
      value: loading ? '—' : formatPercent(metrics.operatingMargin),
      icon: BarChart3,
      iconBg: metrics.operatingMargin >= 0 ? 'bg-green-500/10' : 'bg-red-500/10',
      iconColor: metrics.operatingMargin >= 0 ? 'text-green-500' : 'text-red-500'
    }
  ], [metrics, loading]);

  // Export monthly breakdown as CSV
  const handleExport = () => {
    if (!trend || trend.length === 0) return;
    exportToCSV(
      trend,
      [
        { label: 'Month', accessor: row => formatMonth(row.month) },
        { label: 'Revenue', accessor: row => row.revenue || 0 },
        { label: 'Total Costs', accessor: row => row.totalCosts || 0 },
        { label: 'Net Income', accessor: row => (row.revenue || 0) - (row.totalCosts || 0) },
        { label: 'Margin %', accessor: row => row.revenue > 0 ? (((row.revenue - (row.totalCosts || 0)) / row.revenue) * 100).toFixed(1) : '0.0' }
      ],
      'reporting-summary'
    );
  };

  if (loading && !trend?.length) {
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
          <h1 className="text-xl sm:text-title text-text-primary">Reporting Summary</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Financial overview for {currentOrg?.name}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <PeriodSelector
            period={period}
            setPeriod={setPeriod}
            presets={periodPresets}
          />
          <button
            onClick={refetch}
            disabled={loading}
            className="p-2 rounded-button text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            disabled={!trend || trend.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-accent text-white rounded-button text-body-sm font-medium hover:bg-accent/90 transition-colors disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        </div>
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

      {/* Performance Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Trend</CardTitle>
        </CardHeader>
        <CardContent>
          {loading && (!trend || trend.length === 0) ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : (
            <PerformanceTrend trend={trend} />
          )}
        </CardContent>
      </Card>

      {/* Monthly Breakdown Table */}
      <MonthlyBreakdownTable trend={trend} />
    </div>
  );
}

export default ReportingSummaryPage;
