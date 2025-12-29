/**
 * QuickAddBrokerModal - Refactored to use hooks architecture
 */

import { useState } from 'react';
import { X, Search, Building2, Loader2, Check } from 'lucide-react';
import { useBrokerMutations } from '../../../hooks';
import { Button } from '../../ui/Button';
import brokersApi from '../../../api/brokers.api'; // Keep for FMCSA lookup (no hook yet)

export function QuickAddBrokerModal({ isOpen, onClose, onCreated }) {
  const { createBroker, loading: saving } = useBrokerMutations();
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    mc_number: '',
    dot_number: '',
    phone: '',
    email: '',
    address_line1: '',
    city: '',
    state: '',
    zip: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    setError(null);
    setShowResults(true);

    try {
      const response = await brokersApi.fmcsaLookup({ query: searchQuery });
      setSearchResults(response.data || []);
    } catch (err) {
      setError('Search failed. Try entering details manually.');
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectResult = (result) => {
    setFormData({
      name: result.legal_name || result.name || '',
      mc_number: result.mc_number || '',
      dot_number: result.dot_number || '',
      phone: result.phone || '',
      email: result.email || '',
      address_line1: result.address || '',
      city: result.city || '',
      state: result.state || '',
      zip: result.zip || ''
    });
    setShowResults(false);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError('Company name is required');
      return;
    }

    try {
      const result = await createBroker(formData);
      onCreated(result);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message || 'Failed to create broker');
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      mc_number: '',
      dot_number: '',
      phone: '',
      email: '',
      address_line1: '',
      city: '',
      state: '',
      zip: ''
    });
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-elevated w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-surface-tertiary">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-accent" />
            <h2 className="text-body font-semibold text-text-primary">Add Broker</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FMCSA Search */}
        <div className="p-4 bg-surface-secondary/50 border-b border-surface-tertiary">
          <p className="text-small text-text-secondary mb-2">Search FMCSA database</p>
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="MC#, DOT#, or company name..."
                className="w-full px-3 py-2 bg-white border border-surface-tertiary rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="px-4"
            >
              {searching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Search Results */}
          {showResults && (
            <div className="mt-2 bg-white border border-surface-tertiary rounded-lg overflow-hidden">
              {searching ? (
                <div className="p-4 text-center text-text-tertiary">
                  <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Searching FMCSA...
                </div>
              ) : searchResults.length > 0 ? (
                <div className="max-h-48 overflow-y-auto">
                  {searchResults.map((result, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectResult(result)}
                      className="w-full p-3 text-left hover:bg-surface-secondary border-b border-surface-tertiary last:border-0 transition-colors"
                    >
                      <p className="text-body-sm font-medium text-text-primary">
                        {result.legal_name || result.name}
                      </p>
                      <p className="text-small text-text-secondary">
                        {result.mc_number && `MC# ${result.mc_number}`}
                        {result.mc_number && result.dot_number && ' • '}
                        {result.dot_number && `DOT# ${result.dot_number}`}
                      </p>
                      {result.city && result.state && (
                        <p className="text-small text-text-tertiary">
                          {result.city}, {result.state}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-text-tertiary text-small">
                  No results found. Enter details manually below.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-error/10 border border-error/20 rounded-lg">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          {/* Company Name */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Company Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="ABC Freight Brokers"
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* MC and DOT */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                MC Number
              </label>
              <input
                type="text"
                name="mc_number"
                value={formData.mc_number}
                onChange={handleChange}
                placeholder="123456"
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
                placeholder="1234567"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
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
                placeholder="dispatch@example.com"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Address
            </label>
            <input
              type="text"
              name="address_line1"
              value={formData.address_line1}
              onChange={handleChange}
              placeholder="123 Main St"
              className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>

          {/* City, State, ZIP */}
          <div className="grid grid-cols-6 gap-3">
            <div className="col-span-3">
              <label className="block text-small font-medium text-text-secondary mb-1">
                City
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="Chicago"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="col-span-1">
              <label className="block text-small font-medium text-text-secondary mb-1">
                State
              </label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="IL"
                maxLength={2}
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-small font-medium text-text-secondary mb-1">
                ZIP
              </label>
              <input
                type="text"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                placeholder="60601"
                className="w-full px-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" loading={saving}>
              Add Broker
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default QuickAddBrokerModal;
