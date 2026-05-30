import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Inbox,
  Mail,
  MailOpen,
  Pen,
  RefreshCw,
  Search,
  Star,
  Send,
  Loader2,
  X,
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ChevronRight,
  Sparkles,
  Reply,
  ArrowLeft,
  Activity,
  Filter,
  FileText,
  ExternalLink
} from 'lucide-react';
import inboxApi from '../../api/inbox.api';
import { GENIE_TEAM, getAgent } from '../../config/genieTeam';
import { AgentAvatar } from '../../components/genie/AgentAvatar';
import { getJobNarrative } from '../../utils/agentNarrative';
import { cn } from '../../lib/utils';

/**
 * InboxPage — the Genie team's shared inbox at /o/:slug/genie/inbox.
 *
 * Email-style 3-pane layout:
 *   Left rail  : filter pills (All / Unread / Needs you / per-agent).
 *   Middle pane: thread list — every agent job + every Genie chat
 *                thread becomes one row.
 *   Right pane : preview of the selected thread with task body,
 *                pipeline trace, and per-task actions
 *                (approve, discard, rerun, reply).
 *
 * Data sources: /v1/agents/jobs (no agent filter) + Genie conversations.
 * Unread state is tracked locally in localStorage keyed by item id.
 *
 * The "Reply" composer in the right pane and the "Compose" button at
 * the top both route through Genie's chat endpoint — replies extend
 * an existing conversation, compose starts a fresh one.
 */
