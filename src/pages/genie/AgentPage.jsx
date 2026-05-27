import { useParams, useNavigate, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUp,
  Lock,
  Sparkles,
  ArrowRight,
  Mail,
  AlertCircle
} from 'lucide-react';
import { getAgent } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { AlexInbox } from '../../components/genie/AlexInbox';
import { CeceInbox } from '../../components/genie/CeceInbox';
import { AgentStatStrip } from '../../components/genie/AgentStatStrip';
import { AgentActivityFeed } from '../../components/genie/AgentActivityFeed';
import { AgentTaskQueue } from '../../components/genie/AgentTaskQueue';
import { AgentProfileCard } from '../../components/genie/AgentProfileCard';
import { useOrg } from '../../contexts/OrgContext';
import agentPoliciesApi from '../../api/agentPolicies.api';
import orgEmailApi from '../../api/orgEmailConnections.api';
import { getActiveAgents } from '../../api/agents.api';
import client from '../../api/client';
import { cn } from '../../lib/utils';

/**
 * AgentPage — mission-control view for one agent at
 * /o/:slug/genie/agents/:agentSlug.
 *
 * Layout:
 *   Row 1: Hero (left) + Stat strip (right) on lg+; stacked on smaller.
 *   Row 2: Capability banner (when a required integration is missing).
 *   Row 3: 3-column workspace, equal height, internally scrollable:
 *            [ Inbox ] [ Activity ] [ Profile ]
 *          Agents without an inbox (only Alex + Cece have one) collapse
 *          the workspace to [ Activity ] [ Profile ]. Genie skips the
 *          workspace and gets a chat CTA + profile.
 *
 * Same component renders for all six agents; content is driven by the
 * agent registry. Locked agents show a hire CTA in place of the
 * actionable surfaces.
 */
