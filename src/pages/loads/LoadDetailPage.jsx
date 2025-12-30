/**
 * LoadDetailPage - Refactored to use hooks architecture
 *
 * This page demonstrates the new pattern:
 * - Uses useLoad domain hook for load data, stops, and mutations
 * - Uses useDriversList for driver dropdown
 * - Centralized configs from config/status
 * - Component focuses on rendering
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useLoad, useDriversList } from '../../hooks';
import { LoadStatusConfig, BillingStatusConfig } from '../../config/status';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { DocumentUploadModal } from '../../components/features/documents/DocumentUploadModal';
import { StopsManager } from '../../components/features/loads/StopsManager';
import uploadsApi from '../../api/uploads.api'; // Exception: Simple document fetch
import {
  ArrowLeft,
  MapPin,
  Calendar,
  Truck,
  User,
  Building2,
  Package,
  DollarSign,
  FileText,
  Plus,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Send,
  Printer,
  Copy,
  Trash2,
  ExternalLink,
  Pencil,
  Check,
  X,
  RefreshCw,
  Route
} from 'lucide-react';
import { LoadRouteMap } from '../../components/map';

// Build status flow from centralized config (ordered for UI flow)
const statusFlowOrder = ['new', 'booked', 'dispatched', 'in_transit', 'delivered', 'invoiced', 'paid'];

// Color class mapping - Tailwind needs complete class names at build time
const statusColorClasses = {
  gray: {
    bg: 'bg-gray-100',
    text: 'text-gray-700',
    ring: 'ring-gray-400'
  },
  blue: {
    bg: 'bg-blue-100',
    text: 'text-blue-700',
    ring: 'ring-blue-400'
  },
  indigo: {
    bg: 'bg-indigo-100',
    text: 'text-indigo-700',
    ring: 'ring-indigo-400'
  },
  purple: {
    bg: 'bg-purple-100',
    text: 'text-purple-700',
    ring: 'ring-purple-400'
  },
  orange: {
    bg: 'bg-orange-100',
    text: 'text-orange-700',
    ring: 'ring-orange-400'
  },
  green: {
    bg: 'bg-green-100',
    text: 'text-green-700',
    ring: 'ring-green-400'
  },
  teal: {
    bg: 'bg-teal-100',
    text: 'text-teal-700',
    ring: 'ring-teal-400'
  },
  emerald: {
    bg: 'bg-emerald-100',
    text: 'text-emerald-700',
    ring: 'ring-emerald-400'
  },
  red: {
    bg: 'bg-red-100',
    text: 'text-red-700',
    ring: 'ring-red-400'
  }
};

const statusFlow = statusFlowOrder.map(status => {
  const color = LoadStatusConfig[status]?.color || 'gray';
  return {
    value: status,
    label: LoadStatusConfig[status]?.label || status,
    color,
    classes: statusColorClasses[color] || statusColorClasses.gray
  };
});

// Build billing options from centralized config
const billingOptions = Object.entries(BillingStatusConfig).map(([value, config]) => ({
  value,
  label: config.label
}));

// Inline editable field
function EditableField({ value, onSave, placeholder = '-', prefix = '', suffix = '', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  const save = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onBlur={save}
        className={`bg-white border border-blue-400 px-2 py-0.5 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-full ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => setEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 px-1 -mx-1 rounded transition-colors ${className}`}
    >
      {prefix}{value || <span className="text-gray-400">{placeholder}</span>}{suffix}
    </span>
  );
}

export function LoadDetailPage() {
  const { loadId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  // Use domain hooks for data and mutations
  const {
    load,
    stops,
    loading,
    error,
    refetch,
    updateField: hookUpdateField,
    updateFields,
    updateStatus: hookUpdateStatus,
    addStop,
    updateStop,
    deleteStop,
    reorderStops
  } = useLoad(loadId);

  // Drivers for assignment dropdown
  const { drivers, fetchDrivers } = useDriversList();

  // Local UI state
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showRoutePanel, setShowRoutePanel] = useState(false);
  const [routeRefreshCounter, setRouteRefreshCounter] = useState(0);
  const [routeRefreshing, setRouteRefreshing] = useState(false);

  // Local financial state for immediate UI updates from route calculations
  const [localFinancials, setLocalFinancials] = useState(null);

  // Fetch drivers and documents on mount
  useEffect(() => {
    fetchDrivers();
    fetchDocuments();
  }, [loadId]);

  // Clear local financials when load data is refetched to stay in sync
  useEffect(() => {
    if (load) {
      setLocalFinancials(null);
    }
  }, [load?.updated_at]);

  // Handle route loaded - update financials immediately from route API response
  const handleRouteLoaded = useCallback((routeData) => {
    setRouteRefreshing(false);
    if (routeData?.success && routeData?.load) {
      setLocalFinancials(routeData.load);
    }
    // On error, we just clear refreshing state - the error will show in the map component
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await uploadsApi.getLoadDocuments(loadId);
      setDocuments(response.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
    }
  };

  // Fields that affect financial calculations (RPM, margin)
  const financialFields = ['revenue', 'miles', 'driver_pay', 'rate'];

  const updateField = async (field, value) => {
    try {
      await hookUpdateField(field, value);
      // Refetch load data after financial field changes to get recalculated RPM/margin
      if (financialFields.includes(field)) {
        await refetch();
      }
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  const updateStatus = async (newStatus) => {
    try {
      await hookUpdateStatus(newStatus);
    } catch (err) {
      console.error('Failed to update status:', err);
    }
  };

  // Refresh the map route - increments counter to trigger route recalculation
  // The onRouteLoaded callback handles updating local financials and clearing refreshing state
  const refreshRoute = useCallback(() => {
    setRouteRefreshing(true);
    setRouteRefreshCounter(c => c + 1);
    // Safety timeout in case callback doesn't fire (e.g., route calculation fails)
    setTimeout(() => setRouteRefreshing(false), 10000);
  }, []);

  // Refresh route after stop/location changes
  // Uses callback-based flow: route API returns updated financials → handleRouteLoaded updates UI
  const refreshRouteAndLoad = useCallback(() => {
    setRouteRefreshing(true);
    setRouteRefreshCounter(c => c + 1);
    // Safety timeout in case callback doesn't fire
    setTimeout(() => setRouteRefreshing(false), 10000);
  }, []);

  // Update load field and optionally refresh route
  const updateFieldWithRoute = async (field, value, shouldRefreshRoute = false) => {
    await updateField(field, value);
    if (shouldRefreshRoute) {
      refreshRoute();
    }
  };

  // Update multiple fields at once (for address updates)
  const updateLoadFields = async (updates) => {
    try {
      await updateFields(updates);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to update load:', err);
    }
  };

  // Stop management handlers - use refreshRouteAndLoad to update miles/RPM
  const handleAddStop = async (stopData) => {
    try {
      await addStop(stopData);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to add stop:', err);
    }
  };

  const handleUpdateStop = async (stopId, data) => {
    try {
      await updateStop(stopId, data);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to update stop:', err);
    }
  };

  const handleDeleteStop = async (stopId) => {
    try {
      await deleteStop(stopId);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to delete stop:', err);
    }
  };

  const handleReorderStops = async (stopOrder) => {
    try {
      await reorderStops(stopOrder);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to reorder stops:', err);
    }
  };

  const fmt = (amount) => {
    if (!amount && amount !== 0) return '$0';
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  const fmtDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const fmtTime = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  // Collapsible section state for mobile
  const [expandedSections, setExpandedSections] = useState({
    route: true,
    broker: false,
    assignment: false,
    cargo: false,
    billing: false,
    documents: false,
    notes: false
  });

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><Spinner size="lg" /></div>;
  }

  if (error || !load) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-3 p-4">
        <p className="text-gray-500 text-center">{error || 'Load not found'}</p>
        <Button variant="secondary" size="sm" onClick={() => navigate(orgUrl('/loads'))}>Back to Loads</Button>
      </div>
    );
  }

  const currentStatusIndex = statusFlow.findIndex(s => s.value === load.status);

  // Use local financials if available (immediate updates from route calc), fallback to load data
  const revenue = parseFloat(localFinancials?.revenue ?? load.financials?.revenue) || 0;
  const driverPay = parseFloat(load.financials?.driver_pay) || 0;
  const miles = parseInt(localFinancials?.miles ?? load.financials?.miles) || 0;
  const margin = localFinancials?.margin !== undefined && localFinancials?.margin !== null
    ? parseFloat(localFinancials.margin)
    : (load.financials?.margin !== null && load.financials?.margin !== undefined
        ? parseFloat(load.financials.margin)
        : (revenue - driverPay));
  const rpm = localFinancials?.rpm !== undefined && localFinancials?.rpm !== null
    ? parseFloat(localFinancials.rpm)
    : (load.financials?.rpm !== null && load.financials?.rpm !== undefined
        ? parseFloat(load.financials.rpm)
        : (miles > 0 ? revenue / miles : 0));

  // Build route points for map
  const origin = load.shipper || {};
  const destination = load.consignee || {};

  // Collapsible Section Component for mobile
  const Section = ({ id, icon: Icon, title, badge, children, defaultOpen = false }) => {
    const isOpen = expandedSections[id];
    return (
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <button
          onClick={() => toggleSection(id)}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-2">
            <Icon className="w-4 h-4 text-gray-400" />
            <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            {badge}
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        {isOpen && (
          <div className="px-4 pb-4 border-t border-gray-100">
            {children}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 lg:h-screen lg:overflow-hidden">
      {/* Top Header Bar - Sticky on mobile */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => navigate(orgUrl('/loads'))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{load.reference_number}</h1>
              {load.customer_load_number && (
                <span className="text-xs sm:text-sm text-gray-500 hidden sm:inline">PO: {load.customer_load_number}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <Button size="sm" onClick={() => {}} className="hidden sm:flex">
            <Send className="w-4 h-4 mr-1.5" />
            Dispatch
          </Button>
          <Button size="sm" onClick={() => {}} className="sm:hidden p-2">
            <Send className="w-4 h-4" />
          </Button>
          <div className="relative">
            <button
              onClick={() => setShowActions(!showActions)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-500"
            >
              <MoreHorizontal className="w-5 h-5" />
            </button>
            {showActions && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-50">
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <Copy className="w-4 h-4" />Duplicate Load
                </button>
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-gray-700">
                  <Printer className="w-4 h-4" />Print
                </button>
                <hr className="my-1" />
                <button className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600">
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Status Flow Bar - Horizontal Scroll on Mobile */}
      <div className="bg-white border-b border-gray-200 px-2 sm:px-4 py-2 sm:py-3 flex-shrink-0 overflow-x-auto scrollbar-hide">
        <div className="flex items-center gap-1 sm:justify-between sm:max-w-4xl sm:mx-auto min-w-max sm:min-w-0">
          {statusFlow.map((status, idx) => {
            const isActive = status.value === load.status;
            const isPast = idx < currentStatusIndex;
            const isFuture = idx > currentStatusIndex;

            return (
              <div key={status.value} className="flex items-center">
                <button
                  onClick={() => updateStatus(status.value)}
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${
                    isActive
                      ? `${status.classes.bg} ${status.classes.text} ring-2 ${status.classes.ring} ring-offset-1 sm:ring-offset-2`
                      : isPast
                      ? 'bg-gray-100 text-gray-600'
                      : 'text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  {isPast ? (
                    <CheckCircle2 className="w-3 h-3 sm:w-4 sm:h-4 text-green-500" />
                  ) : isActive ? (
                    <Circle className="w-3 h-3 sm:w-4 sm:h-4 fill-current" />
                  ) : (
                    <Circle className="w-3 h-3 sm:w-4 sm:h-4" />
                  )}
                  <span className="hidden sm:inline">{status.label}</span>
                  <span className="sm:hidden">{status.label.split(' ')[0]}</span>
                </button>
                {idx < statusFlow.length - 1 && (
                  <ChevronRight className={`w-3 h-3 sm:w-4 sm:h-4 mx-0.5 sm:mx-1 ${isPast ? 'text-green-400' : 'text-gray-300'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Map Section - Full width on mobile, half on desktop */}
        <div className="h-[280px] sm:h-[320px] lg:h-full lg:w-1/2 relative shrink-0">
          {/* Mapbox Route Map */}
          <LoadRouteMap
            loadId={loadId}
            className="absolute inset-0"
            showOverlay={false}
            refreshKey={routeRefreshCounter}
            onRouteLoaded={handleRouteLoaded}
          />

          {/* Refresh Indicator */}
          {routeRefreshing && (
            <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-20 bg-blue-600 text-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
              <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin" />
              <span className="hidden sm:inline">Updating route...</span>
            </div>
          )}

          {/* Mobile Route Summary - Compact */}
          <div className="absolute top-2 left-2 right-2 z-10 lg:hidden">
            <div className="bg-white/95 backdrop-blur rounded-lg shadow-lg p-2.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="font-medium text-gray-900 truncate max-w-[80px]">
                    {origin.city || 'Origin'}{origin.state ? `, ${origin.state}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-gray-400">
                  <div className="w-3 h-0.5 bg-gray-300" />
                  {stops.length > 0 && <span className="text-[10px]">+{stops.length}</span>}
                  <ChevronRight className="w-3 h-3" />
                  <div className="w-3 h-0.5 bg-gray-300" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-gray-900 truncate max-w-[80px]">
                    {destination.city || 'Dest'}{destination.state ? `, ${destination.state}` : ''}
                  </span>
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                </div>
              </div>
            </div>
          </div>

          {/* Desktop Route Info Overlay */}
          <div className="absolute top-4 left-4 right-4 z-10 hidden lg:block">
            <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Route className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Route</h3>
                  {stops.length > 0 && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                      {stops.length + 2} stops
                    </span>
                  )}
                </div>
                <button
                  onClick={() => setShowRoutePanel(!showRoutePanel)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <Pencil className="w-3 h-3" />
                  {showRoutePanel ? 'Close' : 'Edit Route'}
                </button>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex-1 group">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Origin</span>
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    {origin.city || 'Add city'}{origin.city && origin.state ? ', ' : ''}{origin.state || ''}
                  </p>
                </div>

                <div className="flex items-center gap-1 px-2">
                  <div className="w-4 h-0.5 bg-gray-300" />
                  {stops.length > 0 && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      {stops.length > 1 && <span className="text-[10px] text-gray-400">+{stops.length - 1}</span>}
                      <div className="w-4 h-0.5 bg-gray-300" />
                    </>
                  )}
                  <ChevronRight className="w-4 h-4 text-gray-400" />
                </div>

                <div className="flex-1 text-right group">
                  <div className="flex items-center justify-end gap-2 mb-0.5">
                    <span className="text-[10px] font-medium text-gray-500 uppercase">Destination</span>
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                  </div>
                  <p className="font-medium text-gray-900 text-sm">
                    {destination.city || 'Add city'}{destination.city && destination.state ? ', ' : ''}{destination.state || ''}
                  </p>
                </div>
              </div>

              {showRoutePanel && (
                <div className="mt-4 pt-4 border-t border-gray-100 max-h-[400px] overflow-y-auto">
                  <StopsManager
                    load={load}
                    stops={stops}
                    onAddStop={handleAddStop}
                    onUpdateStop={handleUpdateStop}
                    onDeleteStop={handleDeleteStop}
                    onReorderStops={handleReorderStops}
                    onUpdateLoad={updateLoadFields}
                    compact
                  />
                </div>
              )}
            </div>
          </div>

          {/* Financial Summary - Bottom of map on mobile, desktop */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-4 sm:left-4 sm:right-4 z-10">
            <div className="bg-white/95 backdrop-blur rounded-lg sm:rounded-xl shadow-lg p-2.5 sm:p-4">
              <div className="grid grid-cols-4 gap-2 sm:gap-4">
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Revenue</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-900">{fmt(revenue)}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Driver</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-900">{fmt(driverPay)}</p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">Margin</p>
                  <p className={`text-sm sm:text-xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {fmt(margin)}
                  </p>
                </div>
                <div className="text-center sm:text-left">
                  <p className="text-[10px] sm:text-xs text-gray-500 mb-0.5">$/Mi</p>
                  <p className="text-sm sm:text-xl font-bold text-gray-900">${rpm.toFixed(2)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Panels - Scrollable on mobile, grid on desktop */}
        <div className="flex-1 lg:w-1/2 bg-gray-50 p-3 sm:p-4 overflow-y-auto pb-24 lg:pb-4">
          {/* Mobile: Accordion Sections */}
          <div className="space-y-3 lg:hidden">
            {/* Route Section - Mobile */}
            <Section id="route" icon={Route} title="Route & Stops" badge={stops.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-2">{stops.length + 2} stops</span>}>
              <div className="pt-3">
                <StopsManager
                  load={load}
                  stops={stops}
                  onAddStop={handleAddStop}
                  onUpdateStop={handleUpdateStop}
                  onDeleteStop={handleDeleteStop}
                  onReorderStops={handleReorderStops}
                  onUpdateLoad={updateLoadFields}
                  compact
                />
              </div>
            </Section>

            {/* Broker Section - Mobile */}
            <Section id="broker" icon={Building2} title="Broker">
              <div className="space-y-3 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Company</p>
                  <EditableField
                    value={load.broker?.name || load.broker_name}
                    onSave={(v) => updateField('broker_name', v)}
                    placeholder="Add broker"
                    className="font-medium text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">MC #</p>
                    <EditableField
                      value={load.broker?.mc || load.broker_mc}
                      onSave={(v) => updateField('broker_mc', v)}
                      className="text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">PO #</p>
                    <EditableField
                      value={load.customer_load_number}
                      onSave={(v) => updateField('customer_load_number', v)}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Assignment Section - Mobile */}
            <Section id="assignment" icon={Truck} title="Assignment">
              <div className="space-y-3 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Driver</p>
                  <select
                    value={load.driver_id || ''}
                    onChange={(e) => updateField('driver_id', e.target.value || null)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400/50"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Truck</p>
                    <p className="text-sm text-gray-700">{load.truck?.unit_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Trailer</p>
                    <p className="text-sm text-gray-700">{load.trailer?.unit_number || '-'}</p>
                  </div>
                </div>
              </div>
            </Section>

            {/* Cargo Section - Mobile */}
            <Section id="cargo" icon={Package} title="Cargo">
              <div className="space-y-3 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Commodity</p>
                  <EditableField
                    value={load.cargo?.commodity}
                    onSave={(v) => updateField('commodity', v)}
                    placeholder="General freight"
                    className="text-sm text-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Weight</p>
                    <EditableField
                      value={load.cargo?.weight_lbs?.toLocaleString()}
                      onSave={(v) => updateField('weight_lbs', parseInt(v.replace(/,/g, '')))}
                      suffix=" lbs"
                      className="text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Pieces</p>
                    <EditableField
                      value={load.cargo?.pieces?.toString()}
                      onSave={(v) => updateField('pieces', parseInt(v))}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Billing Section - Mobile */}
            <Section id="billing" icon={DollarSign} title="Billing">
              <div className="space-y-3 pt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <select
                    value={load.billing_status || 'pending'}
                    onChange={(e) => updateField('billing_status', e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-gray-900 focus:ring-2 focus:ring-blue-400/50"
                  >
                    {billingOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Revenue</p>
                    <EditableField
                      value={fmt(revenue)}
                      onSave={(v) => updateField('revenue', parseFloat(v.replace(/[^0-9.-]/g, '')))}
                      className="text-sm font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Miles</p>
                    <EditableField
                      value={miles.toLocaleString()}
                      onSave={(v) => updateField('miles', parseInt(v.replace(/,/g, '')))}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </Section>

            {/* Documents Section - Mobile */}
            <Section id="documents" icon={FileText} title="Documents" badge={documents.length > 0 && <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded ml-2">{documents.length}</span>}>
              <div className="pt-3">
                {documents.length > 0 ? (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        onClick={() => doc.viewUrl && window.open(doc.viewUrl, '_blank')}
                        className="flex items-center gap-2 p-3 bg-gray-50 hover:bg-gray-100 rounded-lg cursor-pointer text-sm"
                      >
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="flex-1 truncate text-gray-700">{doc.file_name}</span>
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                ) : null}
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full mt-2 py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Upload documents
                </button>
              </div>
            </Section>

            {/* Notes Section - Mobile */}
            <Section id="notes" icon={Clock} title="Notes">
              <div className="pt-3">
                <textarea
                  value={load.notes || ''}
                  onChange={(e) => updateField('notes', e.target.value)}
                  placeholder="Add notes..."
                  rows={4}
                  className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400/50 resize-none"
                />
              </div>
            </Section>
          </div>

          {/* Desktop: Grid Layout */}
          <div className="hidden lg:grid grid-cols-2 gap-4 h-full">
            {/* Broker & Customer Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Broker</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Company</p>
                  <EditableField
                    value={load.broker?.name || load.broker_name}
                    onSave={(v) => updateField('broker_name', v)}
                    placeholder="Add broker"
                    className="font-medium text-gray-900"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">MC #</p>
                    <EditableField
                      value={load.broker?.mc || load.broker_mc}
                      onSave={(v) => updateField('broker_mc', v)}
                      className="text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">PO #</p>
                    <EditableField
                      value={load.customer_load_number}
                      onSave={(v) => updateField('customer_load_number', v)}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Assignment</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Driver</p>
                  <select
                    value={load.driver_id || ''}
                    onChange={(e) => updateField('driver_id', e.target.value || null)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                  >
                    <option value="">Select driver...</option>
                    {drivers.map(d => (
                      <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Truck</p>
                    <p className="text-sm text-gray-700">{load.truck?.unit_number || '-'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Trailer</p>
                    <p className="text-sm text-gray-700">{load.trailer?.unit_number || '-'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cargo */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Cargo</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Commodity</p>
                  <EditableField
                    value={load.cargo?.commodity}
                    onSave={(v) => updateField('commodity', v)}
                    placeholder="General freight"
                    className="text-sm text-gray-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Weight</p>
                    <EditableField
                      value={load.cargo?.weight_lbs?.toLocaleString()}
                      onSave={(v) => updateField('weight_lbs', parseInt(v.replace(/,/g, '')))}
                      suffix=" lbs"
                      className="text-sm text-gray-700"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Pieces</p>
                    <EditableField
                      value={load.cargo?.pieces?.toString()}
                      onSave={(v) => updateField('pieces', parseInt(v))}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Billing */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Billing</h3>
              </div>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <select
                    value={load.billing_status || 'pending'}
                    onChange={(e) => updateField('billing_status', e.target.value)}
                    className="w-full text-sm bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 text-gray-900 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400"
                  >
                    {billingOptions.map(b => <option key={b.value} value={b.value}>{b.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <p className="text-xs text-gray-500">Revenue</p>
                    <EditableField
                      value={fmt(revenue)}
                      onSave={(v) => updateField('revenue', parseFloat(v.replace(/[^0-9.-]/g, '')))}
                      className="text-sm font-semibold text-gray-900"
                    />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Miles</p>
                    <EditableField
                      value={miles.toLocaleString()}
                      onSave={(v) => updateField('miles', parseInt(v.replace(/,/g, '')))}
                      className="text-sm text-gray-700"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Documents */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  <h3 className="text-sm font-semibold text-gray-900">Documents</h3>
                  <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{documents.length}</span>
                </div>
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="p-1 hover:bg-gray-100 rounded text-blue-600"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
              {documents.length > 0 ? (
                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => doc.viewUrl && window.open(doc.viewUrl, '_blank')}
                      className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded-lg cursor-pointer text-sm group"
                    >
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="flex-1 truncate text-gray-700">{doc.file_name}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 opacity-0 group-hover:opacity-100" />
                    </div>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setShowUploadModal(true)}
                  className="w-full py-3 border-2 border-dashed border-gray-200 rounded-lg text-sm text-gray-500 hover:border-blue-300 hover:text-blue-600 transition-colors"
                >
                  Upload documents
                </button>
              )}
            </div>

            {/* Notes */}
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-gray-400" />
                <h3 className="text-sm font-semibold text-gray-900">Notes</h3>
              </div>
              <textarea
                value={load.notes || ''}
                onChange={(e) => updateField('notes', e.target.value)}
                placeholder="Add notes..."
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm text-gray-700 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400 resize-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Document Upload Modal */}
      <DocumentUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        loadId={loadId}
        onSuccess={() => fetchDocuments()}
      />
    </div>
  );
}

export default LoadDetailPage;
