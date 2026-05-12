import { useState } from 'react';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import verificationApi from '../../../../api/networkVerification.api';

/**
 * Screen 4 — Public profile (sub-stepped). Four micro-screens:
 *   a) Basics       — public phone, public email, website
 *   b) Fleet        — fleet size, equipment types
 *   c) Service      — service regions (states), preferred lanes
 *   d) About        — short tagline + description
 *
 * Each sub-step has its own back / continue. Final continue submits to
 * the backend. Owner-op friendly: chips for equipment + states (no typing
 * long strings), small forms.
 */

const EQUIPMENT_OPTIONS = [
  { code: 'F', label: 'Flatbed' },
  { code: 'V', label: 'Dry van' },
  { code: 'R', label: 'Reefer' },
  { code: 'SD', label: 'Step deck' },
  { code: 'PO', label: 'Power only' },
  { code: 'C', label: 'Conestoga' },
  { code: 'HS', label: 'Hotshot' },
  { code: 'T', label: 'Tanker' }
];

const REGION_OPTIONS = [
  'Northeast', 'Southeast', 'Midwest', 'South', 'Southwest',
  'Mountain West', 'Pacific Northwest', 'West Coast', '48 states'
];

export default function ProfileStep({ refresh }) {
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    public_phone: '',
    public_email: '',
    website: '',
    fleet_size: '',
    equipment: [],
    service_regions: [],
    tagline: '',
    description: ''
  });

  const TOTAL_STEPS = 5;
  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const submit = async () => {
    setBusy(true); setError(null);
    try {
      await verificationApi.submitProfile({
        ...data,
        fleet_size: data.fleet_size ? Number(data.fleet_size) : null
      });
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <p className="text-center text-small text-text-tertiary">
        Part {step + 1} of {TOTAL_STEPS}
      </p>

      {step === 0 && <Basics data={data} setData={setData} />}
      {step === 1 && <Fleet data={data} setData={setData} />}
      {step === 2 && <Service data={data} setData={setData} />}
      {step === 3 && <About data={data} setData={setData} />}
      {step === 4 && <Review data={data} />}

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        {step > 0 && (
          <button onClick={back}
            className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        )}
        <button
          onClick={step === TOTAL_STEPS - 1 ? submit : next}
          disabled={busy}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button text-body font-semibold disabled:opacity-50 ${
            step === TOTAL_STEPS - 1
              ? 'bg-emerald-500 text-white hover:bg-emerald-600'
              : 'bg-text-primary text-surface-primary hover:opacity-90'
          }`}
        >
          {busy
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : (step === TOTAL_STEPS - 1
              ? 'Submit for review'
              : <>Next <ArrowRight className="w-4 h-4" /></>)}
        </button>
      </div>
    </div>
  );
}

function Basics({ data, setData }) {
  return (
    <div className="space-y-4">
      <Field label="Public phone" hint="Shippers call this when they have a load that fits.">
        <input type="tel" value={data.public_phone}
          onChange={(e) => setData({ ...data, public_phone: e.target.value })}
          placeholder="(555) 123-4567"
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
      <Field label="Public email" hint="Where load offers land.">
        <input type="email" value={data.public_email}
          onChange={(e) => setData({ ...data, public_email: e.target.value })}
          placeholder="dispatch@yourcompany.com"
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
      <Field label="Website (optional)">
        <input type="url" value={data.website}
          onChange={(e) => setData({ ...data, website: e.target.value })}
          placeholder="https://yourcompany.com"
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
    </div>
  );
}

function Fleet({ data, setData }) {
  const toggle = (code) => {
    setData({
      ...data,
      equipment: data.equipment.includes(code)
        ? data.equipment.filter((c) => c !== code)
        : [...data.equipment, code]
    });
  };
  return (
    <div className="space-y-4">
      <Field label="How many trucks do you run?">
        <input type="number" value={data.fleet_size}
          onChange={(e) => setData({ ...data, fleet_size: e.target.value.replace(/\D/g, '') })}
          placeholder="1"
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
      <Field label="Equipment you run" hint="Tap all that apply.">
        <div className="flex flex-wrap gap-2">
          {EQUIPMENT_OPTIONS.map(({ code, label }) => {
            const active = data.equipment.includes(code);
            return (
              <button type="button" key={code} onClick={() => toggle(code)}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                  active
                    ? 'bg-text-primary text-surface-primary border-text-primary'
                    : 'bg-surface-primary text-text-secondary border-border hover:border-text-secondary'
                }`}>
                {label}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function Service({ data, setData }) {
  const toggle = (region) => {
    setData({
      ...data,
      service_regions: data.service_regions.includes(region)
        ? data.service_regions.filter((r) => r !== region)
        : [...data.service_regions, region]
    });
  };
  return (
    <div className="space-y-4">
      <Field label="Where do you run?" hint="Tap all that apply.">
        <div className="flex flex-wrap gap-2">
          {REGION_OPTIONS.map((region) => {
            const active = data.service_regions.includes(region);
            return (
              <button type="button" key={region} onClick={() => toggle(region)}
                className={`px-3 py-1.5 rounded-full text-body-sm font-medium border transition-colors ${
                  active
                    ? 'bg-text-primary text-surface-primary border-text-primary'
                    : 'bg-surface-primary text-text-secondary border-border hover:border-text-secondary'
                }`}>
                {region}
              </button>
            );
          })}
        </div>
      </Field>
    </div>
  );
}

function About({ data, setData }) {
  return (
    <div className="space-y-4">
      <Field label="Tagline" hint="One short line. Shippers see this first.">
        <input type="text" value={data.tagline}
          onChange={(e) => setData({ ...data, tagline: e.target.value })}
          placeholder="Reliable flatbed runs throughout the Southeast"
          maxLength={120}
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
      <Field label="A bit about your operation (optional)">
        <textarea value={data.description}
          onChange={(e) => setData({ ...data, description: e.target.value })}
          rows={5}
          placeholder="What you specialize in, how long you've been running, anything that helps shippers know they're picking the right carrier."
          className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body" />
      </Field>
    </div>
  );
}

function Review({ data }) {
  const items = [
    { label: 'Public phone', value: data.public_phone || '—' },
    { label: 'Public email', value: data.public_email || '—' },
    { label: 'Website', value: data.website || '—' },
    { label: 'Trucks', value: data.fleet_size || '—' },
    { label: 'Equipment', value: data.equipment.length ? data.equipment.join(', ') : '—' },
    { label: 'Service regions', value: data.service_regions.length ? data.service_regions.join(', ') : '—' },
    { label: 'Tagline', value: data.tagline || '—' },
    { label: 'About', value: data.description || '—' }
  ];
  return (
    <div className="space-y-4">
      <p className="text-body-sm text-text-secondary text-center">
        Last look. Make sure this looks right before we send it for review.
      </p>
      <div className="bg-surface-primary border border-border-subtle rounded-card divide-y divide-border-subtle">
        {items.map((it) => (
          <div key={it.label} className="px-4 py-3 flex items-start gap-3">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary w-32 flex-shrink-0 pt-0.5">{it.label}</p>
            <p className="text-body-sm text-text-primary flex-1 break-words">{it.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-body-sm font-medium text-text-primary mb-1">{label}</span>
      {children}
      {hint && <span className="block text-small text-text-tertiary mt-1.5">{hint}</span>}
    </label>
  );
}
