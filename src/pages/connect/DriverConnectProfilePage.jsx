import { useState, useEffect } from 'react';
import { Loader2, UserRound, CheckCircle2, Globe, Lock } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const AVAIL = [
  { v: 'not_looking', label: 'Not looking' },
  { v: 'looking_for_work', label: 'Looking for work' },
  { v: 'open_to_offers', label: 'Open to offers' },
  { v: 'hired', label: 'Hired' },
  { v: 'temporarily_unavailable', label: 'Temporarily unavailable' }
];
const toCsv = (a) => (Array.isArray(a) ? a.join(', ') : '');
const fromCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);
const inp = 'w-full mt-1 px-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20';

export default function DriverConnectProfilePage() {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    connectApi.getAvailability()
      .then((r) => {
        const a = r.data || {};
        setForm({
          availability_status: a.availability_status || 'not_looking',
          headline: a.headline || '',
          is_visible: !!a.is_visible,
          willing_to_relocate: !!a.willing_to_relocate,
          preferred_equipment: toCsv(a.preferred_equipment),
          preferred_lanes: toCsv(a.preferred_lanes),
          preferred_regions: toCsv(a.preferred_regions),
          available_from: a.available_from ? String(a.available_from).slice(0, 10) : '',
          notes: a.notes || ''
        });
      })
      .catch(() => setForm(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (override = {}) => {
    setSaving(true);
    setSaved(false);
    try {
      const f = { ...form, ...override };
      await connectApi.setAvailability({
        availability_status: f.availability_status,
        headline: f.headline || null,
        is_visible: f.is_visible,
        willing_to_relocate: f.willing_to_relocate,
        preferred_equipment: fromCsv(f.preferred_equipment),
        preferred_lanes: fromCsv(f.preferred_lanes),
        preferred_regions: fromCsv(f.preferred_regions),
        available_from: f.available_from || null,
        notes: f.notes || null
      });
      setForm((s) => ({ ...s, ...override }));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !form) {
    return <div className="flex items-center justify-center py-24 text-text-tertiary"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…</div>;
  }

  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));
  const visible = form.is_visible;

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <UserRound className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">My profile</h1>
          <p className="text-body-sm text-text-secondary">
            What carriers see when they browse the driver network.
          </p>
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
            visible ? 'bg-emerald-500/10' : 'bg-surface-secondary')}>
            {visible ? <Globe className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-text-tertiary" />}
          </div>
          <div>
            <div className="text-body-sm font-medium text-text-primary">
              {visible ? 'Visible to carriers' : 'Hidden'}
            </div>
            <div className="text-small text-text-tertiary">
              {visible ? 'Carriers can find and invite you.' : 'Turn on to appear in carrier searches.'}
            </div>
          </div>
        </div>
        <button type="button" disabled={saving}
          onClick={() => save({ is_visible: !visible })}
          className={cn('px-4 py-2 rounded-button text-body-sm font-medium',
            visible ? 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary' : 'bg-accent text-white hover:bg-accent/90')}>
          {visible ? 'Hide me' : 'Make me visible'}
        </button>
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-primary">Profile details</span>
          {saved && <span className="text-small text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-small text-text-secondary font-medium">Status</label>
            <select value={form.availability_status} onChange={set('availability_status')} className={cn(inp, 'bg-white')}>
              {AVAIL.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-small text-text-secondary font-medium">Available from</label>
            <input type="date" value={form.available_from} onChange={set('available_from')} className={inp} />
          </div>
        </div>

        <div>
          <label className="text-small text-text-secondary font-medium">Headline</label>
          <input value={form.headline} onChange={set('headline')} placeholder="e.g. 5yr OTR · reefer · clean MVR" className={inp} />
        </div>

        <div>
          <label className="text-small text-text-secondary font-medium">Equipment experience</label>
          <input value={form.preferred_equipment} onChange={set('preferred_equipment')} placeholder="reefer, dry van, flatbed" className={inp} />
          <p className="text-[11px] text-text-tertiary mt-1">Comma-separated</p>
        </div>
        <div>
          <label className="text-small text-text-secondary font-medium">Preferred lanes</label>
          <input value={form.preferred_lanes} onChange={set('preferred_lanes')} placeholder="TX→CA, Midwest regional" className={inp} />
        </div>
        <div>
          <label className="text-small text-text-secondary font-medium">Preferred regions</label>
          <input value={form.preferred_regions} onChange={set('preferred_regions')} placeholder="Southeast, TX, OTR 48" className={inp} />
        </div>

        <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer">
          <input type="checkbox" checked={form.willing_to_relocate}
            onChange={(e) => setForm((s) => ({ ...s, willing_to_relocate: e.target.checked }))} className="rounded" />
          Willing to relocate
        </label>

        <div>
          <label className="text-small text-text-secondary font-medium">About you</label>
          <textarea rows={4} value={form.notes} onChange={set('notes')} className={cn(inp, 'resize-none')} />
        </div>

        <div className="flex justify-end">
          <button type="button" onClick={() => save()} disabled={saving}
            className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90 disabled:opacity-60 flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />} Save changes
          </button>
        </div>
      </div>
    </div>
  );
}
