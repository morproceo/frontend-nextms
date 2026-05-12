import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Package, Send, ArrowLeft, AlertTriangle } from 'lucide-react';
import networkApi from '../../../api/network.api';

export default function PostLoadPage() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    reference_number: '',
    commodity: '',
    weight_lbs: '',
    miles: '',
    rate_offered: '',
    payment_terms: 'Net 30',
    pickup_city: '', pickup_state: '', pickup_earliest: '',
    delivery_city: '', delivery_state: '', delivery_latest: '',
    equipment_types: 'dry_van',
    visibility: 'public',
    is_emergency: false
  });

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (publish) => {
    setError(null);
    setSubmitting(publish ? 'publish' : 'draft');
    try {
      const payload = {
        reference_number: form.reference_number || undefined,
        commodity: form.commodity || undefined,
        weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : undefined,
        miles: form.miles ? Number(form.miles) : undefined,
        rate_offered: form.rate_offered ? Number(form.rate_offered) : undefined,
        payment_terms: form.payment_terms || undefined,
        pickup: {
          city: form.pickup_city, state: form.pickup_state,
          earliest_at: form.pickup_earliest || null
        },
        delivery: {
          city: form.delivery_city, state: form.delivery_state,
          latest_at: form.delivery_latest || null
        },
        equipment_requirements: {
          types: form.equipment_types
            ? form.equipment_types.split(',').map((s) => s.trim()).filter(Boolean)
            : []
        },
        visibility: form.visibility,
        is_emergency: !!form.is_emergency
      };
      const created = await networkApi.createLoad(payload, { publish });
      navigate(`/o/${orgSlug}/direct/loads/${created.id}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setSubmitting(null);
    }
  };

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/loads`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> My loads
      </Link>

      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
          <Package className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Post a load</h1>
          <p className="text-body-sm text-text-secondary">Verified carriers will see this and place bids.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <Section title="Reference">
        <Field label="Reference #">
          <Input value={form.reference_number} onChange={onChange('reference_number')} placeholder="ACME-2026-0001" />
        </Field>
        <Field label="Commodity">
          <Input value={form.commodity} onChange={onChange('commodity')} placeholder="Pallets of paper goods" />
        </Field>
        <Field label="Weight (lbs)">
          <Input type="number" value={form.weight_lbs} onChange={onChange('weight_lbs')} placeholder="42000" />
        </Field>
        <Field label="Distance (mi)">
          <Input type="number" value={form.miles} onChange={onChange('miles')} placeholder="487" />
        </Field>
      </Section>

      <Section title="Pickup">
        <Two>
          <Field label="City"><Input value={form.pickup_city} onChange={onChange('pickup_city')} required /></Field>
          <Field label="State"><Input value={form.pickup_state} onChange={onChange('pickup_state')} required maxLength={2} /></Field>
        </Two>
        <Field label="Earliest pickup">
          <Input type="datetime-local" value={form.pickup_earliest} onChange={onChange('pickup_earliest')} />
        </Field>
      </Section>

      <Section title="Delivery">
        <Two>
          <Field label="City"><Input value={form.delivery_city} onChange={onChange('delivery_city')} required /></Field>
          <Field label="State"><Input value={form.delivery_state} onChange={onChange('delivery_state')} required maxLength={2} /></Field>
        </Two>
        <Field label="Latest delivery">
          <Input type="datetime-local" value={form.delivery_latest} onChange={onChange('delivery_latest')} />
        </Field>
      </Section>

      <Section title="Equipment & rate">
        <Field label="Equipment types (comma separated)">
          <Input value={form.equipment_types} onChange={onChange('equipment_types')} placeholder="dry_van, reefer" />
        </Field>
        <Two>
          <Field label="Offered rate ($)"><Input type="number" step="0.01" value={form.rate_offered} onChange={onChange('rate_offered')} placeholder="2000" /></Field>
          <Field label="Payment terms"><Input value={form.payment_terms} onChange={onChange('payment_terms')} placeholder="Net 30" /></Field>
        </Two>
      </Section>

      <Section title="Visibility">
        <select value={form.visibility} onChange={onChange('visibility')}
          className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm">
          <option value="public">Public — all verified carriers can see + bid</option>
          <option value="invited" disabled>Invited only (coming soon)</option>
          <option value="private_direct" disabled>Private direct request (Phase 3)</option>
        </select>
      </Section>

      <Section title="Urgency">
        <label className="flex items-start gap-3 p-3 rounded-card border border-border-subtle bg-surface-primary cursor-pointer">
          <input type="checkbox" checked={form.is_emergency}
            onChange={(e) => setForm({ ...form, is_emergency: e.target.checked })}
            className="mt-1" />
          <div>
            <p className="text-body-sm font-medium text-text-primary inline-flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-error" /> Emergency / urgent capacity
            </p>
            <p className="text-small text-text-tertiary mt-1">
              Sends fanout notifications to qualifying carriers immediately. Use for disasters,
              port disruptions, time-critical surges.
            </p>
          </div>
        </label>
      </Section>

      <div className="flex justify-end gap-3 mt-6">
        <button onClick={() => submit(false)} disabled={!!submitting}
          className="px-4 py-2 rounded-button border border-border text-body-sm font-medium hover:bg-surface-secondary disabled:opacity-50">
          {submitting === 'draft' ? 'Saving…' : 'Save as draft'}
        </button>
        <button onClick={() => submit(true)} disabled={!!submitting}
          className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2">
          <Send className="w-4 h-4" />
          {submitting === 'publish' ? 'Posting…' : 'Post to network'}
        </button>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="mb-5">
      <h2 className="text-body-sm font-medium text-text-primary mb-3">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
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
function Input(props) {
  return <input {...props} className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />;
}
function Two({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}
