import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, Check, Lock, Loader2 } from 'lucide-react';
import { GENIE_TEAM, GENIE_BUNDLE } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import agentsApi from '../../api/agents.api';
import { cn } from '../../lib/utils';

/**
 * HirePage — catalog where the user hires individual agents or the bundle.
 *
 * Two modes (toggle at top):
 *   - Individually : each agent has its own Hire button + price
 *   - As a Suite   : one bundle CTA at $199/mo. Per-agent cards collapse
 *                    their CTAs into "Included" badges.
 *
 * The `?agent=<slug>` query param scrolls the matching card into view and
 * highlights it — used by inline CTAs elsewhere ("Hire Ava" → /hire?agent=ava).
 *
 * Buttons are visual-only. Wiring goes to `POST /v1/agents/:slug/subscribe`
 * (per-agent) or `POST /v1/agents/genie-suite/subscribe` (bundle), both
 * already supported by the existing agentBilling.service.js — just needs
 * the agent_catalog rows seeded backend-side.
 */
export default function HirePage() {
  const [searchParams] = useSearchParams();
  const focusedSlug = searchParams.get('agent');
  const [mode, setMode] = useState('individual'); // 'individual' | 'bundle'
  const [hired, setHired] = useState(new Set());
  const [working, setWorking] = useState(null); // slug currently being hired/cancelled
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Pull the org's currently-active agents so we can render Hired badges
  // + Cancel buttons accurately. ?subscribed=true is what Stripe Checkout
  // redirects back with on success — re-pull then so the new agent shows
  // active without a manual refresh.
  const loadActive = () => {
    setLoading(true);
    agentsApi.getActiveAgents()
      .then((r) => {
        const list = r.data?.data || r.data || [];
        const slugs = new Set(list.map((row) => row.agent_slug || row.slug).filter(Boolean));
        setHired(slugs);
      })
      .catch(() => setHired(new Set()))
      .finally(() => setLoading(false));
  };
  useEffect(() => { loadActive(); }, []);

  // Auto-switch to bundle mode if they're already on the Suite.
  useEffect(() => {
    if (hired.has('genie-suite')) setMode('bundle');
  }, [hired]);

  // Refresh after Checkout returns success.
  useEffect(() => {
    if (searchParams.get('subscribed') === 'true') loadActive();
  }, [searchParams]);

  const hire = async (slug) => {
    setWorking(slug);
    setError(null);
    try {
      const r = await agentsApi.subscribeAgent(slug);
      const url = r.data?.checkout_url || r.data?.data?.checkout_url;
      if (!url) throw new Error('No checkout URL returned');
      // Stripe Checkout in the same tab — they come back via success_url
      // with ?subscribed=true so the activation badge shows immediately.
      window.location.href = url;
    } catch (e) {
      setError(e.response?.data?.error?.message || e.message);
      setWorking(null);
    }
  };

  const cancel = async (slug) => {
    if (!window.confirm(`Cancel ${slug}? Their automations will stop at the end of the current billing period.`)) return;
    setWorking(slug);
    setError(null);
    try {
      await agentsApi.cancelAgent(slug);
      loadActive();
    } catch (e) {
      setError(e.response?.data?.error?.message || e.message);
    } finally {
      setWorking(null);
    }
  };

  const bundleActive = hired.has('genie-suite') || mode === 'bundle';
  const formatPrice = (cents) => `$${(cents / 100).toFixed(0)}/mo`;

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-fuchsia-500 mb-2">
          <Sparkles className="w-3 h-3" />
          Private Beta · $0 for everything
        </div>
        <h1 className="text-headline text-text-primary leading-tight">
          Hire your team
        </h1>
        <p className="text-body text-text-secondary mt-2 max-w-2xl">
          Pick the agents you need now, or get the whole Suite at a discount.
          You can change your team any time.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-button border border-error/30 bg-error/5 text-body-sm text-error">
          {error}
        </div>
      )}

      {/* Mode toggle */}
      <div className="inline-flex items-center bg-surface-primary border border-surface-tertiary rounded-button p-1 mb-8">
        <ModeButton
          active={mode === 'individual'}
          onClick={() => setMode('individual')}
          label="Hire individually"
        />
        <ModeButton
          active={mode === 'bundle'}
          onClick={() => setMode('bundle')}
          label={`Get the Suite · save ${formatPrice(GENIE_BUNDLE.savings)}`}
        />
      </div>

      {/* Bundle hero (when bundle mode) */}
      {mode === 'bundle' && (
        <div
          className={cn(
            'mb-8 p-6 rounded-card border',
            'bg-gradient-to-br from-violet-500/10 via-fuchsia-500/10 to-orange-400/10',
            'border-fuchsia-500/30'
          )}
        >
          <div className="flex items-start gap-5">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center shadow-[0_0_40px_-4px_rgba(236,72,153,0.6)] flex-shrink-0">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-title text-text-primary">
                Genie Suite — the whole team
              </h2>
              <p className="text-body-sm text-text-secondary mt-1.5 max-w-2xl">
                {GENIE_BUNDLE.tagline}. All six on shift 24/7. Save{' '}
                {formatPrice(GENIE_BUNDLE.savings)} vs. hiring individually.
              </p>
              <div className="mt-4 flex items-baseline gap-3">
                <div className="text-headline text-text-primary">
                  {formatPrice(GENIE_BUNDLE.monthlyPriceCents)}
                </div>
                <div className="text-body-sm text-text-tertiary line-through">
                  {formatPrice(
                    GENIE_TEAM.reduce((s, a) => s + a.monthlyPriceCents, 0)
                  )}
                </div>
              </div>
            </div>
            {hired.has('genie-suite') ? (
              <button
                type="button"
                onClick={() => cancel('genie-suite')}
                disabled={working === 'genie-suite'}
                className="px-6 py-3 rounded-button border-2 border-fuchsia-500/40 text-fuchsia-500 text-body font-semibold hover:bg-fuchsia-500/10 transition-colors flex items-center gap-1.5 flex-shrink-0"
              >
                {working === 'genie-suite' && <Loader2 className="w-4 h-4 animate-spin" />}
                Cancel Suite
              </button>
            ) : (
              <button
                type="button"
                onClick={() => hire('genie-suite')}
                disabled={working === 'genie-suite'}
                className={cn(
                  'px-6 py-3 rounded-button text-white text-body font-semibold',
                  'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400',
                  'shadow-[0_0_20px_-2px_rgba(236,72,153,0.5)] hover:scale-[1.03] transition-transform flex-shrink-0',
                  'flex items-center gap-1.5'
                )}
              >
                {working === 'genie-suite' && <Loader2 className="w-4 h-4 animate-spin" />}
                Get the Suite
              </button>
            )}
          </div>
        </div>
      )}

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {GENIE_TEAM.map((agent) => {
          const isHired = hired.has(agent.slug);
          const isFocused = focusedSlug === agent.slug;
          const includedInBundle = bundleActive;
          const price = agent.monthlyPriceCents === 0
            ? 'Free with any agent'
            : formatPrice(agent.monthlyPriceCents);

          return (
            <div
              key={agent.slug}
              id={`agent-${agent.slug}`}
              className={cn(
                'bg-surface-primary border rounded-card p-5 flex flex-col',
                'transition-shadow',
                isFocused
                  ? 'border-fuchsia-500 shadow-[0_0_25px_-5px_rgba(236,72,153,0.4)]'
                  : 'border-surface-tertiary hover:shadow-card'
              )}
            >
              <div className="flex items-start gap-3">
                <AgentAvatar agent={agent} size="md" />
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
                {isHired && !includedInBundle && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-success/10 text-success border border-success/20 flex-shrink-0">
                    <Check className="w-2.5 h-2.5" />
                    Hired
                  </span>
                )}
              </div>

              <p className="text-body-sm text-text-secondary mt-3 leading-relaxed flex-1">
                {agent.tagline}
              </p>

              {/* Capabilities */}
              <ul className="mt-4 space-y-1.5 border-t border-surface-tertiary pt-3">
                {agent.capabilities.slice(0, 3).map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-small text-text-secondary leading-snug">
                    <Check className={cn('w-3 h-3 flex-shrink-0 mt-0.5', `text-${agent.solidColor}-500`)} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-5 pt-4 border-t border-surface-tertiary">
                {includedInBundle ? (
                  <div className="text-center py-2.5 text-body-sm font-medium text-fuchsia-500 bg-fuchsia-500/10 border border-fuchsia-500/30 rounded-button">
                    <Sparkles className="w-3.5 h-3.5 inline mr-1" />
                    Included in Suite
                  </div>
                ) : isHired ? (
                  // Genie comes free (price=0) and doesn't have its own
                  // Stripe sub, so we hide the cancel button for her.
                  agent.monthlyPriceCents === 0 ? (
                    <div className="text-center py-2.5 text-body-sm font-medium text-text-tertiary">
                      <Check className="w-3.5 h-3.5 inline mr-1 text-success" />
                      Always included
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => cancel(agent.slug)}
                      disabled={working === agent.slug}
                      className="w-full py-2.5 rounded-button bg-surface-secondary text-text-secondary text-body-sm font-medium border border-surface-tertiary hover:bg-surface-tertiary transition-colors flex items-center justify-center gap-1.5"
                    >
                      {working === agent.slug && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Cancel hire
                    </button>
                  )
                ) : agent.monthlyPriceCents === 0 ? (
                  // Free agent (Genie) — no Stripe checkout, just a hint.
                  <div className="text-center py-2.5 text-body-sm font-medium text-text-tertiary">
                    Free with any hire
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between mb-3">
                      <div className="text-body-sm text-text-tertiary">From</div>
                      <div className="text-title-sm font-semibold text-text-primary">
                        {price}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => hire(agent.slug)}
                      disabled={working === agent.slug}
                      className={cn(
                        'w-full py-2.5 rounded-button text-white text-body-sm font-medium',
                        'bg-gradient-to-br',
                        agent.accent,
                        'hover:scale-[1.02] transition-transform flex items-center justify-center gap-1.5'
                      )}
                    >
                      {working === agent.slug && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                      Hire {agent.name}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <p className="text-small text-text-tertiary mt-8 text-center max-w-2xl mx-auto">
        Beta access is free for the duration of the Suite's private beta. After
        beta you'll get lifetime founder pricing — never the public rate.
      </p>
    </div>
  );
}

function ModeButton({ active, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-4 py-2 rounded-chip text-body-sm font-medium transition-all',
        active
          ? 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white shadow-sm'
          : 'text-text-secondary hover:text-text-primary'
      )}
    >
      {label}
    </button>
  );
}
