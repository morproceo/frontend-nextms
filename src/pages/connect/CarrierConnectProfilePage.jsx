import { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, Building2, ShieldCheck, BadgeCheck, Globe, Lock,
  Pencil, X, Check, MapPin, Truck, Phone, Mail, ExternalLink,
  Users, Plus, MoreHorizontal
} from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const fromCsv = (s) => String(s || '').split(',').map((x) => x.trim()).filter(Boolean);

const initialsOf = (name) =>
  (name || '').split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'C';

const prettyEquip = (e) => String(e).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

export default function CarrierConnectProfilePage() {
  const { orgSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null); // section key | null
  const [toast, setToast] = useState(null);

  const load = () => {
    setLoading(true);
    connectApi.getCarrierProfile()
      .then((r) => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const flash = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const save = async (patch) => {
    setSaving(true);
    try {
      const r = await connectApi.updateCarrierProfile(patch);
      setData(r.data || data);
      setEditing(null);
      flash('Saved');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }

  const org = data.organization || {};
  const p = data.profile || {};
  const verif = data.verification;
  const isPublic = p.visibility_status === 'public';
  const isVerified =
    !!org.is_morpro_verified ||
    (verif && (verif.status === 'approved' || verif.status === 'verified'));

  const locationLine = [org.city, org.state].filter(Boolean).join(', ');
  const fullAddress = [org.address_line1, locationLine, org.zip].filter(Boolean).join(' · ');

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-3">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded-lg bg-emerald-600 text-white text-body-sm shadow-elevated flex items-center gap-2">
          <Check className="w-4 h-4" /> {toast}
        </div>
      )}

      {/* ── Hero card ─────────────────────────────────────────────── */}
      <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
        {/* Cover banner */}
        <div
          className="h-44 relative"
          style={{
            background:
              'linear-gradient(135deg, #10B981 0%, #047857 45%, #1FA8C7 100%)'
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 70%, rgba(255,255,255,0.4), transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.3), transparent 55%)'
            }}
          />
        </div>

        <div className="px-6 pb-6 -mt-14 relative">
          {/* Logo / avatar */}
          <div className="w-28 h-28 rounded-2xl bg-white border-4 border-white shadow-card overflow-hidden flex items-center justify-center">
            {org.logo_url ? (
              <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-emerald-500/15 to-emerald-500/5 flex items-center justify-center">
                <span className="text-title-sm font-semibold text-emerald-600">
                  {initialsOf(org.name)}
                </span>
              </div>
            )}
          </div>

          {/* Name + verified + headline */}
          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-title text-text-primary">{org.name}</h1>
                {isVerified && (
                  <BadgeCheck className="w-5 h-5 text-emerald-500" title="MorPro verified" />
                )}
              </div>
              {p.headline && (
                <p className="text-body text-text-secondary mt-0.5">{p.headline}</p>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-small text-text-tertiary">
                {locationLine && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" /> {locationLine}
                  </span>
                )}
                {org.dot_number && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span>DOT {org.dot_number}</span>
                  </>
                )}
                {org.mc_number && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span>MC {org.mc_number}</span>
                  </>
                )}
                {org.fleet_size && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span>{org.fleet_size} truck fleet</span>
                  </>
                )}
              </div>
              <div className="text-small text-text-tertiary mt-1">
                {p.available_trucks
                  ? <span className="font-medium text-emerald-600">{p.available_trucks} truck{p.available_trucks === 1 ? '' : 's'} open · hiring</span>
                  : 'Not actively hiring'}
              </div>
            </div>

            {/* Visibility pill — top right */}
            <span className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-full border text-[11px] font-medium self-start',
              isPublic
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-surface-secondary text-text-secondary border-surface-tertiary'
            )}>
              {isPublic ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
              {isPublic ? 'Public' : 'Private'}
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => save({ visibility_status: isPublic ? 'private' : 'public' })}
              className={cn(
                'px-5 py-2 rounded-full text-body-sm font-semibold flex items-center gap-1.5 transition-colors',
                isPublic
                  ? 'border-2 border-accent text-accent hover:bg-accent/5'
                  : 'bg-accent text-white hover:bg-accent/90'
              )}
            >
              {isPublic ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              {isPublic ? 'Unpublish' : 'Publish to network'}
            </button>
            <button
              type="button"
              onClick={() => setEditing('headline')}
              className="px-5 py-2 rounded-full border-2 border-accent text-accent text-body-sm font-semibold hover:bg-accent/5 flex items-center gap-1.5 transition-colors"
            >
              <Pencil className="w-4 h-4" /> Edit headline
            </button>
            <Link
              to={`/o/${orgSlug}/settings`}
              className="px-5 py-2 rounded-full text-body-sm font-medium text-text-secondary hover:bg-surface-secondary flex items-center gap-1.5"
            >
              <Building2 className="w-4 h-4" /> Company info
            </Link>
            <button
              type="button"
              className="w-10 h-10 rounded-full border border-surface-tertiary text-text-secondary hover:bg-surface-secondary flex items-center justify-center"
              aria-label="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          {verif && (
            <div className="mt-4 pt-4 border-t border-surface-tertiary flex items-center gap-2 text-small">
              <ShieldCheck className={cn('w-4 h-4', verif.status === 'approved' || verif.status === 'verified' ? 'text-emerald-500' : 'text-text-tertiary')} />
              <span className="text-text-secondary">
                MorPro verification: <span className="font-medium capitalize">{verif.status}</span>
                {verif.legal_name && ` · ${verif.legal_name}`}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── About ─────────────────────────────────────────────────── */}
      <Section
        title="About"
        onEdit={() => setEditing('about')}
      >
        {editing === 'about' ? (
          <AboutEditor
            initial={{ headline: p.headline, public_notes: p.public_notes, description: org.description }}
            onCancel={() => setEditing(null)}
            onSave={(patch) => save(patch)}
            saving={saving}
          />
        ) : (
          <div className="space-y-3">
            {p.headline ? (
              <p className="text-body text-text-primary leading-relaxed">{p.headline}</p>
            ) : (
              <Hint onClick={() => setEditing('about')}>Add a one-line headline drivers see first</Hint>
            )}
            {p.public_notes ? (
              <p className="text-body-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{p.public_notes}</p>
            ) : (
              <Hint onClick={() => setEditing('about')}>Add an &quot;About us&quot; — pay structure, home time, culture</Hint>
            )}
            {org.description && (
              <p className="text-body-sm text-text-tertiary leading-relaxed whitespace-pre-wrap pt-2 border-t border-surface-tertiary/70">
                {org.description}
              </p>
            )}
          </div>
        )}
      </Section>

      {/* ── Equipment & lanes ─────────────────────────────────────── */}
      <Section
        title="Equipment & lanes"
        onEdit={() => setEditing('lanes')}
      >
        {editing === 'lanes' ? (
          <LanesEditor
            initial={{
              equipment_types: p.equipment_types,
              service_regions: p.service_regions,
              preferred_lanes: p.preferred_lanes
            }}
            onCancel={() => setEditing(null)}
            onSave={(patch) => save(patch)}
            saving={saving}
          />
        ) : (
          <div className="space-y-3">
            <PrefRow icon={Truck} label="Equipment">
              {(p.equipment_types || []).length > 0
                ? p.equipment_types.map((e) => <Chip key={e}>{prettyEquip(e)}</Chip>)
                : <EmptyChip onClick={() => setEditing('lanes')}>Add equipment types</EmptyChip>}
            </PrefRow>
            <PrefRow icon={MapPin} label="Service regions">
              {(p.service_regions || []).length > 0
                ? p.service_regions.map((r) => <Chip key={r}>{r}</Chip>)
                : <EmptyChip onClick={() => setEditing('lanes')}>Add regions you run</EmptyChip>}
            </PrefRow>
            <PrefRow icon={MapPin} label="Preferred lanes">
              {(p.preferred_lanes || []).length > 0
                ? p.preferred_lanes.map((l) => <Chip key={l}>{l}</Chip>)
                : <EmptyChip onClick={() => setEditing('lanes')}>Add lanes you prefer</EmptyChip>}
            </PrefRow>
          </div>
        )}
      </Section>

      {/* ── Hiring ────────────────────────────────────────────────── */}
      <Section
        title="Hiring"
        onEdit={() => setEditing('hiring')}
      >
        {editing === 'hiring' ? (
          <HiringEditor
            initial={{ available_trucks: p.available_trucks }}
            onCancel={() => setEditing(null)}
            onSave={(patch) => save(patch)}
            saving={saving}
          />
        ) : (
          <div className="grid sm:grid-cols-3 gap-4">
            <Stat
              icon={Truck}
              label="Open trucks"
              value={p.available_trucks ?? '—'}
              hint={p.available_trucks ? 'Drivers see "hiring" on your card' : 'Set to mark yourself as hiring'}
            />
            <Stat
              icon={Users}
              label="Fleet size"
              value={org.fleet_size ?? '—'}
              hint="From company info"
            />
            <Stat
              icon={ShieldCheck}
              label="Verification"
              value={isVerified ? 'Verified' : (verif?.status || 'Not started')}
              hint={isVerified ? 'Trust badge shown to drivers' : 'Complete LINQ verification'}
            />
          </div>
        )}
      </Section>

      {/* ── Contact ───────────────────────────────────────────────── */}
      <Section title="Contact" rightHint={<Link to={`/o/${orgSlug}/settings`} className="text-small text-accent hover:underline">Edit in company info →</Link>}>
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
          <Field label="Phone">
            {org.public_phone
              ? <a href={`tel:${org.public_phone}`} className="text-accent hover:underline flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {org.public_phone}</a>
              : <span className="text-text-tertiary">—</span>}
          </Field>
          <Field label="Email">
            {org.public_email
              ? <a href={`mailto:${org.public_email}`} className="text-accent hover:underline flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {org.public_email}</a>
              : <span className="text-text-tertiary">—</span>}
          </Field>
          <Field label="Website">
            {org.website
              ? <a href={org.website.startsWith('http') ? org.website : `https://${org.website}`} target="_blank" rel="noreferrer" className="text-accent hover:underline flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5" /> {org.website}</a>
              : <span className="text-text-tertiary">—</span>}
          </Field>
          <Field label="Address">
            {fullAddress
              ? <span className="text-text-primary">{fullAddress}</span>
              : <span className="text-text-tertiary">—</span>}
          </Field>
        </div>
      </Section>
    </div>
  );
}

