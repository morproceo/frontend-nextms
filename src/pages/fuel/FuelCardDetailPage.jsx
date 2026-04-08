/**
 * FuelCardDetailPage - Detail view for a single fuel card
 *
 * Shows card details, current assignment, and assignment history timeline.
 * Includes assign/return modals wired to action buttons.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import fuelApi from '../../api/fuel.api';
import {
  FuelCardStatusLabels,
  FuelCardStatusColors,
  FuelCardProviderLabels
} from '../../enums/fuel';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import {
  ArrowLeft,
  CreditCard,
  User,
  Truck,
  Calendar,
  DollarSign,
  Shield,
  UserPlus,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { AssignFuelCardModal } from './components/AssignFuelCardModal';
import { ReturnFuelCardModal } from './components/ReturnFuelCardModal';
import { FuelCardAssignmentTimeline } from './components/FuelCardAssignmentTimeline';

const PROVIDER_BADGE_COLORS = {
  efs: 'blue',
  comdata: 'green',
  wex: 'orange',
  fuelman: 'red',
  pilot_rbf: 'emerald',
  loves: 'yellow',
  ta_petro: 'gray',
  fleet_one: 'purple',
  other: 'gray'
};

const maskCardNumber = (number) => {
  if (!number) return '****';
  const last4 = number.slice(-4);
  return `****${last4}`;
};

const formatCurrency = (amount) => {
  if (!amount && amount !== 0) return null;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

export function FuelCardDetailPage() {
  const { cardId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // Data state
  const [card, setCard] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);

  // Fetch card data
  const fetchCard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fuelApi.getFuelCard(cardId);
      setCard(response?.data || response);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'Failed to load fuel card');
    } finally {
      setLoading(false);
    }
  }, [cardId]);

  // Fetch assignment history
  const fetchAssignments = useCallback(async () => {
    try {
      setAssignmentsLoading(true);
      const response = await fuelApi.getFuelCardAssignments(cardId);
      const list = response?.data?.assignments || response?.assignments || (Array.isArray(response) ? response : []);
      setAssignments(list);
    } catch (err) {
      console.error('Failed to load assignments:', err);
    } finally {
      setAssignmentsLoading(false);
    }
  }, [cardId]);

  // Initial fetch
  useEffect(() => {
    fetchCard();
    fetchAssignments();
  }, [fetchCard, fetchAssignments]);

  // Refresh after assign/return
  const handleAssignmentChange = useCallback(() => {
    fetchCard();
    fetchAssignments();
  }, [fetchCard, fetchAssignments]);

  // Loading state
  if (loading && !card) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Error state (no data)
  if (error && !card) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/fuel/cards'))} className="p-0 h-auto">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Fuel Cards
        </Button>
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      </div>
    );
  }

  if (!card) return null;

  const currentAssignment = card.current_assignment;
  const isAssigned = !!currentAssignment;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button variant="ghost" onClick={() => navigate(orgUrl('/fuel/cards'))} className="p-0 h-auto">
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Fuel Cards
      </Button>

      {/* Header Card */}
      <Card className="bg-gradient-to-br from-accent/5 to-accent/10 border-accent/20">
        <CardContent>
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={PROVIDER_BADGE_COLORS[card.card_provider] || 'gray'}>
                  {FuelCardProviderLabels[card.card_provider] || card.card_provider || 'Unknown'}
                </Badge>
                <Badge variant={FuelCardStatusColors[card.status] || 'gray'}>
                  {FuelCardStatusLabels[card.status] || card.status}
                </Badge>
              </div>
              <h1 className="text-xl sm:text-title text-text-primary font-bold font-mono">
                {maskCardNumber(card.card_number)}
              </h1>
              {card.card_label && (
                <p className="text-body-sm text-text-secondary mt-1">{card.card_label}</p>
              )}
            </div>
            <div className="shrink-0">
              <CreditCard className="w-10 h-10 text-accent/30" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
        </Card>
      )}

      {/* Main Content - 3 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card Details */}
          <Card>
            <CardHeader>
              <CardTitle>Card Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-small text-text-tertiary mb-1">Provider</p>
                  <p className="text-body-sm text-text-primary">
                    {FuelCardProviderLabels[card.card_provider] || card.card_provider || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-small text-text-tertiary mb-1">Status</p>
                  <Badge variant={FuelCardStatusColors[card.status] || 'gray'} size="sm">
                    {FuelCardStatusLabels[card.status] || card.status}
                  </Badge>
                </div>

                {/* Spending Limits */}
                {card.spending_limit_daily && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Daily Limit</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-text-secondary" />
                      <p className="text-body-sm text-text-primary">{formatCurrency(card.spending_limit_daily)}</p>
                    </div>
                  </div>
                )}
                {card.spending_limit_weekly && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Weekly Limit</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-text-secondary" />
                      <p className="text-body-sm text-text-primary">{formatCurrency(card.spending_limit_weekly)}</p>
                    </div>
                  </div>
                )}
                {card.spending_limit_monthly && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Monthly Limit</p>
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-text-secondary" />
                      <p className="text-body-sm text-text-primary">{formatCurrency(card.spending_limit_monthly)}</p>
                    </div>
                  </div>
                )}

                {card.expiration_date && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Expiration</p>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-text-secondary" />
                      <p className="text-body-sm text-text-primary">{formatDate(card.expiration_date)}</p>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-small text-text-tertiary mb-1">Fuel Only</p>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-text-secondary" />
                    <p className="text-body-sm text-text-primary">
                      {card.allowed_fuel_only ? 'Yes' : 'No'}
                    </p>
                  </div>
                </div>

                {card.issuer_account_number && (
                  <div>
                    <p className="text-small text-text-tertiary mb-1">Issuer Account</p>
                    <p className="text-body-sm text-text-primary">{card.issuer_account_number}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Assignment History */}
          <Card>
            <CardHeader>
              <CardTitle>Assignment History</CardTitle>
            </CardHeader>
            <CardContent>
              <FuelCardAssignmentTimeline
                assignments={assignments}
                loading={assignmentsLoading}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Current Assignment */}
          <Card>
            <CardHeader>
              <CardTitle>Current Assignment</CardTitle>
            </CardHeader>
            <CardContent>
              {isAssigned ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <User className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary">Driver</p>
                      <p className="text-body-sm font-medium text-text-primary">
                        {currentAssignment.driver
                          ? `${currentAssignment.driver.first_name || ''} ${currentAssignment.driver.last_name || ''}`.trim()
                          : 'Unknown Driver'}
                      </p>
                    </div>
                  </div>

                  {currentAssignment.truck && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                        <Truck className="w-5 h-5 text-accent" />
                      </div>
                      <div>
                        <p className="text-small text-text-tertiary">Truck</p>
                        <p className="text-body-sm font-medium text-text-primary">
                          #{currentAssignment.truck.unit_number}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-small text-text-tertiary">Assigned Since</p>
                      <p className="text-body-sm font-medium text-text-primary">
                        {formatDate(currentAssignment.assigned_at)}
                      </p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    className="w-full"
                    onClick={() => setShowReturnModal(true)}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Return Card
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center mx-auto mb-3">
                    <User className="w-6 h-6 text-text-tertiary" />
                  </div>
                  <p className="text-body-sm text-text-secondary mb-4">Unassigned</p>
                  <Button
                    className="w-full"
                    onClick={() => setShowAssignModal(true)}
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Assign Driver
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {card.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-body-sm text-text-secondary whitespace-pre-wrap">
                  {card.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <AssignFuelCardModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        card={card}
        onAssigned={handleAssignmentChange}
      />

      <ReturnFuelCardModal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        card={card}
        onReturned={handleAssignmentChange}
      />
    </div>
  );
}

export default FuelCardDetailPage;
