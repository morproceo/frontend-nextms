/**
 * InvestorLoadDetailPage - Read-only load detail for investor portal
 *
 * Displays load information, stops, financials, and assignment.
 * No edit/delete/status change capabilities.
 */

import { useParams, useNavigate } from 'react-router-dom';
import { useLoad } from '../../hooks';
import { LoadStatusConfig, getStatusConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  Building2,
  MapPin,
  DollarSign,
  Truck,
  StickyNote,
  CircleDot
} from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(typeof date === 'string' && date.length === 10 ? date + 'T12:00:00' : date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatCurrency = (amount) => {
  if (amount == null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const formatNumber = (num) => {
  if (num == null) return '-';
  return new Intl.NumberFormat('en-US').format(num);
};

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between py-1.5">
      <span className="text-sm text-text-tertiary">{label}</span>
      <span className="text-sm text-text-primary font-medium">{value || '-'}</span>
    </div>
  );
}

export function InvestorLoadDetailPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();
  const { load, stops, loading, error } = useLoad(loadId);

  if (loading && !load) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
        <p className="text-text-secondary">{error}</p>
        <Button variant="secondary" onClick={() => navigate('/investor/loads')}>
          Back to Loads
        </Button>
      </div>
    );
  }

  if (!load) return null;

  const status = getStatusConfig(LoadStatusConfig, load.status, {
    label: load.status,
    variant: 'gray'
  });

  const shipper = load.shipper || {};
  const consignee = load.consignee || {};
  const financials = load.financials || {};
  const driver = load.driver || {};
  const truck = load.truck || {};
  const trailer = load.trailer || {};

  const rpm = financials.revenue && financials.miles
    ? (financials.revenue / financials.miles).toFixed(2)
    : null;

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/investor/loads')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back
        </Button>
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">
            {load.reference_number || 'Load'}
          </h1>
          <Badge variant={status.variant}>{status.label}</Badge>
        </div>
      </div>

      {/* Info Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Shipper */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-text-tertiary" />
              Shipper
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Name" value={shipper.name} />
            <InfoRow label="Address" value={shipper.address} />
            <InfoRow
              label="City/State/Zip"
              value={[shipper.city, shipper.state, shipper.zip].filter(Boolean).join(', ') || '-'}
            />
            <InfoRow label="Pickup Date" value={formatDate(load.schedule?.pickup_date)} />
          </CardContent>
        </Card>

        {/* Consignee */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-text-tertiary" />
              Consignee
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Name" value={consignee.name} />
            <InfoRow label="Address" value={consignee.address} />
            <InfoRow
              label="City/State/Zip"
              value={[consignee.city, consignee.state, consignee.zip].filter(Boolean).join(', ') || '-'}
            />
            <InfoRow label="Delivery Date" value={formatDate(load.schedule?.delivery_date)} />
          </CardContent>
        </Card>

        {/* Financial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-text-tertiary" />
              Financial
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow label="Revenue" value={formatCurrency(financials.revenue)} />
            <InfoRow label="Driver Pay" value={formatCurrency(financials.driver_pay)} />
            <InfoRow label="Miles" value={formatNumber(financials.miles)} />
            <InfoRow label="RPM" value={rpm ? `$${rpm}` : '-'} />
          </CardContent>
        </Card>

        {/* Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-text-tertiary" />
              Assignment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <InfoRow
              label="Driver"
              value={driver.first_name ? `${driver.first_name} ${driver.last_name || ''}`.trim() : '-'}
            />
            <InfoRow label="Truck" value={truck.unit_number || '-'} />
            <InfoRow label="Trailer" value={trailer.unit_number || trailer.trailer_number || '-'} />
          </CardContent>
        </Card>

        {/* Notes */}
        {load.notes && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <StickyNote className="w-4 h-4 text-text-tertiary" />
                Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-text-secondary whitespace-pre-wrap">{load.notes}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Stops */}
      {stops && stops.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CircleDot className="w-4 h-4 text-text-tertiary" />
              Stops
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stops.map((stop, idx) => (
                <div
                  key={stop.id || idx}
                  className="flex items-start gap-3 p-3 bg-surface-secondary rounded-lg"
                >
                  <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-xs font-semibold text-accent">{idx + 1}</span>
                  </div>
                  <div className="text-sm">
                    <p className="font-medium text-text-primary">
                      {stop.facility_name || stop.name || `Stop ${idx + 1}`}
                    </p>
                    <p className="text-text-secondary">
                      {[stop.address, stop.city, stop.state, stop.zip].filter(Boolean).join(', ')}
                    </p>
                    {stop.date && (
                      <p className="text-text-tertiary mt-0.5">{formatDate(stop.date)}</p>
                    )}
                    {stop.type && (
                      <Badge variant="gray" className="mt-1">{stop.type}</Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default InvestorLoadDetailPage;
