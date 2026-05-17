import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  ArrowUp,
  Plus,
  MessagesSquare,
  Package,
  TrendingUp,
  Wrench,
  MapPin,
  Loader2
} from 'lucide-react';
import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import genieApi from '../../api/genie.api';
import { cn } from '../../lib/utils';

/**
 * GeniePanel — slide-in chat drawer for the morpro AI assistant.
 *
 * Layout (top → bottom):
 *   1. Slim sub-header (48px) — Genie identity + action icons
 *   2. Conversation scroll area — empty-state welcome at the top, future
 *      messages stack below
 *   3. Suggestions strip — always visible, sits right above the input
 *   4. Input — pinned to the bottom edge
 *
 * UX decisions:
 *   - Anchored at `top-14` (below the 56px EcosystemHeader) so the universal
 *     bar stays usable — the org switcher, app grid, and avatar remain
 *     reachable during a conversation.
 *   - No backdrop dim — the underlying app stays visible. Reads as a docked
 *     side rail, not a modal. Matches Gmail/Supabase pattern.
 *   - Empty state lives at the TOP of the conversation area, not centered.
 *     When messages start landing, they continue below — no awkward
 *     "centered welcome shoves your first message off-screen" jump.
 *   - Esc closes. Click outside is intentionally NOT a close trigger
 *     because the panel coexists with app content; accidental clicks
 *     elsewhere shouldn't dismiss it.
 *   - Single-source labeling: the input placeholder is the only "Ask…"
 *     prompt. No duplicate "Ask me anything below" in the body.
 *
 * Live: talks to the same Genie backend as the dedicated chat page
 * (POST /v1/agents/genie/chat), with conversation switching via the
 * header's messages icon.
 */
