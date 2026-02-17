import { useState, useEffect, useRef } from 'react';
import { MapPin, ChevronRight, Clock, Pencil } from 'lucide-react';

function InlineField({ value, onSave, placeholder = '-', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    setVal(value || '');
  }, [value]);

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
      onClick={() => onSave && setEditing(true)}
      className={`cursor-pointer hover:bg-gray-100 px-1 -mx-1 rounded transition-colors ${className}`}
    >
      {value || <span className="text-gray-400">{placeholder}</span>}
    </span>
  );
}

const fmtDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const fmtTime = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
};

export function RouteOverviewCard({ load, stops, onUpdateField, onEditRoute }) {
  const origin = load.shipper || {};
  const destination = load.consignee || {};
  const miles = parseInt(load.financials?.miles) || 0;
  const stopCount = (stops?.length || 0) + 2; // origin + destination + intermediate stops

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900">Route Overview</h3>
          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
            {stopCount} stops
          </span>
          {miles > 0 && (
            <span className="text-xs text-gray-500">
              {miles.toLocaleString()} mi
            </span>
          )}
        </div>
        <button
          onClick={onEditRoute}
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"
        >
          <Pencil className="w-3 h-3" />
          Edit Route
        </button>
      </div>

      {/* Timeline - Desktop horizontal, Mobile vertical */}
      <div className="hidden sm:flex items-start gap-0">
        {/* Origin */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 shrink-0" />
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Pickup</span>
          </div>
          <div className="ml-5">
            <p className="font-semibold text-gray-900 text-sm">
              <InlineField
                value={origin.name || origin.company}
                onSave={(v) => onUpdateField('shipper_name', v)}
                placeholder="Shipper name"
              />
            </p>
            <p className="text-sm text-gray-600">
              {origin.city || 'City'}{origin.state ? `, ${origin.state}` : ''}
            </p>
            <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{fmtDate(load.pickup_date)}</span>
              {load.pickup_date && <span className="text-gray-400">{fmtTime(load.pickup_date)}</span>}
            </div>
          </div>
        </div>

        {/* Connecting Line with Stops */}
        <div className="flex items-center self-center pt-2 px-2 shrink-0">
          <div className="w-8 h-0.5 bg-gray-300 border-dashed border-t-2 border-gray-300" />
          {stops && stops.length > 0 && (
            <>
              {stops.slice(0, 3).map((stop, i) => (
                <div key={stop.id || i} className="flex items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 mx-1" title={stop.city ? `${stop.city}, ${stop.state}` : `Stop ${i + 1}`} />
                </div>
              ))}
              {stops.length > 3 && (
                <span className="text-[10px] text-gray-400 mx-1">+{stops.length - 3}</span>
              )}
              <div className="w-8 h-0.5 bg-gray-300 border-dashed border-t-2 border-gray-300" />
            </>
          )}
          <ChevronRight className="w-4 h-4 text-gray-400 mx-1" />
          {(!stops || stops.length === 0) && (
            <div className="w-8 h-0.5 bg-gray-300 border-dashed border-t-2 border-gray-300" />
          )}
        </div>

        {/* Destination */}
        <div className="flex-1 min-w-0 text-right">
          <div className="flex items-center justify-end gap-2 mb-2">
            <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Delivery</span>
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 shrink-0" />
          </div>
          <div className="mr-5">
            <p className="font-semibold text-gray-900 text-sm">
              <InlineField
                value={destination.name || destination.company}
                onSave={(v) => onUpdateField('consignee_name', v)}
                placeholder="Consignee name"
              />
            </p>
            <p className="text-sm text-gray-600">
              {destination.city || 'City'}{destination.state ? `, ${destination.state}` : ''}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{fmtDate(load.delivery_date)}</span>
              {load.delivery_date && <span className="text-gray-400">{fmtTime(load.delivery_date)}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Vertical layout */}
      <div className="sm:hidden space-y-3">
        {/* Origin */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-green-500 ring-4 ring-green-100 shrink-0" />
            <div className="w-0.5 h-8 bg-gray-200 mt-1" />
          </div>
          <div className="flex-1 min-w-0 -mt-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Pickup</p>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {origin.city || 'City'}{origin.state ? `, ${origin.state}` : ''}
            </p>
            <p className="text-xs text-gray-500">{fmtDate(load.pickup_date)}</p>
          </div>
        </div>

        {/* Intermediate Stops */}
        {stops && stops.length > 0 && stops.map((stop, i) => (
          <div key={stop.id || i} className="flex items-start gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 shrink-0 ml-0.5" />
              <div className="w-0.5 h-8 bg-gray-200 mt-1 ml-0.5" />
            </div>
            <div className="flex-1 min-w-0 -mt-1">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Stop {i + 1}</p>
              <p className="text-sm text-gray-700 truncate">
                {stop.city || 'City'}{stop.state ? `, ${stop.state}` : ''}
              </p>
            </div>
          </div>
        ))}

        {/* Destination */}
        <div className="flex items-start gap-3">
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 rounded-full bg-red-500 ring-4 ring-red-100 shrink-0" />
          </div>
          <div className="flex-1 min-w-0 -mt-1">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Delivery</p>
            <p className="font-semibold text-gray-900 text-sm truncate">
              {destination.city || 'City'}{destination.state ? `, ${destination.state}` : ''}
            </p>
            <p className="text-xs text-gray-500">{fmtDate(load.delivery_date)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RouteOverviewCard;
