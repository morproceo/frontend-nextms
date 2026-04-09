/**
 * InvestorLoadsPage - Read-only loads list for investor portal
 *
 * Displays all loads with search filtering. No create/edit/delete.
 */

import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoadsList } from '../../hooks';
import { LoadStatusConfig, getStatusConfig } from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Search, Package } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(typeof date === 'string' && date.length === 10 ? date + 'T12:00:00' : date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatCurrency = (amount) => {
  if (!amount) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const getLocationShort = (loc) => {
  if (!loc) return '-';
  const city = loc.city || '';
  const state = loc.state || '';
  if (city && state) return `${city}, ${state}`;
  return city || state || '-';
};

export function InvestorLoadsPage() {
  const navigate = useNavigate();
  const { loads, loading, fetchLoads } = useLoadsList();
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchLoads();
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return loads || [];
    const q = search.toLowerCase();
    return (loads || []).filter((load) => {
      const ref = (load.reference_number || '').toLowerCase();
      const shipperCity = (load.shipper?.city || '').toLowerCase();
      const consigneeCity = (load.consignee?.city || '').toLowerCase();
      return ref.includes(q) || shipperCity.includes(q) || consigneeCity.includes(q);
    });
  }, [loads, search]);

  if (loading && (!loads || loads.length === 0)) {
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
        <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Loads</h1>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by reference, city..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {/* Table */}
      <Card padding="none" className="overflow-hidden border border-surface-tertiary">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Reference #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Pickup Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Origin</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Destination</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Customer</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-text-tertiary uppercase tracking-wider">Revenue</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
                        <Package className="w-6 h-6 text-text-tertiary" />
                      </div>
                      <p className="text-text-primary font-medium">No loads yet</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((load) => {
                  const status = getStatusConfig(LoadStatusConfig, load.status, {
                    label: load.status,
                    variant: 'gray',
                    icon: Package
                  });
                  const StatusIcon = status.icon;

                  return (
                    <tr
                      key={load.id}
                      className="group hover:bg-accent/5 cursor-pointer transition-colors"
                      onClick={() => navigate('/investor/loads/' + load.id)}
                    >
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-accent">
                          {load.reference_number || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {formatDate(load.schedule?.pickup_date)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {getLocationShort(load.shipper)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {getLocationShort(load.consignee)}
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {load.broker?.name || load.broker_name || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm font-semibold text-text-primary text-right">
                        {formatCurrency(load.financials?.revenue)}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant} className="gap-1">
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Footer */}
      {filtered.length > 0 && (
        <div className="text-sm text-text-tertiary">
          Showing {filtered.length} load{filtered.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}

export default InvestorLoadsPage;
