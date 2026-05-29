/**
 * DriversListPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Status configs from centralized config
 * - Business logic delegated to useDrivers hook
 * - Component focuses on rendering
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDrivers } from '../../hooks';
import {
  DriverStatusConfig,
  DriverAccountStatusConfig,
  getStatusConfig
} from '../../config/status';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import driverConnectionApi from '../../api/driverConnection.api';
import * as driversApi from '../../api/drivers.api';
import {
  Users, Plus, Search, UserX, Mail, Phone, ChevronRight, ChevronDown, Bell, Check, X,
  Database, Globe, Send, Shield, UserCheck, Clock, Truck, AlertCircle, Trash2, Loader2
} from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * Compact filter dropdown — looks like a pill, behaves like a select.
 * Native <select> overlay so the OS-default option menu (which handles
 * mobile beautifully) is used; the rendered pill just shows the current
 * value + a chevron. Active state when the selection is not "all".
 */
function FilterDropdown({ label, value, options, onChange }) {
  const current = options.find((o) => o.v === value) || options[0];
  const active = value && value !== 'all';
  return (
    <label className={cn(
      'relative flex sm:inline-flex items-center justify-between sm:justify-start gap-2 px-3 sm:px-4 py-3 rounded-xl cursor-pointer transition-all shadow-[0_1px_2px_rgba(16,24,40,0.04)] min-w-0',
      active
        ? 'bg-accent/10 border border-accent/30 text-accent'
        : 'bg-white border border-gray-200 text-text-secondary hover:bg-surface-secondary'
    )}>
      <span className="flex items-center gap-2 min-w-0">
        <span className="text-small text-text-tertiary shrink-0">{label}:</span>
        <span className={cn('text-body-sm font-semibold truncate', active ? 'text-accent' : 'text-text-primary')}>
          {current.label}
        </span>
      </span>
      <ChevronDown className={cn('w-4 h-4 shrink-0', active ? 'text-accent' : 'text-text-tertiary')} />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 opacity-0 cursor-pointer"
        aria-label={label}
      >
        {options.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
      </select>
    </label>
  );
}

/**
 * Filter pill — toggles a single value of a filter dimension. Tone arg
 * tints the active state so status colors match the row badges (green
 * Available, amber Pending, etc).
 */
function FilterPill({ label, active, onClick, tone }) {
  const activeCls = (() => {
    if (!active) return 'bg-white border-gray-200 text-text-secondary hover:bg-surface-secondary';
    switch (tone) {
      case 'green':  return 'bg-emerald-50 border-emerald-300 text-emerald-700';
      case 'blue':   return 'bg-blue-50 border-blue-300 text-blue-700';
      case 'amber':
      case 'yellow': return 'bg-amber-50 border-amber-300 text-amber-700';
      case 'red':    return 'bg-red-50 border-red-300 text-red-700';
      default:       return 'bg-text-primary border-text-primary text-white';
    }
  })();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-3 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors',
        activeCls
      )}
    >
      {label}
    </button>
  );
}

/**
 * KPI card used on the drivers list — mirrors the HeroStat pattern from
 * the detail page so the visual language stays consistent across surfaces.
 */
function KpiCard({ icon: Icon, label, value, tone }) {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 p-2 sm:p-4 flex flex-col sm:flex-row items-center sm:items-start sm:gap-3">
      <div className={cn(
        'w-7 h-7 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0',
        tone === 'accent'  && 'bg-accent/10 text-accent',
        tone === 'green'   && 'bg-emerald-50 text-emerald-600',
        tone === 'amber'   && 'bg-amber-50 text-amber-600',
        tone === 'red'     && 'bg-red-50 text-red-600',
        tone === 'blue'    && 'bg-blue-50 text-blue-600',
        !tone              && 'bg-surface-secondary text-text-secondary'
      )}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="min-w-0 w-full sm:flex-1 leading-tight text-center sm:text-left mt-1 sm:mt-0">
        <p className="text-[9px] sm:text-[11px] uppercase tracking-wide text-text-tertiary truncate">{label}</p>
        <p className={cn(
          'text-base sm:text-2xl font-semibold truncate leading-tight',
          tone === 'green'  && 'text-emerald-700',
          tone === 'amber'  && 'text-amber-700',
          tone === 'red'    && 'text-red-700',
          tone === 'accent' && 'text-accent',
          tone === 'blue'   && 'text-blue-700',
          !tone             && 'text-text-primary'
        )}>{value}</p>
      </div>
    </div>
  );
}

