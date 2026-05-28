import { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Sparkles, Loader2 } from 'lucide-react';
import { GENIE_TEAM, getAgent } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { getAgentActivity, getActiveAgents } from '../../api/agents.api';
import { Link } from 'react-router-dom';

/**
 * AiActivityWidget — live feed of the Genie Suite team's recent
 * activity. Fans out across every hired agent's /activity endpoint
 * once on mount + every 8s, merges by timestamp, renders the most
 * recent ~20 with agent avatar, role pill, and action summary.
 *
 * Self-contained — works as a launcher widget on the dashboard
 * AND can be embedded anywhere else if needed.
 */
export function AiActivityWidget() {
  const { orgSlug } = useParams();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const pollRef = useRef(null);

  const fetchFeed = async () => {
    try {
      const res = await getActiveAgents();
      const rows = Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [];
      const slugs = ['genie', ...rows.map((r) => r.agent_slug).filter(Boolean)]
        .filter((s) => s !== 'genie-suite');
      const fetched = await Promise.all(
        slugs.map((slug) =>
          getAgentActivity(slug, { limit: 8 })
            .then((r) => {
              const payload = r?.data ?? r;
              const list = payload?.actions ?? payload ?? [];
              return (Array.isArray(list) ? list : []).map((a) => ({ ...a, _slug: slug }));
            })
            .catch(() => [])
        )
      );
      const merged = fetched
        .flat()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 20);
      setItems(merged);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
    pollRef.current = setInterval(fetchFeed, 8000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug]);

  return (
    <div className="h-full w-full flex flex-col">
      {/* Header — own internal title bar, matches Reminders/Notes
          iCloud tile shape: small gradient icon + bold title + live
          indicator on the right. */}
      <header className="px-5 pt-5 pb-3 flex items-center gap-3 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-body font-semibold text-white truncate">AI team activity</div>
          <div className="text-[11px] text-white/45 truncate">Genie Suite · Live</div>
        </div>
        <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-emerald-400 font-semibold">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Live
        </span>
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-2 sm:px-3">
        {loading && items.length === 0 ? (
          <div className="p-6 flex items-center justify-center">
            <Loader2 className="w-4 h-4 animate-spin text-white/40" />
          </div>
        ) : error ? (
          <div className="p-4 text-small text-rose-400">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState orgSlug={orgSlug} />
        ) : (
          <div className="space-y-1.5 pb-3">
            {items.map((a) => (
              <ActivityRow key={`${a._slug}:${a.id}`} action={a} orgSlug={orgSlug} />
            ))}
          </div>
        )}
      </div>

      <footer className="px-5 py-3 border-t border-white/[0.06] flex-shrink-0">
        <Link
          to={`/o/${orgSlug}/genie/inbox`}
          className="text-[11px] text-fuchsia-400 hover:text-fuchsia-300 inline-flex items-center gap-1"
        >
          Open Genie Inbox →
        </Link>
      </footer>
    </div>
  );
}

function ActivityRow({ action, orgSlug }) {
  const agent = getAgent(action._slug);
  const summary = action.output_data?.summary || humanize(action.action_type);
  const role = (agent?.role || '').split(' ')[0];
  return (
    <Link
      to={`/o/${orgSlug}/genie/agents/${action._slug}`}
      className="block px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors"
    >
      <div className="flex items-start gap-2.5">
        {agent ? (
          <div className="flex-shrink-0">
            <AgentAvatar agent={agent} size="sm" />
          </div>
        ) : (
          <div className="w-7 h-7 rounded-full bg-fuchsia-500/15 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-fuchsia-300" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-body-sm font-semibold text-white">
              {agent?.name?.split(' ')[0] || cap(action._slug)}
            </span>
            {role && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-white/[0.06] text-white/55 uppercase tracking-wider font-semibold">
                {role}
              </span>
            )}
            <span className="text-[10px] text-white/40 ml-auto">
              {relTime(action.created_at)}
            </span>
          </div>
          <div className="text-[11px] sm:text-small text-white/65 leading-snug line-clamp-2 mt-0.5">
            {summary}
          </div>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ orgSlug }) {
  return (
    <div className="px-4 py-6 text-center">
      <div className="flex justify-center gap-1 mb-2">
        {GENIE_TEAM.slice(0, 4).map((a) => (
          <div key={a.slug} className="-mx-1.5">
            <AgentAvatar agent={a} size="sm" muted />
          </div>
        ))}
      </div>
      <div className="text-body-sm text-white/55">
        Your team hasn't shipped anything yet.
      </div>
      <Link
        to={`/o/${orgSlug}/genie/hire`}
        className="inline-block mt-2 text-[11px] text-fuchsia-400 hover:text-fuchsia-300"
      >
        Hire your first agent →
      </Link>
    </div>
  );
}

function relTime(d) {
  if (!d) return '';
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
}

export default AiActivityWidget;
