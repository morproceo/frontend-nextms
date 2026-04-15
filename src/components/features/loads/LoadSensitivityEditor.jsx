/**
 * LoadSensitivityEditor
 *
 * Inline editor for the dispatcher-entered fields that drive load impact
 * scoring (UX/UI plan §9.3). Saving any field calls `onUpdateField` (the
 * existing inline-edit pattern from LoadDetailPage). The Impact card
 * recomputes inline on next read because the backend marks impact stale
 * when these fields change.
 *
 * V1 honesty: every field is manual at booking — there is no auto-classification.
 */

import { useState } from 'react';
import { ShieldAlert, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';

const SECTION_ID = 'sensitivity';

const ENUM_OPTIONS = {
  customer_criticality: [
    { value: '', label: '— Not set —' },
    { value: 'standard',  label: 'Standard' },
    { value: 'preferred', label: 'Preferred' },
    { value: 'dedicated', label: 'Dedicated' },
    { value: 'strategic', label: 'Strategic' }
  ],
  appointment_rigidity: [
    { value: '', label: '— Not set —' },
    { value: 'flexible',      label: 'Flexible' },
    { value: 'fcfs',          label: 'First Come, First Served' },
    { value: 'strict_window', label: 'Strict Window' },
    { value: 'driver_assist', label: 'Driver Assist' }
  ],
  recovery_difficulty: [
    { value: '', label: '— Not set —' },
    { value: 'low',    label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high',   label: 'High' }
  ]
};

function ToggleRow({ label, field, value, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer">
      <span className="text-body-sm text-text-primary">{label}</span>
      <input
        type="checkbox"
        checked={value === true}
        disabled={disabled}
        onChange={e => onChange(field, e.target.checked)}
        className="w-4 h-4 accent-accent cursor-pointer"
      />
    </label>
  );
}

function SelectRow({ label, field, value, options, onChange, disabled }) {
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-body-sm text-text-primary shrink-0">{label}</span>
      <select
        value={value || ''}
        disabled={disabled}
        onChange={e => onChange(field, e.target.value || null)}
        className="text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent min-w-[180px]"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function TextRow({ label, field, value, onChange, disabled, placeholder }) {
  const [local, setLocal] = useState(value || '');
  return (
    <label className="flex items-center justify-between gap-3 py-2">
      <span className="text-body-sm text-text-primary shrink-0">{label}</span>
      <input
        type="text"
        value={local}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => setLocal(e.target.value)}
        onBlur={() => { if (local !== (value || '')) onChange(field, local || null); }}
        className="text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent min-w-[180px]"
      />
    </label>
  );
}

export function LoadSensitivityEditor({ load, onUpdateField }) {
  const [open, setOpen] = useState(false);

  if (!load) return null;

  const handleChange = (field, value) => {
    if (typeof onUpdateField === 'function') onUpdateField(field, value);
  };

  return (
    <Card padding="sm">
      <CardHeader className="mb-0">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="w-full flex items-center justify-between gap-2 text-left"
        >
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-accent" /> Load Sensitivity
          </CardTitle>
          {open ? <ChevronDown className="w-4 h-4 text-text-secondary" />
                : <ChevronRight className="w-4 h-4 text-text-secondary" />}
        </button>
      </CardHeader>

      {open && (
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-surface-tertiary">
            <div>
              <ToggleRow label="Hazmat"          field="hazmat"          value={load.hazmat}          onChange={handleChange} />
              {load.hazmat && (
                <TextRow label="Hazmat Class" field="hazmat_class" value={load.hazmat_class} onChange={handleChange} placeholder="e.g. 3" />
              )}
              <ToggleRow label="Temperature Controlled" field="temp_controlled" value={load.temp_controlled} onChange={handleChange} />
              <ToggleRow label="High Value"      field="high_value"      value={load.high_value}      onChange={handleChange} />
              <ToggleRow label="Requires Team"   field="requires_team"   value={load.requires_team}   onChange={handleChange} />
            </div>
            <div>
              <SelectRow
                label="Customer Criticality"
                field="customer_criticality"
                value={load.customer_criticality}
                options={ENUM_OPTIONS.customer_criticality}
                onChange={handleChange}
              />
              <SelectRow
                label="Appointment Rigidity"
                field="appointment_rigidity"
                value={load.appointment_rigidity}
                options={ENUM_OPTIONS.appointment_rigidity}
                onChange={handleChange}
              />
              <SelectRow
                label="Recovery Difficulty"
                field="recovery_difficulty"
                value={load.recovery_difficulty}
                options={ENUM_OPTIONS.recovery_difficulty}
                onChange={handleChange}
              />
            </div>
          </div>

          <p className="text-[11px] text-text-secondary mt-3 pt-3 border-t border-surface-tertiary">
            These fields are dispatcher-entered at booking. Saving any field re-scores the load impact on next read.
          </p>
        </CardContent>
      )}
    </Card>
  );
}

export default LoadSensitivityEditor;
