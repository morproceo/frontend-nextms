/**
 * LoadDetailPage - Redesigned with full-width layout
 *
 * Map is now on-demand via a slide-over panel (zero Mapbox calls on page load).
 * Financial summary promoted to a prominent editable strip.
 * Route overview shows origin/destination without the map.
 * Content fills full width with a 60/40 two-column grid.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useLoad, useDriversList, useBrokersList } from '../../hooks';
import { LoadStatusConfig, BillingStatusConfig } from '../../config/status';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { DocumentUploadModal } from '../../components/features/documents/DocumentUploadModal';
import { FinancialStrip } from '../../components/features/loads/FinancialStrip';
import { RouteOverviewCard } from '../../components/features/loads/RouteOverviewCard';
import { RouteSlideOver } from '../../components/features/loads/RouteSlideOver';
import NetworkOriginBanner from '../../components/features/loads/NetworkOriginBanner';
import { LoadActivityTimeline } from '../../components/loads/LoadActivityTimeline';
import { LoadDetailsPanel } from '../../components/loads/LoadDetailsPanel';
import uploadsApi from '../../api/uploads.api';
import {
  ArrowLeft,
  Truck,
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
  Map,
  AlertCircle,
  X
} from 'lucide-react';

// Build status flow from centralized config (ordered for UI flow)
const statusFlowOrder = ['new', 'booked', 'dispatched', 'picked_up', 'in_transit', 'delivered', 'review', 'invoiced', 'completed'];

// Color class mapping - Tailwind needs complete class names at build time
const statusColorClasses = {
  gray: { bg: 'bg-gray-100', text: 'text-gray-700', ring: 'ring-gray-400' },
  blue: { bg: 'bg-blue-100', text: 'text-blue-700', ring: 'ring-blue-400' },
  indigo: { bg: 'bg-indigo-100', text: 'text-indigo-700', ring: 'ring-indigo-400' },
  purple: { bg: 'bg-purple-100', text: 'text-purple-700', ring: 'ring-purple-400' },
  violet: { bg: 'bg-violet-100', text: 'text-violet-700', ring: 'ring-violet-400' },
  orange: { bg: 'bg-orange-100', text: 'text-orange-700', ring: 'ring-orange-400' },
  amber: { bg: 'bg-amber-100', text: 'text-amber-700', ring: 'ring-amber-400' },
  cyan: { bg: 'bg-cyan-100', text: 'text-cyan-700', ring: 'ring-cyan-400' },
  green: { bg: 'bg-green-100', text: 'text-green-700', ring: 'ring-green-400' },
  teal: { bg: 'bg-teal-100', text: 'text-teal-700', ring: 'ring-teal-400' },
  emerald: { bg: 'bg-emerald-100', text: 'text-emerald-700', ring: 'ring-emerald-400' },
  red: { bg: 'bg-red-100', text: 'text-red-700', ring: 'ring-red-400' }
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
    deleteLoad,
    addStop,
    updateStop,
    deleteStop,
    reorderStops
  } = useLoad(loadId);

  // Drivers for assignment dropdown
  const { drivers, fetchDrivers } = useDriversList();
  const { brokers, fetchBrokers } = useBrokersList();

  // Local UI state
  const [documents, setDocuments] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showMapPanel, setShowMapPanel] = useState(false);
  const [routeRefreshCounter, setRouteRefreshCounter] = useState(0);
  const [routeRefreshing, setRouteRefreshing] = useState(false);

  // Local financial state for immediate UI updates from route calculations
  const [localFinancials, setLocalFinancials] = useState(null);
  const [statusError, setStatusError] = useState(null);

  // Fetch drivers and documents on mount
  useEffect(() => {
    fetchDrivers();
    fetchBrokers();
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
      setStatusError(null);
    } catch (err) {
      const msg = err?.response?.data?.error?.message
        || err?.message || 'Failed to update status';
      setStatusError(msg);
      console.error('Failed to update status:', err);
    }
  };

  const refreshRoute = useCallback(() => {
    setRouteRefreshing(true);
    setRouteRefreshCounter(c => c + 1);
    setTimeout(() => setRouteRefreshing(false), 10000);
  }, []);

  const refreshRouteAndLoad = useCallback(() => {
    setRouteRefreshing(true);
    setRouteRefreshCounter(c => c + 1);
    setTimeout(() => setRouteRefreshing(false), 10000);
  }, []);

  const updateFieldWithRoute = async (field, value, shouldRefreshRoute = false) => {
    await updateField(field, value);
    if (shouldRefreshRoute) {
      refreshRoute();
    }
  };

  const updateLoadFields = async (updates) => {
    try {
      await updateFields(updates);
      refreshRouteAndLoad();
    } catch (err) {
      console.error('Failed to update load:', err);
    }
  };

  // Stop management handlers
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

  const handleDeleteLoad = async () => {
    if (!window.confirm(`Delete load ${load?.reference_number}? This will permanently remove the load and all associated data.`)) {
      return;
    }
    try {
      // Delete attached documents from S3
      if (documents.length > 0) {
        for (const doc of documents) {
          try {
            await uploadsApi.deleteDocument(doc.id);
          } catch (e) {
            // Continue even if doc delete fails
          }
        }
      }
      await deleteLoad();
      navigate(orgUrl('/loads'));
    } catch (err) {
      console.error('Failed to delete load:', err);
      alert('Failed to delete load: ' + (err.response?.data?.error?.message || err.message));
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

  // Collapsible section state for mobile
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'activity'
  const [expandedSections, setExpandedSections] = useState({
    broker: true,
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

  // Use local financials if available, fallback to load data
  const revenue = parseFloat(localFinancials?.revenue ?? load.financials?.revenue) || 0;
  const driverPay = parseFloat(load.financials?.driver_pay) || 0;
  const miles = parseInt(localFinancials?.miles ?? load.financials?.miles) || 0;
  const margin = localFinancials?.margin !== undefined && localFinancials?.margin !== null
    ? parseFloat(localFinancials.margin)
    : (load.financials?.margin !== null && load.financials?.margin !== undefined
        ? parseFloat(load.financials.margin)
        : (revenue - driverPay));
  // RPM is null for non-STANDARD load types (e.g. trailer rentals)
  const rpmEligible = !load.load_type || load.load_type === 'standard';
  const rpm = !rpmEligible
    ? null
    : (localFinancials?.rpm !== undefined && localFinancials?.rpm !== null
        ? parseFloat(localFinancials.rpm)
        : (load.financials?.rpm !== null && load.financials?.rpm !== undefined
            ? parseFloat(load.financials.rpm)
            : (miles > 0 ? revenue / miles : 0)));

  // Collapsible Section Component for mobile
  const Section = ({ id, icon: Icon, title, badge, children }) => {
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
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header Bar - Sticky */}
      <div className="bg-white border-b border-gray-200 px-3 sm:px-4 py-2 flex items-center justify-between flex-shrink-0 sticky top-0 z-30">
        <div className="flex items-center gap-2 sm:gap-4 min-w-0">
          <button onClick={() => navigate(orgUrl('/loads'))} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-gray-900 truncate">{load.reference_number}</h1>
              {load.customer_load_number && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hidden sm:inline">PO: {load.customer_load_number}</span>
              )}
              {load.load_type === 'trailer_rental' && (
                <span
                  className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium"
                  title="Flat-fee load — excluded from rate-per-mile metrics"
                >
                  Trailer Rental
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* See Route Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowMapPanel(true)}
            className="hidden sm:flex"
          >
            <Map className="w-4 h-4 mr-1.5" />
            See Route
          </Button>
          <button
            onClick={() => setShowMapPanel(true)}
            className="sm:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-500"
          >
            <Map className="w-4 h-4" />
          </button>

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
                <button
                  onClick={handleDeleteLoad}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 flex items-center gap-2 text-red-600"
                >
                  <Trash2 className="w-4 h-4" />Delete
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Completion / transition gate error */}
      {statusError && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-2.5 flex items-start gap-2 flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 flex-1">{statusError}</p>
          <button onClick={() => setStatusError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Status now lives in the designed Status card inside the panel. */}

      {/* Main Content - Full Width */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-3 sm:p-6 space-y-4 sm:space-y-5 pb-24 lg:pb-6">

          {/* Phase 3: surface "this load came from MorPro Direct" if linked.
              Component renders nothing if there's no network linkage. */}
          {load?.id && <NetworkOriginBanner loadId={load.id} loadStatus={load.status} />}

          {/* Genie Suite agent activity (Alex's reviews, etc.) is NOT
              shown here on purpose. The TMS is the dispatcher's
              workspace. Agent inboxes live inside /o/<slug>/genie. */}

          {/* Financial Strip */}
          <FinancialStrip
            revenue={revenue}
            driverPay={driverPay}
            margin={margin}
            rpm={rpm}
            miles={miles}
            onUpdateField={updateField}
          />

          {/* Tab Strip */}
          <div className="border-b border-border">
            <nav className="flex gap-0 -mb-px">
              {[
                { id: 'details', label: 'Details' },
                { id: 'activity', label: 'Activity' }
              ].map(t => {
                const isActive = activeTab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setActiveTab(t.id)}
                    className={`flex items-center gap-2 px-4 sm:px-5 py-2.5 text-body-sm font-medium border-b-2 transition-colors ${
                      isActive
                        ? 'border-accent text-accent'
                        : 'border-transparent text-text-tertiary hover:text-text-secondary hover:border-border'
                    }`}
                  >
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTab === 'activity' && load?.id && (
            <LoadActivityTimeline loadId={load.id} load={load} />
          )}

          {activeTab === 'details' && (
            <>
          <LoadDetailsPanel
            load={load}
            stops={stops}
            drivers={drivers}
            brokers={brokers}
            documents={documents}
            billingOptions={billingOptions}
            updateField={updateField}
            updateLoadFields={updateLoadFields}
            EditableField={EditableField}
            fmt={fmt}
            revenue={revenue}
            miles={miles}
            driverPay={driverPay}
            onUpload={() => setShowUploadModal(true)}
            onEditRoute={() => setShowMapPanel(true)}
            onStatusChange={updateStatus}
          />
            </>
          )}
        </div>
      </div>

      {/* Route Slide-Over Panel */}
      <RouteSlideOver
        isOpen={showMapPanel}
        onClose={() => setShowMapPanel(false)}
        loadId={loadId}
        load={load}
        stops={stops}
        onAddStop={handleAddStop}
        onUpdateStop={handleUpdateStop}
        onDeleteStop={handleDeleteStop}
        onReorderStops={handleReorderStops}
        onUpdateLoad={updateLoadFields}
        refreshKey={routeRefreshCounter}
        onRouteLoaded={handleRouteLoaded}
        routeRefreshing={routeRefreshing}
        onRefreshRoute={refreshRoute}
      />

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