export function DriversListPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // All data and logic from the hook
  const {
    drivers,
    allDrivers,
    stats,
    loading,
    error,
    filters,
    setSearchQuery,
    setStatusFilter,
    setAccountFilter,
    refetch
  } = useDrivers();

  // Connection requests state
  const [connectionRequests, setConnectionRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  // Add-driver bottom sheet (manual vs hire-from-network)
  const [showAddSheet, setShowAddSheet] = useState(false);

  useEffect(() => {
    driverConnectionApi.getPendingRequests()
      .then(res => setConnectionRequests(res.data || []))
      .catch(() => {});
  }, []);

  const handleApproveRequest = useCallback(async (requestId) => {
    try {
      await driverConnectionApi.approveRequest(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
      refetch();
    } catch (err) {
      console.error('Failed to approve request:', err);
    }
  }, [refetch]);

  const handleRejectRequest = useCallback(async (requestId) => {
    try {
      await driverConnectionApi.rejectRequest(requestId);
      setConnectionRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err) {
      console.error('Failed to reject request:', err);
    }
  }, []);

  const handleDriverClick = (driverId) => {
    navigate(orgUrl(`/drivers/${driverId}`));
  };

  // ─── Remove driver from organization ────────────────────────────────
  // Soft-delete on the org-scoped Driver row. Does NOT touch the User
  // (their MorPro account, personal driver pages, and connections to
  // any other orgs they belong to all stay intact).
  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState(null);

  const handleRemoveDriver = useCallback(async (driver, e) => {
    e?.stopPropagation();
    const name = `${driver.first_name || ''} ${driver.last_name || ''}`.trim() || 'this driver';
    const ok = window.confirm(
      `Remove ${name} from your organization?\n\n` +
      `They'll be removed from your dispatch lists and reports. Their ` +
      `personal MorPro account stays intact — they can keep using their ` +
      `own driver app. You can re-add them later.`
    );
    if (!ok) return;
    setRemovingId(driver.id);
    setRemoveError(null);
    try {
      await driversApi.deleteDriver(driver.id);
      await refetch();
    } catch (err) {
      setRemoveError(
        err.response?.data?.message ||
        err.response?.data?.error?.message ||
        err.message ||
        'Could not remove driver'
      );
    } finally {
      setRemovingId(null);
    }
  }, [refetch]);

  // Loading state
  if (loading && allDrivers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title font-semibold text-text-primary">Drivers</h1>
          <p className="text-body-sm text-text-secondary mt-1 hidden sm:block">
            Manage your organization's driver profiles
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {connectionRequests.length > 0 && (
            <Button
              variant="secondary"
              onClick={() => setShowRequests(!showRequests)}
              className="relative"
            >
              <Bell className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Requests</span>
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-warning text-white text-xs rounded-full flex items-center justify-center">
                {connectionRequests.length}
              </span>
            </Button>
          )}
          <Button onClick={() => setShowAddSheet(true)}>
            <Plus className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Add Driver</span>
          </Button>
        </div>
      </div>

      {/* KPI Strip — 3×2 grid on mobile, full row on desktop */}
      {allDrivers.length > 0 && (
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3">
          <KpiCard icon={Users}       label="Total"     value={stats.total} />
          <KpiCard icon={UserCheck}   label="Active"    value={stats.active}    tone="green" />
          <KpiCard icon={Clock}       label="Invited"   value={stats.pending}   tone="amber" />
          <KpiCard icon={UserX}       label="Unclaimed" value={stats.unclaimed} />
          <KpiCard icon={AlertCircle} label="Left"      value={stats.left}      tone="red" />
          <KpiCard icon={Truck}       label="Driving"   value={stats.driving}   tone="accent" />
        </div>
      )}

      {/* Search + Filter bar — search left, dropdown filters right */}
      <div className="flex flex-col sm:flex-row gap-2">
        {/* Smart search bar */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name, email, or phone…"
            value={filters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-24 py-3 bg-white border border-gray-200 rounded-xl text-body text-text-primary placeholder:text-text-tertiary shadow-[0_1px_2px_rgba(16,24,40,0.04)] focus:outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {filters.search && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="w-6 h-6 rounded-full bg-surface-secondary hover:bg-surface-tertiary text-text-tertiary hover:text-text-primary flex items-center justify-center transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <span className="text-small text-text-tertiary tabular-nums">
              {drivers.length}/{allDrivers.length}
            </span>
          </div>
        </div>

        {/* Compact dropdown pills — share row on mobile (50/50), inline on desktop */}
        <div className="grid grid-cols-2 sm:flex gap-2">
          <FilterDropdown
            label="Status"
            value={filters.status}
            onChange={setStatusFilter}
            options={[
              { v: 'all', label: 'All' },
              ...Object.values(DriverStatusConfig).map((c) => ({ v: c.value, label: c.label }))
            ]}
          />
          <FilterDropdown
            label="Account"
            value={filters.account}
            onChange={setAccountFilter}
            options={[
              { v: 'all', label: 'All' },
              ...Object.values(DriverAccountStatusConfig).map((c) => ({ v: c.value, label: c.label }))
            ]}
          />
        </div>
      </div>

      {/* Connection Requests Panel */}
      {showRequests && connectionRequests.length > 0 && (
        <Card className="p-4 border-warning/30 bg-warning/5">
          <h3 className="text-body font-medium text-text-primary mb-3 flex items-center gap-2">
            <Bell className="w-4 h-4 text-warning" />
            Driver Connection Requests
          </h3>
          <div className="space-y-3">
            {connectionRequests.map((request) => (
              <div key={request.id} className="flex items-center justify-between p-3 bg-surface-primary rounded-lg">
                <div>
                  <p className="text-body-sm font-medium text-text-primary">
                    {request.user?.first_name} {request.user?.last_name}
                  </p>
                  <p className="text-small text-text-secondary">
                    {request.user?.email}
                    {request.user?.license_number && ` · CDL: ${request.user.license_number}`}
                    {request.user?.license_state && ` (${request.user.license_state})`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRejectRequest(request.id)}
                    className="text-error hover:bg-error/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleApproveRequest(request.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Approve
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Remove error */}
      {removeError && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
            <p className="text-body-sm text-error flex-1">{removeError}</p>
            <button
              type="button"
              onClick={() => setRemoveError(null)}
              className="text-error/70 hover:text-error"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </Card>
      )}

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
              <UserX className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-body-sm font-medium text-error">Error loading drivers</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!error && drivers.length === 0 && (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
              <Users className="w-8 h-8 text-text-tertiary" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">
              {allDrivers.length === 0 ? 'No drivers yet' : 'No drivers match your filters'}
            </h3>
            <p className="text-body-sm text-text-secondary mb-4">
              {allDrivers.length === 0
                ? 'Add your first driver to get started'
                : 'Try adjusting your search or filters'}
            </p>
            {allDrivers.length === 0 && (
              <Button onClick={() => setShowAddSheet(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Driver
              </Button>
            )}
          </div>
        </Card>
      )}

      {/* Drivers List */}
      {!error && drivers.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] overflow-hidden">
          <div className="divide-y divide-gray-100">
            {drivers.map((driver) => {
              const statusConfig = getStatusConfig(DriverStatusConfig, driver.status);
              const claimed = !!driver.user_id;
              const initials = `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`.toUpperCase() || 'D';
              const sv = statusConfig.variant;

              return (
                <div
                  key={driver.id}
                  onClick={() => handleDriverClick(driver.id)}
                  className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-surface-secondary/60 cursor-pointer transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full shrink-0 overflow-hidden">
                    {driver.user?.avatar_url ? (
                      <img
                        src={driver.user.avatar_url}
                        alt={`${driver.first_name} ${driver.last_name}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-accent flex items-center justify-center">
                        <span className="text-white text-body-sm font-semibold">{initials}</span>
                      </div>
                    )}
                  </div>

                  {/* Driver Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-body font-semibold text-text-primary truncate">
                        {driver.first_name} {driver.last_name}
                      </p>
                      {claimed && (
                        <span
                          className="w-4 h-4 rounded-full bg-accent text-white flex items-center justify-center shrink-0"
                          title="Profile claimed"
                        >
                          <Check className="w-2.5 h-2.5" strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-x-3 gap-y-0.5 mt-0.5 flex-wrap">
                      {driver.email && (
                        <span className="flex items-center gap-1 text-small text-text-secondary truncate max-w-[200px] sm:max-w-none">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {driver.email}
                        </span>
                      )}
                      {driver.phone && (
                        <span className="flex items-center gap-1 text-small text-text-secondary">
                          <Phone className="w-3 h-3 flex-shrink-0" />
                          {driver.phone}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status pill — colored to match driver state */}
                  <span className={cn(
                    'hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] uppercase tracking-wide font-semibold border whitespace-nowrap',
                    sv === 'green'  && 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    sv === 'blue'   && 'bg-blue-50 text-blue-700 border-blue-200',
                    (sv === 'amber' || sv === 'yellow') && 'bg-amber-50 text-amber-700 border-amber-200',
                    sv === 'red'    && 'bg-red-50 text-red-700 border-red-200',
                    (!sv || sv === 'gray') && 'bg-surface-secondary text-text-secondary border-surface-tertiary'
                  )}>
                    {statusConfig.label || driver.status}
                  </span>

                  {/* Remove from organization */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveDriver(driver, e)}
                    disabled={removingId === driver.id}
                    title="Remove from organization"
                    aria-label={`Remove ${driver.first_name || ''} ${driver.last_name || ''} from organization`}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                      'text-text-tertiary hover:text-error hover:bg-error/10',
                      'sm:opacity-0 sm:group-hover:opacity-100 focus:opacity-100',
                      removingId === driver.id && 'opacity-100 cursor-wait'
                    )}
                  >
                    {removingId === driver.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Trash2 className="w-4 h-4" />}
                  </button>

                  {/* Chevron */}
                  <ChevronRight className="w-4 h-4 text-text-tertiary group-hover:text-accent group-hover:translate-x-0.5 transition-all" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Driver bottom sheet ─────────────────────────────────────
          Same pattern as the New Expense sheet — two big card options to
          choose how to add a driver: by hand or by searching the network. */}
      {showAddSheet && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowAddSheet(false)}
          />
          <div className="relative w-full sm:max-w-sm bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden animate-fade-in">
            <div className="flex justify-center pt-3 pb-1 sm:hidden">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>
            <div className="p-6">
              <h2 className="text-lg font-semibold text-text-primary text-center mb-1">Add Driver</h2>
              <p className="text-small text-text-tertiary text-center mb-6">How would you like to add them?</p>

              <div className="space-y-3">
                {/* Hire from MorPro Connect */}
                <button
                  onClick={() => {
                    setShowAddSheet(false);
                    navigate(orgUrl('/connect/drivers'));
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-accent/20 bg-accent/5 hover:bg-accent/10 hover:border-accent/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center shrink-0">
                    <Globe className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-text-primary">Hire from MorPro Direct</span>
                    </div>
                    <p className="text-small text-text-secondary mt-0.5">
                      Browse verified drivers in the network and send them an invite
                    </p>
                  </div>
                </button>

                {/* Manual Entry */}
                <button
                  onClick={() => {
                    setShowAddSheet(false);
                    navigate(orgUrl('/drivers/new'));
                  }}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 border-surface-tertiary hover:border-gray-300 hover:bg-surface-secondary transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center shrink-0">
                    <Users className="w-6 h-6 text-text-secondary" />
                  </div>
                  <div>
                    <span className="font-semibold text-text-primary">Manual Entry</span>
                    <p className="text-small text-text-secondary mt-0.5">Fill in driver details yourself</p>
                  </div>
                </button>
              </div>

              <button
                onClick={() => setShowAddSheet(false)}
                className="w-full mt-4 py-3 text-body-sm font-medium text-text-tertiary hover:text-text-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriversListPage;
