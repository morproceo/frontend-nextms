import { useState, useEffect } from 'react';
import { Loader2, Building2, ShieldCheck, Globe, Lock, CheckCircle2 } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const toCsv = (a) => (Array.isArray(a) ? a.join(', ') : '');
const fromCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

export default function CarrierConnectProfilePage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const load = () => {
    setLoading(true);
    connectApi.getCarrierProfile()
      .then((r) => {
        const d = r.data || {};
        setData(d);
        const p = d.profile || {};
        setForm({
          equipment_types: toCsv(p.equipment_types),
          service_regions: toCsv(p.service_regions),
          preferred_lanes: toCsv(p.preferred_lanes),
          available_trucks: p.available_trucks ?? '',
          public_notes: p.public_notes || '',
          visibility_status: p.visibility_status || 'private'
        });
      })
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async (override = {}) => {
    setSaving(true);
    setSaved(false);
    try {
      const f = { ...form, ...override };
      const r = await connectApi.updateCarrierProfile({
        equipment_types: fromCsv(f.equipment_types),
        service_regions: fromCsv(f.service_regions),
        preferred_lanes: fromCsv(f.preferred_lanes),
        available_trucks: f.available_trucks === '' ? null : Number(f.available_trucks),
        public_notes: f.public_notes || null,
        visibility_status: f.visibility_status
      });
      const d = r.data || {};
      setData(d);
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

  const isPublic = form.visibility_status === 'public';
  const verif = data?.verification;
  const set = (k) => (e) => setForm((s) => ({ ...s, [k]: e.target.value }));

  return (
    <div className="max-w-2xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Company profile</h1>
          <p className="text-body-sm text-text-secondary">
            This is what drivers see when they browse carriers on the network.
          </p>
        </div>
      </div>

      {/* Visibility */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
              isPublic ? 'bg-emerald-500/10' : 'bg-surface-secondary')}>
              {isPublic ? <Globe className="w-5 h-5 text-emerald-500" /> : <Lock className="w-5 h-5 text-text-tertiary" />}
            </div>
            <div>
              <div className="text-body-sm font-medium text-text-primary">
                {isPublic ? 'Listed on the network' : 'Not listed'}
              </div>
              <div className="text-small text-text-tertiary">
                {isPublic ? 'Drivers can discover and apply to you.' : 'Publish to appear in driver searches.'}
              </div>
            </div>
          </div>
          <button
            type="button"
            disabled={saving}
            onClick={() => save({ visibility_status: isPublic ? 'private' : 'public' })}
            className={cn('px-4 py-2 rounded-button text-body-sm font-medium',
              isPublic
                ? 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary'
                : 'bg-accent text-white hover:bg-accent/90')}
          >
            {isPublic ? 'Unpublish' : 'Publish to network'}
          </button>
        </div>
        {verif && (
          <div className="mt-4 pt-4 border-t border-surface-tertiary flex items-center gap-2 text-small">
            <ShieldCheck className={cn('w-4 h-4', verif.status === 'approved' ? 'text-emerald-500' : 'text-text-tertiary')} />
            <span className="text-text-secondary">
              Verification: <span className="font-medium">{verif.status}</span>
              {verif.mc_number ? ` · MC ${verif.mc_number}` : ''}{verif.dot_number ? ` · DOT ${verif.dot_number}` : ''}
            </span>
          </div>
        )}
      </div>

      {/* Editable fields */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-body-sm font-medium text-text-primary">Profile details</span>
          {saved && <span className="text-small text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
        </div>

        <Field label="Equipment types" hint="Comma-separated, e.g. 53ft dry, reefer, flatbed">
          <input value={form.equipment_types} onChange={set('equipment_types')} className={inp} />
        </Field>
        <Field label="Service regions" hint="Comma-separated, e.g. TX, Southeast, OTR 48">
          <input value={form.service_regions} onChange={set('service_regions')} className={inp} />
        </Field>
        <Field label="Preferred lanes" hint="Comma-separated, e.g. TX→CA, Midwest regional">
          <input value={form.preferred_lanes} onChange={set('preferred_lanes')} className={inp} />
        </Field>
        <Field label="Available trucks">
          <input type="number" value={form.available_trucks} onChange={set('available_trucks')} className={inp} />
        </Field>
        <Field label="About / public notes" hint="What drivers should know about working for you">
          <textarea rows={4} value={form.public_notes} onChange={set('public_notes')} className={cn(inp, 'resize-none')} />
        </Field>

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

const inp = 'w-full mt-1 px-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20';

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="text-small text-text-secondary font-medium">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-text-tertiary mt-1">{hint}</p>}
    </div>
  );
}
