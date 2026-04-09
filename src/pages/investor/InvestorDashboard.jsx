import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  DollarSign,
  Package,
  CheckCircle2,
  Truck,
  TrendingUp,
  TrendingDown,
  ArrowRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { useLoadStats, usePnlReport, usePnlTrend, useLoadsList } from '../../hooks';
import { cn } from '../../lib/utils';

const statusVariants = {
  draft: 'gray',
  quoted: 'blue',
  booked: 'purple',
  dispatched: 'indigo',
  in_transit: 'orange',
  delivered: 'green',
  completed: 'emerald',
  cancelled: 'red',
  invoiced: 'teal',
  paid: 'cyan'
};

function formatCurrency(value) {
  if (value == null) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2
  }).format(value);
}

function formatPercent(value) {
  if (value == null) return '0.0%';
  return `${Number(value).toFixed(1)}%`;
}

export function InvestorDashboard() {
  const { stats, loading: statsLoading, fetchStats } = useLoadStats();
  const { report, loading: pnlLoading, fetchPnl } = usePnlReport();
  const { trend, loading: trendLoading, fetchTrend } = usePnlTrend();
  const { loads, loading: loadsLoading, fetchLoads } = useLoadsList();

  useEffect(() => {
    fetchStats();
    fetchPnl({});
    fetchTrend({});
    fetchLoads({ limit: 10 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const activeLoads =
    (stats?.counts?.booked || 0) +
    (stats?.counts?.dispatched || 0) +
    (stats?.counts?.in_transit || stats?.counts?.inTransit || 0);

  const kpiCards = [
    {
      title: 'Total Revenue',
      value: formatCurrency(stats?.revenue?.total),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10'
    },
    {
      title: 'Active Loads',
      value: activeLoads,
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Delivered',
      value: stats?.counts?.delivered || 0,
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Fleet Size',
      value: stats?.counts?.total || 0,
      icon: Truck,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10'
    }
  ];

  const isLoading = statsLoading || pnlLoading || loadsLoading;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">Investor Dashboard</h1>
        <p className="text-body-sm text-text-secondary mt-1">Portfolio overview</p>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((kpi) => (
          <Card key={kpi.title} variant="elevated" padding="default">
            <div className="flex items-center gap-4">
              <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', kpi.bgColor)}>
                <kpi.icon className={cn('w-6 h-6', kpi.color)} />
              </div>
              <div>
                <div className="text-small text-text-tertiary">{kpi.title}</div>
                <div className="text-title-sm text-text-primary font-semibold">
                  {statsLoading ? <Spinner size="sm" className="text-text-tertiary" /> : kpi.value}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* P&L Summary */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle>P&L Summary</CardTitle>
        </CardHeader>
        <CardContent>
          {pnlLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" className="text-accent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <div className="text-small text-text-tertiary mb-1">Gross Profit</div>
                <div className="text-title-sm text-text-primary font-semibold">
                  {formatCurrency(report?.gross_profit)}
                </div>
              </div>
              <div>
                <div className="text-small text-text-tertiary mb-1">Net Income</div>
                <div className="text-title-sm text-text-primary font-semibold">
                  {formatCurrency(report?.net_income)}
                </div>
              </div>
              <div>
                <div className="text-small text-text-tertiary mb-1">Gross Margin %</div>
                <div className="flex items-center gap-2">
                  <span className="text-title-sm text-text-primary font-semibold">
                    {formatPercent(report?.gross_margin_pct)}
                  </span>
                  {report?.gross_margin_pct > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
              <div>
                <div className="text-small text-text-tertiary mb-1">Operating Margin %</div>
                <div className="flex items-center gap-2">
                  <span className="text-title-sm text-text-primary font-semibold">
                    {formatPercent(report?.operating_margin_pct)}
                  </span>
                  {report?.operating_margin_pct > 0 ? (
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Loads */}
      <Card variant="elevated" padding="default">
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Recent Loads</CardTitle>
          <Link
            to="/investor/loads"
            className="text-body-sm text-accent hover:text-accent/80 flex items-center gap-1"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </CardHeader>
        <CardContent>
          {loadsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Spinner size="md" className="text-accent" />
            </div>
          ) : !loads?.length ? (
            <div className="text-center py-8 text-text-tertiary text-body-sm">
              No loads found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-surface-tertiary">
                    <th className="text-small font-medium text-text-tertiary pb-3 pr-4">Reference</th>
                    <th className="text-small font-medium text-text-tertiary pb-3 pr-4">Lane</th>
                    <th className="text-small font-medium text-text-tertiary pb-3 pr-4 text-right">Revenue</th>
                    <th className="text-small font-medium text-text-tertiary pb-3 pr-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-tertiary">
                  {loads.map((load) => {
                    const lane = [load.shipper_city, load.consignee_city]
                      .filter(Boolean)
                      .join(' → ');

                    return (
                      <tr key={load.id} className="hover:bg-surface-secondary/50 transition-colors">
                        <td className="py-3 pr-4">
                          <Link
                            to={`/investor/loads/${load.id}`}
                            className="text-body-sm font-medium text-accent hover:underline"
                          >
                            {load.reference_number || '-'}
                          </Link>
                        </td>
                        <td className="py-3 pr-4 text-body-sm text-text-secondary">
                          {lane || '-'}
                        </td>
                        <td className="py-3 pr-4 text-body-sm text-text-primary text-right font-medium">
                          {formatCurrency(load.revenue)}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariants[load.status] || 'gray'}>
                            {(load.status || 'unknown').replace(/_/g, ' ')}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestorDashboard;
