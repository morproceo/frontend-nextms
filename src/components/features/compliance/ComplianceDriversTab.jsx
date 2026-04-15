/**
 * ComplianceDriversTab - Drivers needing attention
 *
 * Lists drivers with expiring/expired qualifications.
 * Click row navigates to driver detail page.
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { Users, ChevronRight, CheckCircle } from 'lucide-react';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { useDriverReadinessSummary } from '../../../hooks/api/useReadinessApi';

const EXPIRY_FIELDS = [
  { key: 'license_expiry', label: 'CDL License' },
  { key: 'medical_card_expiry', label: 'Medical Card' },
  { key: 'drug_test_expiry', label: 'Drug Test' },
  { key: 'mvr_expiry', label: 'MVR' }
];

function getFieldStatus(value) {
  if (!value) return null;
  const now = new Date();
  const expiry = new Date(value);
  const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
  if (daysUntil <= 0) return { severity: 'expired', daysUntil, variant: 'red' };
  if (daysUntil <= 30) return { severity: 'expiring', daysUntil, variant: 'yellow' };
  return { severity: 'ok', daysUntil, variant: 'green' };
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function ComplianceDriversTab({ drivers, loading }) {
  const navigate = useNavigate();
  const { org } = useOrg();
  const { summary, fetchSummary } = useDriverReadinessSummary();

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  const tierByDriver = useMemo(() => {
    const m = new Map();
    for (const r of summary) m.set(r.driver_id, r.readiness_tier);
    return m;
  }, [summary]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!drivers || drivers.length === 0) {
    return (
      <Card padding="compact" className="p-8 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-title-sm text-text-primary">All Drivers Compliant</h3>
        <p className="text-body-sm text-text-secondary mt-1">
          No drivers have expiring or expired qualifications.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      {/* Header */}
      <div className="hidden sm:grid sm:grid-cols-[1fr_60px_repeat(4,120px)_32px] gap-2 px-4 py-2.5 border-b border-border bg-surface-secondary">
        <span className="text-small font-medium text-text-secondary">Driver</span>
        <span className="text-small font-medium text-text-secondary text-center">Tier</span>
        {EXPIRY_FIELDS.map(f => (
          <span key={f.key} className="text-small font-medium text-text-secondary text-center">{f.label}</span>
        ))}
        <span />
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {drivers.map((driver) => {
          const name = `${driver.first_name} ${driver.last_name}`;
          return (
            <button
              key={driver.id}
              onClick={() => navigate(`/o/${org?.slug}/drivers/${driver.id}`)}
              className="w-full flex flex-col sm:grid sm:grid-cols-[1fr_60px_repeat(4,120px)_32px] gap-1 sm:gap-2 sm:items-center px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
            >
              {/* Driver name */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4 text-accent" />
                </div>
                <span className="text-body-sm font-medium text-text-primary truncate">{name}</span>
              </div>

              {/* Tier */}
              <div className="flex justify-start sm:justify-center pl-10 sm:pl-0">
                {tierByDriver.get(driver.id)
                  ? <ReadinessTierBadge tier={tierByDriver.get(driver.id)} size="sm" />
                  : <span className="text-[11px] text-text-tertiary">—</span>
                }
              </div>

              {/* Expiry fields */}
              <div className="flex flex-wrap sm:contents gap-1.5 pl-10 sm:pl-0">
                {EXPIRY_FIELDS.map(field => {
                  const status = getFieldStatus(driver[field.key]);
                  if (!status) {
                    return (
                      <span key={field.key} className="text-small text-text-tertiary text-center">
                        N/A
                      </span>
                    );
                  }
                  return (
                    <div key={field.key} className="text-center">
                      <Badge variant={status.variant} className="text-[10px]">
                        <span className="sm:hidden">{field.label}: </span>
                        {status.severity === 'expired'
                          ? `${Math.abs(status.daysUntil)}d overdue`
                          : `${status.daysUntil}d`
                        }
                      </Badge>
                    </div>
                  );
                })}
              </div>

              <ChevronRight className="w-4 h-4 text-text-tertiary hidden sm:block" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default ComplianceDriversTab;
