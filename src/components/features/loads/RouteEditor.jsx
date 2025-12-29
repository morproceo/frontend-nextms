import { useState, useRef } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import {
  MapPin,
  GripVertical,
  Plus,
  X,
  ArrowRight,
  Pencil,
  Check
} from 'lucide-react';

/**
 * Interactive Route Editor with drag-and-drop stops
 */
export function RouteEditor({ load, onUpdate, onAddStop, onRemoveStop, onReorderStops }) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [editingStop, setEditingStop] = useState(null);
  const [editData, setEditData] = useState({});

  // Build stops array from load data
  const stops = [
    {
      id: 'pickup',
      type: 'pickup',
      number: 1,
      name: load.shipper?.name || '',
      address: load.shipper?.address || '',
      city: load.shipper?.city || '',
      state: load.shipper?.state || '',
      zip: load.shipper?.zip || '',
      date: load.schedule?.pickup_date || '',
      isOrigin: true
    },
    // Additional stops from load.stops would go here
    ...(load.stops || []).map((stop, idx) => ({
      id: stop.id,
      type: 'stop',
      number: idx + 2,
      name: stop.facility_name || '',
      address: stop.address || '',
      city: stop.city || '',
      state: stop.state || '',
      zip: stop.zip || '',
      date: stop.scheduled_date || '',
      isOrigin: false,
      isDestination: false
    })),
    {
      id: 'delivery',
      type: 'delivery',
      number: (load.stops?.length || 0) + 2,
      name: load.consignee?.name || '',
      address: load.consignee?.address || '',
      city: load.consignee?.city || '',
      state: load.consignee?.state || '',
      zip: load.consignee?.zip || '',
      date: load.schedule?.delivery_date || '',
      isDestination: true
    }
  ];

  const handleDragStart = (e, index) => {
    // Don't allow dragging origin or destination
    if (stops[index].isOrigin || stops[index].isDestination) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    if (stops[index].isOrigin || stops[index].isDestination) return;
    setDragOverIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null && dragOverIndex !== null && draggedIndex !== dragOverIndex) {
      // Reorder stops
      if (onReorderStops) {
        onReorderStops(draggedIndex, dragOverIndex);
      }
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const startEditing = (stop) => {
    setEditingStop(stop.id);
    setEditData({
      name: stop.name,
      city: stop.city,
      state: stop.state,
      zip: stop.zip,
      date: stop.date
    });
  };

  const saveEdit = (stop) => {
    if (onUpdate) {
      if (stop.type === 'pickup') {
        onUpdate({
          shipper_name: editData.name,
          shipper_city: editData.city,
          shipper_state: editData.state,
          shipper_zip: editData.zip,
          pickup_date: editData.date
        });
      } else if (stop.type === 'delivery') {
        onUpdate({
          consignee_name: editData.name,
          consignee_city: editData.city,
          consignee_state: editData.state,
          consignee_zip: editData.zip,
          delivery_date: editData.date
        });
      }
    }
    setEditingStop(null);
    setEditData({});
  };

  const cancelEdit = () => {
    setEditingStop(null);
    setEditData({});
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: '2-digit'
    });
  };

  const getStopColor = (stop) => {
    if (stop.isOrigin) return 'text-success';
    if (stop.isDestination) return 'text-error';
    return 'text-accent';
  };

  const getStopBgColor = (stop) => {
    if (stop.isOrigin) return 'bg-success/10 border-success/20';
    if (stop.isDestination) return 'bg-error/10 border-error/20';
    return 'bg-accent/10 border-accent/20';
  };

  return (
    <Card padding="default">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-body font-semibold text-text-primary">Route</h3>
          <div className="flex items-center gap-2">
            <span className="text-small text-text-secondary">
              {load.financials?.miles || 0} total miles
            </span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onAddStop && onAddStop()}
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Stop
            </Button>
          </div>
        </div>

        {/* Route Timeline */}
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-surface-tertiary" />

          {/* Stops */}
          <div className="space-y-3">
            {stops.map((stop, index) => {
              const isEditing = editingStop === stop.id;
              const isDragging = draggedIndex === index;
              const isDragOver = dragOverIndex === index;
              const canDrag = !stop.isOrigin && !stop.isDestination;

              return (
                <div
                  key={stop.id}
                  draggable={canDrag}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className={`
                    relative flex items-start gap-3 p-3 rounded-lg border transition-all
                    ${isDragging ? 'opacity-50' : ''}
                    ${isDragOver ? 'border-accent border-dashed' : 'border-transparent'}
                    ${getStopBgColor(stop)}
                    ${canDrag ? 'cursor-grab active:cursor-grabbing' : ''}
                  `}
                >
                  {/* Drag Handle */}
                  {canDrag && (
                    <div className="flex items-center justify-center w-5 h-5 text-text-tertiary hover:text-text-secondary">
                      <GripVertical className="w-4 h-4" />
                    </div>
                  )}
                  {!canDrag && <div className="w-5" />}

                  {/* Stop Icon */}
                  <div className={`flex-shrink-0 ${getStopColor(stop)}`}>
                    <MapPin className="w-5 h-5" />
                  </div>

                  {/* Stop Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editData.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          placeholder="Facility name"
                          className="w-full px-2 py-1 bg-white border border-surface-tertiary rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editData.city}
                            onChange={(e) => setEditData({ ...editData, city: e.target.value })}
                            placeholder="City"
                            className="flex-1 px-2 py-1 bg-white border border-surface-tertiary rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <input
                            type="text"
                            value={editData.state}
                            onChange={(e) => setEditData({ ...editData, state: e.target.value.toUpperCase() })}
                            placeholder="ST"
                            maxLength={2}
                            className="w-16 px-2 py-1 bg-white border border-surface-tertiary rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                          <input
                            type="text"
                            value={editData.zip}
                            onChange={(e) => setEditData({ ...editData, zip: e.target.value })}
                            placeholder="ZIP"
                            className="w-20 px-2 py-1 bg-white border border-surface-tertiary rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                          />
                        </div>
                        <input
                          type="date"
                          value={editData.date}
                          onChange={(e) => setEditData({ ...editData, date: e.target.value })}
                          className="px-2 py-1 bg-white border border-surface-tertiary rounded text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveEdit(stop)}
                            className="flex items-center gap-1 px-2 py-1 bg-success text-white rounded text-small hover:bg-success/90"
                          >
                            <Check className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex items-center gap-1 px-2 py-1 bg-surface-secondary text-text-secondary rounded text-small hover:bg-surface-tertiary"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="group">
                        <div className="flex items-center gap-2">
                          <span className="text-small font-medium text-text-tertiary">
                            #{stop.number} {stop.type}
                          </span>
                          <button
                            onClick={() => startEditing(stop)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-accent transition-opacity"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                          {canDrag && (
                            <button
                              onClick={() => onRemoveStop && onRemoveStop(stop.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 text-text-tertiary hover:text-error transition-opacity"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-body font-medium text-text-primary">
                          {stop.city && stop.state
                            ? `${stop.city}, ${stop.state}`
                            : stop.name || 'Location TBD'}
                        </div>
                        {stop.name && stop.city && (
                          <div className="text-small text-text-secondary">{stop.name}</div>
                        )}
                        {stop.date && (
                          <div className="text-small text-text-tertiary mt-1">
                            {formatDate(stop.date)}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Miles to next stop */}
                  {index < stops.length - 1 && (
                    <div className="absolute -bottom-3 left-6 flex items-center gap-1 text-small text-text-tertiary bg-white px-1">
                      <ArrowRight className="w-3 h-3" />
                      <span>
                        {index === 0 && stops.length === 2
                          ? `${load.financials?.miles || '?'} mi`
                          : '? mi'}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-3 pt-2 border-t border-surface-tertiary">
          <button className="text-small text-accent hover:underline">
            View on map
          </button>
          <span className="text-text-tertiary">•</span>
          <button className="text-small text-accent hover:underline">
            Recalculate distance
          </button>
          <span className="text-text-tertiary">•</span>
          <button className="text-small text-accent hover:underline">
            Dispatch to driver
          </button>
        </div>
      </div>
    </Card>
  );
}

export default RouteEditor;
