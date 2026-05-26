import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowLeft, BadgeCheck, ShieldCheck, Mail, Phone, Truck, MapPin,
  Bookmark, BookmarkCheck, Briefcase, Calendar, Award, Send, MoreHorizontal,
  Plus, Check
} from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const STATUS_LABEL = {
  looking_for_work: 'Looking for work',
  open_to_offers: 'Open to offers',
  not_looking: 'Not looking',
  hired: 'Hired',
  temporarily_unavailable: 'Temporarily unavailable'
};

const verifPill = (v) =>
  v === 'verified'
    ? { label: 'Verified', cls: 'text-emerald-700 bg-emerald-50 border-emerald-200' }
    : v === 'pending' || v === 'processing'
      ? { label: 'Verification pending', cls: 'text-amber-700 bg-amber-50 border-amber-200' }
      : { label: 'Unverified', cls: 'text-text-secondary bg-surface-secondary border-surface-tertiary' };

const initialsOf = (name) =>
  (name || '').split(/\s+/).filter(Boolean).map((s) => s[0]).slice(0, 2).join('').toUpperCase() || 'D';

const prettyEquip = (e) => String(e).replace(/_/g, ' ').replace(/\b\w/g, (m) => m.toUpperCase());

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;

export default function DriverProfilePage() {
  const { orgSlug, userId } = useParams();
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    connectApi.getDriverProfile(userId)
      .then((r) => setP(r.data || null))
      .catch(() => setP(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [userId]);

  const toggleSave = async () => {
    setBusy(true);
    try {
      if (p.saved) await connectApi.unsaveDriver(userId);
      else await connectApi.saveDriver(userId);
      load();
    } finally { setBusy(false); }
  };
  const invite = async () => {
    setBusy(true);
    try { await connectApi.inviteDriver(userId, null); load(); }
    finally { setBusy(false); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…
      </div>
    );
  }
  if (!p?.user) {
    return (
      <div className="max-w-3xl mx-auto p-8">
        <div className="p-4 rounded-card bg-error/5 border border-error/20 text-error text-body-sm">
          Driver not found.
        </div>
      </div>
    );
  }

  const { user, availability, identity, work_history, connection, onboarding_id } = p;
  const vb = verifPill(identity?.verification || 'unverified');
  const isVerified = identity?.verification === 'verified';
  const statusLabel = availability?.status && STATUS_LABEL[availability.status];
  const statusTone =
    availability?.status === 'looking_for_work' ? 'text-emerald-600'
    : availability?.status === 'open_to_offers' ? 'text-blue-600'
    : 'text-text-tertiary';

  return (
    <div className="max-w-3xl mx-auto p-4 lg:p-6 space-y-3">
      <Link to={`/o/${orgSlug}/connect/drivers`} className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to drivers
      </Link>

      {/* ── Hero card: cover banner + avatar + name + actions ─────── */}
      <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
        {/* Cover banner — subtle morpro-themed gradient. Replaceable per-
            driver later if we add a cover_image to NetworkDriverIdentity. */}
        <div
          className="h-44 relative"
          style={{
            background:
              'linear-gradient(135deg, #34CCFF 0%, #1FA8C7 35%, #2563EB 100%)'
          }}
        >
          <div
            aria-hidden
            className="absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 20% 70%, rgba(255,255,255,0.4), transparent 50%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.25), transparent 55%)'
            }}
          />
        </div>

        <div className="px-6 pb-6 -mt-14 relative">
          {/* Avatar — ring overlaps the cover */}
          <div className="w-28 h-28 rounded-full bg-gradient-to-br from-accent/20 to-accent/5 border-4 border-white shadow-card flex items-center justify-center">
            <span className="text-title-sm font-semibold text-accent">
              {initialsOf(user.name)}
            </span>
          </div>

          {/* Name + verified + status */}
          <div className="mt-3 flex items-start justify-between gap-4 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h1 className="text-title text-text-primary">{user.name}</h1>
                {isVerified && (
                  <BadgeCheck className="w-5 h-5 text-emerald-500 flex-shrink-0" title="Identity verified" />
                )}
                {statusLabel && (
                  <>
                    <span className="text-text-tertiary text-small">·</span>
                    <span className={cn('text-small font-medium', statusTone)}>
                      {statusLabel}
                    </span>
                  </>
                )}
              </div>

              {availability?.headline && (
                <p className="text-body text-text-secondary mt-0.5">{availability.headline}</p>
              )}

              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-small text-text-tertiary">
                {identity?.cdl_state && (
                  <span className="flex items-center gap-1">
                    <Award className="w-3.5 h-3.5" /> CDL {identity.cdl_state}
                  </span>
                )}
                {availability?.available_from && (
                  <>
                    <span className="text-text-tertiary">·</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> Available {fmtDate(availability.available_from)}
                    </span>
                  </>
                )}
                <span className="text-text-tertiary">·</span>
                <a href={`mailto:${user.email}`} className="text-accent hover:underline">
                  Contact info
                </a>
              </div>

              <div className="text-small text-text-tertiary mt-1">
                <span className="font-medium text-text-secondary">
                  {work_history?.total_loads || 0}
                </span>{' '}
                completed {work_history?.total_loads === 1 ? 'load' : 'loads'} on the network
              </div>
            </div>

            {/* Verification pill (top-right, like LinkedIn's company chip) */}
            <span className={cn(
              'text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full border flex items-center gap-1 self-start',
              vb.cls
            )}>
              <ShieldCheck className="w-3 h-3" /> {vb.label}
            </span>
          </div>

          {/* Action buttons — LinkedIn pattern: filled primary + outline secondary + more menu */}
          <div className="flex flex-wrap items-center gap-2 mt-4">
            {onboarding_id ? (
              <Link
                to={`/o/${orgSlug}/connect/onboarding/${onboarding_id}`}
                className="px-5 py-2 rounded-full bg-accent text-white text-body-sm font-semibold hover:bg-accent/90 flex items-center gap-1.5 transition-colors"
              >
                <Send className="w-4 h-4" /> Onboarding
              </Link>
            ) : connection ? (
              <button
                type="button"
                disabled
                className="px-5 py-2 rounded-full bg-surface-secondary text-text-tertiary text-body-sm font-medium flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                {connection.status?.startsWith('pending') ? 'Invite sent' : 'Connected'}
              </button>
            ) : (
              <button
                type="button"
                onClick={invite}
                disabled={busy}
                className="px-5 py-2 rounded-full bg-accent text-white text-body-sm font-semibold hover:bg-accent/90 flex items-center gap-1.5 transition-colors"
              >
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Connect
              </button>
            )}

            <button
              type="button"
              onClick={toggleSave}
              disabled={busy}
              className="px-5 py-2 rounded-full border-2 border-accent text-accent text-body-sm font-semibold hover:bg-accent/5 flex items-center gap-1.5 transition-colors"
            >
              {p.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
              {p.saved ? 'Saved' : 'Save'}
            </button>

            <button
              type="button"
              className="w-10 h-10 rounded-full border border-surface-tertiary text-text-secondary hover:bg-surface-secondary flex items-center justify-center"
              aria-label="More"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── About ─────────────────────────────────────────────────── */}
      {(availability?.headline || availability?.notes) && (
        <Section title="About">
          {availability?.headline && (
            <p className="text-body text-text-primary leading-relaxed">{availability.headline}</p>
          )}
          {availability?.notes && (
            <p className="text-body-sm text-text-secondary leading-relaxed mt-2 whitespace-pre-wrap">
              {availability.notes}
            </p>
          )}
        </Section>
      )}

      {/* ── Preferences (Equipment + lanes + regions) ─────────────── */}
      {availability && (
        <Section title="Equipment & lanes">
          <div className="space-y-3">
            {(availability.preferred_equipment || []).length > 0 && (
              <PrefRow icon={Truck} label="Equipment">
                {availability.preferred_equipment.map((e) => (
                  <Chip key={e}>{prettyEquip(e)}</Chip>
                ))}
              </PrefRow>
            )}
            {(availability.preferred_regions || []).length > 0 && (
              <PrefRow icon={MapPin} label="Regions">
                {availability.preferred_regions.map((r) => (
                  <Chip key={r}>{r}</Chip>
                ))}
              </PrefRow>
            )}
            {(availability.preferred_lanes || []).length > 0 && (
              <PrefRow icon={MapPin} label="Lanes">
                {availability.preferred_lanes.map((l) => (
                  <Chip key={l}>{l}</Chip>
                ))}
              </PrefRow>
            )}
            {availability.willing_to_relocate && (
              <div className="flex items-center gap-2 text-body-sm text-emerald-700 pt-1">
                <Check className="w-4 h-4" /> Willing to relocate for the right opportunity
              </div>
            )}
          </div>
        </Section>
      )}

      {/* ── Credentials ───────────────────────────────────────────── */}
      {identity && (
        <Section title="Credentials">
          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
            <Field label="CDL state">{identity.cdl_state || '—'}</Field>
            <Field label="CDL number">
              {identity.cdl_number ? `••••${String(identity.cdl_number).slice(-4)}` : '—'}
            </Field>
            <Field label="CDL expiry">{fmtDate(identity.cdl_expiry) || '—'}</Field>
            <Field label="Identity verification">
              <span className={cn(
                'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border',
                vb.cls
              )}>
                <ShieldCheck className="w-3 h-3" /> {vb.label}
              </span>
            </Field>
          </div>
        </Section>
      )}

      {/* ── Contact ───────────────────────────────────────────────── */}
      <Section title="Contact info">
        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2">
          {user.email && (
            <Field label="Email">
              <a href={`mailto:${user.email}`} className="text-accent hover:underline flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5" /> {user.email}
              </a>
            </Field>
          )}
          {user.phone && (
            <Field label="Phone">
              <a href={`tel:${user.phone}`} className="text-accent hover:underline flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5" /> {user.phone}
              </a>
            </Field>
          )}
        </div>
      </Section>

      {/* ── Work history ──────────────────────────────────────────── */}
      <Section
        title="Work history"
        rightMeta={`${work_history?.total_loads || 0} ${work_history?.total_loads === 1 ? 'load' : 'loads'}`}
      >
        {(work_history?.companies || []).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {work_history.companies.map((c) => (
              <Chip key={c.name}>{c.name} · {c.loads}</Chip>
            ))}
          </div>
        )}
        {(work_history?.recent || []).length === 0 ? (
          <div className="text-body-sm text-text-tertiary py-4 text-center">
            No work history on file yet.
          </div>
        ) : (
          <div className="divide-y divide-surface-tertiary/70 -mx-5">
            {work_history.recent.map((h, i) => (
              <div key={i} className="px-5 py-3 flex items-start gap-3">
                <span className="w-8 h-8 rounded-md bg-accent/10 text-accent flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Briefcase className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {h.company || 'Carrier'}
                  </div>
                  <div className="text-small text-text-tertiary">
                    {h.reference && <span>{h.reference}</span>}
                    {h.reference && h.shipper && ' · '}
                    {h.shipper}
                  </div>
                  {h.date && (
                    <div className="text-[11px] text-text-tertiary mt-0.5">
                      {new Date(h.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

/* ───────────────────────── shared bits ───────────────────────── */

function Section({ title, children, rightMeta }) {
  return (
    <div className="bg-white rounded-card border border-surface-tertiary p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-title-sm text-text-primary">{title}</h2>
        {rightMeta && <span className="text-small text-text-tertiary">{rightMeta}</span>}
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

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-0.5">{label}</div>
      <div className="text-body-sm text-text-primary">{children}</div>
    </div>
  );
}
