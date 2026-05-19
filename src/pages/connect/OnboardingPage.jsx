import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Loader2, ArrowLeft, FileText, Upload, CheckCircle2, XCircle,
  Clock, ChevronRight, MessageSquare, Send
} from 'lucide-react';
import connectApi from '../../api/connect.api';
import { cn } from '../../lib/utils';

const DOC_PRESETS = [
  { doc_type: 'cdl', label: 'CDL (front & back)' },
  { doc_type: 'medical_card', label: 'DOT Medical Card' },
  { doc_type: 'mvr', label: 'MVR / Driving Record' },
  { doc_type: 'insurance', label: 'Insurance' },
  { doc_type: 'application', label: 'Driver Application' },
  { doc_type: 'employment_history', label: 'Employment History' },
  { doc_type: 'other', label: 'Other' }
];

const STATUS_FLOW = [
  'started', 'documents_requested', 'documents_submitted',
  'under_review', 'verification_pending', 'approved', 'hired'
];
const STATUS_LABEL = {
  started: 'Started', documents_requested: 'Documents requested',
  documents_submitted: 'Documents submitted', under_review: 'Under review',
  verification_pending: 'Verification pending', approved: 'Approved',
  hired: 'Hired', rejected: 'Rejected', withdrawn: 'Withdrawn', archived: 'Archived'
};
const docTone = (s) =>
  s === 'accepted' ? 'text-emerald-600 bg-emerald-50 border-emerald-200'
  : s === 'rejected' ? 'text-red-600 bg-red-50 border-red-200'
  : s === 'submitted' ? 'text-blue-600 bg-blue-50 border-blue-200'
  : 'text-amber-600 bg-amber-50 border-amber-200';

