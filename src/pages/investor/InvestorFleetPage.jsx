/**
 * InvestorFleetPage - Read-only fleet overview with live truck map
 *
 * Shows trucks, trailers, KPIs, and a live FleetMap.
 * No create/edit/delete capabilities.
 */

import { useState, useEffect } from 'react';
import { useTrucksList, useTrailersList } from '../../hooks';
import { AssetStatusConfig, getStatusConfig } from '../../config/status';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { FleetMap } from '../../components/features/tools/FleetMap';
import api from '../../api/client';
import { Truck, Container, Wifi } from 'lucide-react';

export function InvestorFleetPage() {
  const { trucks, loading: trucksLoading, fetchTrucks } = useTrucksList();
  const { trailers, loading: trailersLoading, fetchTrailers } = useTrailersList();

  const [fleetTrucks, setFleetTrucks] = useState(null);
  const [selectedTruckId, setSelectedTruckId] = useState(null);
  const [mapLoading, setMapLoading] = useState(true);

  useEffect(() => {
    fetchTrucks();
    fetchTrailers();

    const fetchFleetLocations = async () => {
      try {
        setMapLoading(true);
        const response = await api.get('/v1/ava/fleet-locations');
        setFleetTrucks(response.data.data.trucks);
      } catch (err) {
        // 400 = no Motive integration, just skip the map
        setFleetTrucks(null);
      } finally {
        setMapLoading(false);
      }
    };
    fetchFleetLocations();
  }, []);

  const loading = trucksLoading || trailersLoading;

  if (loading && (!trucks || trucks.length === 0)) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const truckCount = trucks?.length || 0;
  const trailerCount = trailers?.length || 0;
  const onlineCount = fleetTrucks?.length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <h1 className="text-xl sm:text-2xl font-semibold text-text-primary">Fleet Overview</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Truck className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Total Trucks</p>
              <p className="text-2xl font-bold text-text-primary">{truckCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <Container className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Total Trailers</p>
              <p className="text-2xl font-bold text-text-primary">{trailerCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
              <Wifi className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-text-tertiary">Trucks Online</p>
              <p className="text-2xl font-bold text-text-primary">{onlineCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Fleet Map */}
      {!mapLoading && fleetTrucks && fleetTrucks.length > 0 && (
        <Card padding="none" className="overflow-hidden border border-surface-tertiary">
          <div style={{ height: 400 }}>
            <FleetMap
              trucks={fleetTrucks}
              selectedTruckId={selectedTruckId}
              onTruckSelect={setSelectedTruckId}
              loading={mapLoading}
            />
          </div>
        </Card>
      )}

      {/* Truck List */}
      <Card padding="none" className="overflow-hidden border border-surface-tertiary">
        <div className="px-4 py-3 border-b border-surface-tertiary bg-surface-secondary/50">
          <h2 className="text-sm font-semibold text-text-primary">Trucks</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-surface-secondary/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Unit #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Make / Model</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-text-tertiary uppercase tracking-wider">Current Driver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-tertiary">
              {(!trucks || trucks.length === 0) ? (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center">
                    <p className="text-text-tertiary text-sm">No trucks found</p>
                  </td>
                </tr>
              ) : (
                trucks.map((truck) => {
                  const status = getStatusConfig(AssetStatusConfig, truck.status, {
                    label: truck.status || 'Unknown',
                    variant: 'gray'
                  });

                  return (
                    <tr key={truck.id} className="hover:bg-accent/5 transition-colors">
                      <td className="px-4 py-3">
                        <span className="font-mono font-semibold text-text-primary">
                          {truck.unit_number || '-'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {[truck.make, truck.model].filter(Boolean).join(' ') || '-'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={status.variant}>{status.label}</Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-text-primary">
                        {truck.current_driver
                          ? `${truck.current_driver.first_name || ''} ${truck.current_driver.last_name || ''}`.trim()
                          : '-'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default InvestorFleetPage;
