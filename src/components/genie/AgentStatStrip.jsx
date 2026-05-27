import { useEffect, useRef, useState } from 'react';
import { Activity, Inbox, Sparkles, Clock } from 'lucide-react';
import agentJobsApi from '../../api/agentJobs.api';
import { cn } from '../../lib/utils';

/**
 * AgentStatStrip — 4 live tiles at the top of the agent page.
 *
 *   [Active today]  [In flight]  [Needs you]  [Last seen]
 *
 * Polls agent_jobs every 8s. `needsCount` is supplied by the parent
 * (it's task-shape-specific — Alex computes it from recent-reviews;
 * Cece from pending review/categorize jobs).
 */
export function AgentStatStrip({ agentSlug, accent, needsCount = 0, className }) {
  const [jobs, setJobs] = useState([]);
  const pollRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const fetchJobs = async () => {
      try {
        const result = await agentJobsApi.listJobs({
          agent: agentSlug,
          minutes: 60 * 24,
          limit: 100
        });
        if (!alive) return;
        setJobs(result.jobs || []);
      } catch {
        // Silent — stats are best-effort.
      }
    };
    fetchJobs();
    pollRef.current = setInterval(fetchJobs, 8000);
    return () => {
      alive = false;
      clearInterval(pollRef.current);
    };
  }, [agentSlug]);

  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const completedToday = jobs.filter(
    (j) => j.status === 'completed' && j.completed_at && now - new Date(j.completed_at).getTime() < dayMs
  ).length;
  const inFlight = jobs.filter((j) => j.status === 'running' || j.status === 'pending').length;
  const lastCompleted = jobs
    .filter((j) => j.status === 'completed' && j.completed_at)
    .map((j) => new Date(j.completed_at).getTime())
    .sort((a, b) => b - a)[0];
  const lastSeen = lastCompleted ? relTime(lastCompleted) : '—';

  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3', className)}>
      <Tile
        Icon={Sparkles}
        label="Active today"
        value={completedToday}
        accent={accent}
        tone="emerald"
      />
      <Tile
        Icon={Activity}
        label="In flight"
        value={inFlight}
        accent={accent}
        tone={inFlight > 0 ? 'cyan' : 'slate'}
        pulse={inFlight > 0}
      />
      <Tile
        Icon={Inbox}
        label="Needs you"
        value={needsCount}
        accent={accent}
        tone={needsCount > 0 ? 'amber' : 'slate'}
      />
      <Tile
        Icon={Clock}
        label="Last seen"
        value={lastSeen}
        accent={accent}
        tone="slate"
        small
      />
    </div>
  );
}

function Tile({ Icon, label, value, tone, pulse, small }) {
  const toneClass = {
    emerald: 'text-emerald-600 bg-emerald-500/10',
    cyan: 'text-cyan-600 bg-cyan-500/10',
    amber: 'text-amber-600 bg-amber-500/10',
    slate: 'text-text-tertiary bg-surface-secondary'
  }[tone] || 'text-text-tertiary bg-surface-secondary';

  return (
    <div className="relative bg-surface-primary border border-surface-tertiary rounded-card px-4 py-3 overflow-hidden">
      <div className="flex items-center gap-2 mb-1.5">
        <div className={cn('w-6 h-6 rounded-full flex items-center justify-center', toneClass)}>
          <Icon className={cn('w-3 h-3', pulse && 'animate-pulse')} />
        </div>
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary font-medium">
          {label}
        </span>
      </div>
      <div className={cn(
        'font-semibold text-text-primary',
        small ? 'text-body-sm' : 'text-headline leading-none'
      )}>
        {value}
      </div>
      {pulse && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-cyan-500 animate-ping" />
      )}
    </div>
  );
}

function relTime(ms) {
  const s = Math.floor((Date.now() - ms) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default AgentStatStrip;
