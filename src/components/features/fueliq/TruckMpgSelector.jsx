/**
 * TruckMpgSelector - Truck dropdown with MPG display and override
 * Reusable in trip planner and modals
 */

import { useState } from 'react';
import { Truck, Gauge, Edit3 } from 'lucide-react';

export function TruckMpgSelector({
  trucks = [],
  selectedTruckId,
  onTruckChange,
  mpg,
  mpgSource,
  mpgOverride,
  onMpgOverride,
  className = ''
}) {
  const [editingMpg, setEditingMpg] = useState(false);
  const [tempMpg, setTempMpg] = useState('');

  const handleMpgEdit = () => {
    setTempMpg(mpgOverride?.toString() || mpg?.toString() || '6.0');
    setEditingMpg(true);
  };

  const handleMpgSave = () => {
    const val = parseFloat(tempMpg);
    if (val > 0) {
      onMpgOverride(val);
    }
    setEditingMpg(false);
  };

  return (
    <div className={`flex flex-col sm:flex-row gap-3 ${className}`}>
      {/* Truck Selector */}
      <div className="flex-1">
        <label className="block text-small font-medium text-text-secondary mb-1.5">
          <Truck className="w-3.5 h-3.5 inline mr-1" />
          Truck
        </label>
        <select
          value={selectedTruckId || ''}
          onChange={(e) => onTruckChange(e.target.value || null)}
          className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="">Select truck...</option>
          {trucks.map(t => (
            <option key={t.id} value={t.id}>
              {t.unit_number} {t.make ? `(${t.year || ''} ${t.make} ${t.model || ''})`.trim() : ''}
            </option>
          ))}
        </select>
      </div>

      {/* MPG Display/Override */}
      <div className="w-32">
        <label className="block text-small font-medium text-text-secondary mb-1.5">
          <Gauge className="w-3.5 h-3.5 inline mr-1" />
          MPG
        </label>
        {editingMpg ? (
          <div className="flex gap-1">
            <input
              type="number"
              step="0.1"
              value={tempMpg}
              onChange={(e) => setTempMpg(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleMpgSave()}
              autoFocus
              className="w-full px-2 py-2 rounded-input border border-accent bg-white text-body text-text-primary focus:outline-none"
            />
            <button
              onClick={handleMpgSave}
              className="px-2 py-1 text-small font-medium text-accent hover:bg-accent/10 rounded-chip"
            >
              OK
            </button>
          </div>
        ) : (
          <div
            onClick={handleMpgEdit}
            className="flex items-center gap-1.5 px-3 py-2 rounded-input border border-border-primary bg-white cursor-pointer hover:border-accent transition-colors"
          >
            <span className="text-body text-text-primary font-medium">
              {mpgOverride || mpg || '6.0'}
            </span>
            <Edit3 className="w-3 h-3 text-text-tertiary" />
          </div>
        )}
        {mpgSource && !editingMpg && (
          <span className="text-caption text-text-tertiary mt-0.5 block">
            {mpgSource === 'estimate' ? 'Set by user' :
             mpgSource === 'calculated' ? 'From fuel data' : 'Default'}
          </span>
        )}
      </div>
    </div>
  );
}

export default TruckMpgSelector;
