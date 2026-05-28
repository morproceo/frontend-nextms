import { useState, useEffect, useRef } from 'react';
import {
  Wrench, Truck, AlertTriangle, Loader2, Send, Sparkles,
  ChevronRight, KeyRound, CheckCircle2, Zap, ChevronDown
} from 'lucide-react';
import myTruckApi from '../../api/myTruck.api';
import * as motiveOAuthApi from '../../api/motiveOAuth.api';
import { cn } from '../../lib/utils';

const sevColor = (s) => {
  const v = String(s || '').toLowerCase();
  if (v.includes('critical')) return 'text-red-600 bg-red-50 border-red-200';
  if (v.includes('warn')) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-text-secondary bg-surface-secondary border-surface-tertiary';
};

export default function MyTruckPage() {
  const [state, setState] = useState({ loading: true });

  const load = () => {
    setState({ loading: true });
    myTruckApi.getMyTruck()
      .then((r) => setState({ loading: false, ...(r.data || {}) }))
      .catch((e) => setState({ loading: false, error: e?.response?.data?.error || e.message }));
  };
  useEffect(() => { load(); }, []);

  if (state.loading) {
    return (
      <div className="flex items-center justify-center py-24 text-text-tertiary">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading your truck…
      </div>
    );
  }

  if (state.error) {
    return <div className="p-4 rounded-card bg-error/5 border border-error/20 text-error text-body-sm">{state.error}</div>;
  }

  if (state.mode === 'needs_motive') return <ConnectMotive onDone={load} />;
  if (state.mode === 'independent_pick_vehicle') {
    return <PickVehicle vehicles={state.vehicles} onDone={load} />;
  }
  if (state.mode === 'no_truck') {
    return (
      <EmptyHero
        title="No truck assigned yet"
        body="Your organization hasn't assigned you a truck. Once they do, its health and AI mechanic show up here."
      />
    );
  }

  // org | independent — show the truck
  return <TruckView data={state} onReconnect={load} />;
}

/* ───────────────────────── Truck view ───────────────────────── */

function TruckView({ data }) {
  const t = data.truck || {};
  const faults = data.faults || [];
  const open = faults.filter((f) => String(f.status).toLowerCase() !== 'closed');

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center flex-shrink-0">
          <Wrench className="w-6 h-6 text-orange-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-title text-text-primary">My Truck</h1>
          <p className="text-body-sm text-text-secondary">
            {data.mode === 'independent' ? 'Connected via your Motive key' : 'Assigned by your organization'}
          </p>
        </div>
      </div>

      {/* Truck card */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5 flex items-center gap-4">
        <div className="w-11 h-11 rounded-lg bg-accent/10 flex items-center justify-center">
          <Truck className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1">
          <div className="text-body font-semibold text-text-primary">
            Unit {t.unit_number || '—'}
          </div>
          <div className="text-small text-text-tertiary">
            {[t.year, t.make, t.model].filter(Boolean).join(' ') || 'Vehicle'}
            {t.odometer ? ` · ${Number(t.odometer).toLocaleString()} mi` : ''}
          </div>
        </div>
        <span className={cn(
          'text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border',
          open.length === 0
            ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
            : 'text-amber-600 bg-amber-50 border-amber-200'
        )}>
          {open.length === 0 ? 'Healthy' : `${open.length} active code${open.length > 1 ? 's' : ''}`}
        </span>
      </div>

      {/* Fault codes */}
      <div>
        <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-2">
          Fault codes
        </div>
        {faults.length === 0 ? (
          <div className="bg-white rounded-card border border-surface-tertiary p-6 text-center text-body-sm text-text-tertiary">
            No fault codes reported. Your truck looks healthy.
          </div>
        ) : (
          <div className="space-y-2">
            {faults.map((f, i) => <FaultRow key={i} fault={f} />)}
          </div>
        )}
      </div>

      <TruckChat />
    </div>
  );
}

