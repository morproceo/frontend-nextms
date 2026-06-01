/**
 * DriverEarningsPage
 *
 * Reads from the driver-owned earnings ledger (driver_earnings). Each row
 * survives carrier load-deletion and driver org off-boarding. Net pay per
 * row reflects base pay + any carrier-issued adjustments. Status badge
 * tells the driver whether the money is still earned/pending, on an open
 * settlement, or paid.
 */

import { useEffect, useState } from 'react';
import { useDriverPortalEarnings } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Spinner } from '../../components/ui/Spinner';
import { Badge } from '../../components/ui/Badge';
import {
  DollarSign,
  TrendingUp,
  Package,
  MapPin,
  Truck,
  ChevronDown,
  ChevronRight,
  Building2,
  AlertTriangle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';

const STATUS_META = {
  earned: { label: 'Pending', variant: 'gray', Icon: Clock },
  in_settlement: { label: 'On settlement', variant: 'blue', Icon: TrendingUp },
  paid: { label: 'Paid', variant: 'emerald', Icon: CheckCircle2 }
};

export function DriverEarningsPage() {
  const { history, summary, loading, refetch } = useDriverPortalEarnings();
  const [expandedId, setExpandedId] = useState(null);

  // Refetch when the tab regains focus. A frontend WebSocket subscriber for
  // `earnings_updated` is its own piece of work (Phase 2 toast system);
  // until then this is the cheapest way to pick up carrier-issued
  // adjustments and PAID stamps without polling on a timer.
  useEffect(() => {
    const onFocus = () => refetch?.();
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') refetch?.();
    });
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [refetch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-headline text-text-primary">Earnings</h1>
        <p className="text-body text-text-secondary mt-1">
          Your lifetime earnings on MorPro — stays with you, even if a load is
          edited or you switch carriers.
        </p>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryTile
          label="Paid"
          value={formatCurrency(summary.paid)}
          accent="success"
          Icon={CheckCircle2}
        />
        <SummaryTile
          label="Pending"
          value={formatCurrency(summary.pending)}
          accent="accent"
          Icon={Clock}
        />
        <SummaryTile
          label="This month"
          value={formatCurrency(summary.monthToDate)}
          accent="purple"
          Icon={DollarSign}
        />
        <SummaryTile
          label="Lifetime"
          value={formatCurrency(summary.allTime)}
          accent="orange"
          Icon={TrendingUp}
        />
      </div>

      {/* Optional sub-row: only when meaningful */}
      <div className="flex flex-wrap items-center gap-3 text-small text-text-secondary">
        <span className="inline-flex items-center gap-1">
          <Package className="w-3.5 h-3.5" />
          {summary.completedLoads} {summary.completedLoads === 1 ? 'load' : 'loads'}
        </span>
        <span className="inline-flex items-center gap-1">
          <Truck className="w-3.5 h-3.5" />
          {summary.totalMiles.toLocaleString()} mi
        </span>
        {summary.carrierCount > 1 && (
          <span className="inline-flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            {summary.carrierCount} carriers
          </span>
        )}
      </div>

      {/* History */}
      <Card className="p-6">
        <h2 className="text-title text-text-primary mb-4">Recent earnings</h2>

        {history.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-text-tertiary" />
            </div>
            <p className="text-body text-text-secondary">
              No earnings yet. Complete a load and your carrier will record
              your pay here.
            </p>
          </div>
        ) : (
          <ul className="space-y-3">
            {history.map((row) => (
              <EarningRow
                key={row.id}
                row={row}
                expanded={expandedId === row.id}
                onToggle={() => setExpandedId(expandedId === row.id ? null : row.id)}
                showCarrier={summary.carrierCount > 1}
              />
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function SummaryTile({ label, value, accent = 'success', Icon }) {
  const accentBg = {
    success: 'bg-success/10 text-success',
    accent: 'bg-accent/10 text-accent',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600'
  }[accent];

  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accentBg}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-small text-text-tertiary">{label}</p>
          <p className="text-title text-text-primary truncate">{value}</p>
        </div>
      </div>
    </Card>
  );
}

function EarningRow({ row, expanded, onToggle, showCarrier }) {
  const status = STATUS_META[row.pay_status] || STATUS_META.earned;
  const adjustments = row.adjustments || [];
  const hasAdjustments = adjustments.length > 0;
  const base = Number(row.pay_amount || 0);
  const net = Number(row.net_pay ?? base);
  const route = [row.pickup_city, row.pickup_state, '→', row.delivery_city, row.delivery_state]
    .filter(Boolean)
    .join(' ')
    .replace(' → ', ' → ');
  const completedAt = row.delivery_date || row.recognized_at;

  return (
    <li className="bg-surface-secondary rounded-card">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-surface-tertiary/50 transition-colors rounded-card"
      >
        <div className="flex items-center gap-4 min-w-0">
          <div className="w-10 h-10 rounded-lg bg-surface-primary flex items-center justify-center shrink-0">
            <Package className="w-5 h-5 text-text-tertiary" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-body font-medium text-text-primary truncate">
                {row.load_reference || 'Load'}
              </p>
              <Badge variant={status.variant}>
                <status.Icon className="w-3 h-3" />
                {status.label}
                {row.pay_status === 'paid' && row.paid_at && (
                  <span className="opacity-80 ml-1">· {formatDate(row.paid_at)}</span>
                )}
              </Badge>
              {row.load_deleted_at && (
                <Badge variant="gray" title="The carrier deleted this load from their system. Your earning record is preserved.">
                  <AlertTriangle className="w-3 h-3" />
                  Load deleted
                </Badge>
              )}
              {showCarrier && row.organization_name && (
                <Badge variant="gray">
                  <Building2 className="w-3 h-3" />
                  {row.organization_name}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 text-small text-text-secondary mt-0.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{route}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <p className="text-body font-semibold text-success">
              {formatCurrency(net)}
            </p>
            <p className="text-small text-text-tertiary">
              {row.miles?.toLocaleString() || 0} mi · {formatDate(completedAt)}
            </p>
          </div>
          {hasAdjustments && (
            <span className="text-text-tertiary">
              {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </span>
          )}
        </div>
      </button>

      {hasAdjustments && expanded && (
        <div className="px-4 pb-4 -mt-1 space-y-2 text-small">
          <div className="flex items-center justify-between text-text-secondary">
            <span>Original pay</span>
            <span className="font-mono">{formatCurrency(base)}</span>
          </div>
          {adjustments.map((adj) => (
            <div key={adj.id} className="flex items-start justify-between gap-3 pt-2 border-t border-border-subtle">
              <div className="min-w-0">
                <p className="text-text-primary">
                  Adjustment {Number(adj.amount) >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
                </p>
                <p className="text-text-tertiary truncate">{adj.reason}</p>
                <p className="text-text-tertiary">{formatDate(adj.created_at)}</p>
              </div>
              <span className={`font-mono ${Number(adj.amount) < 0 ? 'text-red-600' : 'text-success'}`}>
                {Number(adj.amount) >= 0 ? '+' : ''}{formatCurrency(adj.amount)}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between pt-2 border-t border-border-subtle font-semibold">
            <span>Net pay</span>
            <span className="font-mono">{formatCurrency(net)}</span>
          </div>
          {row.pay_status === 'paid' && row.payment_method && (
            <p className="text-text-tertiary pt-1">
              Paid via {row.payment_method}{row.payment_reference ? ` · ${row.payment_reference}` : ''}
            </p>
          )}
        </div>
      )}
    </li>
  );
}

export default DriverEarningsPage;