export function GeniePanel({ open, onClose }) {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const firstName = user?.first_name || (user?.email?.split('@')[0] ?? 'there');

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const loadConversations = useCallback(() => {
    genieApi.listGenieConversations()
      .then((r) => setConversations(r.data?.conversations || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (open) loadConversations();
  }, [open, loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
    setShowHistory(false);
  };

  const openConversation = async (id) => {
    setConversationId(id);
    setShowHistory(false);
    try {
      const r = await genieApi.getGenieConversation(id);
      setMessages(r.data?.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: body }]);
    setSending(true);
    try {
      const r = await genieApi.sendGenieMessage(body, conversationId);
      const data = r.data || {};
      if (!conversationId && data.conversation_id) {
        setConversationId(data.conversation_id);
        loadConversations();
      }
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: data.reply, steps: data.steps || [] }
      ]);
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: `Sorry — I hit an error. ${err?.response?.data?.error || err.message}`,
          _error: true
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const suggestions = [
    { icon: Package, label: 'What loads need attention today?', tone: 'violet' },
    { icon: TrendingUp, label: "How's my P&L this month?", tone: 'emerald' },
    { icon: Wrench, label: 'Find trucks due for service', tone: 'amber' },
    { icon: MapPin, label: "What's my Spotty utilization?", tone: 'cyan' }
  ];
  const hasThread = messages.length > 0;

  // Portal to document.body so the panel escapes the EcosystemHeader's
  // backdrop-filter containing block. Without this, `position: fixed`
  // resolves relative to the (56px) header instead of the viewport, and
  // the panel renders crammed inside the header strip.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.aside
          role="dialog"
          aria-label="Genie AI assistant"
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', stiffness: 400, damping: 40 }}
          // Solid dark fill: `bg-[#0a0e1a]/98` is NOT a valid Tailwind
          // opacity step and silently generates no rule, so the panel
          // reads as transparent on light app shells (Spotty/NextMS).
          // We layer a fully-opaque base + a translucent gradient on top
          // for depth, with a backdrop blur for whatever does peek through
          // at the edges.
          className={cn(
            'fixed top-14 right-0 bottom-0 z-[60]',
            'w-full sm:w-[400px] flex flex-col',
            'bg-[#0a0e1a] backdrop-blur-2xl',
            'border-l border-white/[0.08] text-white',
            'shadow-[-16px_0_60px_-10px_rgba(0,0,0,0.55)]'
          )}
          style={{
            backgroundImage:
              'linear-gradient(180deg, rgba(20,16,40,0.6) 0%, rgba(10,14,26,0) 40%)'
          }}
        >
          {/* — 1. Sub-header — */}
          <header className="flex items-center justify-between pl-4 pr-3 h-12 border-b border-white/[0.06] flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <GenieMark className="w-6 h-6" />
              <div className="leading-tight min-w-0">
                <div className="text-body-sm font-semibold truncate">Genie</div>
                <div className="text-[10px] uppercase tracking-wider text-white/40 truncate">
                  AI CEO · Alpha
                </div>
              </div>
            </div>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <IconButton icon={Plus} label="New conversation" onClick={newChat} />
              <IconButton
                icon={MessagesSquare}
                label="Switch conversation"
                active={showHistory}
                onClick={() => setShowHistory((s) => !s)}
              />
              <IconButton icon={X} label="Close Genie" onClick={onClose} />
            </div>
          </header>

          {/* — Conversation switcher (toggled) — */}
          {showHistory && (
            <div className="border-b border-white/[0.06] bg-white/[0.02] max-h-56 overflow-y-auto flex-shrink-0">
              <button
                type="button"
                onClick={newChat}
                className="w-full flex items-center gap-2 px-4 py-2.5 text-body-sm text-white/80 hover:bg-white/[0.05] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> New chat
              </button>
              {conversations.length === 0 ? (
                <p className="text-[11px] text-white/35 px-4 py-2">No past conversations.</p>
              ) : (
                conversations.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => openConversation(c.id)}
                    className={cn(
                      'w-full text-left px-4 py-2 text-body-sm truncate transition-colors',
                      c.id === conversationId
                        ? 'bg-white/[0.07] text-white'
                        : 'text-white/60 hover:bg-white/[0.04]'
                    )}
                  >
                    {c.title || 'New conversation'}
                  </button>
                ))
              )}
            </div>
          )}

          {/* — 2. Conversation scroll area —
              Empty state sits at the TOP of this scrollable region. When
              real messages arrive they'll render below, in the same scroll
              container, with no layout jump. */}
          <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto">
            {!hasThread && (
              <div className="px-5 pt-7 pb-4">
                <GenieMark className="w-12 h-12 mb-4" pulse />
                <h2 className="text-[22px] font-semibold text-white leading-tight tracking-tight">
                  Hey {firstName}.
                </h2>
                <p className="text-body-sm text-white/55 mt-2 leading-relaxed">
                  I'm your AI CEO. I can see your loads, expenses, financials and the
                  agent team for{' '}
                  <span className="text-white/85 font-medium">
                    {currentOrg?.name || 'your organization'}
                  </span>
                  . Ask me anything.
                </p>
              </div>
            )}

            {hasThread && (
              <div className="px-4 py-4 space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn('flex gap-2.5', m.role === 'user' ? 'justify-end' : 'justify-start')}
                  >
                    {m.role === 'assistant' && <GenieMark className="w-7 h-7 flex-shrink-0" />}
                    <div className="max-w-[82%] min-w-0">
                      <div
                        className={cn(
                          'px-3.5 py-2.5 rounded-2xl text-body-sm whitespace-pre-wrap break-words',
                          m.role === 'user'
                            ? 'bg-white/[0.10] text-white rounded-br-sm'
                            : m._error
                              ? 'bg-red-500/15 text-red-200 border border-red-500/25'
                              : 'bg-white/[0.05] text-white/90 rounded-bl-sm'
                        )}
                      >
                        {m.content}
                      </div>
                      {Array.isArray(m.steps) && m.steps.length > 0 && (
                        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                          <Wrench className="w-3 h-3 text-white/35" />
                          {m.steps.map((s, j) => (
                            <span
                              key={j}
                              className="text-[9px] uppercase tracking-wider text-white/45 bg-white/[0.05] border border-white/10 rounded-full px-2 py-0.5"
                            >
                              {String(s.tool || '').replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {sending && (
                  <div className="flex gap-2.5 justify-start">
                    <GenieMark className="w-7 h-7 flex-shrink-0" />
                    <div className="px-3.5 py-2.5 rounded-2xl bg-white/[0.05] text-white/60 text-body-sm flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" /> Thinking…
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* — 3. Suggestions strip —
              Always-visible quick prompts directly above the input where
              they're closest to thumb / cursor at the moment of action. */}
          {!hasThread && (
            <div className="px-3 pt-2 pb-1 border-t border-white/[0.04] flex-shrink-0">
              <div className="text-[10px] uppercase tracking-wider text-white/35 px-1 pb-1.5">
                Try asking
              </div>
              <div className="space-y-1">
                {suggestions.map((s, i) => (
                  <SuggestionChip key={i} {...s} onClick={() => send(s.label)} />
                ))}
              </div>
            </div>
          )}

          {/* — 4. Input — */}
          <div className="px-3 pt-3 pb-3 flex-shrink-0">
            <div className="relative rounded-2xl bg-white/[0.04] border border-white/[0.08] focus-within:border-white/25 transition-colors">
              <textarea
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Ask Genie anything…"
                className={cn(
                  'w-full resize-none bg-transparent px-4 py-3 pr-12',
                  'text-body-sm text-white placeholder:text-white/35',
                  'focus:outline-none'
                )}
              />
              <button
                type="button"
                aria-label="Send"
                onClick={() => send()}
                disabled={sending || !input.trim()}
                className={cn(
                  'absolute right-2 bottom-2 w-8 h-8 rounded-full',
                  'flex items-center justify-center text-white',
                  'transition-transform',
                  sending || !input.trim()
                    ? 'bg-white/10 text-white/40 cursor-not-allowed'
                    : 'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 shadow-[0_0_18px_-3px_rgba(168,85,247,0.55)] hover:scale-105 active:scale-95'
                )}
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowUp className="w-4 h-4" strokeWidth={2.5} />}
              </button>
            </div>
            <p className="text-[10px] text-white/30 text-center mt-2 leading-snug">
              Genie can make mistakes. Verify anything that moves money or affects compliance.
            </p>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>,
    document.body
  );
}

function IconButton({ icon: Icon, label, onClick, active }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={cn(
        'p-1.5 rounded-chip transition-colors',
        active
          ? 'text-white bg-white/[0.10]'
          : 'text-white/45 hover:text-white hover:bg-white/[0.06]'
      )}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}

/**
 * GenieMark — small gradient-ring brand mark with a sparkles glyph.
 * Used inside the panel header (calm) and in the welcome (with a gentle
 * scale pulse). Inline SVG so the stroke can carry a linear gradient.
 */
function GenieMark({ className = '', pulse = false }) {
  return (
    <motion.div
      animate={pulse ? { scale: [1, 1.04, 1] } : undefined}
      transition={pulse ? { duration: 2.6, repeat: Infinity, ease: 'easeInOut' } : undefined}
      className={cn('relative rounded-full overflow-hidden flex-shrink-0', className)}
    >
      <motion.div
        aria-hidden
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={{
          background:
            'conic-gradient(from 0deg at 50% 50%, #a855f7, #ec4899, #f97316, #f59e0b, #a855f7)'
        }}
      />
      <div className="absolute inset-[2px] rounded-full bg-[#0a0e1a]" />
      <svg
        viewBox="0 0 24 24"
        className="absolute inset-0 w-full h-full p-[22%]"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        aria-hidden
      >
        <defs>
          <linearGradient id="genie-mark-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#fce7f3" />
          </linearGradient>
        </defs>
        <path
          d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
          stroke="url(#genie-mark-grad)"
        />
        <path d="M20 3v4" stroke="url(#genie-mark-grad)" />
        <path d="M22 5h-4" stroke="url(#genie-mark-grad)" />
        <path d="M4 17v2" stroke="url(#genie-mark-grad)" />
        <path d="M5 18H3" stroke="url(#genie-mark-grad)" />
      </svg>
    </motion.div>
  );
}

function SuggestionChip({ icon: Icon, label, tone, onClick }) {
  const toneClasses =
    {
      violet: 'bg-violet-500/12 text-violet-300 border-violet-500/25',
      emerald: 'bg-emerald-500/12 text-emerald-300 border-emerald-500/25',
      amber: 'bg-amber-500/12 text-amber-300 border-amber-500/25',
      cyan: 'bg-cyan-500/12 text-cyan-300 border-cyan-500/25'
    }[tone] || 'bg-white/[0.04] text-white/70 border-white/10';

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'group w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left',
        'bg-white/[0.02] hover:bg-white/[0.06] border border-transparent hover:border-white/[0.10]',
        'transition-all'
      )}
    >
      <span
        className={cn(
          'w-6 h-6 rounded-md border flex items-center justify-center flex-shrink-0',
          toneClasses
        )}
      >
        <Icon className="w-3 h-3" />
      </span>
      <span className="text-body-sm text-white/80 leading-snug truncate group-hover:text-white">
        {label}
      </span>
    </button>
  );
}

export default GeniePanel;
