import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Sparkles, ArrowRight, Loader2, X, ShieldCheck, Plus, RefreshCw } from 'lucide-react';
import { GENIE_TEAM, GENIE_BUNDLE, getAgent } from '../../../config/genieTeam';
import { AgentAvatar } from '../../genie/AgentAvatar';
import agentsApi from '../../../api/agents.api';

/**
 * AiAgentsBilling — billing-page section listing every AI agent the
 * org has hired (or the Suite bundle if active), with monthly cost,
 * status, and a cancel button. Also surfaces a "hire more" CTA and
 * a quick link to the Genie Suite team page.
 *
 * Reads `organization_agents` via the existing /v1/agents/active
 * endpoint. The "hire" path defers to /genie/hire so we don't have
 * to duplicate the Stripe Checkout wiring.
 */
export function AiAgentsBilling() {
  const { orgSlug } = useParams();
  const [active, setActive] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(null);
  const [error, setError] = useState(null);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const load = () => {
    setLoading(true);
    agentsApi
      .getActiveAgents()
      .then((res) => {
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setActive(rows);
      })
      .catch(() => setActive([]))
      .finally(() => setLoading(false));
  };

  // Sweep Stripe for any paid checkout that hasn't been activated yet.
  // Always idempotent — safe to run on every billing-page visit.
  const sync = async (showResult = true) => {
    setSyncing(true);
    if (showResult) setSyncResult(null);
    try {
      const res = await agentsApi.verifyAgentCheckout(null);
      const data = res?.data ?? res;
      if (showResult) setSyncResult(data);
      // Always refresh the active list — even if nothing was newly
      // activated, this catches state changes from the webhook.
      await new Promise((r) => setTimeout(r, 200));
      load();
    } catch (e) {
      if (showResult) setError(e?.response?.data?.error?.message || e.message);
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    load();
    // Auto-sweep on first mount — cheap insurance against missed
    // webhooks. Silent (no toast/banner) so the page doesn't blink
    // for users with nothing stuck.
    sync(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const bundleActive = active.some((r) => r.agent_slug === 'genie-suite' && r.status === 'active');
  const hiredAgents = active
    .filter((r) => r.status === 'active' && r.agent_slug !== 'genie-suite' && r.agent_slug !== 'genie')
    .map((r) => ({
      ...r,
      meta: getAgent(r.agent_slug)
    }))
    .filter((r) => r.meta);

  const handleCancel = async (slug) => {
    const meta = getAgent(slug);
    if (!window.confirm(`Cancel ${meta?.name || slug}? Their automations stop at the end of the current billing period.`)) return;
    setCancelling(slug);
    setError(null);
    try {
      await agentsApi.cancelAgent(slug);
      await load();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setCancelling(null);
    }
  };

  const monthlyTotal = bundleActive
    ? GENIE_BUNDLE?.monthlyPriceCents || 0
    : hiredAgents.reduce((sum, a) => sum + (a.meta.monthlyPriceCents || 0), 0);

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
      <div className="px-5 py-3 sm:py-4 border-b border-surface-tertiary flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-fuchsia-500 flex-shrink-0" />
          <h3 className="text-body sm:text-subtitle text-text-primary truncate">AI agents</h3>
          {(bundleActive || hiredAgents.length > 0) && (
            <span className="text-small text-text-tertiary tabular-nums">
              · ${(monthlyTotal / 100).toFixed(0)}/mo
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => sync(true)}
            disabled={syncing}
            title="Sync recent Stripe purchases — fixes agents that paid through but didn't activate"
            className="inline-flex items-center gap-1 px-2 py-1.5 rounded-button text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>
          <Link
            to={`/o/${orgSlug}/genie/hire`}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-button text-body-sm text-fuchsia-600 hover:text-fuchsia-700 hover:bg-fuchsia-500/5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Hire</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="px-5 py-2 bg-error/5 border-b border-error/10 text-small text-error">{error}</div>
      )}

      {syncResult?.activated?.length > 0 && (
        <div className="px-5 py-2 bg-success/8 border-b border-success/20 text-small text-success flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5" />
          Activated {syncResult.activated.length} stuck purchase{syncResult.activated.length === 1 ? '' : 's'}:
          {' '}{syncResult.activated.map((a) => a.agent_slug).join(', ')}
        </div>
      )}
      {syncResult && (syncResult.activated?.length || 0) === 0 && syncResult.status === 'done' && (
        <div className="px-5 py-2 bg-surface-secondary/40 border-b border-surface-tertiary text-small text-text-tertiary">
          Already in sync with Stripe.
        </div>
      )}

      {loading ? (
        <div className="p-8 flex items-center justify-center">
          <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
        </div>
      ) : bundleActive ? (
        <BundleRow
          orgSlug={orgSlug}
          memberCount={hiredAgents.length}
          onCancel={() => handleCancel('genie-suite')}
          cancelling={cancelling === 'genie-suite'}
          monthly={GENIE_BUNDLE?.monthlyPriceCents}
        />
      ) : hiredAgents.length === 0 ? (
        <EmptyState orgSlug={orgSlug} />
      ) : (
        <div className="divide-y divide-surface-tertiary">
          {hiredAgents.map((a) => (
            <AgentRow
              key={a.agent_slug}
              agent={a.meta}
              activatedAt={a.activated_at}
              cancelling={cancelling === a.agent_slug}
              onCancel={() => handleCancel(a.agent_slug)}
              orgSlug={orgSlug}
            />
          ))}
          <SuiteUpsellRow orgSlug={orgSlug} />
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent, activatedAt, cancelling, onCancel, orgSlug }) {
  return (
    <div className="px-5 py-3 sm:py-4 flex items-center gap-3 sm:gap-4">
      <AgentAvatar agent={agent} size="sm" />
      <div className="flex-1 min-w-0">
        <Link
          to={`/o/${orgSlug}/genie/agents/${agent.slug}`}
          className="text-body-sm font-medium text-text-primary hover:text-fuchsia-600 transition-colors"
        >
          {agent.name}
        </Link>
        <div className="text-[11px] sm:text-small text-text-tertiary truncate">
          {agent.role}{activatedAt ? ` · since ${formatDate(activatedAt)}` : ''}
        </div>
      </div>
      <div className="text-right flex-shrink-0">
        <div className="text-body-sm font-medium text-text-primary tabular-nums">
          ${(agent.monthlyPriceCents / 100).toFixed(0)}/mo
        </div>
        <button
          type="button"
          onClick={onCancel}
          disabled={cancelling}
          className="inline-flex items-center gap-1 mt-0.5 text-[11px] uppercase tracking-wider text-text-tertiary hover:text-rose-600 disabled:opacity-50 transition-colors"
        >
          {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          Cancel
        </button>
      </div>
    </div>
  );
}

function BundleRow({ orgSlug, memberCount, onCancel, cancelling, monthly }) {
  return (
    <div className="px-5 py-4 sm:py-5">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-body sm:text-subtitle font-semibold text-text-primary">Genie Suite</span>
            <span className="text-[10px] uppercase tracking-wider text-fuchsia-600 font-semibold">All-in</span>
          </div>
          <div className="text-small text-text-secondary mt-0.5">
            Every specialist agent + Genie as your CEO. {memberCount > 0 ? `${memberCount} member${memberCount === 1 ? '' : 's'} active.` : 'Suite-wide bundle.'}
          </div>
          <Link
            to={`/o/${orgSlug}/genie`}
            className="inline-flex items-center gap-1 mt-2 text-body-sm text-fuchsia-600 hover:text-fuchsia-700"
          >
            Open the team <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-body-sm sm:text-body font-semibold text-text-primary tabular-nums">
            ${((monthly || 0) / 100).toFixed(0)}/mo
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={cancelling}
            className="inline-flex items-center gap-1 mt-1 text-[11px] uppercase tracking-wider text-text-tertiary hover:text-rose-600 disabled:opacity-50 transition-colors"
          >
            {cancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
            Cancel suite
          </button>
        </div>
      </div>
    </div>
  );
}

function SuiteUpsellRow({ orgSlug }) {
  if (!GENIE_BUNDLE) return null;
  return (
    <Link
      to={`/o/${orgSlug}/genie/hire`}
      className="block px-5 py-3 bg-gradient-to-r from-violet-500/5 via-fuchsia-500/5 to-orange-400/5 hover:from-violet-500/10 hover:via-fuchsia-500/10 hover:to-orange-400/10 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Sparkles className="w-4 h-4 text-fuchsia-500 flex-shrink-0" />
        <div className="flex-1 text-body-sm text-text-secondary">
          Hire the full Suite for one price — every agent, plus Genie.
        </div>
        <span className="text-body-sm font-medium text-fuchsia-600 flex items-center gap-1">
          See bundle <ArrowRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </Link>
  );
}

function EmptyState({ orgSlug }) {
  // Preview the team so it's clear what's available.
  const preview = (GENIE_TEAM || []).filter((a) => a.slug !== 'genie').slice(0, 5);
  return (
    <div className="p-5 sm:p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex -space-x-2">
          {preview.map((a) => (
            <div key={a.slug} className="ring-2 ring-surface-primary rounded-full">
              <AgentAvatar agent={a} size="sm" muted />
            </div>
          ))}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium text-text-primary">
            No agents hired yet
          </div>
          <div className="text-small text-text-tertiary">
            Hire a specialist or get the full Suite for a discount.
          </div>
        </div>
      </div>
      <Link
        to={`/o/${orgSlug}/genie/hire`}
        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] transition-transform"
      >
        <Plus className="w-3.5 h-3.5" />
        Browse agents
      </Link>
    </div>
  );
}

function formatDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default AiAgentsBilling;
