import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, UsersRound, ShieldCheck, Bookmark } from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const TABS = [
  { key: 'pending', label: 'New approvals' },
  { key: 'connected', label: 'Connected' },
  { key: 'saved', label: 'Saved' }
];

const verifPill = (v) =>
  v === 'verified' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : v === 'pending' ? 'text-amber-600 bg-amber-50 border-amber-200'
  : 'text-text-secondary bg-surface-secondary border-surface-tertiary';

export default function CandidatesPage() {
  const { orgSlug } = useParams();
  const [data, setData] = useState({ pending: [], connected: [], saved: [] });
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [busy, setBusy] = useState(null);

  const load = () => {
    setLoading(true);
    connectApi.getCandidates()
      .then((r) => setData(r.data || { pending: [], connected: [], saved: [] }))
      .catch(() => setData({ pending: [], connected: [], saved: [] }))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const respond = async (c, accept) => {
    setBusy(c.id);
    try { await connectApi.respondConnection(c.id, accept, true); load(); }
    finally { setBusy(null); }
  };

  const rows = data[tab] || [];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <UsersRound className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Candidates</h1>
          <p className="text-body-sm text-text-secondary">
            Review applicants, your connected drivers, and saved prospects.
          </p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-surface-tertiary">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={cn(
              'px-4 py-2 text-body-sm font-medium border-b-2 -mb-px transition-colors',
              tab === t.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            )}
          >
            {t.label}
            <span className="ml-1.5 text-[11px] text-text-tertiary">
              {(data[t.key] || []).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-card border border-surface-tertiary p-10 text-center text-body-sm text-text-tertiary">
          {tab === 'pending' && 'No new applications awaiting your approval.'}
          {tab === 'connected' && 'No connected drivers yet.'}
          {tab === 'saved' && 'No saved drivers. Save prospects from Browse drivers.'}
        </div>
      ) : (
        <div className="bg-white rounded-card border border-surface-tertiary divide-y divide-surface-tertiary">
          {rows.map((c) => {
            const uid = c.driver_user_id;
            const name = c.driver?.name || c.name || 'Driver';
            return (
              <div key={c.id || uid} className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-body-sm font-semibold text-accent">
                    {name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-body-sm font-medium text-text-primary truncate">{name}</div>
                  <div className="text-small text-text-tertiary">
                    {tab === 'pending' && (c.initiated_by === 'carrier' ? 'You invited' : 'Driver applied')}
                    {tab === 'connected' && (c.onboarding?.status ? `Onboarding: ${c.onboarding.status}` : 'Connected')}
                    {tab === 'saved' && (c.headline || c.availability_status || 'Saved prospect')}
                  </div>
                </div>
                {(c.verification || c.driver?.verification) && (
                  <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border flex items-center gap-1', verifPill(c.verification))}>
                    <ShieldCheck className="w-3 h-3" /> {c.verification || 'unverified'}
                  </span>
                )}
                <Link
                  to={`/o/${orgSlug}/connect/drivers/${uid}`}
                  className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary"
                >
                  View profile
                </Link>
                {tab === 'pending' && (
                  <div className="flex gap-2">
                    <button type="button" disabled={busy === c.id} onClick={() => respond(c, true)}
                      className="px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90">
                      Accept
                    </button>
                    <button type="button" disabled={busy === c.id} onClick={() => respond(c, false)}
                      className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary">
                      Decline
                    </button>
                  </div>
                )}
                {tab === 'connected' && c.onboarding && (
                  <Link
                    to={`/o/${orgSlug}/connect/onboarding/${c.onboarding.id}`}
                    className="px-3 py-1.5 rounded-button bg-surface-secondary text-text-secondary text-small font-medium hover:bg-surface-tertiary"
                  >
                    Onboarding →
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
