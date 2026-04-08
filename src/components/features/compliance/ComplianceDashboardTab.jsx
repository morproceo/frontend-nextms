/**
 * ComplianceDashboardTab - Overview of all compliance alerts
 *
 * Shows a combined list of all alerts across drivers, trucks, and trailers,
 * sorted by urgency (expired first, then expiring soon).
 * Color-coded: red = expired, amber = expiring within 30 days, green = compliant.
 */

import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Card } from '../../ui/Card';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import {
  AlertTriangle,
  Clock,
  Users,
  Truck,
  Container,
  CheckCircle,
  ChevronRight
} from 'lucide-react';

function getAlertLink(alert, orgSlug) {
  if (alert.type === 'driver') return `/o/${orgSlug}/drivers/${alert.entityId}`;
  if (alert.type === 'truck') return `/o/${orgSlug}/assets/trucks/${alert.entityId}`;
  if (alert.type === 'trailer') return `/o/${orgSlug}/assets/trailers/${alert.entityId}`;
  return '#';
}

function getTypeIcon(type) {
  if (type === 'driver') return Users;
  if (type === 'truck') return Truck;
  return Container;
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

export function ComplianceDashboardTab({ alerts, summary, loading }) {
  const navigate = useNavigate();
  const { org } = useOrg();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner />
      </div>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card padding="compact" className="p-8 text-center">
        <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-success" />
        </div>
        <h3 className="text-title-sm text-text-primary">All Clear</h3>
        <p className="text-body-sm text-text-secondary mt-1">
          No expiring or expired documents found. Your fleet is fully compliant.
        </p>
      </Card>
    );
  }

  const expiredCount = alerts.filter(a => a.severity === 'expired').length;
  const expiringCount = alerts.filter(a => a.severity === 'expiring').length;

  return (
    <div className="space-y-4">
      {/* Summary badges */}
      <div className="flex flex-wrap gap-2">
        {expiredCount > 0 && (
          <Badge variant="red">
            <AlertTriangle className="w-3 h-3" />
            {expiredCount} Expired
          </Badge>
        )}
        {expiringCount > 0 && (
          <Badge variant="yellow">
            <Clock className="w-3 h-3" />
            {expiringCount} Expiring Soon
          </Badge>
        )}
      </div>

      {/* Alerts list */}
      <Card padding="none">
        <div className="divide-y divide-border">
          {alerts.map((alert) => {
            const TypeIcon = getTypeIcon(alert.type);
            const isExpired = alert.severity === 'expired';

            return (
              <button
                key={alert.id}
                onClick={() => navigate(getAlertLink(alert, org?.slug))}
                className="w-full flex items-center gap-3 sm:gap-4 px-4 py-3 hover:bg-surface-secondary transition-colors text-left"
              >
                {/* Severity indicator */}
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                  isExpired ? 'bg-error' : 'bg-warning'
                }`} />

                {/* Type icon */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                  isExpired ? 'bg-error/10' : 'bg-warning/10'
                }`}>
                  <TypeIcon className={`w-4 h-4 ${isExpired ? 'text-error' : 'text-warning'}`} />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-text-primary truncate">
                      {alert.entityName}
                    </span>
                    <Badge variant={alert.type === 'driver' ? 'blue' : 'gray'} className="text-[10px] px-1.5 py-0.5">
                      {alert.type}
                    </Badge>
                  </div>
                  <p className="text-small text-text-secondary mt-0.5">
                    {alert.field} — {isExpired ? 'Expired' : 'Expires'} {formatDate(alert.expiryDate)}
                  </p>
                </div>

                {/* Days indicator */}
                <div className="text-right shrink-0">
                  <span className={`text-body-sm font-semibold ${
                    isExpired ? 'text-error' : 'text-warning'
                  }`}>
                    {isExpired
                      ? `${Math.abs(alert.daysUntil)}d overdue`
                      : `${alert.daysUntil}d left`
                    }
                  </span>
                </div>

                <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

export default ComplianceDashboardTab;
