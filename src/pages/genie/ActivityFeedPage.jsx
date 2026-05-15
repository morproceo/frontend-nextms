import { useState, useMemo } from 'react';
import { Activity, Filter } from 'lucide-react';
import { GENIE_TEAM, MOCK_ACTIVITY, getAgent } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { cn } from '../../lib/utils';

/**
 * ActivityFeedPage — chronological log of what every agent has done.
 *
 * This is THE primary interaction model for the Suite: not chat, but the
 * timeline of agent actions ("4:42 AM — Ava — Bid accepted on Houston →
 * Atlanta. $2,840 net."). Each row is one agent_actions row.
 *
 * Filters: chips at top let the user scope the feed to one agent. "All"
 * resets. Future filters: action type, date range.
 *
 * Mock data lives in genieTeam.js; swap for `GET /v1/agents/activity` once
 * the backend route exists.
 */
export default function ActivityFeedPage() {
  const [filterSlug, setFilterSlug] = useState(null);

  const items = useMemo(() => {
    if (!filterSlug) return MOCK_ACTIVITY;
    return MOCK_ACTIVITY.filter((a) => a.agentSlug === filterSlug);
  }, [filterSlug]);

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <Activity className="w-6 h-6" />
          Activity feed
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Every action your team has taken. Newest first.
        </p>
      </div>

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap mb-6">
        <div className="flex items-center gap-1.5 text-small text-text-tertiary mr-2">
          <Filter className="w-3.5 h-3.5" />
          Filter
        </div>
        <FilterChip
          active={!filterSlug}
          onClick={() => setFilterSlug(null)}
          label="All"
        />
        {GENIE_TEAM.map((agent) => (
          <FilterChip
            key={agent.slug}
            active={filterSlug === agent.slug}
            onClick={() => setFilterSlug(agent.slug)}
            label={agent.name}
            agent={agent}
          />
        ))}
      </div>

      {/* Feed */}
      {items.length === 0 ? (
        <div className="bg-surface-primary border border-surface-tertiary rounded-card p-12 text-center">
          <div className="text-body-sm text-text-tertiary">
            No actions from this agent yet.
          </div>
        </div>
      ) : (
        <div className="bg-surface-primary border border-surface-tertiary rounded-card divide-y divide-surface-tertiary overflow-hidden">
          {items.map((item) => (
            <ActivityRow key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ active, onClick, label, agent }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-body-sm transition-colors',
        active
          ? 'bg-accent text-white'
          : 'bg-surface-primary text-text-secondary hover:bg-surface-tertiary border border-surface-tertiary'
      )}
    >
      {agent && <AgentAvatar agent={agent} size="sm" className="!w-4 !h-4 !text-[8px]" />}
      {label}
    </button>
  );
}

function ActivityRow({ item }) {
  const agent = getAgent(item.agentSlug);
  if (!agent) return null;

  const time = new Date(item.at);
  const relative = formatRelativeTime(time);
  const absolute = time.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });

  return (
    <div className="p-4 flex items-start gap-3 hover:bg-surface-secondary/40 transition-colors">
      <AgentAvatar agent={agent} size="md" />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body-sm font-semibold text-text-primary">
            {agent.name}
          </span>
          <span className="text-small text-text-tertiary">
            {agent.role}
          </span>
          <span className="text-small text-text-tertiary ml-auto" title={absolute}>
            {relative}
          </span>
        </div>

        <div className="mt-1 text-body-sm">
          <span className="text-text-primary font-medium">{item.action}</span>
          <span className="text-text-secondary"> — {item.summary}</span>
        </div>

        {item.target && (
          <div className="mt-1.5 inline-block">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
              {item.target}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function formatRelativeTime(date) {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
