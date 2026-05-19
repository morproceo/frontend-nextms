import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowLeft, ShieldCheck, Mail, Phone, Truck, MapPin,
  Bookmark, BookmarkCheck, Briefcase, ChevronRight
} from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const verifPill = (v) =>
  v === 'verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : v === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200'
  : 'text-text-secondary bg-surface-secondary border-surface-tertiary';

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
    return <div className="flex items-center justify-center py-24 text-text-tertiary"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading profile…</div>;
  }
  if (!p?.user) {
    return <div className="max-w-3xl mx-auto p-8"><div className="p-4 rounded-card bg-error/5 border border-error/20 text-error text-body-sm">Driver not found.</div></div>;
  }

  const { user, availability, identity, work_history, connection, onboarding_id } = p;
  const vb = identity?.verification || 'unverified';

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
      <Link to={`/o/${orgSlug}/connect/candidates`} className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to candidates
      </Link>

      {/* Identity header */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
          <span className="text-title-sm font-semibold text-accent">
            {user.name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-title text-text-primary">{user.name}</h1>
            <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border flex items-center gap-1', verifPill(vb))}>
              <ShieldCheck className="w-3 h-3" /> {vb}
            </span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-small text-text-tertiary">
            {user.email && <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>}
            {user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
            {identity?.cdl_state && <span>CDL {identity.cdl_state}{identity.cdl_number ? ` · ${identity.cdl_number}` : ''}</span>}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button type="button" onClick={toggleSave} disabled={busy}
            className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary flex items-center gap-1.5">
            {p.saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {p.saved ? 'Saved' : 'Save'}
          </button>
          {onboarding_id ? (
            <Link to={`/o/${orgSlug}/connect/onboarding/${onboarding_id}`}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90 text-center">
              Onboarding →
            </Link>
          ) : connection ? (
            <span className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-tertiary text-small text-center">
              {connection.status?.startsWith('pending') ? 'Invite pending' : connection.status}
            </span>
          ) : (
            <button type="button" onClick={invite} disabled={busy}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90">
              Invite to connect
            </button>
          )}
        </div>
      </div>

      {/* Preferences */}
      {availability && (
        <div className="bg-white rounded-card border border-surface-tertiary p-5">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-3">Preferences</div>
          {availability.headline && <p className="text-body-sm text-text-primary mb-3">{availability.headline}</p>}
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">
              {availability.status}
            </span>
            {availability.willing_to_relocate && (
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Will relocate
              </span>
            )}
            {(availability.preferred_equipment || []).map((e) => (
              <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary flex items-center gap-1">
                <Truck className="w-3 h-3" /> {e}
              </span>
            ))}
            {(availability.preferred_regions || []).map((r) => (
              <span key={r} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">{r}</span>
            ))}
          </div>
        </div>
      )}

      {/* Work history / resume */}
      <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-tertiary flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">
            Work history · {work_history?.total_loads || 0} loads
          </span>
        </div>
        {(work_history?.companies || []).length > 0 && (
          <div className="px-5 py-3 flex flex-wrap gap-2 border-b border-surface-tertiary">
            {work_history.companies.map((c) => (
              <span key={c.name} className="text-[11px] px-2 py-0.5 rounded-full bg-surface-secondary border border-surface-tertiary text-text-secondary">
                {c.name} · {c.loads}
              </span>
            ))}
          </div>
        )}
        {(work_history?.recent || []).length === 0 ? (
          <div className="p-6 text-center text-body-sm text-text-tertiary">No work history on record.</div>
        ) : (
          <div className="divide-y divide-surface-tertiary">
            {work_history.recent.map((h, i) => (
              <div key={i} className="px-5 py-3 flex items-center gap-3">
                <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm text-text-primary truncate">
                    {h.company || 'Carrier'}{h.reference ? ` · ${h.reference}` : ''}
                  </div>
                  <div className="text-small text-text-tertiary">
                    {h.shipper || ''}{h.date ? ` · ${new Date(h.date).toLocaleDateString()}` : ''}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
