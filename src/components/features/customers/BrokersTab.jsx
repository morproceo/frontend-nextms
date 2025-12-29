/**
 * BrokersTab - Refactored to use hooks architecture
 *
 * This component demonstrates the new pattern:
 * - No direct API imports
 * - Business logic delegated to useBrokers hook
 * - Component focuses on rendering
 */

import { useState } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import { useBrokers } from '../../../hooks';
import {
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Star,
  ExternalLink
} from 'lucide-react';

export function BrokersTab({ onViewBroker, onAddBroker }) {
  // All data and logic from the hook
  const {
    brokers,
    allBrokers,
    loading,
    error,
    filters,
    setSearchQuery,
    refetch,
    searchFmcsa,
    fmcsaLoading
  } = useBrokers();

  // Local UI state for FMCSA panel
  const [showFmcsaSearch, setShowFmcsaSearch] = useState(false);
  const [fmcsaQuery, setFmcsaQuery] = useState('');
  const [fmcsaResults, setFmcsaResults] = useState([]);

  // Handle FMCSA search
  const handleFmcsaSearch = async () => {
    if (!fmcsaQuery.trim()) return;

    try {
      const results = await searchFmcsa(fmcsaQuery);
      setFmcsaResults(results || []);
    } catch (err) {
      console.error('FMCSA search failed:', err);
    }
  };

  // Loading state
  if (loading && allBrokers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Actions */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
            <input
              type="text"
              placeholder="Search brokers..."
              value={filters.search}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowFmcsaSearch(!showFmcsaSearch)}
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            FMCSA Lookup
          </Button>
        </div>
        <Button onClick={onAddBroker}>
          <Plus className="w-4 h-4 mr-2" />
          Add Broker
        </Button>
      </div>

      {/* FMCSA Search Panel */}
      {showFmcsaSearch && (
        <Card padding="default" className="bg-accent/5 border border-accent/20">
          <div className="space-y-3">
            <h3 className="text-body-sm font-medium text-text-primary">Search FMCSA Database</h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter MC#, DOT#, or company name..."
                value={fmcsaQuery}
                onChange={(e) => setFmcsaQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleFmcsaSearch()}
                className="flex-1 px-3 py-2 bg-white border border-surface-tertiary rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <Button onClick={handleFmcsaSearch} loading={fmcsaLoading}>
                Search
              </Button>
            </div>

            {fmcsaResults.length > 0 && (
              <div className="space-y-2 mt-4">
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
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => {
                        // TODO: Open form with pre-filled data
                        console.log('Add broker from FMCSA:', result);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Brokers List */}
      {error ? (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <p className="text-body-sm text-error">{error}</p>
          <Button variant="secondary" size="sm" onClick={refetch} className="mt-2">
            Retry
          </Button>
        </Card>
      ) : brokers.length === 0 ? (
        <Card padding="default" className="text-center py-12">
          <Building2 className="w-12 h-12 text-text-tertiary mx-auto mb-4" />
          <p className="text-body text-text-secondary">
            {allBrokers.length === 0 ? 'No brokers yet' : 'No brokers match your search'}
          </p>
          {allBrokers.length === 0 && (
            <Button onClick={onAddBroker} className="mt-4">
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Broker
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brokers.map((broker) => (
            <Card
              key={broker.id}
              padding="default"
              className="cursor-pointer hover:shadow-card transition-shadow"
              onClick={() => onViewBroker(broker.id)}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-body font-medium text-text-primary">{broker.name}</h3>
                      {broker.is_preferred && (
                        <Star className="w-4 h-4 text-warning fill-warning" />
                      )}
                    </div>
                    {broker.mc_number && (
                      <p className="text-small text-text-secondary">MC# {broker.mc_number}</p>
                    )}
                  </div>
                  <Badge variant={broker.is_active ? 'green' : 'gray'} size="sm">
                    {broker.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-1.5 text-small">
                  {broker.contact?.name && (
                    <p className="text-text-secondary">{broker.contact.name}</p>
                  )}
                  {broker.contact?.phone && (
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <Phone className="w-3.5 h-3.5" />
                      <span>{broker.contact.phone}</span>
                    </div>
                  )}
                  {broker.contact?.email && (
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <Mail className="w-3.5 h-3.5" />
                      <span className="truncate">{broker.contact.email}</span>
                    </div>
                  )}
                  {(broker.address?.city || broker.address?.state) && (
                    <div className="flex items-center gap-2 text-text-tertiary">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>
                        {[broker.address.city, broker.address.state].filter(Boolean).join(', ')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default BrokersTab;
