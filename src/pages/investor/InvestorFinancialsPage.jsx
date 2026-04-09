/**
 * InvestorFinancialsPage - Read-only P&L report and expense overview
 *
 * Shows P&L summary, trend, COGS/OpEx breakdowns, and recent expenses.
 * No approve/reject/create/edit capabilities.
 */

import { useEffect } from 'react';
import { usePnlReport, usePnlTrend, useExpensesList } from '../../hooks';
import { ExpenseStatusConfig, getStatusConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Receipt,
  Layers
} from 'lucide-react';

const formatCurrency = (amount) => {
  if (amount == null) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatPercent = (value) => {
  if (value == null) return '-';
  return `${(value * 100).toFixed(1)}%`;
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(typeof date === 'string' && date.length === 10 ? date + 'T12:00:00' : date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

function SummaryCard({ icon: Icon, iconBg, label, value, subValue }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-text-tertiary">{label}</p>
          <p className="text-xl font-bold text-text-primary">{value}</p>
          {subValue && <p className="text-xs text-text-tertiary">{subValue}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function InvestorFinancialsPage() {
  const { report, loading: pnlLoading, fetchPnl } = usePnlReport();
  const { trend, loading: trendLoading, fetchTrend } = usePnlTrend();
  const { expenses, loading: expensesLoading, fetchExpenses } = useExpensesList();

  useEffect(() => {
    fetchPnl({});
    fetchTrend({});
    fetchExpenses({ status: ['approved', 'paid'], limit: 20 });
  }, []);

  const loading = pnlLoading && !report;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const totalRevenue = report?.revenue?.total || 0;
  const totalCogs = report?.costOfRevenue?.total || 0;
  const grossProfit = report?.grossProfit || 0;
  const netIncome = report?.netIncome || 0;
  const grossMargin = totalRevenue ? grossProfit / totalRevenue : null;
  const operatingMargin = totalRevenue ? netIncome / totalRevenue : null;

  const cogsItems = report?.costOfRevenue?.items || [];
  const opexItems = report?.operatingExpenses?.items || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Financial Overview</h1>

      {/* P&L Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <SummaryCard
          icon={DollarSign}
          iconBg="bg-blue-50 text-blue-600"
          label="Total Revenue"
          value={formatCurrency(totalRevenue)}
        />
        <SummaryCard
          icon={TrendingDown}
          iconBg="bg-red-50 text-red-600"
          label="Total COGS"
          value={formatCurrency(totalCogs)}
        />
        <SummaryCard
          icon={TrendingUp}
          iconBg="bg-green-50 text-green-600"
          label="Gross Profit"
          value={formatCurrency(grossProfit)}
        />
        <SummaryCard
          icon={BarChart3}
          iconBg="bg-purple-50 text-purple-600"
          label="Net Income"
          value={formatCurrency(netIncome)}
        />
        <SummaryCard
          icon={TrendingUp}
          iconBg="bg-emerald-50 text-emerald-600"
          label="Gross Margin %"
          value={formatPercent(grossMargin)}
        />
        <SummaryCard
          icon={BarChart3}
          iconBg="bg-indigo-50 text-indigo-600"
          label="Operating Margin %"
          value={formatPercent(operatingMargin)}
        />
      </div>

      {/* P&L Trend */}
      {trend && trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-text-tertiary" />
              Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="px-3 py-2 text-left text-xs font-semibold text-text-tertiary uppercase">Month</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-tertiary uppercase">Revenue</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-tertiary uppercase">Costs</th>
                    <th className="px-3 py-2 text-right text-xs font-semibold text-text-tertiary uppercase">Net Income</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-tertiary">
                  {trend.map((item, idx) => (
                    <tr key={idx} className="hover:bg-accent/5 transition-colors">
                      <td className="px-3 py-2 text-sm font-medium text-text-primary">{item.month}</td>
                      <td className="px-3 py-2 text-sm text-text-primary text-right">{formatCurrency(item.revenue)}</td>
                      <td className="px-3 py-2 text-sm text-text-primary text-right">{formatCurrency(item.costs)}</td>
                      <td className="px-3 py-2 text-sm font-semibold text-right">
                        <span className={item.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(item.netIncome)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdowns Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* COGS Breakdown */}
        {cogsItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-text-tertiary" />
                COGS Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {cogsItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <span className="text-sm font-medium text-text-primary">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* OpEx Breakdown */}
        {opexItems.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-text-tertiary" />
                OpEx Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {opexItems.map((item, idx) => (
                  <div key={idx} className="flex justify-between py-1.5">
                    <span className="text-sm text-text-secondary">{item.label}</span>
                    <span className="text-sm font-medium text-text-primary">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Recent Expenses */}
      <Card padding="none" className="overflow-hidden border border-surface-tertiary">
        <div className="px-4 py-3 border-b border-surface-tertiary bg-surface-secondary/50">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-text-tertiary" />
            <h2 className="text-sm font-semibold text-text-primary">Recent Expenses</h2>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Vendor</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Category</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider">Amount</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {(!expenses || expenses.length === 0) ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center">
                    <p className="text-text-tertiary text-sm">No recent expenses</p>
                  </td>
                </tr>
              ) : (
                expenses.map((expense) => {
                  const status = getStatusConfig(ExpenseStatusConfig, expense.status, {
                    label: expense.status || 'Unknown',
                    variant: 'gray'
                  });

                  return (
                    <tr key={expense.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {formatDate(expense.date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {expense.vendor || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary capitalize">
                        {expense.category?.replace(/_/g, ' ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary text-right">
                        {formatCurrency(expense.amount)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default InvestorFinancialsPage;
