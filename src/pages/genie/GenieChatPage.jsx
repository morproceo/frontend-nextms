import { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, Send, Plus, Loader2, Wrench } from 'lucide-react';
import genieApi from '../../api/genie.api';
import { cn } from '../../lib/utils';

/**
 * GenieChatPage — the dedicated place you talk to Genie.
 *
 * Left: conversation history. Main: the thread. Genie's tool steps
 * (what she checked) render as a subtle line under her replies so you
 * can see she's grounded in real data.
 */
export default function GenieChatPage() {
  const [conversations, setConversations] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const loadConversations = useCallback(() => {
    genieApi.listGenieConversations()
      .then((r) => setConversations(r.data?.conversations || []))
      .catch(() => {});
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const openConversation = async (id) => {
    setConversationId(id);
    try {
      const r = await genieApi.getGenieConversation(id);
      setMessages(r.data?.messages || []);
    } catch {
      setMessages([]);
    }
  };

  const newChat = () => {
    setConversationId(null);
    setMessages([]);
    setInput('');
  };

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text, _local: true }]);
    setSending(true);
    try {
      const r = await genieApi.sendGenieMessage(text, conversationId);
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
        { role: 'assistant', content: `Sorry — I hit an error. ${err?.response?.data?.error || err.message}`, _error: true }
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

  return (
    <div className="flex gap-4 h-[calc(100vh-9rem)] -m-2">
      {/* History */}
      <aside className="hidden md:flex w-60 flex-shrink-0 flex-col bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
        <button
          type="button"
          onClick={newChat}
          className="flex items-center gap-2 m-3 px-3 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <Plus className="w-4 h-4" /> New chat
        </button>
        <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
          {conversations.length === 0 && (
            <p className="text-small text-text-tertiary px-2 py-3">No conversations yet.</p>
          )}
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => openConversation(c.id)}
              className={cn(
                'w-full text-left px-3 py-2 rounded-button text-body-sm truncate transition-colors',
                c.id === conversationId
                  ? 'bg-surface-secondary text-text-primary'
                  : 'text-text-secondary hover:bg-surface-secondary/60'
              )}
            >
              {c.title || 'New conversation'}
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className="flex-1 flex flex-col bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden min-w-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-5">
          {messages.length === 0 && !sending && (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center mb-4 shadow-[0_0_40px_-6px_rgba(236,72,153,0.6)]">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h2 className="text-title text-text-primary">Ask Genie anything</h2>
              <p className="text-body-sm text-text-secondary mt-1 max-w-md">
                She sees your loads, expenses, financials and the whole agent team.
                Try “how did we do this week?”, “what’s pending approval?”, or
                “what did Cece do today?”
              </p>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={cn('flex gap-3', m.role === 'user' ? 'justify-end' : 'justify-start')}>
              {m.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={cn('max-w-[80%] min-w-0', m.role === 'user' ? 'items-end' : '')}>
                <div
                  className={cn(
                    'px-4 py-2.5 rounded-2xl text-body-sm whitespace-pre-wrap break-words',
                    m.role === 'user'
                      ? 'bg-accent text-white rounded-br-sm'
                      : m._error
                        ? 'bg-error/10 text-error border border-error/20'
                        : 'bg-surface-secondary text-text-primary rounded-bl-sm'
                  )}
                >
                  {m.content}
                </div>
                {Array.isArray(m.steps) && m.steps.length > 0 && (
                  <div className="mt-1.5 flex items-center gap-1.5 flex-wrap pl-1">
                    <Wrench className="w-3 h-3 text-text-tertiary" />
                    {m.steps.map((s, j) => (
                      <span
                        key={j}
                        className="text-[10px] uppercase tracking-wider text-text-tertiary bg-surface-secondary border border-surface-tertiary rounded-full px-2 py-0.5"
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
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-surface-secondary text-text-secondary text-body-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Genie is thinking…
              </div>
            </div>
          )}
        </div>

        {/* Composer */}
        <div className="border-t border-surface-tertiary p-3">
          <div className="flex items-end gap-2 rounded-xl bg-surface-secondary border border-surface-tertiary focus-within:border-accent transition-colors p-2">
            <textarea
              rows={1}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask Genie about a load, an expense, this week…"
              className="flex-1 bg-transparent resize-none px-2 py-1.5 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none max-h-32"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !input.trim()}
              className={cn(
                'flex items-center justify-center w-9 h-9 rounded-lg transition-colors flex-shrink-0',
                input.trim() && !sending
                  ? 'bg-accent text-white hover:bg-accent/90'
                  : 'bg-surface-tertiary text-text-tertiary cursor-not-allowed'
              )}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