export default function InboxPage() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState([]);
  const [threads, setThreads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all | unread | needs | <agent_slug>
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [readMap, setReadMap] = useState(() => loadReadMap());
  const pollRef = useRef(null);

  const fetchData = async () => {
    try {
      const [jobsList, threadsList] = await Promise.all([
        inboxApi.fetchAllJobs({ minutes: 60 * 24 * 14, limit: 200 }),
        inboxApi.fetchGenieThreads().catch(() => [])
      ]);
      setJobs(jobsList);
      setThreads(Array.isArray(threadsList) ? threadsList : []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 8000);
    return () => clearInterval(pollRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgSlug]);

  // Convert raw rows to normalized message objects.
  const items = useMemo(() => {
    const jobItems = jobs.map(jobToMessage);
    const threadItems = threads.map(threadToMessage);
    return [...jobItems, ...threadItems].sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()
    );
  }, [jobs, threads]);

  // Apply filter + search.
  const filteredItems = useMemo(() => {
    let list = items;
    if (filter === 'unread') list = list.filter((m) => !readMap[m.id]);
    else if (filter === 'needs') list = list.filter((m) => m.needsAction);
    else if (filter !== 'all') list = list.filter((m) => m.agentSlug === filter);

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.subject?.toLowerCase().includes(q) ||
          m.preview?.toLowerCase().includes(q) ||
          m.fromName?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, filter, search, readMap]);

  // Counts for the left rail.
  const counts = useMemo(() => {
    const out = { all: items.length, unread: 0, needs: 0 };
    for (const a of GENIE_TEAM) out[a.slug] = 0;
    for (const m of items) {
      if (!readMap[m.id]) out.unread += 1;
      if (m.needsAction) out.needs += 1;
      if (m.agentSlug && out[m.agentSlug] !== undefined) out[m.agentSlug] += 1;
    }
    return out;
  }, [items, readMap]);

  // Selected item + auto-select first when nothing's chosen.
  const selected = filteredItems.find((m) => m.id === selectedId) || null;
  useEffect(() => {
    if (!selected && filteredItems.length > 0) {
      setSelectedId(filteredItems[0].id);
    }
  }, [filter, search, filteredItems, selected]);

  const onOpen = (m) => {
    setSelectedId(m.id);
    if (!readMap[m.id]) {
      const next = { ...readMap, [m.id]: Date.now() };
      setReadMap(next);
      saveReadMap(next);
    }
  };

  const markAllRead = () => {
    const next = { ...readMap };
    for (const m of items) next[m.id] = Date.now();
    setReadMap(next);
    saveReadMap(next);
  };

  return (
    <div className="mx-auto" style={{ maxWidth: 'min(1700px, 100%)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-title text-text-primary flex items-center gap-2">
            <Inbox className="w-5 h-5 text-fuchsia-500" />
            Inbox
          </h1>
          <p className="text-body-sm text-text-secondary">
            Every action from every agent. Reply to start a thread with Genie about anything.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={fetchData}
            className="p-2 rounded-button text-text-tertiary hover:text-text-primary hover:bg-surface-secondary transition-colors"
            aria-label="Refresh inbox"
          >
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </button>
          <button
            type="button"
            onClick={() => setComposeOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 text-white text-body-sm font-medium hover:scale-[1.02] transition-transform"
          >
            <Pen className="w-3.5 h-3.5" />
            Compose
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-3 px-4 py-2 rounded-button bg-error/10 border border-error/20 text-small text-error">
          {error}
        </div>
      )}

      {/* 3-pane layout */}
      <div
        className="grid grid-cols-1 md:grid-cols-[200px_minmax(0,1fr)] lg:grid-cols-[220px_400px_minmax(0,1fr)] gap-0 border border-surface-tertiary rounded-card overflow-hidden bg-surface-primary"
        style={{ height: 'min(82vh, 920px)' }}
      >
        {/* LEFT RAIL — filters ------------------------------------ */}
        <aside className="bg-surface-secondary/40 border-r border-surface-tertiary overflow-y-auto p-3 hidden md:block">
          <FilterGroup label="Mailbox">
            <FilterPill
              icon={Inbox}
              label="All"
              count={counts.all}
              active={filter === 'all'}
              onClick={() => setFilter('all')}
            />
            <FilterPill
              icon={Mail}
              label="Unread"
              count={counts.unread}
              active={filter === 'unread'}
              tone="fuchsia"
              onClick={() => setFilter('unread')}
            />
            <FilterPill
              icon={Star}
              label="Needs you"
              count={counts.needs}
              active={filter === 'needs'}
              tone="amber"
              onClick={() => setFilter('needs')}
            />
          </FilterGroup>

          <FilterGroup label="By agent">
            {GENIE_TEAM.map((a) => (
              <FilterPill
                key={a.slug}
                avatar={a}
                label={a.name.split(' ')[0]}
                sublabel={a.role}
                count={counts[a.slug] || 0}
                active={filter === a.slug}
                onClick={() => setFilter(a.slug)}
              />
            ))}
          </FilterGroup>

          <div className="mt-4 px-1 space-y-2">
            <button
              type="button"
              onClick={markAllRead}
              className="w-full text-left text-small text-text-tertiary hover:text-text-primary px-2 py-1.5 rounded-button hover:bg-surface-secondary transition-colors"
            >
              Mark all as read
            </button>
            <Link
              to={`/o/${orgSlug}/genie/activity`}
              className="flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-primary px-2 py-1.5 rounded-button hover:bg-surface-secondary transition-colors"
            >
              <Activity className="w-3 h-3" />
              Full activity feed
            </Link>
          </div>
        </aside>

        {/* MIDDLE — thread list ----------------------------------- */}
        <section className="border-r border-surface-tertiary flex flex-col min-h-0">
          {/* Search */}
          <div className="px-3 py-2.5 border-b border-surface-tertiary flex items-center gap-2 flex-shrink-0">
            <Search className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search inbox…"
              className="flex-1 bg-transparent text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="text-text-tertiary hover:text-text-primary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading && filteredItems.length === 0 ? (
              <div className="p-8 flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="p-10 text-center">
                <Sparkles className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
                <div className="text-body-sm text-text-secondary">
                  {filter === 'all' ? 'Inbox is empty.' : 'No messages match this filter.'}
                </div>
              </div>
            ) : (
              <div className="divide-y divide-surface-tertiary">
                {filteredItems.map((m) => (
                  <ThreadRow
                    key={m.id}
                    message={m}
                    unread={!readMap[m.id]}
                    selected={selectedId === m.id}
                    onClick={() => onOpen(m)}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* RIGHT — preview --------------------------------------- */}
        <section className="flex flex-col min-h-0 bg-surface-primary">
          {selected ? (
            <ThreadView
              message={selected}
              orgSlug={orgSlug}
              navigate={navigate}
              onActed={fetchData}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-center px-8">
              <div>
                <Inbox className="w-10 h-10 text-text-tertiary mx-auto mb-3" />
                <div className="text-body text-text-secondary">
                  Select a message to preview it.
                </div>
                <div className="text-small text-text-tertiary mt-1">
                  Reply opens a chat thread with Genie about that task.
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Compose modal ------------------------------------------- */}
      {composeOpen && (
        <ComposeModal
          orgSlug={orgSlug}
          onClose={() => setComposeOpen(false)}
          onSent={(conv) => {
            setComposeOpen(false);
            fetchData();
            if (conv?.conversation_id) {
              setSelectedId(`thread:${conv.conversation_id}`);
            }
          }}
        />
      )}
    </div>
  );
}

/* ────────────────────────────── Left rail bits ─────────────────────────── */

function FilterGroup({ label, children }) {
  return (
    <div className="mb-3">
      <div className="text-[10px] uppercase tracking-wider font-semibold text-text-tertiary px-2 mb-1.5">
        {label}
      </div>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function FilterPill({ icon: Icon, avatar, label, sublabel, count, active, tone, onClick }) {
  const toneClass = {
    fuchsia: 'text-fuchsia-700',
    amber: 'text-amber-700'
  }[tone] || 'text-text-primary';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-2 px-2 py-1.5 rounded-button text-body-sm transition-colors text-left',
        active
          ? 'bg-fuchsia-500/10 text-fuchsia-700 font-medium'
          : `hover:bg-surface-secondary ${toneClass}`
      )}
    >
      {avatar ? (
        <div className="scale-75 -mx-1">
          <AgentAvatar agent={avatar} size="sm" />
        </div>
      ) : (
        Icon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />
      )}
      <span className="flex-1 truncate">{label}</span>
      {count > 0 && (
        <span className={cn(
          'text-[10px] font-medium px-1.5 py-0.5 rounded-full',
          active ? 'bg-fuchsia-500/20 text-fuchsia-700' : 'bg-surface-secondary text-text-tertiary'
        )}>
          {count}
        </span>
      )}
    </button>
  );
}

/* ────────────────────────────── Thread row ─────────────────────────────── */

function ThreadRow({ message, unread, selected, onClick }) {
  const agent = message.agentSlug ? getAgent(message.agentSlug) : null;

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full text-left px-3 py-3 transition-colors relative',
        selected
          ? 'bg-fuchsia-500/8'
          : unread
          ? 'bg-surface-primary hover:bg-surface-secondary/40'
          : 'bg-surface-secondary/30 hover:bg-surface-secondary/50'
      )}
    >
      {/* Unread blob */}
      {unread && !selected && (
        <span className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
      )}

      <div className="flex items-start gap-2.5">
        {agent ? (
          <AgentAvatar agent={agent} size="sm" />
        ) : (
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className={cn(
              'text-body-sm truncate',
              unread ? 'font-semibold text-text-primary' : 'text-text-secondary'
            )}>
              {message.fromName}
            </span>
            <span className="text-[10px] text-text-tertiary ml-auto flex-shrink-0">
              {relTime(message.time)}
            </span>
          </div>
          <div className={cn(
            'text-body-sm truncate mt-0.5',
            unread ? 'font-medium text-text-primary' : 'text-text-secondary'
          )}>
            {message.subject}
          </div>
          {message.preview && (
            <div className="text-small text-text-tertiary truncate mt-0.5">
              {message.preview}
            </div>
          )}
          <div className="flex items-center gap-1.5 mt-1.5">
            {message.kind === 'task' && (
              <Badge tone={statusTone(message.status)}>{message.taskLabel}</Badge>
            )}
            {message.kind === 'thread' && (
              <Badge tone="violet">Chat thread</Badge>
            )}
            {message.needsAction && (
              <Badge tone="amber" icon={Star}>Action</Badge>
            )}
            {message.status === 'failed' && (
              <Badge tone="rose" icon={AlertTriangle}>Failed</Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}

function Badge({ children, tone, icon: Icon }) {
  const cls = {
    emerald: 'bg-emerald-500/10 text-emerald-700',
    amber: 'bg-amber-500/10 text-amber-700',
    rose: 'bg-rose-500/10 text-rose-700',
    cyan: 'bg-cyan-500/10 text-cyan-700',
    violet: 'bg-violet-500/10 text-violet-700',
    slate: 'bg-surface-secondary text-text-tertiary'
  }[tone] || 'bg-surface-secondary text-text-tertiary';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider',
      cls
    )}>
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {children}
    </span>
  );
}

/* ────────────────────────────── Right pane (preview) ───────────────────── */

function ThreadView({ message, orgSlug, navigate, onActed }) {
  const agent = message.agentSlug ? getAgent(message.agentSlug) : null;
  const senderEmail = agent
    ? `${agent.slug}@${agent.slug === 'genie' ? 'genie.morpro' : 'team.morpro'}`
    : 'agent@team.morpro';

  return (
    <div className="flex flex-col h-full bg-surface-secondary/30">
      {/* Subject bar — like Gmail's persistent subject line */}
      <div className="px-6 py-3 border-b border-surface-tertiary bg-surface-primary flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <h2 className="text-body font-semibold text-text-primary truncate">
            {message.subject}
          </h2>
          {message.kind === 'task' && (
            <Badge tone={statusTone(message.status)}>{message.taskLabel}</Badge>
          )}
          {message.kind === 'thread' && <Badge tone="violet">Thread</Badge>}
          {message.needsAction && <Badge tone="amber" icon={Star}>Action</Badge>}
        </div>
      </div>

      {/* Scrollable email body region ----------------------------- */}
      <div className="flex-1 overflow-y-auto">
        {message.kind === 'task' && (
          <EmailMessage
            agent={agent}
            senderEmail={senderEmail}
            message={message}
          />
        )}
        {message.kind === 'thread' && (
          <ThreadMessages
            conversationId={message.threadId}
            agent={agent}
            senderEmail={senderEmail}
            message={message}
          />
        )}
      </div>

      {/* Action bar */}
      <div className="border-t border-surface-tertiary bg-surface-primary flex-shrink-0">
        <ActionBar
          message={message}
          orgSlug={orgSlug}
          navigate={navigate}
          onActed={onActed}
        />
      </div>
    </div>
  );
}

/**
 * EmailMessage — one task rendered as a single email letter:
 * sender row, subject context, narrative body, signature, and
 * collapsible "attachments" with the structured detail.
 */
function EmailMessage({ agent, senderEmail, message }) {
  const job = message.raw;
  const out = job?.output_data || {};
  const data = out.output || out;
  const narrative = message.narrative || message.preview || '';
  const signOff = agent?.name?.split(' ')[0] || message.fromName;

  // Build the list of "attachments" — task-specific detail panels +
  // pipeline trace + raw output fallback.
  const attachments = buildAttachments(job, data, message);

  return (
    <article className="mx-4 my-4 md:mx-6 md:my-5 bg-surface-primary border border-surface-tertiary rounded-card shadow-sm overflow-hidden">
      {/* Sender row — Gmail-style */}
      <EmailSenderRow
        agent={agent}
        senderEmail={senderEmail}
        time={message.time}
        message={message}
      />

      {/* Letter body */}
      <div className="px-5 md:px-7 py-5 md:py-6 border-t border-surface-tertiary bg-surface-primary">
        {narrative ? (
          <p className="text-body text-text-primary leading-[1.7] whitespace-pre-wrap">
            {narrative}
          </p>
        ) : (
          <p className="text-body-sm text-text-tertiary italic">
            (No message body for this task.)
          </p>
        )}

        {/* Signature */}
        <div className="mt-6 pt-4 border-t border-dashed border-surface-tertiary text-body-sm text-text-secondary">
          <div>— {signOff}</div>
          {agent?.role && (
            <div className="text-small text-text-tertiary">
              {agent.role}{agent.isCeo ? ' · CEO' : ''}
            </div>
          )}
        </div>

        {/* Error pill — folded into the letter when failed */}
        {job?.status === 'failed' && job?.error_message && (
          <div className="mt-5 px-3 py-2 rounded-button bg-rose-500/8 border border-rose-500/20 text-small text-rose-700 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Task failed</div>
              <div>{job.error_message}</div>
            </div>
          </div>
        )}
      </div>

      {/* Attachments — collapsible details */}
      {attachments.length > 0 && (
        <div className="border-t border-surface-tertiary bg-surface-secondary/30">
          <div className="px-5 md:px-7 py-3 text-[10px] uppercase tracking-wider text-text-tertiary font-semibold">
            Attachments · {attachments.length}
          </div>
          <div className="px-3 md:px-5 pb-4 space-y-2">
            {attachments.map((a, i) => (
              <Attachment key={i} icon={a.icon} label={a.label} hint={a.hint} defaultOpen={a.defaultOpen}>
                {a.body}
              </Attachment>
            ))}
          </div>
        </div>
      )}

      {/* Metadata footer */}
      <footer className="px-5 md:px-7 py-3 border-t border-surface-tertiary bg-surface-secondary/40 flex items-center justify-between text-[10px] uppercase tracking-wider text-text-tertiary">
        <span>Triggered by {job?.triggered_by || 'manual'}</span>
        <span title={new Date(message.time).toLocaleString()}>
          {new Date(message.time).toLocaleString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric',
            hour: 'numeric', minute: '2-digit'
          })}
        </span>
      </footer>
    </article>
  );
}

function EmailSenderRow({ agent, senderEmail, time, message }) {
  return (
    <div className="px-5 md:px-7 py-4 flex items-start gap-3">
      {agent ? (
        <AgentAvatar agent={agent} size="md" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="text-body font-semibold text-text-primary">
            {message.fromName}
          </span>
          <span className="text-small text-text-tertiary font-mono truncate">
            &lt;{senderEmail}&gt;
          </span>
          <span
            className="text-small text-text-tertiary ml-auto flex-shrink-0"
            title={new Date(time).toLocaleString()}
          >
            {new Date(time).toLocaleString(undefined, {
              month: 'short', day: 'numeric',
              hour: 'numeric', minute: '2-digit'
            })}
          </span>
        </div>
        <div className="text-small text-text-tertiary mt-0.5">
          to <span className="text-text-secondary">me</span>
          {message.fromRole && (
            <span className="ml-2 text-text-tertiary">· {message.fromRole}</span>
          )}
        </div>
        {message.targetType && message.targetId && (
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5">
              {message.targetType} · {String(message.targetId).slice(0, 8)}
            </span>
            {message.deepLink && (
              <Link
                to={message.deepLink}
                className="text-small text-fuchsia-600 hover:text-fuchsia-700 inline-flex items-center gap-1"
              >
                Open {message.targetType}
                <ExternalLink className="w-3 h-3" />
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Attachment — collapsible card under "Attachments" section.
 * Mimics the way Gmail / Outlook show file chips that expand.
 */
function Attachment({ icon, label, hint, defaultOpen = false, children }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-button overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-surface-secondary/40 transition-colors text-left"
      >
        <span className="w-7 h-7 rounded-md bg-surface-secondary flex items-center justify-center flex-shrink-0">
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-body-sm font-medium text-text-primary truncate">
            {label}
          </span>
          {hint && (
            <span className="block text-[10px] text-text-tertiary truncate">{hint}</span>
          )}
        </span>
        <ChevronRight
          className={cn(
            'w-4 h-4 text-text-tertiary transition-transform',
            open && 'rotate-90'
          )}
        />
      </button>
      {open && (
        <div className="border-t border-surface-tertiary px-3 py-3 bg-surface-secondary/30">
          {children}
        </div>
      )}
    </div>
  );
}

function buildAttachments(job, data, message) {
  const items = [];
  if (!job) return items;

  if (job.task_name === 'check_load_completeness') {
    items.push({
      icon: <FileText className="w-3.5 h-3.5 text-emerald-600" />,
      label: 'Findings',
      hint: findingsHint(data),
      defaultOpen: message.needsAction,
      body: <CheckLoadDetail data={data} />
    });
  }
  if (job.task_name === 'notify_broker_on_status_change') {
    const email = data?.drafted_email || {};
    if (email.body || email.subject) {
      items.push({
        icon: <MailOpen className="w-3.5 h-3.5 text-fuchsia-600" />,
        label: 'Drafted email',
        hint: email.to ? `To ${email.to}` : null,
        defaultOpen: true,
        body: <NotifyBrokerDetail data={data} message={message} />
      });
    }
  }
  if (job.task_name === 'categorize_expense' && (data?.category || data?.reasoning)) {
    items.push({
      icon: <Filter className="w-3.5 h-3.5 text-emerald-600" />,
      label: 'Categorization',
      hint: data.category || null,
      body: <CategorizeExpenseDetail data={data} />
    });
  }
  if (job.task_name === 'generate_invoice_for_load' && (data?.invoice_number || data?.total_cents != null)) {
    items.push({
      icon: <FileText className="w-3.5 h-3.5 text-emerald-600" />,
      label: 'Invoice',
      hint: data.invoice_number || null,
      body: <InvoiceDetail data={data} />
    });
  }
  if (job.task_name === 'finance_watch' && (data?.alerts?.length || 0) > 0) {
    items.push({
      icon: <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />,
      label: `${data.alerts.length} finance alert${data.alerts.length === 1 ? '' : 's'}`,
      defaultOpen: true,
      body: <FinanceWatchDetail data={data} />
    });
  }

  // Raw output fallback when nothing matched but there's still data worth seeing.
  if (items.length === 0 && data && Object.keys(data).filter((k) => k !== 'narrative').length > 0) {
    items.push({
      icon: <FileText className="w-3.5 h-3.5 text-text-tertiary" />,
      label: 'Raw output',
      body: (
        <pre className="text-small text-text-secondary font-mono whitespace-pre-wrap max-h-64 overflow-auto">
{JSON.stringify(stripNarrative(data), null, 2)}
        </pre>
      )
    });
  }

  // Pipeline trace as the last attachment — like an audit log.
  items.push({
    icon: <Activity className="w-3.5 h-3.5 text-text-tertiary" />,
    label: 'How this happened',
    hint: '5-stage pipeline trace',
    body: <PipelineTrace job={job} />
  });

  return items;
}

function findingsHint(data) {
  const parts = [];
  const ready = data?.ready_to_apply?.length || 0;
  const conflicts = data?.conflicts?.length || 0;
  const missing = data?.missing_fields?.length || 0;
  if (ready) parts.push(`${ready} ready`);
  if (conflicts) parts.push(`${conflicts} conflict${conflicts > 1 ? 's' : ''}`);
  if (missing) parts.push(`${missing} missing`);
  return parts.length ? parts.join(' · ') : null;
}

function stripNarrative(data) {
  const { narrative, ...rest } = data || {};
  return rest;
}

/**
 * ThreadMessages — chat thread rendered as a stack of email-like
 * messages (you + Genie alternating), each in its own letter card.
 */
function ThreadMessages({ conversationId, agent, senderEmail, message }) {
  const [thread, setThread] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    inboxApi
      .fetchGenieThread(conversationId)
      .then((t) => {
        if (alive) { setThread(t); setError(null); }
      })
      .catch((err) => {
        if (alive) setError(err?.response?.data?.error?.message || err.message);
      })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [conversationId]);

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-text-tertiary animate-spin" />
      </div>
    );
  }
  if (error) {
    return <div className="px-5 py-4 text-small text-error">{error}</div>;
  }
  const messages = thread?.messages || thread?.agent_messages || [];
  if (!messages.length) {
    return (
      <div className="mx-4 my-4 md:mx-6 md:my-5 bg-surface-primary border border-surface-tertiary rounded-card p-8 text-center text-body-sm text-text-tertiary">
        Empty thread — say something below to start the conversation.
      </div>
    );
  }

  return (
    <div className="px-4 md:px-6 py-4 md:py-5 space-y-3">
      {messages.map((m, i) => {
        const isUser = m.role === 'user' || m.role === 'human';
        return (
          <article
            key={m.id || i}
            className={cn(
              'border rounded-card overflow-hidden shadow-sm',
              isUser
                ? 'bg-fuchsia-500/[0.04] border-fuchsia-500/20'
                : 'bg-surface-primary border-surface-tertiary'
            )}
          >
            <div className="px-4 py-3 flex items-center gap-2 border-b border-current/10">
              {isUser ? (
                <div className="w-8 h-8 rounded-full bg-fuchsia-500/15 flex items-center justify-center text-fuchsia-700 text-body-sm font-semibold">
                  Me
                </div>
              ) : agent ? (
                <AgentAvatar agent={agent} size="sm" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-text-primary">
                  {isUser ? 'You' : message.fromName || 'Genie'}
                </div>
                {!isUser && (
                  <div className="text-[10px] text-text-tertiary font-mono">
                    &lt;{senderEmail}&gt;
                  </div>
                )}
              </div>
              {m.created_at && (
                <span className="text-small text-text-tertiary" title={new Date(m.created_at).toLocaleString()}>
                  {relTime(m.created_at)}
                </span>
              )}
            </div>
            <div className="px-4 py-3 text-body-sm text-text-primary leading-[1.7] whitespace-pre-wrap">
              {m.content || m.body || m.message}
            </div>
          </article>
        );
      })}
    </div>
  );
}

function CheckLoadDetail({ data }) {
  const ready = data?.ready_to_apply || [];
  const conflicts = data?.conflicts || [];
  const missing = data?.missing_fields || [];
  if (!ready.length && !conflicts.length && !missing.length) return null;
  return (
    <Block label="Findings">
      <div className="space-y-2">
        {ready.length > 0 && (
          <div className="text-body-sm text-emerald-700">
            <span className="font-semibold">{ready.length} ready to apply</span>
            {' — '}
            {ready.slice(0, 4).map((r) => prettyField(r.field)).join(', ')}
            {ready.length > 4 && '…'}
          </div>
        )}
        {conflicts.length > 0 && (
          <div className="text-body-sm text-amber-700">
            <span className="font-semibold">{conflicts.length} conflict{conflicts.length > 1 ? 's' : ''}</span>
            {' — '}
            {conflicts.slice(0, 4).map((c) => prettyField(c.field)).join(', ')}
          </div>
        )}
        {missing.length > 0 && (
          <div className="text-body-sm text-text-tertiary">
            <span className="font-semibold">{missing.length} missing</span>
            {' — '}
            {missing.slice(0, 5).map((m) => m.label || prettyField(m.field)).join(', ')}
          </div>
        )}
      </div>
    </Block>
  );
}

function NotifyBrokerDetail({ data, message }) {
  const email = data?.drafted_email || message.raw?.output_data?.drafted_email || {};
  if (!email.body && !email.subject) return null;
  return (
    <Block label="Drafted email">
      <div className="bg-surface-secondary border border-surface-tertiary rounded-button px-3 py-2.5 space-y-1.5">
        <KV label="To" value={email.to} mono />
        <KV label="Subject" value={email.subject} bold />
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mt-2">Body</div>
        <pre className="text-body-sm text-text-primary whitespace-pre-wrap font-sans">
{email.body}
        </pre>
      </div>
    </Block>
  );
}

function CategorizeExpenseDetail({ data }) {
  if (!data?.category && !data?.reasoning) return null;
  return (
    <Block label="Categorization">
      <KV label="Category" value={data.category} bold />
      {data.confidence && <KV label="Confidence" value={data.confidence} />}
      {data.reasoning && <KV label="Reasoning" value={data.reasoning} multiline />}
    </Block>
  );
}

function InvoiceDetail({ data }) {
  if (!data?.invoice_number && data?.total_cents == null) return null;
  return (
    <Block label="Invoice">
      <KV label="Number" value={data.invoice_number} mono />
      {data.total_cents != null && (
        <KV label="Total" value={`$${(data.total_cents / 100).toLocaleString()}`} bold />
      )}
    </Block>
  );
}

function FinanceWatchDetail({ data }) {
  const alerts = data?.alerts || [];
  if (!alerts.length) return null;
  return (
    <Block label="Alerts">
      <div className="space-y-1.5">
        {alerts.map((a, i) => (
          <div key={i} className="flex items-start gap-2 text-body-sm text-text-secondary">
            <AlertTriangle className="w-3 h-3 text-amber-500 mt-1 flex-shrink-0" />
            <span>{a.message || a.summary || JSON.stringify(a)}</span>
          </div>
        ))}
      </div>
    </Block>
  );
}

function PipelineTrace({ job }) {
  const stages = [
    { key: 'gather', label: 'Gather', done: !!job?.input_data },
    { key: 'reason', label: 'Reason', done: !!job?.started_at },
    { key: 'gate',   label: 'Gate',   done: job?.status !== 'pending' && job?.status !== 'running' },
    { key: 'act',    label: 'Act',    done: job?.status === 'completed' && !!job?.output_data },
    { key: 'audit',  label: 'Audit',  done: job?.status === 'completed' }
  ];
  return (
    <div className="flex items-center gap-1">
      {stages.map((s, i) => (
        <div key={s.key} className="flex items-center flex-1">
          <div className={cn(
            'flex items-center gap-1 px-2 py-1 rounded-full text-[10px] uppercase tracking-wider font-medium',
            s.done
              ? job?.status === 'failed' && i === stages.length - 1
                ? 'bg-rose-500/10 text-rose-600'
                : 'bg-emerald-500/10 text-emerald-600'
              : 'bg-surface-secondary text-text-tertiary'
          )}>
            <span className={cn('w-1.5 h-1.5 rounded-full', s.done ? 'bg-current' : 'bg-text-tertiary/40')} />
            {s.label}
          </div>
          {i < stages.length - 1 && (
            <div className={cn('h-px flex-1 mx-1', s.done && stages[i + 1].done ? 'bg-emerald-500/40' : 'bg-surface-tertiary')} />
          )}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────── Action bar ─────────────────────────────── */

function ActionBar({ message, orgSlug, navigate, onActed }) {
  const [busy, setBusy] = useState(false);
  const [replyOpen, setReplyOpen] = useState(message.kind === 'thread');
  const [reply, setReply] = useState('');
  const [error, setError] = useState(null);

  const job = message.raw;
  const isDraft = job?.task_name === 'notify_broker_on_status_change' && message.needsAction;
  const canRerun =
    (job?.task_name === 'check_load_completeness' && !!job?.target_id) ||
    job?.status === 'failed';

  const onApprove = async () => {
    setBusy(true); setError(null);
    try {
      await inboxApi.approveNotification(job.id);
      await onActed?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };
  const onDiscard = async () => {
    if (!confirm('Discard this draft? It will not be sent.')) return;
    setBusy(true); setError(null);
    try {
      await inboxApi.discardNotification(job.id);
      await onActed?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };
  const onRerun = async () => {
    if (!job?.target_id) return;
    setBusy(true); setError(null);
    try {
      await inboxApi.rerunAlexCheck(job.target_id);
      await onActed?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  const onSendReply = async () => {
    const body = reply.trim();
    if (!body) return;
    setBusy(true); setError(null);
    try {
      if (message.kind === 'thread') {
        await inboxApi.replyToThread(message.threadId, body);
      } else {
        // Reply to a task → start a new Genie thread referencing it.
        const subject = message.subject;
        const prefix = `Re: ${subject}\n\n`;
        await inboxApi.composeNew(prefix + body);
      }
      setReply('');
      setReplyOpen(message.kind === 'thread');
      await onActed?.();
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="px-5 py-3 space-y-2">
      {error && (
        <div className="text-small text-error flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" /> {error}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {isDraft && (
          <>
            <button
              type="button"
              onClick={onApprove}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] transition-transform disabled:opacity-50"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Approve &amp; send
            </button>
            <button
              type="button"
              onClick={onDiscard}
              disabled={busy}
              className="flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium bg-surface-secondary text-text-secondary hover:bg-surface-tertiary disabled:opacity-50"
            >
              <X className="w-3.5 h-3.5" />
              Discard
            </button>
          </>
        )}
        {canRerun && (
          <button
            type="button"
            onClick={onRerun}
            disabled={busy}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium bg-surface-secondary text-text-secondary hover:bg-surface-tertiary disabled:opacity-50"
          >
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            Rerun
          </button>
        )}
        {!replyOpen && (
          <button
            type="button"
            onClick={() => setReplyOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-button text-body-sm font-medium bg-surface-secondary text-text-secondary hover:bg-surface-tertiary"
          >
            <Reply className="w-3.5 h-3.5" />
            Reply to Genie
          </button>
        )}
      </div>

      {/* Reply composer */}
      {replyOpen && (
        <div className="border border-surface-tertiary rounded-button bg-surface-primary overflow-hidden">
          <div className="px-3 py-1.5 border-b border-surface-tertiary text-[10px] uppercase tracking-wider text-text-tertiary flex items-center justify-between">
            <span>
              {message.kind === 'thread' ? 'Reply to Genie' : `Reply to Genie · Re: ${message.subject}`}
            </span>
            <button
              type="button"
              onClick={() => setReplyOpen(false)}
              aria-label="Close reply"
              className="text-text-tertiary hover:text-text-primary"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          <textarea
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                onSendReply();
              }
            }}
            placeholder="Type your message…"
            className="w-full resize-none bg-transparent px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
          />
          <div className="px-3 pb-2 flex items-center justify-between">
            <span className="text-[10px] text-text-tertiary">⌘↵ to send</span>
            <button
              type="button"
              onClick={onSendReply}
              disabled={busy || !reply.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-button text-body-sm font-medium text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] transition-transform disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ────────────────────────────── Compose modal ──────────────────────────── */

function ComposeModal({ orgSlug, onClose, onSent }) {
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  // Lock background scroll while open + close on Escape.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e) => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const send = async () => {
    const b = body.trim();
    if (!b) return;
    setBusy(true); setError(null);
    try {
      const fullBody = subject.trim() ? `${subject.trim()}\n\n${b}` : b;
      const result = await inboxApi.composeNew(fullBody);
      onSent?.(result);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  // Portal to document.body so the modal isn't trapped inside an
  // ancestor with a transform (which breaks position:fixed) — the
  // app shell has one, which clipped this modal before.
  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end md:items-center justify-center p-0 md:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      {/* Backdrop — its own element so the modal panel sits on top
          and never inherits its semi-transparent fill. */}
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" />

      <div
        className="relative bg-surface-primary rounded-t-card md:rounded-card border border-surface-tertiary w-full max-w-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-3 border-b border-surface-tertiary flex items-center justify-between bg-gradient-to-r from-violet-500/10 via-fuchsia-500/10 to-orange-400/10">
          <div className="flex items-center gap-2">
            <Pen className="w-4 h-4 text-fuchsia-500" />
            <span className="text-body-sm font-medium text-text-primary">New message to Genie</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="text-text-tertiary hover:text-text-primary">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="p-5 space-y-3 bg-surface-primary">
          <div className="text-body-sm text-text-secondary flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary w-12">To</span>
            <span className="font-medium text-text-primary">Genie · CEO</span>
            <span className="text-text-tertiary">(can pull in any teammate)</span>
          </div>
          <div className="flex items-center gap-2 border-b border-surface-tertiary pb-2">
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary w-12">Subject</span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject (optional)"
              className="flex-1 bg-transparent text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            />
          </div>
          <textarea
            rows={8}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                send();
              }
            }}
            placeholder="What do you want Genie to look into?"
            className="w-full resize-none bg-transparent text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none"
            autoFocus
          />
          {error && (
            <div className="text-small text-error flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> {error}
            </div>
          )}
        </div>
        <footer className="px-5 py-3 border-t border-surface-tertiary bg-surface-secondary/40 flex items-center justify-between">
          <span className="text-[10px] text-text-tertiary">⌘↵ to send</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-button text-body-sm text-text-secondary hover:text-text-primary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={send}
              disabled={busy || !body.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-button text-body-sm font-medium text-white bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02] transition-transform disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              Send to Genie
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}

/* ────────────────────────────── Helpers ────────────────────────────────── */

function Block({ label, children }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-1.5">
        {label}
      </div>
      {children}
    </div>
  );
}

function KV({ label, value, bold, mono, multiline }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-body-sm">
      <span className="text-[10px] uppercase tracking-wider text-text-tertiary w-16 flex-shrink-0 mt-1">
        {label}
      </span>
      <span className={cn(
        'flex-1 min-w-0 text-text-primary',
        bold && 'font-semibold',
        mono && 'font-mono',
        multiline && 'whitespace-pre-wrap'
      )}>
        {value}
      </span>
    </div>
  );
}

function hasDetailRenderer(taskName) {
  return [
    'check_load_completeness',
    'notify_broker_on_status_change',
    'categorize_expense',
    'generate_invoice_for_load',
    'finance_watch'
  ].includes(taskName);
}

function statusTone(status) {
  if (status === 'completed') return 'emerald';
  if (status === 'failed') return 'rose';
  if (status === 'running') return 'cyan';
  if (status === 'pending') return 'amber';
  return 'slate';
}

function prettyField(f) {
  return (f || '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function jobToMessage(job) {
  const agent = getAgent(job.agent_slug);
  const fromName = agent?.name || cap(job.agent_slug);
  const fromRole = agent?.role || null;
  const subject = subjectForJob(job);
  const out = job.output_data || {};
  const data = out.output || out;
  // Narrative is the agent's first-person message — used for both the
  // row preview and the email body.
  const narrative = getJobNarrative(job);
  const preview = narrative || out.summary || data?.summary || (job.error_message ? `Error: ${job.error_message}` : '');
  const needsAction =
    job.status === 'failed' ||
    (job.task_name === 'notify_broker_on_status_change' &&
      !out.sent && !out.skipped &&
      (out.authority === 'propose' || data?.authority === 'propose'));
  const deepLink = buildDeepLink(job);

  return {
    id: `job:${job.id}`,
    kind: 'task',
    agentSlug: job.agent_slug,
    fromName,
    fromRole,
    subject,
    preview,
    narrative,
    time: job.completed_at || job.created_at,
    status: job.status,
    taskLabel: humanize(job.task_name),
    targetType: job.target_type,
    targetId: job.target_id,
    deepLink,
    needsAction: !!needsAction,
    raw: job
  };
}

function threadToMessage(thread) {
  const subject = thread.title || firstLine(thread.last_message || thread.preview) || 'Chat with Genie';
  const preview = thread.preview || thread.last_message || '';
  return {
    id: `thread:${thread.id || thread.conversation_id}`,
    kind: 'thread',
    threadId: thread.id || thread.conversation_id,
    agentSlug: 'genie',
    fromName: 'Genie',
    fromRole: 'CEO',
    subject,
    preview,
    time: thread.updated_at || thread.created_at,
    status: 'completed',
    needsAction: false,
    raw: thread
  };
}

function subjectForJob(job) {
  const task = job.task_name;
  const data = job.output_data?.output || job.output_data || {};
  const ref = data?.load?.reference_number || data?.reference_number;
  if (task === 'check_load_completeness') {
    return ref ? `Load ${ref} reviewed` : `Load completeness check`;
  }
  if (task === 'notify_broker_on_status_change') {
    return ref ? `Broker notification · Load ${ref}` : 'Broker notification drafted';
  }
  if (task === 'categorize_expense') {
    return data?.category ? `Categorized expense as ${data.category}` : 'Categorized expense';
  }
  if (task === 'generate_invoice_for_load') {
    return data?.invoice_number ? `Invoice ${data.invoice_number} generated` : 'Invoice generated';
  }
  if (task === 'finance_watch') {
    return (data?.alerts?.length || 0) > 0 ? `${data.alerts.length} finance alert${data.alerts.length === 1 ? '' : 's'}` : 'Finance watch · all clear';
  }
  if (task === 'review_pending_expense') {
    return 'Pending expense reviewed';
  }
  if (task === 'scan_email_for_leads') {
    // Subject reports the outcome of the scan: lead found (with broker
    // + route), no lead, or processing skipped/failed. Each scanned
    // email produces a job — one job = at most one lead.
    const oppId = data?.opportunity_id;
    if (oppId) {
      const broker = data?.broker?.name || data?.broker_name;
      const route = data?.route;
      if (data?.auto_added) {
        return broker
          ? `New lead added · ${broker}${route ? ' · ' + route : ''}`
          : 'New lead added';
      }
      return broker
        ? `Found a lead · ${broker}${route ? ' · ' + route : ''}`
        : 'Found a new lead';
    }
    return 'Scanned email · no lead';
  }
  if (task === 'scan_inbox_now') {
    const triggered = data?.triggered_count || data?.connections?.filter?.((c) => c.status === 'triggered').length;
    return triggered
      ? `Inbox scan kicked off · ${triggered} mailbox${triggered === 1 ? '' : 'es'}`
      : 'Inbox scan kicked off';
  }
  if (task === 'review_recent_loads') {
    // Dynamic subject so the inbox list shows what Alex actually did,
    // not a generic "Review Recent Loads" repeated for every run.
    const counts = data?.counts || {};
    const fixed = counts.fixes_applied || 0;
    const stillOpen = (counts.with_issues || 0) - (counts.fully_resolved || 0);
    const total = counts.total_checked || 0;
    if (total === 0) return 'Audit · no new loads to review';
    if (fixed > 0 && stillOpen > 0) {
      return `Audit · fixed ${fixed}, ${stillOpen} need eyes`;
    }
    if (fixed > 0) {
      return `Audit complete · fixed ${fixed} field${fixed === 1 ? '' : 's'}`;
    }
    if (stillOpen > 0) {
      return `Audit · ${stillOpen} load${stillOpen === 1 ? '' : 's'} need eyes`;
    }
    return `Audit complete · all ${total} clean`;
  }
  return humanize(task);
}

function buildDeepLink(job) {
  if (!job?.target_id) return null;
  const orgSlug = window?.location?.pathname?.match(/\/o\/([^/]+)\//)?.[1];
  if (!orgSlug) return null;
  const t = job.target_type;
  if (t === 'load') return `/o/${orgSlug}/loads/${job.target_id}`;
  if (t === 'expense' || t === 'fuel_transaction') return `/o/${orgSlug}/expenses/${job.target_id}`;
  if (t === 'invoice') return `/o/${orgSlug}/invoices/${job.target_id}`;
  return null;
}

function humanize(name) {
  return (name || '').split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
function cap(s) { return s ? s.charAt(0).toUpperCase() + s.slice(1) : ''; }
function firstLine(s) { return (s || '').split('\n')[0].slice(0, 80); }

function relTime(d) {
  if (!d) return '';
  const ms = Date.now() - new Date(d).getTime();
  const s = Math.floor(ms / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  const date = new Date(d);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const READ_KEY = 'genie_inbox_read_v1';
function loadReadMap() {
  try {
    const raw = localStorage.getItem(READ_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
function saveReadMap(map) {
  try { localStorage.setItem(READ_KEY, JSON.stringify(map)); } catch { /* ignore */ }
}
