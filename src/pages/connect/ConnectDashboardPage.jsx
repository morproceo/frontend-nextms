import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, Network, Building2, UserRound, Search, ChevronRight } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const AVAIL = [
  { v: 'not_looking', label: 'Not looking' },
  { v: 'looking_for_work', label: 'Looking for work' },
  { v: 'open_to_offers', label: 'Open to offers' },
  { v: 'hired', label: 'Hired' },
  { v: 'temporarily_unavailable', label: 'Temporarily unavailable' }
];

const CONN_LABEL = {
  pending_driver_approval: 'Pending your approval',
  pending_carrier_approval: 'Pending carrier approval',
  connected: 'Connected',
  declined: 'Declined',
  blocked: 'Blocked',
  archived: 'Archived'
};

const connTone = (s) =>
  s === 'connected' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : s?.startsWith('pending') ? 'text-amber-600 bg-amber-50 border-amber-200'
  : 'text-text-secondary bg-surface-secondary border-surface-tertiary';

export default function ConnectDashboardPage() {
  const { orgSlug } = useParams();
  const [avail, setAvail] = useState(null);
  const [savingAvail, setSavingAvail] = useState(false);
  const [savedAt, setSavedAt] = useState(false);
  const [mine, setMine] = useState([]);
  const [orgConns, setOrgConns] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAll = () => {
    setLoading(true);
    Promise.all([
      connectApi.getAvailability().then((r) => setAvail(r.data || {})).catch(() => setAvail({})),
      connectApi.getMyConnections().then((r) => setMine(r.data?.connections || [])).catch(() => setMine([])),
      connectApi.getOrgConnections().then((r) => setOrgConns(r.data?.connections || [])).catch(() => setOrgConns([]))
    ]).finally(() => setLoading(false));
  };
  useEffect(() => { loadAll(); }, []);

  const saveAvail = async (patch) => {
    setSavingAvail(true);
    setSavedAt(false);
    try {
      const r = await connectApi.setAvailability({ ...avail, ...patch });
      setAvail(r.data || {});
      setSavedAt(true);
      setTimeout(() => setSavedAt(false), 2500);
    } finally {
      setSavingAvail(false);
    }
  };

  const respond = async (c, accept, asOrg) => {
    await connectApi.respondConnection(c.id, accept, asOrg).catch(() => {});
    loadAll();
  };

  if (loading || !avail) {
    return (
      <div className="flex items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading MorPro Connect…
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Network className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">MorPro Connect</h1>
          <p className="text-body-sm text-text-secondary">
            The verified driver↔carrier network. Discovery, hiring & onboarding coming next — set your availability now.
          </p>
        </div>
      </div>

      {/* Availability */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UserRound className="w-4 h-4 text-text-secondary" />
            <span className="text-body-sm font-medium text-text-primary">Your availability</span>
          </div>
          {savedAt && (
            <span className="text-small text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Saved
            </span>
          )}
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-small text-text-tertiary">Status</label>
            <select
              value={avail.availability_status || 'not_looking'}
              onChange={(e) => saveAvail({ availability_status: e.target.value })}
              disabled={savingAvail}
              className="w-full mt-1 px-3 py-2 rounded-input border border-surface-tertiary text-body-sm bg-white focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {AVAIL.map((a) => <option key={a.v} value={a.v}>{a.label}</option>)}
            </select>
          </div>
          <div>
            <label className="text-small text-text-tertiary">Headline</label>
            <input
              defaultValue={avail.headline || ''}
              onBlur={(e) => e.target.value !== (avail.headline || '') && saveAvail({ headline: e.target.value })}
              placeholder="e.g. 5yr OTR · reefer · clean MVR"
              className="w-full mt-1 px-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={!!avail.is_visible}
              onChange={(e) => saveAvail({ is_visible: e.target.checked })}
              className="rounded"
            />
            Visible to carriers in the network
          </label>
          <label className="flex items-center gap-2 text-body-sm text-text-secondary cursor-pointer">
            <input
              type="checkbox"
              checked={!!avail.willing_to_relocate}
              onChange={(e) => saveAvail({ willing_to_relocate: e.target.checked })}
              className="rounded"
            />
            Willing to relocate
          </label>
        </div>
      </div>

      {/* Find carriers (driver discovery) */}
      <Link
        to="/driver/connect/carriers"
        className="flex items-center gap-4 bg-white rounded-card border border-surface-tertiary p-5 hover:border-accent/40 transition-colors group"
      >
        <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Search className="w-5 h-5 text-emerald-500" />
        </div>
        <div className="flex-1">
          <div className="text-body-sm font-semibold text-text-primary">Find carriers that are hiring</div>
          <div className="text-small text-text-tertiary">Browse verified trucking companies and request to connect.</div>
        </div>
        <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
      </Link>

      {/* My connections (driver side) */}
      <ConnList
        title="My connections"
        icon={Building2}
        rows={mine}
        empty="No connections yet. When a carrier invites you (or you apply), it shows here."
        nameOf={(c) => c.organization?.name || 'Carrier'}
        canAct={(c) => c.status === 'pending_driver_approval'}
        onAccept={(c) => respond(c, true, false)}
        onDecline={(c) => respond(c, false, false)}
        onbHref={(c) => (c.onboarding ? `/driver/connect/onboarding/${c.onboarding.id}` : null)}
      />

      {/* Org connections (carrier side) */}
      {orgConns.length > 0 && (
        <ConnList
          title="Drivers connecting with us"
          icon={UserRound}
          rows={orgConns}
          empty=""
          nameOf={(c) => c.driver?.name || 'Driver'}
          canAct={(c) => c.status === 'pending_carrier_approval'}
          onAccept={(c) => respond(c, true, true)}
          onDecline={(c) => respond(c, false, true)}
          onbHref={(c) => (c.onboarding ? `/o/${orgSlug}/connect/onboarding/${c.onboarding.id}` : null)}
        />
      )}
    </div>
  );
}

function ConnList({ title, icon: Icon, rows, empty, nameOf, canAct, onAccept, onDecline, onbHref }) {
  return (
    <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-tertiary flex items-center gap-2">
        <Icon className="w-4 h-4 text-text-secondary" />
        <span className="text-body-sm font-medium text-text-primary">{title}</span>
      </div>
      {rows.length === 0 ? (
        <div className="p-6 text-center text-body-sm text-text-tertiary">{empty}</div>
      ) : (
        <div className="divide-y divide-surface-tertiary">
          {rows.map((c) => (
            <div key={c.id} className="p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium text-text-primary">{nameOf(c)}</div>
                <div className="text-small text-text-tertiary">
                  {c.initiated_by === 'carrier' ? 'Carrier invited' : 'Driver applied'}
                  {c.onboarding?.status ? ` · onboarding: ${c.onboarding.status}` : ''}
                </div>
              </div>
              <span className={cn('text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border', connTone(c.status))}>
                {CONN_LABEL[c.status] || c.status}
              </span>
              {canAct(c) ? (
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => onAccept(c)}
                    className="px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecline(c)}
                    className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary"
                  >
                    Decline
                  </button>
                </div>
              ) : (
                onbHref && onbHref(c) && (
                  <Link
                    to={onbHref(c)}
                    className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary"
                  >
                    Open onboarding →
                  </Link>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
