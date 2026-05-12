import { useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

const TYPES = [
  ['preventive', 'Preventive'],
  ['repair', 'Repair'],
  ['inspection', 'Inspection'],
  ['emergency', 'Emergency'],
  ['dot', 'DOT'],
  ['oil_change', 'Oil change'],
  ['tires', 'Tires'],
  ['brakes', 'Brakes'],
  ['engine', 'Engine'],
  ['transmission', 'Transmission'],
  ['electrical', 'Electrical'],
  ['cooling', 'Cooling'],
  ['aftertreatment', 'Aftertreatment'],
  ['other', 'Other']
];

const STATUSES = [
  ['open', 'Open'],
  ['reviewed', 'Reviewed'],
  ['scheduled', 'Scheduled'],
  ['in_shop', 'In shop'],
  ['completed', 'Completed'],
  ['cancelled', 'Cancelled'],
  ['deferred', 'Deferred']
];

/**
 * Inline maintenance create/edit form. When `prefill` is provided (from a
 * fault code's "Create maintenance" button), the form opens with truck +
 * type + linked diagnosis + estimated cost from the AI analysis.
 */
export default function MaintenanceForm({
  truckId, prefill = {}, existing = null, onSaved, onCancel
}) {
  const [form, setForm] = useState({
    title: existing?.title || prefill.title || '',
    description: existing?.description || prefill.description || '',
    maintenance_type: existing?.maintenance_type || prefill.maintenance_type || 'repair',
    status: existing?.status || 'open',
    severity: existing?.severity || prefill.severity || 'unknown',
    odometer: existing?.odometer || '',
    estimated_cost_low_cents: existing?.estimated_cost_low_cents || prefill.estimated_cost_low_cents || '',
    estimated_cost_high_cents: existing?.estimated_cost_high_cents || prefill.estimated_cost_high_cents || '',
    actual_cost_cents: existing?.actual_cost_cents || '',
    shop_name: existing?.shop_name || '',
    shop_phone: existing?.shop_phone || '',
    shop_address: existing?.shop_address || '',
    related_fault_code_id: existing?.related_fault_code_id || prefill.related_fault_code_id || null,
    related_diagnosis_id: existing?.related_diagnosis_id || prefill.related_diagnosis_id || null
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const update = (k) => (e) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true); setError(null);
    try {
      const payload = {
        truck_id: truckId,
        title: form.title.trim(),
        description: form.description.trim() || null,
        maintenance_type: form.maintenance_type,
        status: form.status,
        severity: form.severity || null,
        odometer: form.odometer ? Number(form.odometer) : null,
        estimated_cost_low_cents: form.estimated_cost_low_cents
          ? Number(form.estimated_cost_low_cents) : null,
        estimated_cost_high_cents: form.estimated_cost_high_cents
          ? Number(form.estimated_cost_high_cents) : null,
        actual_cost_cents: form.actual_cost_cents ? Number(form.actual_cost_cents) : null,
        shop_name: form.shop_name || null,
        shop_phone: form.shop_phone || null,
        shop_address: form.shop_address || null,
        related_fault_code_id: form.related_fault_code_id,
        related_diagnosis_id: form.related_diagnosis_id
      };
      const saved = existing
        ? await wrenchApi.updateMaintenance(existing.id, payload)
        : await wrenchApi.createMaintenance(payload);
      onSaved?.(saved);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <Field label="Title">
        <input type="text" value={form.title} onChange={update('title')} required
          placeholder="Coolant leak — replace water pump"
          className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Type">
          <select value={form.maintenance_type} onChange={update('maintenance_type')}
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm">
            {TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
        <Field label="Status">
          <select value={form.status} onChange={update('status')}
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm">
            {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </Field>
      </div>

      <Field label="Description">
        <textarea value={form.description} onChange={update('description')} rows={3}
          placeholder="Notes for the shop or for your records"
          className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
      </Field>

      <div className="grid grid-cols-3 gap-3">
        <Field label="Odometer">
          <input type="number" value={form.odometer} onChange={update('odometer')}
            placeholder="148000"
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
        </Field>
        <Field label="Est cost low ($)">
          <input type="number" value={form.estimated_cost_low_cents ? form.estimated_cost_low_cents / 100 : ''}
            onChange={(e) => setForm({ ...form, estimated_cost_low_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : '' })}
            placeholder="150"
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
        </Field>
        <Field label="Est cost high ($)">
          <input type="number" value={form.estimated_cost_high_cents ? form.estimated_cost_high_cents / 100 : ''}
            onChange={(e) => setForm({ ...form, estimated_cost_high_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : '' })}
            placeholder="500"
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
        </Field>
      </div>

      <Field label="Actual cost ($) — fill in when done">
        <input type="number" value={form.actual_cost_cents ? form.actual_cost_cents / 100 : ''}
          onChange={(e) => setForm({ ...form, actual_cost_cents: e.target.value ? Math.round(Number(e.target.value) * 100) : '' })}
          placeholder="285"
          className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
      </Field>

      <div className="pt-3 border-t border-border-subtle">
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">Shop (optional)</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <Field label="Shop name">
            <input type="text" value={form.shop_name} onChange={update('shop_name')}
              placeholder="Joe's Diesel"
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
          </Field>
          <Field label="Shop phone">
            <input type="tel" value={form.shop_phone} onChange={update('shop_phone')}
              placeholder="(555) 123-4567"
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
          </Field>
        </div>
        <Field label="Shop address">
          <input type="text" value={form.shop_address} onChange={update('shop_address')}
            placeholder="123 Main St, Atlanta GA 30303"
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
        </Field>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button type="button" onClick={onCancel}
          className="px-4 py-2 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary inline-flex items-center gap-1.5">
          <X className="w-3.5 h-3.5" /> Cancel
        </button>
        <button type="submit" disabled={busy || !form.title.trim()}
          className="flex-1 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center justify-center gap-1.5">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> {existing ? 'Save changes' : 'Create record'}</>}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-small text-text-tertiary mb-1">{label}</span>
      {children}
    </label>
  );
}
