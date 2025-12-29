/**
 * BrokerFormPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useBroker/useBrokers hooks
 * - Component focuses on rendering
 */

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useBroker, useBrokers } from '../../hooks';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { ArrowLeft, Search, ExternalLink } from 'lucide-react';

export function BrokerFormPage() {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const isEdit = Boolean(brokerId);

  // Hooks for API operations
  const {
    broker,
    loading: detailLoading,
    updateBroker,
    searchFmcsa,
    fmcsaLoading,
    mutating: updateMutating
  } = useBroker(brokerId, { autoFetch: isEdit });

  const {
    createBroker,
    mutating: createMutating
  } = useBrokers({ autoFetch: false });

  // Local state
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [fmcsaQuery, setFmcsaQuery] = useState('');
  const [fmcsaResults, setFmcsaResults] = useState([]);
  const [showFmcsaResults, setShowFmcsaResults] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    mc_number: '',
    dot_number: '',
    contact_name: '',
    email: '',
    phone: '',
    fax: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip: '',
    payment_terms: 30,
    credit_limit: '',
    factoring_company: '',
    is_active: true,
    is_preferred: false,
    notes: ''
  });

  // Populate form when broker data loads (edit mode)
  useEffect(() => {
    if (isEdit && broker) {
      setFormData({
        name: broker.name || '',
        mc_number: broker.mc_number || '',
        dot_number: broker.dot_number || '',
        contact_name: broker.contact?.name || '',
        email: broker.contact?.email || '',
        phone: broker.contact?.phone || '',
        fax: broker.contact?.fax || '',
        address_line1: broker.address?.line1 || '',
        address_line2: broker.address?.line2 || '',
        city: broker.address?.city || '',
        state: broker.address?.state || '',
        zip: broker.address?.zip || '',
        payment_terms: broker.billing?.payment_terms || 30,
        credit_limit: broker.billing?.credit_limit || '',
        factoring_company: broker.billing?.factoring_company || '',
        is_active: broker.is_active !== false,
        is_preferred: broker.is_preferred || false,
        notes: broker.notes || ''
      });
    }
  }, [isEdit, broker]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFmcsaSearch = async () => {
    if (!fmcsaQuery.trim()) return;

    try {
      const response = await searchFmcsa(fmcsaQuery);
      setFmcsaResults(response?.data || []);
      setShowFmcsaResults(true);
    } catch (err) {
      console.error('FMCSA search failed:', err);
    }
  };

  const applyFmcsaResult = (result) => {
    setFormData(prev => ({
      ...prev,
      name: result.name || prev.name,
      mc_number: result.mc_number || prev.mc_number,
      dot_number: result.dot_number || prev.dot_number,
      address_line1: result.address_line1 || prev.address_line1,
      city: result.city || prev.city,
      state: result.state || prev.state,
      zip: result.zip || prev.zip,
      phone: result.phone || prev.phone
    }));
    setShowFmcsaResults(false);
    setFmcsaQuery('');
    setFmcsaResults([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Broker name is required');
      return;
    }

    try {
      setSaving(true);
      if (isEdit) {
        await updateBroker(formData);
      } else {
        await createBroker(formData);
      }
      navigate(orgUrl('/customers?tab=brokers'));
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to save broker');
    } finally {
      setSaving(false);
    }
  };

  if (detailLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(orgUrl('/customers?tab=brokers'))}
          className="text-text-tertiary hover:text-text-primary"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-title text-text-primary">
          {isEdit ? 'Edit Broker' : 'Add Broker'}
        </h1>
      </div>

      {/* FMCSA Lookup */}
      {!isEdit && (
        <Card padding="default" className="bg-accent/5 border border-accent/20">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-accent" />
              <h3 className="text-body-sm font-medium text-text-primary">
                Quick Fill from FMCSA
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter MC#, DOT#, or company name..."
                value={fmcsaQuery}
                onChange={(e) => setFmcsaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleFmcsaSearch())}
                className="flex-1 px-3 py-2 bg-white border border-surface-tertiary rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button type="button" onClick={handleFmcsaSearch} loading={fmcsaLoading}>
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {showFmcsaResults && fmcsaResults.length > 0 && (
              <div className="space-y-2 mt-3">
                {fmcsaResults.map((result, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-white rounded-lg border border-surface-tertiary"
                  >
                    <div>
                      <p className="text-body-sm font-medium text-text-primary">{result.name}</p>
                      <p className="text-small text-text-secondary">
                        MC# {result.mc_number || 'N/A'} | DOT# {result.dot_number || 'N/A'}
                      </p>
                      <p className="text-small text-text-tertiary">
                        {result.city}, {result.state}
                      </p>
                    </div>
                    <Button variant="secondary" size="sm" onClick={() => applyFmcsaResult(result)}>
                      Use This
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        <Card padding="default" className="space-y-6">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  required
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  MC Number
                </label>
                <input
                  type="text"
                  name="mc_number"
                  value={formData.mc_number}
                  onChange={handleChange}
                  placeholder="e.g., 123456"
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  DOT Number
                </label>
                <input
                  type="text"
                  name="dot_number"
                  value={formData.dot_number}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Contact Name
                </label>
                <input
                  type="text"
                  name="contact_name"
                  value={formData.contact_name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Fax
                </label>
                <input
                  type="tel"
                  name="fax"
                  value={formData.fax}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Address</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  name="address_line1"
                  value={formData.address_line1}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  name="address_line2"
                  value={formData.address_line2}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-small font-medium text-text-secondary mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-small font-medium text-text-secondary mb-1">
                    ZIP
                  </label>
                  <input
                    type="text"
                    name="zip"
                    value={formData.zip}
                    onChange={handleChange}
                    className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Billing */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Billing</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Payment Terms (days)
                </label>
                <input
                  type="number"
                  name="payment_terms"
                  value={formData.payment_terms}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Credit Limit
                </label>
                <input
                  type="number"
                  name="credit_limit"
                  value={formData.credit_limit}
                  onChange={handleChange}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
              <div>
                <label className="block text-small font-medium text-text-secondary mb-1">
                  Factoring Company
                </label>
                <input
                  type="text"
                  name="factoring_company"
                  value={formData.factoring_company}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-4">
            <h3 className="text-body font-medium text-text-primary">Status</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_active"
                  checked={formData.is_active}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/20"
                />
                <span className="text-body-sm text-text-primary">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  name="is_preferred"
                  checked={formData.is_preferred}
                  onChange={handleChange}
                  className="w-4 h-4 rounded border-surface-tertiary text-accent focus:ring-accent/20"
                />
                <span className="text-body-sm text-text-primary">Preferred Broker</span>
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-surface-tertiary">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(orgUrl('/customers?tab=brokers'))}
            >
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              {isEdit ? 'Save Changes' : 'Add Broker'}
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
}

export default BrokerFormPage;
