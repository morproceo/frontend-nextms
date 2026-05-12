import { useEffect, useState } from 'react';
import {
  Plug, Loader2, CheckCircle2, AlertCircle, Settings, RefreshCw, X
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';

const META = {
  motive: {
    description: 'Live truck locations + fault codes via your existing Motive Vehicle Gateway.',
    inputs: [{ name: 'api_key', label: 'Motive API key', type: 'password', placeholder: 'mot_xxxxx' }]
  },
  samsara: {
    description: 'Same data, Samsara fleets. Coming next.',
    disabled: true,
    inputs: []
  },
  morprotms: {
    description: 'Use the trucks already in your MorPro TMS. Always available.',
    inputs: []
  },
  manual: {
    description: 'Manage trucks by hand. No telematics, no fault codes.',
    inputs: []
  }
};

export default function ConnectionsPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openId, setOpenId] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try { setProviders(await wrenchApi.listConnections() || []); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { refresh(); }, []);

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
          <Plug className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Connections</h1>
          <p className="text-body-sm text-text-secondary">Pick where your truck data comes from.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : (
        <ul className="space-y-3">
          {providers.map((p) => (
            <ProviderCard key={p.id} provider={p} meta={META[p.id]}
              expanded={openId === p.id}
              onToggle={() => setOpenId(openId === p.id ? null : p.id)}
              onChange={refresh} />
          ))}
        </ul>
      )}
    </div>
  );
}

function ProviderCard({ provider, meta, expanded, onToggle, onChange }) {
  const connected = provider.status?.connected;
  return (
    <li className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
      <div className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${connected ? 'bg-emerald-500/15' : 'bg-surface-secondary'}`}>
          <Plug className={`w-4 h-4 ${connected ? 'text-emerald-600 dark:text-emerald-400' : 'text-text-tertiary'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="text-body font-medium text-text-primary">{provider.label}</p>
            <ConnPill connected={connected} />
          </div>
          <p className="text-small text-text-tertiary">{meta?.description || ''}</p>
        </div>
        {!meta?.disabled && (
          <button onClick={onToggle}
            className="px-3 py-1.5 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary inline-flex items-center gap-1.5">
            <Settings className="w-3.5 h-3.5" /> {expanded ? 'Hide' : 'Configure'}
          </button>
        )}
      </div>
      {expanded && (
        <div className="border-t border-border-subtle p-4 bg-surface-secondary/30">
          <ProviderForm provider={provider} meta={meta} onChange={onChange} />
        </div>
      )}
    </li>
  );
}

function ProviderForm({ provider, meta, onChange }) {
  const [form, setForm] = useState({});
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);

  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async () => {
    setBusy('save'); setError(null); setMsg(null);
    try {
      await wrenchApi.saveConnection(provider.id, form);
      setMsg('Saved.');
      setForm({});
      await onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  const test = async () => {
    setBusy('test'); setError(null); setMsg(null);
    try {
      const r = await wrenchApi.testConnection(provider.id);
      setMsg(r.connected ? 'Connection OK.' : `Not connected${r.reason ? ': ' + r.reason : ''}`);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  const sync = async () => {
    setBusy('sync'); setError(null); setMsg(null);
    try {
      const r = await wrenchApi.syncConnection(provider.id);
      setMsg(r.skipped ? `Sync skipped (${r.skipped})` : `Synced. ${r.synced || 0} record(s) updated.`);
      await onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  if (meta?.disabled) {
    return (
      <p className="text-body-sm text-text-tertiary">
        {provider.status?.reason === 'samsara_not_implemented'
          ? 'Coming next. We\'ll let you know when it\'s ready to connect.'
          : 'Not available yet.'}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {(meta?.inputs || []).map((f) => (
        <label key={f.name} className="block">
          <span className="block text-small text-text-tertiary mb-1">{f.label}</span>
          <input type={f.type || 'text'}
            value={form[f.name] ?? ''}
            onChange={update(f.name)}
            placeholder={f.placeholder}
            className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
        </label>
      ))}

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-2 inline-flex items-start gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}
      {msg && (
        <div className="rounded-card border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 p-2 inline-flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <p className="text-body-sm">{msg}</p>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {(meta?.inputs?.length ?? 0) > 0 && (
          <button onClick={save} disabled={busy === 'save'}
            className="px-3 py-1.5 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Save credentials'}
          </button>
        )}
        <button onClick={test} disabled={busy === 'test'}
          className="px-3 py-1.5 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
          {busy === 'test' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Test connection'}
        </button>
        {provider.status?.connected && provider.id === 'motive' && (
          <button onClick={sync} disabled={busy === 'sync'}
            className="px-3 py-1.5 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
            {busy === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <><RefreshCw className="w-3.5 h-3.5" /> Sync now</>}
          </button>
        )}
      </div>
    </div>
  );
}

function ConnPill({ connected }) {
  const cls = connected
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cls}`}>{connected ? 'connected' : 'not connected'}</span>;
}
