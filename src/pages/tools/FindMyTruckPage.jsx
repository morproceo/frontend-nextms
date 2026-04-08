/**
 * Find My Truck - Real-time fleet tracking page
 * Shows fleet locations on a map with a searchable truck sidebar
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { Card, CardContent } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { Input } from '../../components/ui/Input';
import FleetMap from '../../components/features/tools/FleetMap';
import api from '../../api/client';
import {
  MapPin,
  RefreshCw,
  Search,
  Truck,
  Settings,
  AlertTriangle
} from 'lucide-react';

// ---------- Helpers ----------

function getEldColor(status) {
  switch (status) {
    case 'driving': return 'red';
    case 'on_duty': return 'yellow';
    case 'sleeper_berth': return 'blue';
    case 'off_duty': return 'green';
    case 'available': return 'green';
    default: return 'gray';
  }
}

function getEldLabel(status) {
  switch (status) {
    case 'driving': return 'Driving';
    case 'on_duty': return 'On Duty';
    case 'sleeper_berth': return 'Sleeper';
    case 'off_duty': return 'Off Duty';
    case 'available': return 'Available';
    default: return status || 'Unknown';
  }
}

function timeAgo(isoDate) {
  if (!isoDate) return '';
  const seconds = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatHours(decimal) {
  if (decimal == null) return '';
  const h = Math.floor(decimal);
  const m = Math.round((decimal - h) * 60);
  return `${h}h ${m}m`;
}

// ---------- Component ----------

export function FindMyTruckPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const [trucks, setTrucks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [notConfigured, setNotConfigured] = useState(false);

  // Fetch fleet locations
  const fetchLocations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setNotConfigured(false);

      const response = await api.get('/v1/ava/fleet-locations');
      const payload = response.data.data;

      setTrucks(payload.trucks || []);
      setLastUpdated(payload.last_updated ? new Date(payload.last_updated) : new Date());
    } catch (err) {
      console.error('Error fetching fleet locations:', err);

      if (err.response?.status === 400 && /not configured/i.test(err.response?.data?.message || '')) {
        setNotConfigured(true);
      } else {
        setError(err.response?.data?.message || err.message);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchLocations();
  }, [fetchLocations]);

  // Auto-refresh every 30s
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(fetchLocations, 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchLocations]);

  // ---------- Not-configured state ----------
  if (notConfigured) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12 px-8">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <Truck className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-headline text-text-primary mb-2">Connect Motive ELD</h2>
            <p className="text-body-sm text-text-secondary text-center max-w-md mb-6">
              Set up your Motive API key to see real-time truck locations.
            </p>
            <Button onClick={() => navigate(orgUrl('/tools/ava/settings'))}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Motive Integration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // ---------- Filtered trucks ----------
  const query = searchQuery.toLowerCase().trim();
  const filteredTrucks = query
    ? trucks.filter((t) => {
        const unit = (t.unit_number || '').toLowerCase();
        const driver = (t.driver?.name || t.driver_name || '').toLowerCase();
        const location = (t.location?.description || t.location_description || '').toLowerCase();
        return unit.includes(query) || driver.includes(query) || location.includes(query);
      })
    : trucks;

  // ---------- Empty state (no trucks with locations) ----------
  const showEmpty = !loading && !error && trucks.length === 0;

  // ---------- Render ----------
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Title bar */}
      <div className="sticky top-0 z-10 bg-white border-b flex items-center justify-between px-4 h-14 flex-shrink-0">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-accent" />
          <h1 className="text-body font-semibold text-text-primary">Find My Truck</h1>
          {trucks.length > 0 && (
            <Badge variant="gray">{trucks.length}</Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-small text-text-tertiary hidden sm:inline">
              Updated {timeAgo(lastUpdated.toISOString())}
            </span>
          )}

          <label className="flex items-center gap-1.5 text-small text-text-secondary cursor-pointer hidden sm:flex">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-surface-tertiary"
            />
            Auto
          </label>

          <Button variant="secondary" size="sm" onClick={fetchLocations} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="bg-error/5 border-b border-error/20 px-4 py-2 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-error flex-shrink-0" />
          <p className="text-small text-error flex-1">{error}</p>
          <Button variant="secondary" size="sm" onClick={fetchLocations}>Retry</Button>
        </div>
      )}

      {/* Main content: sidebar + map */}
      {showEmpty ? (
        <div className="flex-1 flex items-center justify-center">
          <Card padding="default">
            <div className="flex flex-col items-center justify-center py-12 px-8">
              <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center mb-4">
                <Truck className="w-8 h-8 text-text-tertiary" />
              </div>
              <h3 className="text-body font-medium text-text-primary mb-1">No trucks found</h3>
              <p className="text-body-sm text-text-secondary text-center max-w-md">
                Ensure your trucks are linked to Motive and have valid GPS data to see them here.
              </p>
            </div>
          </Card>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Left sidebar */}
          <div className="w-80 bg-white border-r flex flex-col flex-shrink-0 overflow-hidden">
            {/* Search */}
            <div className="p-3 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
                <input
                  type="text"
                  placeholder="Search trucks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-body-sm rounded-lg border border-surface-tertiary bg-surface-secondary focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent placeholder:text-text-tertiary"
                />
              </div>
            </div>

            {/* Truck count */}
            <div className="px-4 py-2 border-b">
              <p className="text-small text-text-secondary">
                {filteredTrucks.length} truck{filteredTrucks.length !== 1 ? 's' : ''} online
              </p>
            </div>

            {/* Truck list */}
            <div className="flex-1 overflow-y-auto">
              {filteredTrucks.map((truck) => {
                const isSelected = selectedTruckId === truck.id;
                const driverName = truck.driver?.name || truck.driver_name || 'No driver assigned';
                const locationDesc = truck.location?.description || truck.location_description || '';
                const speed = truck.speed != null ? `${truck.speed} mph` : '';
                const updatedAt = truck.location?.updated_at || truck.updated_at;

                return (
                  <div
                    key={truck.id}
                    onClick={() => setSelectedTruckId(truck.id)}
                    className={`py-3 px-4 border-b border-surface-tertiary cursor-pointer transition-colors hover:bg-surface-secondary/50 ${
                      isSelected ? 'bg-accent/5 border-l-2 border-l-accent' : ''
                    }`}
                  >
                    {/* Row 1: Unit number + ELD badge */}
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm font-semibold text-text-primary">
                        Unit #{truck.unit_number}
                      </span>
                      <Badge variant={getEldColor(truck.eld_status)} size="sm">
                        {getEldLabel(truck.eld_status)}
                      </Badge>
                    </div>

                    {/* Row 2: Driver */}
                    <p className="text-small text-text-secondary mt-0.5">{driverName}</p>

                    {/* Row 3: Speed + location */}
                    {(speed || locationDesc) && (
                      <p className="text-small text-text-tertiary mt-0.5 truncate">
                        {speed}{speed && locationDesc ? ' · ' : ''}{locationDesc}
                      </p>
                    )}

                    {/* Row 4: Updated time */}
                    {updatedAt && (
                      <p className="text-small text-text-tertiary mt-0.5">
                        Updated {timeAgo(updatedAt)}
                      </p>
                    )}
                  </div>
                );
              })}

              {filteredTrucks.length === 0 && searchQuery && (
                <div className="p-4 text-center">
                  <p className="text-small text-text-tertiary">No trucks match "{searchQuery}"</p>
                </div>
              )}
            </div>
          </div>

          {/* Map area */}
          <div className="flex-1 relative">
            <FleetMap
              trucks={trucks}
              selectedTruckId={selectedTruckId}
              onTruckSelect={setSelectedTruckId}
              loading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default FindMyTruckPage;