/* ───────────────────────── shared building blocks ───────────────────────── */

function Section({ title, children, onEdit, rightHint }) {
  return (
    <div className="bg-white rounded-card border border-surface-tertiary p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-title-sm text-text-primary">{title}</h2>
        <div className="flex items-center gap-3">
          {rightHint}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="w-8 h-8 rounded-full text-text-secondary hover:bg-surface-secondary flex items-center justify-center transition-colors"
              aria-label={`Edit ${title}`}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  );
}

function PrefRow({ icon: Icon, label, children }) {
  return (
    <div className="flex items-start gap-3">
      <span className="w-7 h-7 rounded-md bg-surface-secondary flex items-center justify-center text-text-secondary flex-shrink-0 mt-0.5">
        <Icon className="w-3.5 h-3.5" />
      </span>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">{label}</div>
        <div className="flex flex-wrap gap-1.5">{children}</div>
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">
      {children}
    </span>
  );
}

function EmptyChip({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 rounded-full border border-dashed border-surface-tertiary text-text-tertiary hover:border-accent hover:text-accent flex items-center gap-1 transition-colors"
    >
      <Plus className="w-3 h-3" /> {children}
    </button>
  );
}

function Hint({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-body-sm text-text-tertiary hover:text-accent text-left flex items-center gap-1.5 transition-colors"
    >
      <Plus className="w-3.5 h-3.5" /> {children}
    </button>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-0.5">{label}</div>
      <div className="text-body-sm text-text-primary">{children}</div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint }) {
  return (
    <div className="p-3 rounded-lg bg-surface-secondary/40 border border-surface-tertiary/60">
      <div className="flex items-center gap-1.5 text-text-tertiary text-[11px] uppercase tracking-wider mb-1.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className="text-title-sm font-semibold text-text-primary">{value}</div>
      {hint && <div className="text-[11px] text-text-tertiary mt-1">{hint}</div>}
    </div>
  );
}