function FaultRow({ fault }) {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const r = await myTruckApi.analyzeCode(fault.code);
      setAnalysis(r.data?.analysis || { explanation: 'No analysis available.' });
    } catch (e) {
      setAnalysis({ explanation: e?.response?.data?.error || 'Analysis failed.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-body-sm font-medium text-text-primary">{fault.code}</div>
          {fault.description && (
            <div className="text-small text-text-tertiary truncate">{fault.description}</div>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
          {fault.status}
        </span>
        {!analysis && (
          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
            Analyze
          </button>
        )}
      </div>
      {analysis && (
        <div className="border-t border-surface-tertiary p-4 bg-surface-secondary/40 space-y-3">
          {analysis.name && (
            <div className="text-body-sm font-semibold text-text-primary">{analysis.name}</div>
          )}
          <p className="text-body-sm text-text-secondary leading-relaxed">
            {analysis.explanation}
          </p>
          <div className="flex flex-wrap gap-2 text-small">
            {analysis.severity && (
              <span className={cn('px-2 py-0.5 rounded-full border', sevColor(analysis.severity))}>
                {analysis.severity}
              </span>
            )}
            {analysis.urgency && (
              <span className="px-2 py-0.5 rounded-full border border-surface-tertiary text-text-secondary">
                Urgency: {analysis.urgency}
              </span>
            )}
            {typeof analysis.canDrive === 'boolean' && (
              <span className={cn(
                'px-2 py-0.5 rounded-full border',
                analysis.canDrive
                  ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
                  : 'text-red-600 bg-red-50 border-red-200'
              )}>
                {analysis.canDrive ? 'Safe to drive' : 'Do not drive'}
              </span>
            )}
            {analysis.estimatedCost && (
              <span className="px-2 py-0.5 rounded-full border border-surface-tertiary text-text-secondary">
                Est. ${analysis.estimatedCost.min}–${analysis.estimatedCost.max}
              </span>
            )}
          </div>
          {Array.isArray(analysis.recommendedFixes) && analysis.recommendedFixes.length > 0 && (
            <div>
              <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-1">
                Recommended
              </div>
              <ul className="space-y-1">
                {analysis.recommendedFixes.map((fx, i) => (
                  <li key={i} className="text-body-sm text-text-secondary flex gap-2">
                    <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
                    <span>{typeof fx === 'string' ? fx : fx.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Chat ───────────────────────── */

function TruckChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async () => {
    const text = input.trim();
    if (!text || sending) return;
    const next = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    setSending(true);
    try {
      const r = await myTruckApi.askMyTruck(next);
      const reply = r.data?.reply;
      setMessages((m) => [...m, { role: 'assistant', content: reply?.content || '…' }]);
    } catch (e) {
      setMessages((m) => [...m, { role: 'assistant', content: e?.response?.data?.error || 'Error.' }]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
      <div className="px-4 py-3 border-b border-surface-tertiary flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-accent" />
        <span className="text-body-sm font-medium text-text-primary">Ask about this truck</span>
      </div>
      <div ref={scrollRef} className="max-h-80 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-body-sm text-text-tertiary">
            Describe a symptom or ask about a code — e.g. “engine derate this morning, what should I check?”
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={cn('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cn(
              'max-w-[85%] px-3.5 py-2.5 rounded-2xl text-body-sm whitespace-pre-wrap',
              m.role === 'user'
                ? 'bg-accent text-white rounded-br-sm'
                : 'bg-surface-secondary text-text-primary rounded-bl-sm'
            )}>
              {m.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="px-3.5 py-2.5 rounded-2xl bg-surface-secondary text-text-secondary text-body-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Thinking…
            </div>
          </div>
        )}
      </div>
      <div className="border-t border-surface-tertiary p-3 flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Ask the AI mechanic…"
          className="flex-1 resize-none bg-surface-secondary rounded-xl px-3 py-2 text-body-sm text-text-primary placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20 max-h-28"
        />
        <button
          type="button"
          onClick={send}
          disabled={sending || !input.trim()}
          className={cn(
            'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
            input.trim() && !sending ? 'bg-accent text-white hover:bg-accent/90' : 'bg-surface-tertiary text-text-tertiary'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

/* ───────────────────── Independent: connect / pick ───────────────────── */

function ConnectMotive({ onDone }) {
  const [oauthBusy, setOauthBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const popupPollRef = useRef(null);

  // Listen for the postMessage from the popup's result page.
  useEffect(() => {
    const onMessage = (ev) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data || {};
      if (data.source !== 'motive-oauth') return;
      if (data.status === 'success') {
        onDone();
      } else {
        setErr(data.message || 'Connection failed');
      }
      setOauthBusy(false);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
  }, [onDone]);

  const connectOAuth = async () => {
    setErr(null); setOauthBusy(true);
    try {
      const { authUrl } = await motiveOAuthApi.startConnect('user');
      const popup = motiveOAuthApi.openOAuthPopup(authUrl);
      if (!popup) {
        setErr('Popup blocked — please allow popups and try again.');
        setOauthBusy(false);
        return;
      }
      popupPollRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupPollRef.current);
          setOauthBusy(false);
          onDone();
        }
      }, 700);
    } catch (e) {
      setErr(e?.response?.data?.message || e?.message || 'Could not start OAuth');
      setOauthBusy(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto py-10 text-center">
      <div className="w-14 h-14 rounded-2xl bg-orange-500/10 flex items-center justify-center mx-auto mb-4">
        <Zap className="w-7 h-7 text-orange-500" />
      </div>
      <h1 className="text-title text-text-primary">Connect your truck</h1>
      <p className="text-body-sm text-text-secondary mt-2">
        Sign in with your Motive account to unlock live fault codes and the
        AI mechanic. No copy-pasting required.
      </p>

      <button
        type="button"
        onClick={connectOAuth}
        disabled={oauthBusy}
        className="w-full mt-6 py-2.5 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90 disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {oauthBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
        Connect with Motive
      </button>
      {err && <p className="text-small text-error mt-3 text-left">{err}</p>}

      {/* Advanced — paste API key fallback */}
      <div className="mt-8 text-left">
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          className="flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary"
        >
          <KeyRound className="w-3.5 h-3.5" />
          Advanced: use an API key instead
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', showAdvanced && 'rotate-180')} />
        </button>
        {showAdvanced && <ApiKeyForm onDone={onDone} />}
      </div>
    </div>
  );
}

function ApiKeyForm({ onDone }) {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const connect = async () => {
    if (!key.trim()) return;
    setBusy(true); setErr(null);
    try {
      await myTruckApi.connectMotive(key.trim());
      onDone();
    } catch (e) {
      setErr(e?.response?.data?.error || 'Could not connect.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-3">
      <label className="text-small text-text-tertiary">Motive API key</label>
      <input
        type="password"
        value={key}
        onChange={(e) => setKey(e.target.value)}
        placeholder="Paste your Motive API key"
        className="w-full mt-1 px-3 py-2.5 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
      {err && <p className="text-small text-error mt-2">{err}</p>}
      <button
        type="button"
        onClick={connect}
        disabled={busy || !key.trim()}
        className="w-full mt-3 py-2 rounded-button bg-surface-secondary text-text-primary text-body-sm font-medium border border-surface-tertiary hover:bg-surface-tertiary disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
        Save API key
      </button>
    </div>
  );
}

function PickVehicle({ vehicles = [], onDone }) {
  const [busy, setBusy] = useState(null);
  const pick = async (id) => {
    setBusy(id);
    try { await myTruckApi.selectMotiveVehicle(id); onDone(); }
    finally { setBusy(null); }
  };
  return (
    <div className="max-w-lg mx-auto py-10">
      <h1 className="text-title text-text-primary text-center">Pick your truck</h1>
      <p className="text-body-sm text-text-secondary text-center mt-1">
        Which vehicle on your Motive account is yours?
      </p>
      <div className="mt-6 space-y-2">
        {vehicles.length === 0 && (
          <p className="text-body-sm text-text-tertiary text-center">
            No vehicles found on that Motive account.
          </p>
        )}
        {vehicles.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => pick(v.id)}
            disabled={busy}
            className="w-full flex items-center gap-3 p-4 rounded-card bg-white border border-surface-tertiary hover:border-accent/40 text-left transition-colors"
          >
            <Truck className="w-5 h-5 text-accent" />
            <div className="flex-1">
              <div className="text-body-sm font-medium text-text-primary">
                {v.number || v.label || `Vehicle ${v.id}`}
              </div>
              <div className="text-small text-text-tertiary">
                {[v.year, v.make, v.model].filter(Boolean).join(' ')}
              </div>
            </div>
            {busy === v.id ? <Loader2 className="w-4 h-4 animate-spin text-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-text-tertiary" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyHero({ title, body }) {
  return (
    <div className="max-w-md mx-auto py-16 text-center">
      <div className="w-14 h-14 rounded-2xl bg-surface-secondary flex items-center justify-center mx-auto mb-4">
        <Truck className="w-7 h-7 text-text-tertiary" />
      </div>
      <h1 className="text-title text-text-primary">{title}</h1>
      <p className="text-body-sm text-text-secondary mt-2">{body}</p>
    </div>
  );
}
