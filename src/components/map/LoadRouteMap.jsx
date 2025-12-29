/**
 * LoadRouteMap Component
 * Wrapper component that fetches and displays route for a load
 * Note: mapApi kept as exception (specialized mapping operation)
 */

import { useState, useEffect, useCallback } from 'react';
import { RouteMap } from './RouteMap';
import mapApi from '../../api/map.api'; // Exception: Specialized mapping operation
import { AlertCircle, RefreshCw } from 'lucide-react';

export function LoadRouteMap({
  loadId,
  className = '',
  onRouteLoaded = null,
  showOverlay = true,
  forceRefresh = false,
  refreshKey = 0  // Incrementing key to trigger refresh
}) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [routeData, setRouteData] = useState(null);

  const fetchRoute = useCallback(async (refresh = false) => {
    if (!loadId) return;

    if (refresh && routeData) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await mapApi.getLoadRoute(loadId, { refresh });

      if (data.success) {
        setRouteData(data);
        if (onRouteLoaded) {
          // Pass route data with load financials (API returns data.load)
          onRouteLoaded(data);
        }
      } else {
        setError(data.error || 'Unable to calculate route');
        // Still show locations even if route failed
        if (data.locations && data.locations.length > 0) {
          setRouteData({ ...data, route: null });
        }
      }
    } catch (err) {
      console.error('Failed to fetch route:', err);
      setError(err.message || 'Failed to load route');
      // Notify parent that loading is complete (even on error)
      if (onRouteLoaded) {
        onRouteLoaded({ success: false, error: err.message });
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [loadId, onRouteLoaded, routeData]);

  const handleRefresh = useCallback(() => {
    fetchRoute(true);
  }, [fetchRoute]);

  useEffect(() => {
    // Use forceRefresh or refreshKey change to trigger route recalculation
    const shouldRefresh = forceRefresh || refreshKey > 0;
    fetchRoute(shouldRefresh);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId, forceRefresh, refreshKey]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 h-full ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Loading route...</p>
        </div>
      </div>
    );
  }

  if (error && (!routeData || routeData.locations?.length === 0)) {
    return (
      <div className={`flex items-center justify-center bg-gray-900 h-full ${className}`}>
        <div className="text-center px-6 max-w-md">
          <AlertCircle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <p className="text-sm text-gray-300 mb-2 font-medium">Route Unavailable</p>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <p className="text-xs text-gray-600 mb-4">
            Add pickup and delivery city/state to display the route.
          </p>
          <button
            onClick={fetchRoute}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative h-full ${className}`}>
      <RouteMap
        route={routeData?.route}
        locations={routeData?.locations || []}
        className="w-full h-full"
      />

      {/* Route Stats Overlay */}
      {showOverlay && routeData?.distanceMiles && (
        <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg px-4 py-2 text-white">
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-gray-400">Distance:</span>{' '}
              <span className="font-semibold">{routeData.distanceMiles.toLocaleString()} mi</span>
            </div>
            {routeData.durationHours && (
              <div>
                <span className="text-gray-400">Est. Time:</span>{' '}
                <span className="font-semibold">{formatDuration(routeData.durationHours)}</span>
              </div>
            )}
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-1.5 rounded hover:bg-white/10 transition-colors disabled:opacity-50"
              title={routeData.cached ? 'Recalculate route' : 'Refresh route'}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDuration(hours) {
  if (hours < 1) {
    return `${Math.round(hours * 60)} min`;
  }
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export default LoadRouteMap;