/* ───────────────────────── editors (inline) ───────────────────────── */

function EditorShell({ children, onCancel, onSave, saving }) {
  return (
    <div className="space-y-3">
      {children}
      <div className="flex items-center justify-end gap-2 pt-2 border-t border-surface-tertiary/70">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-1.5 rounded-full text-body-sm font-medium text-text-secondary hover:bg-surface-secondary"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onSave}
          disabled={saving}
          className="px-4 py-1.5 rounded-full bg-accent text-white text-body-sm font-semibold hover:bg-accent/90 disabled:opacity-60 flex items-center gap-1.5"
        >
          {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save
        </button>
      </div>
    </div>
  );
}

const inp = 'w-full px-3 py-2 rounded-lg border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20';

function AboutEditor({ initial, onCancel, onSave, saving }) {
  const [headline, setHeadline] = useState(initial.headline || '');
  const [notes, setNotes] = useState(initial.public_notes || '');
  return (
    <EditorShell
      onCancel={onCancel}
      saving={saving}
      onSave={() => onSave({ headline: headline || null, public_notes: notes || null })}
    >
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          maxLength={200}
          placeholder="e.g. Family-run reefer carrier · home weekends · $0.65 cpm"
          className={inp}
        />
        <p className="text-[11px] text-text-tertiary mt-1">{headline.length}/200 — the one-line pitch drivers see first.</p>
      </div>
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">About us</label>
        <textarea
          rows={5}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Pay structure, home time, benefits, what makes you a great place to drive…"
          className={cn(inp, 'resize-none')}
        />
      </div>
    </EditorShell>
  );
}

function LanesEditor({ initial, onCancel, onSave, saving }) {
  const [eq, setEq] = useState((initial.equipment_types || []).join(', '));
  const [reg, setReg] = useState((initial.service_regions || []).join(', '));
  const [lanes, setLanes] = useState((initial.preferred_lanes || []).join(', '));
  return (
    <EditorShell
      onCancel={onCancel}
      saving={saving}
      onSave={() => onSave({
        equipment_types: fromCsv(eq),
        service_regions: fromCsv(reg),
        preferred_lanes: fromCsv(lanes)
      })}
    >
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">Equipment types</label>
        <input value={eq} onChange={(e) => setEq(e.target.value)} placeholder="dry van, reefer, flatbed" className={inp} />
        <p className="text-[11px] text-text-tertiary mt-1">Comma-separated.</p>
      </div>
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">Service regions</label>
        <input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Southeast, Texas Triangle, OTR (48 states)" className={inp} />
      </div>
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">Preferred lanes</label>
        <input value={lanes} onChange={(e) => setLanes(e.target.value)} placeholder="TX → CA, Midwest regional" className={inp} />
      </div>
    </EditorShell>
  );
}

function HiringEditor({ initial, onCancel, onSave, saving }) {
  const [n, setN] = useState(initial.available_trucks ?? '');
  return (
    <EditorShell
      onCancel={onCancel}
      saving={saving}
      onSave={() => onSave({ available_trucks: n === '' ? null : Number(n) })}
    >
      <div>
        <label className="text-small text-text-secondary font-medium block mb-1">Open trucks</label>
        <input
          type="number"
          min="0"
          value={n}
          onChange={(e) => setN(e.target.value)}
          placeholder="0"
          className={cn(inp, 'max-w-[160px]')}
        />
        <p className="text-[11px] text-text-tertiary mt-1">
          The number of trucks you have open right now. Drivers see &quot;hiring&quot; on your card when this is &gt; 0.
        </p>
      </div>
    </EditorShell>
  );
}
