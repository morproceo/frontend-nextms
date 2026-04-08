/**
 * ComplianceEquipmentTab - Trucks & trailers needing attention
 *
 * Combined list of trucks and trailers with expiring/expired documents.
 * Click row navigates to truck/trailer detail page.
 */

import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { Truck, Container, ChevronRight, CheckCircle } from 'lucide-react';

const TRUCK_EXPIRY_FIELDS = [
  { key: 'annual_inspection_expiry', label: 'Annual Inspection' },
  { key: 'registration_expiry', label: 'Registration' },
  { key: 'insurance_expiry', label: 'Insurance' },
  { key: 'irp_expiry', label: 'IRP' },
  { key: 'ifta_expiry', label: 'IFTA' },
  { key: 'next_service_date', label: 'Next Service' }
];

const TRAILER_EXPIRY_FIELDS = [
  { key: 'annual_inspection_expiry', label: 'Annual Inspection' },
  { key: 'registration_expiry', label: 'Registration' },
  { key: 'insurance_expiry', label: 'Insurance' },
  { key: 'next_service_date', label: 'Next Service' }
];

function getExpiringFields(item, fields) {
  const now = new Date();
  const results = [];
  fields.forEach(field => {
    if (item[field.key]) {
      const expiry = new Date(item[field.key]);
      const daysUntil = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
      if (daysUntil <= 30) {
        results.push({
          ...field,
          daysUntil,
          severity: daysUntil <= 0 ? 'expired' : 'expiring'
        });
      }
    }
  });
  // Sort expired first
  results.sort((a, b) => a.daysUntil - b.daysUntil);
  return results;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function ComplianceEquipmentTab({ trucks, trailers, loading }) {
  const navigate = useNavigate();
  const { org } = useOrg();

  // Combine trucks and trailers into a single list
  const equipment = useMemo(() => {
    const items = [];

    (trucks || []).forEach(truck => {
      const alerts = getExpiringFields(truck, TRUCK_EXPIRY_FIELDS);
      if (alerts.length > 0) {
        items.push({
          id: truck.id,
          type: 'truck',
          unitNumber: truck.unit_number || `Truck #${truck.id.slice(0, 8)}`,
          alerts,
          worstDays: Math.min(...alerts.map(a => a.daysUntil))
        });
      }
    });

    (trailers || []).forEach(trailer => {
      const alerts = getExpiringFields(trailer, TRAILER_EXPIRY_FIELDS);
      if (alerts.length > 0) {
        items.push({
          id: trailer.id,
          type: 'trailer',
          unitNumber: trailer.unit_number || `Trailer #${trailer.id.slice(0, 8)}`,
          alerts,
          worstDays: Math.min(...alerts.map(a => a.daysUntil))
        });
      }
    });

    // Sort by most urgent first
    items.sort((a, b) => a.worstDays - b.worstDays);

    return items;
  }, [trucks, trailers]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (equipment.length === 0) {
    return (
      <Card padding="compact" className="p-8 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-title-sm text-text-primary">All Equipment Compliant</h3>
        <p className="text-body-sm text-text-secondary mt-1">
          No trucks or trailers have expiring or expired documents.
        </p>
      </Card>
    );
  }

  return (
    <Card padding="none">
      <div className="divide-y divide-border">
        {equipment.map((item) => {
          const Icon = item.type === 'truck' ? Truck : Container;
          const link = item.type === 'truck'
            ? `/o/${org?.slug}/assets/trucks/${item.id}`
            : `/o/${org?.slug}/assets/trailers/${item.id}`;
          const hasExpired = item.alerts.some(a => a.severity === 'expired');

          return (
            <button
              key={`${item.type}-${item.id}`}
              onClick={() => navigate(link)}
              className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
            >
              {/* Type icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                hasExpired ? 'bg-error/10' : 'bg-warning/10'
              }`}>
                <Icon className={`w-4.5 h-4.5 ${hasExpired ? 'text-error' : 'text-warning'}`} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-body-sm font-medium text-text-primary">{item.unitNumber}</span>
                  <Badge variant={item.type === 'truck' ? 'blue' : 'gray'} className="text-[10px] px-1.5 py-0.5">
                    {item.type}
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {item.alerts.map(alert => (
                    <Badge
                      key={alert.key}
                      variant={alert.severity === 'expired' ? 'red' : 'yellow'}
                      className="text-[10px]"
                    >
                      {alert.label}: {alert.severity === 'expired'
                        ? `${Math.abs(alert.daysUntil)}d overdue`
                        : `${alert.daysUntil}d`
                      }
                    </Badge>
                  ))}
                </div>
              </div>

              <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
            </button>
          );
        })}
      </div>
    </Card>
  );
}

export default ComplianceEquipmentTab;