export default function AgentPage() {
  const { orgSlug, agentSlug } = useParams();
  const navigate = useNavigate();
  const agent = getAgent(agentSlug);

  // Real hire state from organization_agents. Genie ships free.
  const [hiredSlugs, setHiredSlugs] = useState(['genie']);
  useEffect(() => {
    let alive = true;
    getActiveAgents()
      .then((res) => {
        if (!alive) return;
        const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
        setHiredSlugs(['genie', ...rows.map((r) => r.agent_slug).filter(Boolean)]);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [orgSlug]);
  const bundleActive = hiredSlugs.includes('genie-suite');
  const isHired = agent && (bundleActive || hiredSlugs.includes(agent.slug));

  // Needs-action count for the stat strip. Computed per-agent from the
  // same endpoints that drive their inbox component.
  const [needsCount, setNeedsCount] = useState(0);
  useEffect(() => {
    if (!agent?.slug || !isHired) { setNeedsCount(0); return; }
    let alive = true;

    const tick = async () => {
      try {
        if (agent.slug === 'alex') {
          const res = await client.get('/v1/agents/alex/recent-reviews?limit=30');
          const list = (res.data?.data ?? res.data)?.reviews || [];
          const n = list.filter((r) => {
            if (r.task_name === 'check_load_completeness') {
              return (r.ready_count || 0) + (r.conflict_count || 0) > 0;
            }
            if (r.task_name === 'notify_broker_on_status_change') {
              return !r.skipped && r.authority === 'propose' && !r.sent;
            }
            return false;
          }).length;
          if (alive) setNeedsCount(n);
        } else if (agent.slug === 'cece') {
          // Cece's "needs you" = open finance-watch alerts in the
          // last 24h.
          const res = await client.get('/v1/agents/jobs?agent=cece&minutes=1440&limit=40');
          const jobs = (res.data?.data ?? res.data)?.jobs || [];
          const n = jobs.filter(
            (j) =>
              j.status === 'completed' &&
              j.task_name === 'finance_watch' &&
              (j.output_data?.alerts?.length || j.output_data?.output?.alerts?.length || 0) > 0
          ).length;
          if (alive) setNeedsCount(n);
        }
      } catch {
        // Silent — stats are best-effort.
      }
    };

    tick();
    const id = setInterval(tick, 8000);
    return () => { alive = false; clearInterval(id); };
  }, [agent?.slug, isHired]);

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

  const hasInbox = agent.slug === 'alex' || agent.slug === 'cece';

  return (
    <div className="pb-8" style={{ maxWidth: 'min(1700px, 100%)' }}>
      {/* Back */}
      <Link
        to={`/o/${orgSlug}/genie`}
        className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Team
      </Link>

      {/* Hero (with stat strip docked on the right at lg+) ------ */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] gap-4 lg:gap-6 mb-5 items-stretch">
        <AgentHero agent={agent} isHired={isHired} />
        {isHired && (
          <AgentStatStrip
            agentSlug={agent.slug}
            accent={agent.accent}
            needsCount={needsCount}
            className=""
          />
        )}
      </div>

      {/* Capability banner --------------------------------------- */}
      {isHired && <CapabilityBadges agentSlug={agent.slug} orgSlug={orgSlug} />}

      {/* Workspace: 4 equal-height columns, internally scrollable.
          Order: Inbox · Activity · Queue · Profile.
          - sm/md: stacked
          - lg : 2-col grid (rows wrap)
          - xl : 4-col grid (side-by-side) */}
      {isHired && hasInbox && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4 items-stretch mb-5"
          style={{ height: 'min(75vh, 820px)' }}
        >
          {agent.slug === 'alex' && <AlexInbox />}
          {agent.slug === 'cece' && <CeceInbox />}
          <AgentActivityFeed agentSlug={agent.slug} />
          <AgentTaskQueue
            agentSlug={agent.slug}
            agentName={agent.name}
            accent={agent.accent}
            solidColor={agent.solidColor}
          />
          <AgentProfileCard agent={agent} orgSlug={orgSlug} />
        </div>
      )}

      {/* Inboxless hired agents: 3-col Activity + Queue + Profile */}
      {isHired && !hasInbox && agent.slug !== 'genie' && (
        <div
          className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch mb-5"
          style={{ height: 'min(75vh, 820px)' }}
        >
          <AgentActivityFeed agentSlug={agent.slug} />
          <AgentTaskQueue
            agentSlug={agent.slug}
            agentName={agent.name}
            accent={agent.accent}
            solidColor={agent.solidColor}
          />
          <AgentProfileCard agent={agent} orgSlug={orgSlug} />
        </div>
      )}

      {/* Genie: it's not a worker — it talks. Chat CTA + profile. */}
      {isHired && agent.slug === 'genie' && (
        <div
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch mb-5"
          style={{ height: 'min(75vh, 820px)' }}
        >
          <Link
            to={`/o/${orgSlug}/genie/chat`}
            className="group flex flex-col justify-between bg-surface-primary border border-surface-tertiary rounded-card p-6 hover:border-fuchsia-500/40 transition-colors h-full"
          >
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <div className="text-body font-semibold text-text-primary">
                  Chat with {agent.name}
                </div>
                <div className="text-body-sm text-text-secondary">
                  Ask about loads, expenses, this week, or what the team's been doing.
                </div>
              </div>
              <ArrowUp className="w-5 h-5 text-fuchsia-500 rotate-45 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
          <AgentProfileCard agent={agent} orgSlug={orgSlug} />
        </div>
      )}

      {/* Locked agent CTA --------------------------------------- */}
      {!isHired && (
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
 * AgentHero — avatar + name + role + status pill. A subtle accent halo
 * around the avatar plus a live "Working" / "Idle" pill makes the page
 * feel like a real person is on duty.
 */
function AgentHero({ agent, isHired }) {
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (!isHired || !agent?.slug) { setWorking(false); return; }
    let alive = true;
    const check = async () => {
      try {
        const res = await client.get(
          `/v1/agents/jobs?agent=${agent.slug}&status=pending,running&limit=5`
        );
        const jobs = (res.data?.data ?? res.data)?.jobs || [];
        if (alive) setWorking(jobs.length > 0);
      } catch {
        // Silent.
      }
    };
    check();
    const id = setInterval(check, 6000);
    return () => { alive = false; clearInterval(id); };
  }, [agent?.slug, isHired]);

  return (
    <div className="relative flex items-start gap-4 md:gap-5 mb-5">
      <div className="flex-shrink-0 relative">
        <div className={cn(
          'absolute -inset-1 rounded-full blur-md opacity-60 bg-gradient-to-br',
          agent.accent
        )} />
        <div className="relative hidden md:block">
          <AgentAvatar agent={agent} size="xl" muted={!isHired} />
        </div>
        <div className="relative md:hidden">
          <AgentAvatar agent={agent} size="lg" muted={!isHired} />
        </div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <h1 className="text-title md:text-headline text-text-primary">{agent.name}</h1>
          {agent.isCeo && (
            <span className="text-[10px] uppercase tracking-wider text-fuchsia-500 font-semibold mt-1">
              CEO
            </span>
          )}
          {isHired && (
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-medium border',
                working
                  ? 'bg-cyan-500/10 text-cyan-700 border-cyan-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 border-emerald-500/30'
              )}
            >
              <span className={cn(
                'w-1.5 h-1.5 rounded-full',
                working ? 'bg-cyan-500 animate-pulse' : 'bg-emerald-500'
              )} />
              {working ? 'Working' : 'Idle'}
            </span>
          )}
        </div>
        <div className="text-body-sm md:text-body text-text-secondary">{agent.role}</div>
        <p className="hidden md:block text-body-sm text-text-secondary mt-2 leading-relaxed">
          {agent.tagline}
        </p>
      </div>
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
        // Silent.
      }
    }
    load();
    return () => { cancelled = true; };
  }, [agentSlug, currentOrg?.id]);

  if (!needsEmail) return null;

  if (connection?.status === 'active') {
    return (
      <div className="mb-5 flex items-center gap-2 px-3 py-2 rounded-button bg-success/8 border border-success/20 text-body-sm text-success">
        <Mail className="w-4 h-4" />
        <span>Email connected as <span className="font-medium">{connection.email_address}</span> — broker notifications work.</span>
      </div>
    );
  }

  if (connection?.status === 'expired') {
    return (
      <Link
        to={`/o/${orgSlug}/settings/integrations`}
        className="mb-5 flex items-center gap-3 px-4 py-3 rounded-button bg-amber-500/10 border border-amber-500/30 text-amber-700 hover:bg-amber-500/15 transition-colors"
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

  return (
    <Link
      to={`/o/${orgSlug}/settings/integrations`}
      className="mb-5 flex items-center gap-3 px-4 py-3 rounded-button bg-fuchsia-500/8 border border-fuchsia-500/30 text-fuchsia-700 hover:bg-fuchsia-500/12 transition-colors"
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