export default function OnboardingPage() {
  const { orgSlug, id } = useParams();
  const asOrg = !!orgSlug;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = () => {
    setLoading(true);
    connectApi.getOnboarding(id, asOrg)
      .then((r) => setData(r.data || null))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [id, asOrg]);

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-text-tertiary"><Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading onboarding…</div>;
  }
  if (!data?.onboarding) {
    return <div className="max-w-3xl mx-auto p-8"><div className="p-4 rounded-card bg-error/5 border border-error/20 text-error text-body-sm">Onboarding not found or not accessible.</div></div>;
  }

  const { onboarding, organization, driver, documents = [] } = data;
  const backTo = asOrg ? `/o/${orgSlug}/connect` : '/driver/connect';
  const counterpart = asOrg ? (driver?.name || 'Driver') : (organization?.name || 'Carrier');

  return (
    <div className="max-w-3xl mx-auto p-6 lg:p-8 space-y-6">
      <div>
        <Link to={backTo} className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary mb-2">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to MorPro Connect
        </Link>
        <div className="flex items-center justify-between">
          <h1 className="text-title text-text-primary">Onboarding · {counterpart}</h1>
          <span className="text-[11px] uppercase tracking-wider px-2 py-1 rounded-full border border-surface-tertiary bg-surface-secondary text-text-secondary">
            {STATUS_LABEL[onboarding.status] || onboarding.status}
          </span>
        </div>
      </div>

      {/* Pipeline */}
      <div className="bg-white rounded-card border border-surface-tertiary p-5">
        <div className="flex items-center gap-1.5 flex-wrap">
          {STATUS_FLOW.map((s, i) => {
            const reached = STATUS_FLOW.indexOf(onboarding.status) >= i;
            return (
              <div key={s} className="flex items-center gap-1.5">
                <span className={cn('text-[11px] px-2 py-1 rounded-full border',
                  reached ? 'text-accent bg-accent/10 border-accent/30' : 'text-text-tertiary bg-surface-secondary border-surface-tertiary')}>
                  {STATUS_LABEL[s]}
                </span>
                {i < STATUS_FLOW.length - 1 && <ChevronRight className="w-3 h-3 text-text-tertiary" />}
              </div>
            );
          })}
        </div>
        {asOrg && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-tertiary">
            {['under_review', 'verification_pending', 'approved', 'hired', 'rejected'].map((s) => (
              <button key={s} type="button" disabled={busy}
                onClick={async () => { setBusy(true); try { const r = await connectApi.advanceOnboarding(id, s); setData(r.data || data); } finally { setBusy(false); } }}
                className={cn('px-3 py-1.5 rounded-button text-small font-medium',
                  s === 'rejected' ? 'bg-red-50 text-red-600 hover:bg-red-100'
                  : s === 'hired' ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                  : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary')}>
                Mark {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
        <div className="px-5 py-3 border-b border-surface-tertiary flex items-center gap-2">
          <FileText className="w-4 h-4 text-text-secondary" />
          <span className="text-body-sm font-medium text-text-primary">Documents</span>
        </div>
        {documents.length === 0 ? (
          <div className="p-5">
            {asOrg
              ? <RequestDocsForm id={id} onDone={(d) => setData(d || data)} />
              : <div className="text-body-sm text-text-tertiary text-center py-4">No documents requested yet. The carrier will request what they need.</div>}
          </div>
        ) : (
          <div className="divide-y divide-surface-tertiary">
            {documents.map((d) => (
              <DocRow key={d.id} doc={d} id={id} asOrg={asOrg} onChange={(r) => setData(r || data)} />
            ))}
            {asOrg && (
              <div className="p-4">
                <RequestDocsForm id={id} onDone={(r) => setData(r || data)} compact />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      {onboarding.connection_id && (
        <MessagesCard connectionId={onboarding.connection_id} asOrg={asOrg} />
      )}

      {/* Timeline */}
      {Array.isArray(onboarding.timeline) && onboarding.timeline.length > 0 && (
        <div className="bg-white rounded-card border border-surface-tertiary p-5">
          <div className="text-[11px] uppercase tracking-wider text-text-tertiary mb-3">Timeline</div>
          <div className="space-y-3">
            {onboarding.timeline.slice().reverse().map((t, i) => (
              <div key={i} className="flex gap-3">
                <Clock className="w-4 h-4 text-text-tertiary flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-body-sm text-text-primary">
                    {t.note || `${t.from || ''} → ${t.to || ''}`}
                  </div>
                  <div className="text-small text-text-tertiary">
                    {t.actor ? `${t.actor} · ` : ''}{new Date(t.at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function RequestDocsForm({ id, onDone, compact }) {
  const [sel, setSel] = useState([]);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const toggle = (dt) => setSel((s) => s.includes(dt) ? s.filter((x) => x !== dt) : [...s, dt]);
  const submit = async () => {
    if (!sel.length) return;
    setBusy(true);
    try {
      const items = sel.map((dt) => DOC_PRESETS.find((p) => p.doc_type === dt));
      const r = await connectApi.requestDocs(id, items, note || null);
      onDone(r.data);
      setSel([]); setNote('');
    } finally { setBusy(false); }
  };
  return (
    <div>
      {!compact && <div className="text-body-sm font-medium text-text-primary mb-2">Request documents from the driver</div>}
      <div className="flex flex-wrap gap-2">
        {DOC_PRESETS.map((p) => (
          <button key={p.doc_type} type="button" onClick={() => toggle(p.doc_type)}
            className={cn('px-3 py-1.5 rounded-full text-small border',
              sel.includes(p.doc_type) ? 'bg-accent text-white border-accent' : 'bg-surface-secondary text-text-secondary border-surface-tertiary')}>
            {p.label}
          </button>
        ))}
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Optional note to the driver"
        className="w-full mt-3 px-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20" />
      <button type="button" onClick={submit} disabled={busy || !sel.length}
        className="mt-3 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90 disabled:opacity-60">
        {busy ? 'Requesting…' : `Request ${sel.length || ''} document${sel.length === 1 ? '' : 's'}`}
      </button>
    </div>
  );
}

function DocRow({ doc, id, asOrg, onChange }) {
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const view = async () => {
    const r = await connectApi.getOnboardingDocUrl(id, doc.id, asOrg).catch(() => null);
    if (r?.data?.url) window.open(r.data.url, '_blank', 'noopener');
  };
  const upload = async (file) => {
    if (!file) return;
    setBusy(true);
    try { const r = await connectApi.uploadOnboardingDoc(id, doc.id, file); onChange(r.data); }
    finally { setBusy(false); }
  };
  const review = async (accept) => {
    setBusy(true);
    try { const r = await connectApi.reviewDoc(id, doc.id, accept, null); onChange(r.data); }
    finally { setBusy(false); }
  };

  return (
    <div className="p-4 flex items-center gap-3">
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium text-text-primary">{doc.label || doc.doc_type}</div>
        <div className="text-small text-text-tertiary">
          {doc.file_name || (doc.request_note ? doc.request_note : 'Awaiting upload')}
          {doc.review_note ? ` · ${doc.review_note}` : ''}
        </div>
      </div>
      <span className={cn('text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border', docTone(doc.status))}>
        {doc.status}
      </span>

      {doc.file_name && (
        <button type="button" onClick={view} className="text-small text-accent hover:underline">View</button>
      )}

      {!asOrg && doc.status === 'requested' && (
        <>
          <input ref={fileRef} type="file" className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.webp"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ''; }} />
          <button type="button" onClick={() => fileRef.current?.click()} disabled={busy}
            className="px-3 py-1.5 rounded-button bg-accent text-white text-small font-medium hover:bg-accent/90 flex items-center gap-1.5">
            {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />} Upload
          </button>
        </>
      )}

      {asOrg && doc.status === 'submitted' && (
        <div className="flex gap-1.5">
          <button type="button" onClick={() => review(true)} disabled={busy}
            className="p-1.5 rounded-button bg-emerald-50 text-emerald-600 hover:bg-emerald-100" title="Accept">
            <CheckCircle2 className="w-4 h-4" />
          </button>
          <button type="button" onClick={() => review(false)} disabled={busy}
            className="p-1.5 rounded-button bg-red-50 text-red-600 hover:bg-red-100" title="Reject">
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function MessagesCard({ connectionId, asOrg }) {
  const [msgs, setMsgs] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const load = () => {
    connectApi.getConnectionMessages(connectionId, asOrg)
      .then((r) => setMsgs(r.data?.messages || []))
      .catch(() => setMsgs([]));
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [connectionId, asOrg]);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [msgs]);

  const send = async () => {
    const body = input.trim();
    if (!body || sending) return;
    setInput('');
    setSending(true);
    try {
      const r = await connectApi.postConnectionMessage(connectionId, asOrg, body);
      setMsgs(r.data?.messages || []);
    } finally {
      setSending(false);
    }
  };

  const mineRole = asOrg ? 'carrier' : 'driver';

  return (
    <div className="bg-white rounded-card border border-surface-tertiary overflow-hidden">
      <div className="px-5 py-3 border-b border-surface-tertiary flex items-center gap-2">
        <MessageSquare className="w-4 h-4 text-text-secondary" />
        <span className="text-body-sm font-medium text-text-primary">Messages</span>
      </div>
      <div ref={scrollRef} className="max-h-72 overflow-y-auto p-4 space-y-3">
        {msgs.length === 0 && (
          <p className="text-body-sm text-text-tertiary text-center py-4">
            No messages yet. Start the conversation.
          </p>
        )}
        {msgs.map((m) => {
          const mine = m.sender_role === mineRole;
          return (
            <div key={m.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
              <div className="max-w-[80%]">
                <div className={cn(
                  'px-3.5 py-2 rounded-2xl text-body-sm whitespace-pre-wrap break-words',
                  mine ? 'bg-accent text-white rounded-br-sm' : 'bg-surface-secondary text-text-primary rounded-bl-sm'
                )}>
                  {m.body}
                </div>
                <div className={cn('text-[10px] text-text-tertiary mt-0.5', mine ? 'text-right' : '')}>
                  {m.sender_name} · {new Date(m.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="border-t border-surface-tertiary p-3 flex items-end gap-2">
        <textarea
          rows={1}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder="Write a message…"
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
