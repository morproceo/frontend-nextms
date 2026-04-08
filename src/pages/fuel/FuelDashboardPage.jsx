/**
 * FuelDashboardPage - Fuel management dashboard overview
 *
 * Shows fuel spend stats, recent transactions, top trucks by cost,
 * and quick action buttons for common fuel management tasks.
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFuelDashboard } from '../../hooks';
import {
  FuelTransactionStatusLabels,
  FuelTransactionStatusColors
} from '../../enums/fuel';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  DollarSign,
  Fuel,
  TrendingDown,
  AlertCircle,
  Plus,
  Upload,
  CreditCard,
  Truck
} from 'lucide-react';

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatGallons = (gallons) => {
  if (!gallons && gallons !== 0) return '0';
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  }).format(gallons);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit'
  });
};

export function FuelDashboardPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const { stats, recentTransactions, loading } = useFuelDashboard();

  const statCards = [
    {
      name: 'Total Spend',
      value: formatCurrency(stats?.amounts?.total_spend),
      icon: DollarSign,
      color: 'accent'
    },
    {
      name: 'Total Gallons',
      value: formatGallons(stats?.amounts?.total_gallons),
      icon: Fuel,
      color: 'blue-600'
    },
    {
      name: 'Avg PPG',
      value: stats?.amounts?.avg_ppg ? `$${Number(stats.amounts.avg_ppg).toFixed(3)}` : '$0.000',
      icon: TrendingDown,
      color: 'success'
    },
    {
      name: 'Pending Verification',
      value: stats?.counts?.pending_verification?.toString() || '0',
      icon: AlertCircle,
      color: 'warning'
    }
  ];

  const topTrucks = stats?.byTruck || [];

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-title text-text-primary">Fuel Dashboard</h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Overview of fuel spend and activity
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => (
          <Card key={stat.name} padding="compact" className="p-3 sm:p-4">
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="text-[11px] sm:text-body-sm text-text-secondary truncate">{stat.name}</p>
                <p className="text-title-sm sm:text-headline text-text-primary mt-0.5 sm:mt-1">
                  {loading ? '\u2014' : stat.value}
                </p>
              </div>
              <div className={`w-8 h-8 sm:w-10 sm:h-10 bg-${stat.color}/10 rounded-lg flex items-center justify-center shrink-0`}>
                <stat.icon className={`w-4 h-4 sm:w-5 sm:h-5 text-${stat.color}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
        <Button onClick={() => navigate(orgUrl('/fuel/transactions/new'))} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Transaction</span>
        </Button>
        <Button variant="secondary" onClick={() => navigate(orgUrl('/fuel/transactions/import'))} className="shrink-0">
          <Upload className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Import CSV</span>
        </Button>
        <Button variant="secondary" onClick={() => navigate(orgUrl('/fuel/cards'))} className="shrink-0">
          <CreditCard className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Manage Cards</span>
        </Button>
      </div>

      {/* Recent Transactions & Top Trucks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Transactions</CardTitle>
              <button
                onClick={() => navigate(orgUrl('/fuel/transactions'))}
                className="text-small font-medium text-accent hover:text-accent/80 transition-colors"
              >
                View all
              </button>
            </div>
          </CardHeader>
          <CardContent>
            {loading && (!recentTransactions || recentTransactions.length === 0) ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : !recentTransactions || recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <Fuel className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-body-sm text-text-secondary">No fuel transactions yet</p>
                <button
                  onClick={() => navigate(orgUrl('/fuel/transactions/new'))}
                  className="text-small font-medium text-accent hover:text-accent/80 mt-2 inline-block"
                >
                  Add your first transaction
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto -mx-4 sm:mx-0">
                <table className="w-full">
                  <thead className="bg-surface-secondary">
                    <tr>
                      <th className="px-3 py-2 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Date</th>
                      <th className="px-3 py-2 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Merchant</th>
                      <th className="px-3 py-2 text-left text-small font-medium text-text-secondary uppercase tracking-wider hidden sm:table-cell">Truck</th>
                      <th className="px-3 py-2 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Gallons</th>
                      <th className="px-3 py-2 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Total</th>
                      <th className="px-3 py-2 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-tertiary">
                    {recentTransactions.slice(0, 10).map((txn) => (
                      <tr
                        key={txn.id}
                        className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                        onClick={() => navigate(orgUrl(`/fuel/transactions/${txn.id}`))}
                      >
                        <td className="px-3 py-3 text-body-sm text-text-secondary whitespace-nowrap">
                          {formatDate(txn.transaction_date)}
                        </td>
                        <td className="px-3 py-3 text-body-sm text-text-primary font-medium truncate max-w-[160px]">
                          {txn.merchant_name || '-'}
                        </td>
                        <td className="px-3 py-3 text-body-sm text-text-secondary hidden sm:table-cell">
                          {txn.truck?.unit_number || '-'}
                        </td>
                        <td className="px-3 py-3 text-body-sm text-text-primary text-right tabular-nums">
                          {formatGallons(txn.gallons)}
                        </td>
                        <td className="px-3 py-3 text-body-sm font-medium text-text-primary text-right tabular-nums">
                          {formatCurrency(txn.total_amount)}
                        </td>
                        <td className="px-3 py-3">
                          <Badge variant={FuelTransactionStatusColors[txn.status] || 'gray'} size="sm">
                            {FuelTransactionStatusLabels[txn.status] || txn.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Trucks by Fuel Cost */}
        <Card>
          <CardHeader>
            <CardTitle>Top Trucks by Fuel Cost</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && topTrucks.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <Spinner size="md" />
              </div>
            ) : topTrucks.length === 0 ? (
              <div className="text-center py-8">
                <Truck className="w-10 h-10 text-text-tertiary mx-auto mb-2" />
                <p className="text-body-sm text-text-secondary">No truck fuel data yet</p>
              </div>
            ) : (
              <div className="space-y-1">
                {topTrucks.map((truck, index) => (
                  <div
                    key={truck.truck_id || index}
                    className="flex items-center justify-between py-3 border-b border-surface-tertiary last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-surface-secondary rounded-lg flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4 text-text-secondary" />
                      </div>
                      <span className="text-body-sm font-medium text-text-primary truncate">
                        {truck.truck?.unit_number || `Truck ${index + 1}`}
                      </span>
                    </div>
                    <span className="text-body-sm font-medium text-text-primary tabular-nums shrink-0 ml-3">
                      {formatCurrency(truck.total)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default FuelDashboardPage;
