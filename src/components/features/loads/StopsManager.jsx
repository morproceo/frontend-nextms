/**
 * StopsManager - Refactored to use hooks architecture
 */

import { useState, useEffect } from 'react';
import { MapPin, GripVertical, Plus, X, Pencil, Check, Calendar, Building2, ArrowUpFromLine, ArrowDownToLine, CircleDot } from 'lucide-react';
import { useFacilitiesList } from '../../../hooks';
import { SearchableSelect } from '../../ui/SearchableSelect';
import { QuickAddFacilityModal } from '../customers/QuickAddFacilityModal';

const stopTypeOptions = [
  { value: 'pickup', label: 'Pickup', icon: ArrowUpFromLine, color: 'green' },
  { value: 'delivery', label: 'Delivery', icon: ArrowDownToLine, color: 'red' },
  { value: 'stop', label: 'Stop', icon: CircleDot, color: 'blue' }
];

/**
 * StopsManager - Drag and drop route management
 *
 * Rules:
 * - First stop is always PICKUP (green)
 * - Last stop is always DELIVERY (red)
 * - Intermediate stops can be reordered
 * - Can add stops between pickup and delivery
 */
export function StopsManager({
  load,
  stops = [],
  onAddStop,
  onUpdateStop,
  onDeleteStop,
  onReorderStops,
  onUpdateLoad,
  compact = false  // When true, removes outer card styling for embedding
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newStop, setNewStop] = useState({ facility_id: '', city: '', state: '', facility_name: '', address: '', zip: '', scheduled_date: '', type: 'stop' });

  // Use hook for facilities
  const { facilities, fetchFacilities, setFacilities } = useFacilitiesList();
  const [showFacilityModal, setShowFacilityModal] = useState(false);

  // Fetch facilities on mount
  useEffect(() => {
    fetchFacilities({ is_active: true });
  }, []);

  // Handle facility created from modal
  const handleFacilityCreated = (newFacility) => {
    setFacilities(prev => [...prev, newFacility]);
    // Auto-fill stop data from new facility
    setNewStop(prev => ({
      ...prev,
      facility_id: newFacility.id,
      facility_name: newFacility.company_name || '',
      address: newFacility.address?.line1 || '',
      city: newFacility.address?.city || '',
      state: newFacility.address?.state || '',
      zip: newFacility.address?.zip || ''
    }));
  };

  // Handle facility selection
  const handleFacilitySelect = (option) => {
    if (option) {
      const facility = facilities.find(f => f.id === option.id);
      if (facility) {
        setNewStop(prev => ({
          ...prev,
          facility_id: facility.id,
          facility_name: facility.company_name || '',
          address: facility.address?.line1 || '',
          city: facility.address?.city || '',
          state: facility.address?.state || '',
          zip: facility.address?.zip || ''
        }));
      }
    } else {
      setNewStop(prev => ({
        ...prev,
        facility_id: '',
        facility_name: '',
        address: '',
        city: '',
        state: '',
        zip: ''
      }));
    }
  };

  // Build combined stops list from load data + intermediate stops
  const allStops = buildStopsList(load, stops);

  const handleDragStart = (e, index) => {
    // Only allow dragging intermediate stops (not first or last)
    if (index === 0 || index === allStops.length - 1) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    // Don't allow dropping on first or last position
    if (index === 0 || index === allStops.length - 1) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Get the actual stops (not pickup/delivery from load)
      const intermediateStops = allStops.slice(1, -1);
      const dragIdx = draggedIndex - 1; // Adjust for pickup
      const dropIdx = dragOverIndex - 1;

      // Reorder
      const reordered = [...intermediateStops];
      const [moved] = reordered.splice(dragIdx, 1);
      reordered.splice(dropIdx, 0, moved);

      // Call reorder with new order of stop IDs
      const newOrder = reordered.map(s => s.id);
      if (onReorderStops) {
        onReorderStops(newOrder);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const startEdit = (stop) => {
    setEditingId(stop.id);
    setEditData({
      city: stop.city || '',
      state: stop.state || '',
      facility_name: stop.facility_name || '',
      scheduled_date: stop.scheduled_date || ''
    });
  };

  const saveEdit = (stop) => {
    if (stop.isPickup) {
      // Update load shipper
      onUpdateLoad?.({
        shipper_city: editData.city,
        shipper_state: editData.state,
        shipper_name: editData.facility_name,
        pickup_date: editData.scheduled_date
      });
    } else if (stop.isDelivery) {
      // Update load consignee
      onUpdateLoad?.({
        consignee_city: editData.city,
        consignee_state: editData.state,
        consignee_name: editData.facility_name,
        delivery_date: editData.scheduled_date
      });
    } else {
      // Update intermediate stop
      onUpdateStop?.(stop.id, editData);
    }
    setEditingId(null);
    setEditData({});
  };

  const handleAddStop = () => {
    if (!newStop.city && !newStop.facility_name) return;
    onAddStop?.({
      facility_id: newStop.facility_id || null,
      facility_name: newStop.facility_name,
      address: newStop.address,
      city: newStop.city,
      state: newStop.state,
      zip: newStop.zip,
      scheduled_date: newStop.scheduled_date,
      type: newStop.type || 'stop'
    });
    setNewStop({ facility_id: '', city: '', state: '', facility_name: '', address: '', zip: '', scheduled_date: '', type: 'stop' });
    setShowAddForm(false);
  };

  const fmtDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className={compact ? '' : 'bg-white rounded-xl border border-gray-200'}>
      {/* Header */}
      {!compact && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-xs font-medium text-gray-500 uppercase">Route</h3>
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stop
          </button>
        </div>
      )}

      {/* Compact Header */}
      {compact && (
        <div className="flex items-center justify-end mb-3">
          <button
            onClick={() => setShowAddForm(true)}
            className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Stop
          </button>
        </div>
      )}

      {/* Stops List */}
      <div className={compact ? '' : 'p-4'}>
        <div className="relative">
          {/* Connecting Line */}
          <div className="absolute left-[11px] top-4 bottom-4 w-0.5 bg-gray-200" />

          {/* Stops */}
          <div className="space-y-1">
            {allStops.map((stop, index) => {
              const isFirst = index === 0;
              const isLast = index === allStops.length - 1;
              const canDrag = !isFirst && !isLast;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index && draggedIndex !== index;
              const isEditing = editingId === stop.id;

              // Determine colors based on stop type (not just position)
              const getStopColors = () => {
                if (isFirst) return { dot: 'bg-green-500', label: 'text-green-600', name: 'Pickup' };
                if (isLast) return { dot: 'bg-red-500', label: 'text-red-600', name: 'Delivery' };
                // For intermediate stops, use the type
                if (stop.type === 'pickup') return { dot: 'bg-green-500', label: 'text-green-600', name: 'Pickup' };
                if (stop.type === 'delivery') return { dot: 'bg-red-500', label: 'text-red-600', name: 'Delivery' };
                return { dot: 'bg-blue-500', label: 'text-blue-600', name: 'Stop' };
              };
              const stopStyle = getStopColors();
              const dotColor = stopStyle.dot;
              const labelColor = stopStyle.label;

              return (
                <div
                  key={stop.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative flex items-start gap-3 p-2 rounded-lg transition-all
                    ${isDragging ? 'opacity-40' : ''}
                    ${isDragOver ? 'bg-blue-50 border border-dashed border-blue-400' : 'hover:bg-gray-50'}
                    ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                  `}
                >
                  {/* Drag Handle or Spacer */}
                  <div className="w-4 flex items-center justify-center pt-1">
                    {canDrag ? (
                      <GripVertical className="w-3.5 h-3.5 text-gray-400" />
                    ) : null}
                  </div>

                  {/* Stop Dot */}
                  <div className={`w-[22px] h-[22px] rounded-full ${dotColor} flex items-center justify-center flex-shrink-0 z-10`}>
                    <div className="w-2 h-2 bg-white rounded-full" />
                  </div>

                  {/* Stop Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            placeholder="City"
                            className="flex-1 px-2 py-1 bg-gray-100 border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                          />
                          <input
                            type="text"
                            value={editData.state}
                            onChange={(e) => setEditData({ ...editData, state: e.target.value.toUpperCase() })}
                            placeholder="ST"
                            maxLength={2}
                            className="w-12 px-2 py-1 bg-gray-100 border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                          />
                        </div>
                        <input
                          type="text"
                          value={editData.facility_name}
                          onChange={(e) => setEditData({ ...editData, facility_name: e.target.value })}
                          placeholder="Facility name"
                          className="w-full px-2 py-1 bg-gray-100 border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                        />
                        <div className="flex items-center gap-2">
                          <input
                            type="date"
                            value={editData.scheduled_date}
                            onChange={(e) => setEditData({ ...editData, scheduled_date: e.target.value })}
                            className="px-2 py-1 bg-gray-100 border-0 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-400/50"
                          />
                          <button
                            onClick={() => saveEdit(stop)}
                            className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setEditingId(null); setEditData({}); }}
                            className="p-1 bg-gray-200 text-gray-600 rounded hover:bg-gray-300"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-medium uppercase ${labelColor}`}>
                            {stopStyle.name}
                          </span>
                          {stop.scheduled_date && (
                            <span className="text-xs text-gray-400">{fmtDate(stop.scheduled_date)}</span>
                          )}
                          <div className="flex-1" />
                          <button
                            onClick={() => startEdit(stop)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-600 transition-opacity"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {canDrag && (
                            <button
                              onClick={() => onDeleteStop?.(stop.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <p className="text-sm font-medium text-gray-900">
                          {stop.city && stop.state ? `${stop.city}, ${stop.state}` : stop.city || stop.state || 'Location TBD'}
                        </p>
                        {stop.facility_name && (
                          <p className="text-xs text-gray-500 truncate">{stop.facility_name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Add Stop Form */}
        {showAddForm && (
          <div className="mt-4 p-4 bg-gray-50 rounded-xl">
            <p className="text-sm font-medium text-gray-700 mb-3">Add Stop</p>
            <div className="space-y-3">
              {/* Stop Type Selection */}
              <div className="flex gap-2">
                {stopTypeOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = newStop.type === option.value;
                  const colorClasses = {
                    green: isSelected ? 'border-green-500 bg-green-50 text-green-600' : 'border-gray-200 text-gray-500 hover:border-green-300',
                    red: isSelected ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200 text-gray-500 hover:border-red-300',
                    blue: isSelected ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200 text-gray-500 hover:border-blue-300'
                  };
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setNewStop({ ...newStop, type: option.value })}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${colorClasses[option.color]}`}
                    >
                      <Icon className="w-4 h-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>

              {/* Facility Selection */}
              <div>
                <label className="block text-xs text-gray-500 mb-1">Select Facility</label>
                <SearchableSelect
                  value={newStop.facility_id}
                  onChange={handleFacilitySelect}
                  options={facilities.map(f => ({
                    id: f.id,
                    label: f.company_name,
                    sublabel: f.address?.city && f.address?.state
                      ? `${f.address.city}, ${f.address.state}`
                      : null
                  }))}
                  placeholder="Select or enter manually..."
                  onAddNew={() => setShowFacilityModal(true)}
                  addNewLabel="Add New Facility"
                />
              </div>

              {/* Manual Entry Fields */}
              <input
                type="text"
                value={newStop.facility_name}
                onChange={(e) => setNewStop({ ...newStop, facility_name: e.target.value })}
                placeholder="Facility name"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <input
                type="text"
                value={newStop.address}
                onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
                placeholder="Address"
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
              />
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newStop.city}
                  onChange={(e) => setNewStop({ ...newStop, city: e.target.value })}
                  placeholder="City"
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <input
                  type="text"
                  value={newStop.state}
                  onChange={(e) => setNewStop({ ...newStop, state: e.target.value.toUpperCase() })}
                  placeholder="ST"
                  maxLength={2}
                  className="w-16 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <input
                  type="text"
                  value={newStop.zip}
                  onChange={(e) => setNewStop({ ...newStop, zip: e.target.value })}
                  placeholder="ZIP"
                  className="w-20 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={newStop.scheduled_date}
                  onChange={(e) => setNewStop({ ...newStop, scheduled_date: e.target.value })}
                  className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30"
                />
                <button
                  onClick={handleAddStop}
                  disabled={!newStop.city && !newStop.facility_name}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  onClick={() => { setShowAddForm(false); setNewStop({ facility_id: '', city: '', state: '', facility_name: '', address: '', zip: '', scheduled_date: '', type: 'stop' }); }}
                  className="px-4 py-2 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Add Facility Modal */}
        <QuickAddFacilityModal
          isOpen={showFacilityModal}
          onClose={() => setShowFacilityModal(false)}
          onCreated={handleFacilityCreated}
          defaultType="both"
        />

        {/* Total Miles */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
          <span>{allStops.length} stops</span>
          <span className="font-medium">{(load?.financials?.miles || 0).toLocaleString()} total miles</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Build a combined stops list from load + intermediate stops
 */
function buildStopsList(load, stops) {
  const result = [];

  // Pickup (from load)
  result.push({
    id: 'pickup',
    type: 'pickup',
    isPickup: true,
    city: load?.shipper?.city,
    state: load?.shipper?.state,
    facility_name: load?.shipper?.name,
    scheduled_date: load?.schedule?.pickup_date
  });

  // Intermediate stops (sorted by stop_number)
  const sortedStops = [...stops].sort((a, b) => a.stop_number - b.stop_number);
  sortedStops.forEach(stop => {
    result.push({
      id: stop.id,
      type: stop.type,
      city: stop.city,
      state: stop.state,
      facility_name: stop.facility_name,
      scheduled_date: stop.scheduled_date,
      stop_number: stop.stop_number
    });
  });

  // Delivery (from load)
  result.push({
    id: 'delivery',
    type: 'delivery',
    isDelivery: true,
    city: load?.consignee?.city,
    state: load?.consignee?.state,
    facility_name: load?.consignee?.name,
    scheduled_date: load?.schedule?.delivery_date
  });

  return result;
}

export default StopsManager;
