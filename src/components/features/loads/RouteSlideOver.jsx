import { useEffect, useCallback, useState, lazy, Suspense } from 'react';
import { X, RefreshCw } from 'lucide-react';
import { StopsManager } from './StopsManager';
import { Spinner } from '../../ui/Spinner';

// Lazy load the map component - only imported when panel opens
const LoadRouteMap = lazy(() =>
  import('../../map/LoadRouteMap').then(m => ({ default: m.LoadRouteMap }))
);

export function RouteSlideOver({
  isOpen,
  onClose,
  loadId,
  load,
  stops,
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onUpdateLoad,
  refreshKey,
  onRouteLoaded,
  routeRefreshing,
  onRefreshRoute
}) {
  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/30 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-xl bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
          <h2 className="text-base font-semibold text-gray-900">Route & Stops</h2>
          <div className="flex items-center gap-2">
            {onRefreshRoute && (
              <button
                onClick={onRefreshRoute}
                disabled={routeRefreshing}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 disabled:opacity-50"
                title="Refresh route"
              >
                <RefreshCw className={`w-4 h-4 ${routeRefreshing ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Map - Only rendered when panel is open */}
        {isOpen && (
          <div className="h-[280px] sm:h-[320px] relative shrink-0">
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <Spinner size="lg" />
              </div>
            }>
              <LoadRouteMap
                loadId={loadId}
                className="absolute inset-0"
                showOverlay={false}
                refreshKey={refreshKey}
                onRouteLoaded={onRouteLoaded}
              />
            </Suspense>

            {routeRefreshing && (
              <div className="absolute top-2 right-2 z-20 bg-blue-600 text-white px-2.5 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 text-xs">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Updating route...
              </div>
            )}
          </div>
        )}

        {/* Stops Manager */}
        <div className="flex-1 overflow-y-auto p-4">
          <StopsManager
            load={load}
            stops={stops}
            onAddStop={onAddStop}
            onUpdateStop={onUpdateStop}
            onDeleteStop={onDeleteStop}
            onReorderStops={onReorderStops}
            onUpdateLoad={onUpdateLoad}
            compact
          />
        </div>
      </div>
    </>
  );
}

export default RouteSlideOver;
