import { useState, useEffect } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowRight, Lock, Check, Sparkles } from 'lucide-react';
import { GENIE_TEAM, GENIE_BUNDLE } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { getActiveAgents, getAgentActivity, verifyAgentCheckout } from '../../api/agents.api';
import { cn } from '../../lib/utils';

/**
 * TeamPage — landing view for /o/:slug/genie.
 *
 * Hero copy matches the morpro.io/genie marketing voice ("six agents, on
 * shift 24/7"). Below: a 2-3 column grid of agent cards. Each card shows
 * the agent's identity, status (Hired / In Suite / Locked), and their two
 * most recent actions if hired (from the mock activity feed).
 *
 * Hired agents have an "Open thread" CTA → /agents/:slug.
 * Locked agents have a "Hire — $XX/mo" CTA → /hire (highlights that agent).
 */
export default function GeniePageTeam() {
  const { orgSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const basePath = `/o/${orgSlug}/genie`;

  // Real hire state from organization_agents. Genie ships free.
  const [hired, setHired] = useState(new Set(['genie']));
  const [bundleActive, setBundleActive] = useState(false);
  const [recentBySlug, setRecentBySlug] = useState({});
  const [refreshTick, setRefreshTick] = useState(0);

  // Post-checkout reconciliation — bundle redirects land here. Flip
  // the org agents to 'active' immediately even if the webhook hasn't
  // landed yet. session_id-less variants trigger a sweep of recent
  // paid sessions; either way the URL params get stripped after.
  useEffect(() => {
    if (searchParams.get('subscribed') !== 'true') return;
    const raw = searchParams.get('session_id');
    const sessionId = raw && raw !== '{CHECKOUT_SESSION_ID}' ? raw : null;
    let alive = true;
    verifyAgentCheckout(sessionId)
      .catch((e) => console.warn('[TeamPage] checkout verify failed:', e?.response?.data?.error?.message || e.message))
      .finally(() => {
        if (!alive) return;
        const next = new URLSearchParams(searchParams);
        next.delete('subscribed');
        next.delete('session_id');
        setSearchParams(next, { replace: true });
        setRefreshTick((t) => t + 1);
      });
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let alive = true;
    getActiveAgents()
      .then(async (res) => {
        const active = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        const slugs = active.map((r) => r.agent_slug).filter(Boolean);
        if (!alive) return;
        setBundleActive(slugs.includes('genie-suite'));
        setHired(new Set(['genie', ...slugs]));

        const fetchSlugs = [...new Set(['genie', ...slugs])];
        const pairs = await Promise.all(
          fetchSlugs.map((slug) =>
            getAgentActivity(slug, { limit: 2 })
              .then((r) => {
                const payload = r?.data ?? r;
                const list = payload?.actions ?? [];
                return [slug, Array.isArray(list) ? list.slice(0, 2) : []];
              })
              .catch(() => [slug, []])
          )
        );
        if (!alive) return;
        setRecentBySlug(Object.fromEntries(pairs));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [orgSlug, refreshTick]);

  const formatPrice = (cents) => {
    if (!cents) return null;
    return `$${(cents / 100).toFixed(0)}/mo`;
  };

  const recentActionsFor = (slug) => recentBySlug[slug] || [];

  return (
    <div className="max-w-6xl">
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-fuchsia-400 mb-2">
          <Sparkles className="w-3 h-3" />
          Genie Suite · Private Beta · $0
        </div>
        <h1 className="text-headline text-text-primary leading-tight">
          Your team is on shift.
        </h1>
        <p className="text-body text-text-secondary mt-2 max-w-2xl">
          Six AI specialists with real hands across MorPro Direct, NextMS,
          Spotty, LINQ, and AiMechanic. You stay the driver. They run the back office.
        </p>
      </div>

      {/* Bundle CTA strip (only when not bundled and at least one agent locked) */}
      {!bundleActive && GENIE_TEAM.some((a) => !hired.has(a.slug)) && (
        <Link
          to={`${basePath}/hire`}
          className={cn(
            'group flex items-center gap-4 mb-8 p-5 rounded-card border',
            'bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-orange-400/10',
            'border-fuchsia-500/30 hover:border-fuchsia-500/50 transition-colors'
          )}
        >
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-[0_0_30px_-4px_rgba(236,72,153,0.6)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-body font-semibold text-text-primary">
              Hire the whole team — {formatPrice(GENIE_BUNDLE.monthlyPriceCents)}
            </div>
            <div className="text-body-sm text-text-secondary">
              Save {formatPrice(GENIE_BUNDLE.savings)} vs. hiring individually. All six on shift, 24/7.
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-fuchsia-500 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
        </Link>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {GENIE_TEAM.map((agent) => {
          const isHired = bundleActive || hired.has(agent.slug);
          const actions = recentActionsFor(agent.slug);

          return (
            <div
              key={agent.slug}
              className={cn(
                'group bg-surface-primary border rounded-card p-5 flex flex-col transition-shadow',
                isHired
                  ? 'border-surface-tertiary hover:shadow-elevated'
                  : 'border-surface-tertiary opacity-95 hover:opacity-100'
              )}
            >
              {/* Header */}
              <div className="flex items-start gap-4">
                <AgentAvatar agent={agent} size="md" muted={!isHired} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-title-sm text-text-primary truncate">
                      {agent.name}
                    </h3>
                    {agent.isCeo && (
                      <span className="text-[10px] uppercase tracking-wider text-fuchsia-500 font-semibold">
                        CEO
                      </span>
                    )}
                  </div>
                  <div className="text-body-sm text-text-secondary truncate">
                    {agent.role}
                  </div>
                </div>
                <StatusPill isHired={isHired} bundleActive={bundleActive} />
              </div>

              {/* Tagline */}
              <p className="text-body-sm text-text-secondary mt-4 leading-relaxed">
                {agent.tagline}
              </p>

              {/* Recent actions (only when hired) */}
              {isHired && actions.length > 0 && (
                <div className="mt-5 space-y-2 border-t border-surface-tertiary pt-4">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary">
                    Recent
                  </div>
                  {actions.map((a) => (
                    <div key={a.id} className="text-body-sm">
                      <span className="text-text-primary font-medium capitalize">
                        {String(a.action_type || 'action').replace(/_/g, ' ')}
                      </span>
                      {a.output_data?.summary && (
                        <span className="text-text-secondary"> — {a.output_data.summary}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Hands list (only when locked, to sell the value) */}
              {!isHired && (
                <div className="mt-5 border-t border-surface-tertiary pt-4">
                  <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">
                    Hands on
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {agent.hands.map((h) => (
                      <span
                        key={h}
                        className="px-2 py-0.5 text-[11px] rounded-full bg-surface-secondary text-text-secondary border border-surface-tertiary"
                      >
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* CTA */}
              <div className="mt-5 pt-4">
                {isHired ? (
                  <Link
                    to={`${basePath}/agents/${agent.slug}`}
                    className="flex items-center justify-between px-4 py-2.5 rounded-button bg-surface-secondary hover:bg-surface-tertiary text-text-primary text-body-sm font-medium transition-colors"
                  >
                    Open thread
                    <ArrowRight className="w-4 h-4 text-text-secondary group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                ) : (
                  <Link
                    to={`${basePath}/hire?agent=${agent.slug}`}
                    className={cn(
                      'flex items-center justify-center gap-2 px-4 py-2.5 rounded-button text-white text-body-sm font-medium transition-transform hover:scale-[1.02]',
                      'bg-gradient-to-br',
                      agent.accent
                    )}
                  >
                    Hire {agent.name} · {formatPrice(agent.monthlyPriceCents) || 'Free'}
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function StatusPill({ isHired, bundleActive }) {
  if (bundleActive) {
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-fuchsia-500/15 text-fuchsia-600 border border-fuchsia-500/30 flex-shrink-0">
        In Suite
      </span>
    );
  }
  if (isHired) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-success/10 text-success border border-success/20 flex-shrink-0">
        <Check className="w-2.5 h-2.5" />
        Hired
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-surface-tertiary text-text-tertiary flex-shrink-0">
      <Lock className="w-2.5 h-2.5" />
      Not hired
    </span>
  );
}
