/**
 * FuelCardsPage - Fuel card management with CRUD
 *
 * Displays fuel cards in a responsive grid with filtering by status,
 * provider, and search. Includes inline form for adding new cards.
 */

import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useFuelCards } from '../../hooks';
import AssignFuelCardModal from './AssignFuelCardModal';
import ReturnFuelCardModal from './ReturnFuelCardModal';
import {
  FuelCardStatus,
  FuelCardStatusLabels,
  FuelCardStatusColors,
  FuelCardProvider,
  FuelCardProviderLabels
} from '../../enums/fuel';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import {
  Plus,
  Search,
  CreditCard,
  Pencil,
  Trash2,
  X,
  Save,
  UserPlus,
  RotateCcw,
  RefreshCw
} from 'lucide-react';

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

const EMPTY_FORM = {
  card_number: '',
  card_provider: '',
  card_label: '',
  spending_limit_daily: '',
  spending_limit_weekly: '',
  spending_limit_monthly: '',
  allowed_fuel_only: false,
  expiration_date: '',
  notes: ''
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

export function FuelCardsPage() {
  const { orgUrl } = useOrg();
  const navigate = useNavigate();
  const {
    cards,
    loading,
    error,
    filters,
    setStatusFilter,
    setProviderFilter,
    setSearchQuery,
    createCard,
    updateCard,
    deleteCard,
    mutating,
    refetch
  } = useFuelCards();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [formError, setFormError] = useState(null);
  const [assignModalCard, setAssignModalCard] = useState(null);
  const [returnModalCard, setReturnModalCard] = useState(null);

  const openAddForm = useCallback(() => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setFormError(null);
    setShowForm(true);
  }, []);

  const openEditForm = useCallback((card) => {
    setFormData({
      card_number: card.card_number || '',
      card_provider: card.card_provider || '',
      card_label: card.card_label || '',
      spending_limit_daily: card.spending_limit_daily || '',
      spending_limit_weekly: card.spending_limit_weekly || '',
      spending_limit_monthly: card.spending_limit_monthly || '',
      allowed_fuel_only: card.allowed_fuel_only || false,
      expiration_date: card.expiration_date ? card.expiration_date.split('T')[0] : '',
      notes: card.notes || ''
    });
    setEditingId(card.id);
    setFormError(null);
    setShowForm(true);
  }, []);

  const closeForm = useCallback(() => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setFormError(null);
  }, []);

  const handleFieldChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleSave = useCallback(async () => {
    setFormError(null);

    if (!formData.card_number.trim()) {
      setFormError('Card number is required');
      return;
    }
    if (!formData.card_provider) {
      setFormError('Card provider is required');
      return;
    }

    try {
      const payload = { ...formData };
      // Remove driver/truck — managed via assignment flow
      delete payload.driver_id;
      delete payload.truck_id;
      // Convert spending limits to numbers or null
      ['spending_limit_daily', 'spending_limit_weekly', 'spending_limit_monthly'].forEach(field => {
        payload[field] = payload[field] ? Number(payload[field]) : null;
      });
      // Remove empty strings
      Object.keys(payload).forEach(key => {
        if (payload[key] === '') payload[key] = null;
      });
      payload.allowed_fuel_only = !!payload.allowed_fuel_only;

      if (editingId) {
        await updateCard(editingId, payload);
      } else {
        await createCard(payload);
      }
      closeForm();
    } catch (err) {
      setFormError(err?.message || 'Failed to save card');
    }
  }, [formData, editingId, createCard, updateCard, closeForm]);

  const handleDelete = useCallback(async (cardId) => {
    if (!window.confirm('Are you sure you want to delete this fuel card?')) return;
    try {
      await deleteCard(cardId);
    } catch (err) {
      console.error('Failed to delete card:', err);
    }
  }, [deleteCard]);

  const maskCardNumber = (number) => {
    if (!number) return '****';
    const last4 = number.slice(-4);
    return `****${last4}`;
  };

  if (loading && (!cards || cards.length === 0)) {
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
        <h1 className="text-xl sm:text-title text-text-primary">Fuel Cards</h1>
        <Button onClick={openAddForm} className="shrink-0">
          <Plus className="w-4 h-4 sm:mr-2" />
          <span className="hidden sm:inline">Add Card</span>
        </Button>
      </div>

      {/* Filter Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
        <select
          value={filters.status}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Status</option>
          {Object.values(FuelCardStatus).map(status => (
            <option key={status} value={status}>
              {FuelCardStatusLabels[status]}
            </option>
          ))}
        </select>

        <select
          value={filters.card_provider}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 shrink-0"
        >
          <option value="">All Providers</option>
          {Object.values(FuelCardProvider).map(provider => (
            <option key={provider} value={provider}>
              {FuelCardProviderLabels[provider]}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-[180px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search cards..."
            value={filters.search}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <p className="text-body-sm text-error">{error}</p>
            <Button variant="secondary" size="sm" onClick={refetch} className="ml-auto">
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Inline Add/Edit Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingId ? 'Edit Fuel Card' : 'Add Fuel Card'}</CardTitle>
              <button onClick={closeForm} className="p-1 hover:bg-surface-secondary rounded-lg transition-colors">
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {formError && (
              <div className="p-3 bg-error/5 border border-error/20 rounded-lg">
                <p className="text-body-sm text-error">{formError}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Card Number */}
              <Input
                label="Card Number"
                value={formData.card_number}
                onChange={(e) => handleFieldChange('card_number', e.target.value)}
                placeholder="Enter card number"
              />

              {/* Card Provider */}
              <div className="space-y-2">
                <label className="block text-body-sm font-medium text-text-primary">
                  Card Provider
                </label>
                <select
                  value={formData.card_provider}
                  onChange={(e) => handleFieldChange('card_provider', e.target.value)}
                  className="w-full px-4 py-3 bg-surface-secondary text-text-primary border border-transparent rounded-input focus:bg-white focus:border-accent focus:shadow-input-focus focus:outline-none transition-all duration-200"
                >
                  <option value="">Select provider...</option>
                  {Object.values(FuelCardProvider).map(provider => (
                    <option key={provider} value={provider}>
                      {FuelCardProviderLabels[provider]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Label */}
              <Input
                label="Card Label"
                value={formData.card_label}
                onChange={(e) => handleFieldChange('card_label', e.target.value)}
                placeholder="e.g., Main Fleet Card"
              />

              {/* Expiration Date */}
              <Input
                label="Expiration Date"
                type="date"
                value={formData.expiration_date}
                onChange={(e) => handleFieldChange('expiration_date', e.target.value)}
              />

              {/* Spending Limits */}
              <Input
                label="Daily Spending Limit"
                type="number"
                value={formData.spending_limit_daily}
                onChange={(e) => handleFieldChange('spending_limit_daily', e.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Weekly Spending Limit"
                type="number"
                value={formData.spending_limit_weekly}
                onChange={(e) => handleFieldChange('spending_limit_weekly', e.target.value)}
                placeholder="Optional"
              />
              <Input
                label="Monthly Spending Limit"
                type="number"
                value={formData.spending_limit_monthly}
                onChange={(e) => handleFieldChange('spending_limit_monthly', e.target.value)}
                placeholder="Optional"
              />
            </div>

            {/* Fuel Only Checkbox */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.allowed_fuel_only}
                onChange={(e) => handleFieldChange('allowed_fuel_only', e.target.checked)}
                className="w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/20"
              />
              <span className="text-body-sm text-text-primary">Fuel purchases only</span>
            </label>

            {/* Notes */}
            <div className="space-y-2">
              <label className="block text-body-sm font-medium text-text-primary">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleFieldChange('notes', e.target.value)}
                placeholder="Optional notes..."
                rows={2}
                className="w-full px-4 py-3 bg-surface-secondary text-text-primary border border-transparent rounded-input placeholder:text-text-tertiary focus:bg-white focus:border-accent focus:shadow-input-focus focus:outline-none transition-all duration-200 resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button variant="secondary" onClick={closeForm}>
                Cancel
              </Button>
              <Button onClick={handleSave} loading={mutating}>
                <Save className="w-4 h-4 mr-2" />
                {editingId ? 'Update Card' : 'Save Card'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards Grid */}
      {!cards || cards.length === 0 ? (
        <Card padding="default" className="text-center py-12">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-surface-secondary flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-text-tertiary" />
            </div>
            <p className="text-text-secondary">
              {filters.status || filters.card_provider || filters.search
                ? 'No fuel cards match your filters.'
                : 'No fuel cards yet. Add your first card to get started.'}
            </p>
            {!showForm && !filters.status && !filters.card_provider && !filters.search && (
              <Button variant="ghost" onClick={openAddForm}>
                <Plus className="w-4 h-4 mr-2" />
                Add Card
              </Button>
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Card
              key={card.id}
              padding="default"
              className="p-4 hover:shadow-card transition-shadow cursor-pointer"
              onClick={() => navigate(orgUrl(`/fuel/cards/${card.id}`))}
            >
              {/* Card Header: Provider + Masked Number */}
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={PROVIDER_BADGE_COLORS[card.card_provider] || 'gray'} size="sm">
                      {FuelCardProviderLabels[card.card_provider] || card.card_provider || 'Unknown'}
                    </Badge>
                    <Badge variant={FuelCardStatusColors[card.status] || 'gray'} size="sm">
                      {FuelCardStatusLabels[card.status] || card.status}
                    </Badge>
                  </div>
                  <p className="text-body-sm font-mono text-text-primary mt-1">
                    {maskCardNumber(card.card_number)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => openEditForm(card)}
                    className="p-1.5 hover:bg-surface-secondary rounded-lg transition-colors"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleDelete(card.id)}
                    className="p-1.5 hover:bg-error/10 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4 text-text-secondary hover:text-error" />
                  </button>
                </div>
              </div>

              {/* Card Label */}
              {card.card_label && (
                <p className="text-body-sm font-medium text-text-primary mb-2 truncate">
                  {card.card_label}
                </p>
              )}

              {/* Driver Assignment */}
              <div className="space-y-1 mb-3" onClick={(e) => e.stopPropagation()}>
                {card.driver ? (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-small text-text-secondary truncate">
                      <span className="text-text-tertiary">Driver:</span>{' '}
                      {`${card.driver.first_name || ''} ${card.driver.last_name || ''}`.trim()}
                      {card.current_assignment && (
                        <span className="text-text-tertiary">
                          {' '}&middot; Since {new Date(card.current_assignment.assigned_at).toLocaleDateString()}
                        </span>
                      )}
                    </p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setReturnModalCard(card)}
                        className="p-1 hover:bg-surface-secondary rounded transition-colors"
                        title="Return card"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-text-tertiary" />
                      </button>
                      <button
                        onClick={() => setAssignModalCard(card)}
                        className="p-1 hover:bg-surface-secondary rounded transition-colors"
                        title="Reassign"
                      >
                        <RefreshCw className="w-3.5 h-3.5 text-text-tertiary" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-small text-text-tertiary">Unassigned</p>
                    <button
                      onClick={() => setAssignModalCard(card)}
                      className="flex items-center gap-1 px-2 py-0.5 text-small text-accent hover:bg-accent/5 rounded transition-colors"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Assign Driver
                    </button>
                  </div>
                )}
              </div>

              {/* Spending Limits */}
              {(card.spending_limit_daily || card.spending_limit_weekly || card.spending_limit_monthly) && (
                <div className="border-t border-surface-tertiary pt-2 mt-2">
                  <p className="text-[11px] text-text-tertiary uppercase tracking-wider mb-1">Spending Limits</p>
                  <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-small text-text-secondary">
                    {card.spending_limit_daily && (
                      <span>Daily: {formatCurrency(card.spending_limit_daily)}</span>
                    )}
                    {card.spending_limit_weekly && (
                      <span>Weekly: {formatCurrency(card.spending_limit_weekly)}</span>
                    )}
                    {card.spending_limit_monthly && (
                      <span>Monthly: {formatCurrency(card.spending_limit_monthly)}</span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Summary Footer */}
      {cards && cards.length > 0 && (
        <div className="text-body-sm text-text-secondary">
          Showing {cards.length} fuel card{cards.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Assignment Modals */}
      {assignModalCard && (
        <AssignFuelCardModal
          card={assignModalCard}
          onClose={() => setAssignModalCard(null)}
          onSuccess={() => {
            setAssignModalCard(null);
            refetch();
          }}
        />
      )}

      {returnModalCard && (
        <ReturnFuelCardModal
          card={returnModalCard}
          onClose={() => setReturnModalCard(null)}
          onSuccess={() => {
            setReturnModalCard(null);
            refetch();
          }}
        />
      )}
    </div>
  );
}

export default FuelCardsPage;
