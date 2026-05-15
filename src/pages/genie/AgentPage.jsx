import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUp, Lock, Sparkles, Settings as SettingsIcon, ArrowRight, Mail, AlertCircle } from 'lucide-react';
import { getAgent, MOCK_ACTIVITY, GENIE_TEAM } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { JobQueuePanel } from '../../components/genie/JobQueuePanel';
import { AlexInbox } from '../../components/genie/AlexInbox';
import { useOrg } from '../../contexts/OrgContext';
import agentPoliciesApi from '../../api/agentPolicies.api';
import orgEmailApi from '../../api/orgEmailConnections.api';
import { cn } from '../../lib/utils';

/**
 * AgentPage — per-agent detail at /o/:slug/genie/agents/:agentSlug.
 *
 * Same component renders for all six agents — content is driven by
 * `genieTeam.js` keyed by the slug param. Top: agent header (avatar,
 * name, role, status, hire CTA if locked). Middle: agent's recent
 * action stream. Bottom: chat-style composer (visual mock — no logic
 * yet; the input is inert).
 *
 * Locked-agent state shows a Hire CTA in place of the composer to keep
 * the page useful even when the user lands on a locked agent's URL.
 */
export default function AgentPage() {
  const { orgSlug, agentSlug } = useParams();
  const navigate = useNavigate();
  const agent = getAgent(agentSlug);

  // MOCK
  const hired = new Set(['genie', 'sage', 'alex']);
  const bundleActive = false;
  const isHired = agent && (bundleActive || hired.has(agent.slug));

  if (!agent) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-title text-text-primary">Agent not found</h1>
        <p className="text-body-sm text-text-secondary mt-2">
          That agent isn't part of the Suite.
        </p>
        <button
          onClick={() => navigate(`/o/${orgSlug}/genie`)}
          className="mt-4 flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to team
        </button>
      </div>
    );
  }

  const actions = MOCK_ACTIVITY.filter((a) => a.agentSlug === agent.slug);

  return (
    <div className="max-w-3xl">
      {/* Back */}
      <Link
        to={`/o/${orgSlug}/genie`}
        className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Team
      </Link>

      {/* Hero */}
      <div className="flex items-start gap-5 mb-8">
        <AgentAvatar agent={agent} size="xl" muted={!isHired} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-headline text-text-primary">{agent.name}</h1>
            {agent.isCeo && (
              <span className="text-[10px] uppercase tracking-wider text-fuchsia-500 font-semibold mt-1">
                CEO
              </span>
            )}
          </div>
          <div className="text-body text-text-secondary">{agent.role}</div>
          <p className="text-body-sm text-text-secondary mt-3 leading-relaxed">
            {agent.tagline}
          </p>
        </div>
      </div>

      {/* Capabilities + Hands */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <section className="bg-surface-primary border border-surface-tertiary rounded-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-3">
            What {agent.name.split(' ')[0]} does
          </div>
          <ul className="space-y-2">
            {agent.capabilities.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-body-sm text-text-secondary">
                <Sparkles className={cn('w-3.5 h-3.5 flex-shrink-0 mt-1', `text-${agent.solidColor}-500`)} />
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-surface-primary border border-surface-tertiary rounded-card p-5">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-3">
            Hands on
          </div>
          <div className="flex flex-wrap gap-1.5">
            {agent.hands.map((h) => (
              <span
                key={h}
                className="px-2.5 py-1 text-body-sm rounded-full bg-surface-secondary text-text-secondary border border-surface-tertiary"
              >
                {h}
              </span>
            ))}
          </div>
        </section>
      </div>

      {/* Capability badges — banner when a task's `requires` (email_send /
          email_read) isn't satisfied by the org's connected integrations.
          Prevents silent agent failures from users not realizing they
          need to connect Gmail first. */}
      {isHired && (
        <CapabilityBadges agentSlug={agent.slug} orgSlug={orgSlug} />
      )}

      {/* Quick link to this agent's policy section in Suite settings.
          Lets the user flip autopilot knobs without leaving Alex's
          context — the settings page auto-expands the matching agent
          via the URL fragment. */}
      {isHired && (
        <Link
          to={`/o/${orgSlug}/genie/settings#${agent.slug}`}
          className="group flex items-center gap-3 mb-4 px-4 py-3 rounded-button bg-surface-primary border border-surface-tertiary hover:border-fuchsia-500/40 transition-colors"
        >
          <SettingsIcon className="w-4 h-4 text-text-secondary flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-body-sm font-medium text-text-primary">
              {agent.name}'s policies
            </div>
            <div className="text-small text-text-tertiary">
              Tune triggers, decision rules, and authority for this org.
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-text-tertiary group-hover:translate-x-0.5 group-hover:text-fuchsia-500 transition-all" />
        </Link>
      )}

      {/* Alex's Inbox — the primary surface. Every load Alex has
          reviewed is one row; expand to act (accept fills, choose on
          conflicts, apply). The TMS load detail page never embeds
          agent work — this is where the user reviews + approves
          everything Alex produces. */}
      {isHired && agent.slug === 'alex' && (
        <AlexInbox className="mb-6" />
      )}

      {/* Worker activity — small secondary panel for debugging.
          Shows operational job status (pending/running/completed/failed)
          for the underlying queue. Most users won't need this; useful
          when reactive triggers aren't firing as expected. */}
      {isHired && (
        <details className="mb-6 bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
          <summary className="cursor-pointer px-5 py-3 text-body-sm text-text-secondary hover:text-text-primary select-none">
            Worker activity
          </summary>
          <JobQueuePanel agentSlug={agent.slug} className="border-0 rounded-none" />
        </details>
      )}

      {/* Activity timeline */}
      <section className="bg-surface-primary border border-surface-tertiary rounded-card mb-6 overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-tertiary">
          <div className="text-body-sm font-medium text-text-primary">
            {agent.name}'s recent actions
          </div>
        </div>
        {actions.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-body-sm text-text-tertiary">
              No activity yet — {agent.name} hasn't shipped anything to your inbox.
            </div>
          </div>
        ) : (
          <div className="divide-y divide-surface-tertiary">
            {actions.map((a) => (
              <div key={a.id} className="p-4">
                <div className="text-body-sm">
                  <span className="text-text-primary font-medium">{a.action}</span>
                  <span className="text-text-secondary"> — {a.summary}</span>
                </div>
                {a.target && (
                  <div className="mt-1 inline-block">
                    <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
                      {a.target}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Composer OR hire CTA */}
      {isHired ? (
        <div className="bg-surface-primary border border-surface-tertiary rounded-card p-3">
          <div className="text-[10px] uppercase tracking-wider text-text-tertiary px-2 pb-2">
            Talk to {agent.name}
          </div>
          <div className="relative rounded-xl bg-surface-secondary border border-surface-tertiary focus-within:border-accent transition-colors">
            <textarea
              rows={2}
              placeholder={`Ask ${agent.name} something...`}
              className="w-full resize-none bg-transparent px-4 py-3 pr-12 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            <button
              type="button"
              aria-label={`Send to ${agent.name}`}
              className={cn(
                'absolute right-2 bottom-2 w-8 h-8 rounded-full text-white',
                'bg-gradient-to-br',
                agent.accent,
                'flex items-center justify-center hover:scale-105 active:scale-95 transition-transform'
              )}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </div>
        </div>
      ) : (
        <Link
          to={`/o/${orgSlug}/genie/hire?agent=${agent.slug}`}
          className={cn(
            'group block bg-surface-primary border border-surface-tertiary rounded-card p-6',
            'hover:border-fuchsia-500/40 transition-colors'
          )}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-surface-secondary flex items-center justify-center flex-shrink-0">
              <Lock className="w-5 h-5 text-text-tertiary" />
            </div>
            <div className="flex-1">
              <div className="text-body font-semibold text-text-primary">
                {agent.name} isn't on your team yet
              </div>
              <div className="text-body-sm text-text-secondary">
                Hire {agent.name} for ${(agent.monthlyPriceCents / 100).toFixed(0)}/mo, or get the full Suite at a discount.
              </div>
            </div>
            <button
              type="button"
              className={cn(
                'px-4 py-2 rounded-button text-white text-body-sm font-medium',
                'bg-gradient-to-br',
                agent.accent,
                'group-hover:scale-[1.03] transition-transform'
              )}
            >
              Hire {agent.name}
            </button>
          </div>
        </Link>
      )}
    </div>
  );
}

/**
 * CapabilityBadges — reads the agent's task manifest, finds any task
 * that declares `requires: ['email_send'|'email_read']`, and shows a
 * banner if the org doesn't have the matching integration connected.
 * Also surfaces "Reconnect Gmail" when the existing connection is in
 * expired state.
 */
function CapabilityBadges({ agentSlug, orgSlug }) {
  const { currentOrg } = useOrg();
  const [needsEmail, setNeedsEmail] = useState(false);
  const [connection, setConnection] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [tasksRes, connsRes] = await Promise.all([
          agentPoliciesApi.getTasks(agentSlug),
          currentOrg?.id
            ? orgEmailApi.listConnections(currentOrg.id)
            : Promise.resolve({ connections: [] })
        ]);
        if (cancelled) return;
        const tasks = tasksRes?.tasks || [];
        const needsEmailNow = tasks.some((t) =>
          (t.requires || []).some((r) => r === 'email_send' || r === 'email_read')
        );
        const activeConn = (connsRes?.connections || []).find((c) => c.status === 'active');
        const expiredConn = (connsRes?.connections || []).find((c) => c.status === 'expired');
        setNeedsEmail(needsEmailNow);
        setConnection(activeConn || expiredConn || null);
      } catch {
        // Silent — don't block the page on a metadata fetch.
      }
    }
    load();
    return () => { cancelled = true; };
  }, [agentSlug, currentOrg?.id]);

  if (!needsEmail) return null;

  // Active connection — small green confirmation pill
  if (connection?.status === 'active') {
    return (
      <div className="mb-4 flex items-center gap-2 px-3 py-2 rounded-button bg-success/8 border border-success/20 text-body-sm text-success">
        <Mail className="w-4 h-4" />
        <span>Email connected as <span className="font-medium">{connection.email_address}</span> — broker notifications work.</span>
      </div>
    );
  }

  // Expired connection — needs reconnect
  if (connection?.status === 'expired') {
    return (
      <Link
        to={`/o/${orgSlug}/settings/integrations`}
        className="mb-4 flex items-center gap-3 px-4 py-3 rounded-button bg-amber-500/10 border border-amber-500/30 text-amber-700 hover:bg-amber-500/15 transition-colors"
      >
        <AlertCircle className="w-4 h-4 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium">Email connection expired</div>
          <div className="text-small">
            {connection.email_address} needs to be reconnected — broker notifications are paused.
          </div>
        </div>
        <ArrowRight className="w-4 h-4 flex-shrink-0" />
      </Link>
    );
  }

  // No connection at all
  return (
    <Link
      to={`/o/${orgSlug}/settings/integrations`}
      className="mb-4 flex items-center gap-3 px-4 py-3 rounded-button bg-fuchsia-500/8 border border-fuchsia-500/30 text-fuchsia-700 hover:bg-fuchsia-500/12 transition-colors"
    >
      <Mail className="w-4 h-4 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium">Connect email to enable broker notifications</div>
        <div className="text-small">
          This agent has tasks that send broker emails. Connect Gmail in Organization → Integrations.
        </div>
      </div>
      <ArrowRight className="w-4 h-4 flex-shrink-0" />
    </Link>
  );
}
