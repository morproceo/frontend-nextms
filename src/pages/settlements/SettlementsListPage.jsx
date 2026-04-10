/**
 * SettlementsListPage - List page for driver settlements
 *
 * Displays settlements in a table (desktop) or card list (mobile).
 * Supports filtering by driver and status.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDriversList } from '../../hooks';
import settlementsApi from '../../api/settlements.api';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { SearchableSelect } from '../../components/ui/SearchableSelect';
import { Plus, FileText } from 'lucide-react';

// Status config
const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'draft', label: 'Draft' },
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'paid', label: 'Paid' },
  { value: 'void', label: 'Void' },
];

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending Review',
  approved: 'Approved',
  paid: 'Paid',
  void: 'Void',
};

const STATUS_BADGE_COLORS = {
  draft: 'gray',
  pending_review: 'blue',
  approved: 'green',
  paid: 'emerald',
  void: 'red',
};

export function SettlementsListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const { drivers, fetchDrivers } = useDriversList();

  // State
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [driverFilter, setDriverFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Fetch settlements
  const fetchSettlements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (driverFilter) params.driver_id = driverFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await settlementsApi.getSettlements(params);
      const list = Array.isArray(res) ? res : (res?.data || []);
      setSettlements(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error('Failed to fetch settlements:', err);
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [driverFilter, statusFilter]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  // Driver options for SearchableSelect
  const driverOptions = useMemo(() =>
    (drivers || []).map(d => ({
      id: d.id,
      label: `${d.first_name} ${d.last_name}`,
    })),
    [drivers]
  );

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatSettlementNumber = (num) => {
    if (!num && num !== 0) return '-';
    return `SET-${String(num).padStart(4, '0')}`;
  };

  const getDriverName = (settlement) => {
    if (settlement.driver) {
      return `${settlement.driver.first_name} ${settlement.driver.last_name}`;
    }
    return '-';
  };

  // Loading state
  if (loading && settlements.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-xl sm:text-title text-text-primary">Driver Settlements</h1>
        <Button onClick={() => navigate(orgUrl('/settlements/new'))} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">New Settlement</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="w-64">
          <SearchableSelect
            value={driverFilter}
            onChange={(opt) => setDriverFilter(opt ? opt.id : '')}
            options={driverOptions}
            placeholder="All Drivers"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          {STATUS_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-3">
        {settlements.length === 0 ? (
          <Card padding="default" className="text-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                <FileText className="w-6 h-6 text-text-tertiary" />
              </div>
              <p className="text-text-secondary">No settlements yet</p>
            </div>
          </Card>
        ) : (
          settlements.map((s) => (
            <div
              key={s.id}
              onClick={() => navigate(orgUrl(`/settlements/${s.id}`))}
              className="bg-white rounded-xl p-4 border border-surface-tertiary active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-text-primary">
                    {formatSettlementNumber(s.settlement_number)}
                  </p>
                  <p className="text-small text-text-tertiary truncate">
                    {getDriverName(s)}
                  </p>
                </div>
                <span className="font-bold text-text-primary ml-3">
                  {formatCurrency(s.net_pay)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-small text-text-secondary">
                  {formatDate(s.period_start)} &mdash; {formatDate(s.period_end)}
                </span>
                <Badge variant={STATUS_BADGE_COLORS[s.status] || 'gray'} size="sm">
                  {STATUS_LABELS[s.status] || s.status}
                </Badge>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <Card padding="none" className="overflow-hidden hidden lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary border-b border-surface-tertiary">
              <tr>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Settlement #</th>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Driver</th>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Period</th>
                <th className="px-3 py-3 text-right text-small font-medium text-text-secondary uppercase tracking-wider">Net Pay</th>
                <th className="px-3 py-3 text-left text-small font-medium text-text-secondary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {settlements.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-12 text-center text-text-secondary">
                    No settlements yet
                  </td>
                </tr>
              ) : (
                settlements.map((s) => (
                  <tr
                    key={s.id}
                    className="hover:bg-surface-secondary/50 cursor-pointer transition-colors"
                    onClick={() => navigate(orgUrl(`/settlements/${s.id}`))}
                  >
                    <td className="px-3 py-3">
                      <span className="text-accent font-medium hover:underline">
                        {formatSettlementNumber(s.settlement_number)}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-primary">
                      {getDriverName(s)}
                    </td>
                    <td className="px-3 py-3 text-body-sm text-text-secondary whitespace-nowrap">
                      {formatDate(s.period_start)} &mdash; {formatDate(s.period_end)}
                    </td>
                    <td className="px-3 py-3 text-body-sm font-bold text-text-primary text-right tabular-nums">
                      {formatCurrency(s.net_pay)}
                    </td>
                    <td className="px-3 py-3">
                      <Badge variant={STATUS_BADGE_COLORS[s.status] || 'gray'} size="sm">
                        {STATUS_LABELS[s.status] || s.status}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default SettlementsListPage;
