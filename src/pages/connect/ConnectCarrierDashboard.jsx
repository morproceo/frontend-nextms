import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Loader2, Network, Search, UsersRound, ClipboardList, ChevronRight } from 'lucide-react';
import connectApi from '../../api/connect.api';

/**
 * Carrier MorPro Connect home — a thin overview. The real work lives in
 * the Browse / Candidates / Onboarding tabs (good workflow, nothing
 * dumped in one dashboard).
 */
export default function ConnectCarrierDashboard() {
  const { orgSlug } = useParams();
  const base = `/o/${orgSlug}/connect`;
  const [c, setC] = useState(null);
  const [onb, setOnb] = useState(null);

  useEffect(() => {
    connectApi.getCandidates().then((r) => setC(r.data || {})).catch(() => setC({}));
    connectApi.getOnboardings().then((r) => setOnb(r.data?.onboardings || [])).catch(() => setOnb([]));
  }, []);

  const pending = c?.pending?.length ?? null;
  const connected = c?.connected?.length ?? null;
  const saved = c?.saved?.length ?? null;
  const activeOnb = onb
    ? onb.filter((o) => !['hired', 'rejected', 'withdrawn', 'archived'].includes(o.status)).length
    : null;
  const loading = c === null || onb === null;

  const cards = [
    {
      to: `${base}/drivers`, icon: Search, title: 'Browse drivers',
      desc: 'Find verified drivers looking for work and invite them.',
      stat: null
    },
    {
      to: `${base}/candidates`, icon: UsersRound, title: 'Candidates',
      desc: 'Approvals, connected drivers, and saved prospects.',
      stat: pending != null ? `${pending} awaiting approval` : null
    },
    {
      to: `${base}/onboarding`, icon: ClipboardList, title: 'Onboarding',
      desc: 'Collect documents, communicate, and hire.',
      stat: activeOnb != null ? `${activeOnb} in progress` : null
    }
  ];

  return (
    <div className="max-w-4xl mx-auto p-6 lg:p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
          <Network className="w-6 h-6 text-emerald-500" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">MorPro Connect</h1>
          <p className="text-body-sm text-text-secondary">
            Hire from the verified driver network — discover, connect, onboard.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10 text-text-tertiary">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : (
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { label: 'Awaiting approval', value: pending },
            { label: 'Connected drivers', value: connected },
            { label: 'Onboarding', value: activeOnb }
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-card border border-surface-tertiary p-4">
              <div className="text-headline text-text-primary">{s.value ?? 0}</div>
              <div className="text-small text-text-tertiary">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {cards.map(({ to, icon: Icon, title, desc, stat }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-4 bg-white rounded-card border border-surface-tertiary p-5 hover:border-accent/40 transition-colors group"
          >
            <div className="w-11 h-11 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-semibold text-text-primary">{title}</div>
              <div className="text-small text-text-tertiary">{desc}</div>
            </div>
            {stat && <span className="text-small text-text-secondary">{stat}</span>}
            <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:translate-x-0.5 transition-transform" />
          </Link>
        ))}
      </div>
    </div>
  );
}
