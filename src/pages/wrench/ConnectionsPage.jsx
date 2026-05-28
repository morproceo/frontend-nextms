import { useEffect, useRef, useState } from 'react';
import {
  Plug, Loader2, CheckCircle2, AlertCircle, Settings, RefreshCw,
  Zap, KeyRound, ChevronDown
} from 'lucide-react';
import wrenchApi from '../../api/wrench.api';
import * as motiveOAuthApi from '../../api/motiveOAuth.api';

const META = {
  motive: {
    description: 'Live truck locations + fault codes via your Motive ELD.'
  },
  samsara: {
    description: 'Same data, Samsara fleets. Coming next.',
    disabled: true
  },
  morprotms: {
    description: 'Use the trucks already in your MorPro TMS. Always available.'
  },
  manual: {
    description: 'Manage trucks by hand. No telematics, no fault codes.'
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
    <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-3xl">
      <header className="flex items-center gap-3">
        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center flex-shrink-0">
          <Plug className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-title text-text-primary">Connections</h1>
          <p className="text-[11px] sm:text-body-sm text-text-secondary mt-0.5">
            Pick where your truck data comes from. Connect once — every Fleet Health tool uses the same source.
          </p>
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
            {provider.id === 'motive' && provider.status?.auth_type === 'oauth' && (
              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium bg-accent/15 text-accent">
                OAuth
              </span>
            )}
          </div>
          <p className="text-small text-text-tertiary">
            {provider.id === 'motive' && connected && provider.status?.company
              ? `Connected to ${provider.status.company}`
              : (meta?.description || '')}
          </p>
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
          {provider.id === 'motive'
            ? <MotiveForm provider={provider} onChange={onChange} />
            : <ProviderForm provider={provider} meta={meta} onChange={onChange} />}
        </div>
      )}
    </li>
  );
}

/**
 * Motive's expanded panel — OAuth-first. Same connection row as
 * /o/<slug>/settings/integrations/motive, so any action here is
 * mirrored there and vice versa.
 */
function MotiveForm({ provider, onChange }) {
  const connected = provider.status?.connected;
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const [error, setError] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState('');

  const popupPollRef = useRef(null);

  // Listen for OAuth popup result
  useEffect(() => {
    const onMessage = (ev) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data || {};
      if (data.source !== 'motive-oauth') return;
      if (data.status === 'success') {
        setMsg(data.company ? `Connected to ${data.company}` : 'Connected to Motive');
      } else {
        setError(data.message || 'Connection failed');
      }
      setBusy(null);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
      onChange?.();
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
  }, [onChange]);

  const connectOAuth = async () => {
    setBusy('oauth'); setError(null); setMsg(null);
    try {
      const { authUrl } = await motiveOAuthApi.startConnect('org');
      const popup = motiveOAuthApi.openOAuthPopup(authUrl);
      if (!popup) {
        setError('Popup blocked — allow popups for this site and try again.');
        setBusy(null);
        return;
      }
      popupPollRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupPollRef.current);
          setBusy(null);
          onChange?.();
        }
      }, 700);
    } catch (err) {
      setBusy(null);
      setError(err.response?.data?.message || err.message);
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect Motive? Find My Truck, AVA, and the Wrench dashboard will stop syncing until you reconnect.')) return;
    setBusy('disconnect'); setError(null); setMsg(null);
    try {
      await motiveOAuthApi.disconnect('org');
      setMsg('Disconnected');
      await onChange?.();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally { setBusy(null); }
  };

  const sync = async () => {
    setBusy('sync'); setError(null); setMsg(null);
    try {
      const r = await wrenchApi.syncConnection('motive');
      setMsg(r.skipped ? `Sync skipped (${r.skipped})` : `Synced. ${r.synced || 0} record(s) updated.`);
      await onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  const saveApiKey = async () => {
    if (!apiKey.trim()) return;
    setBusy('save'); setError(null); setMsg(null);
    try {
      await wrenchApi.saveConnection('motive', { api_key: apiKey.trim() });
      setMsg('API key saved.');
      setApiKey('');
      await onChange?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      {!connected ? (
        <>
          <p className="text-body-sm text-text-secondary">
            Sign in with Motive — no API keys to copy. Authorizes live vehicle locations,
            fault codes, and driver info.
          </p>
          <button onClick={connectOAuth} disabled={busy === 'oauth'}
            className="px-3 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2">
            {busy === 'oauth' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            Connect with Motive
          </button>
        </>
      ) : (
        <>
          {provider.status?.last_synced_at && (
            <p className="text-small text-text-tertiary">
              Last sync: {new Date(provider.status.last_synced_at).toLocaleString()}
              {provider.status?.vehicle_count ? ` · ${provider.status.vehicle_count} vehicles` : ''}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            <button onClick={connectOAuth} disabled={busy === 'oauth'}
              className="px-3 py-1.5 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
              {busy === 'oauth' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              Reconnect
            </button>
            <button onClick={sync} disabled={busy === 'sync'}
              className="px-3 py-1.5 rounded-button border border-border text-body-sm text-text-secondary hover:bg-surface-secondary disabled:opacity-50 inline-flex items-center gap-1.5">
              {busy === 'sync' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Sync now
            </button>
            <button onClick={disconnect} disabled={busy === 'disconnect'}
              className="px-3 py-1.5 rounded-button border border-border text-body-sm text-error hover:bg-error/5 disabled:opacity-50 inline-flex items-center gap-1.5">
              {busy === 'disconnect' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Disconnect
            </button>
          </div>
        </>
      )}

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

      {/* Advanced — paste API key fallback (BYOK) */}
      <div className="pt-2 border-t border-border-subtle">
        <button onClick={() => setShowAdvanced((v) => !v)}
          className="inline-flex items-center gap-1.5 text-small text-text-tertiary hover:text-text-secondary">
          <KeyRound className="w-3.5 h-3.5" />
          Advanced: use an API key
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
        </button>
        {showAdvanced && (
          <div className="mt-3 space-y-2">
            <p className="text-small text-text-tertiary">
              For Motive accounts where OAuth isn't available. Stored encrypted.
            </p>
            <input type="password" value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="mot_xxxxx"
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
            <button onClick={saveApiKey} disabled={busy === 'save' || !apiKey.trim()}
              className="px-3 py-1.5 rounded-button bg-surface-secondary border border-border text-body-sm text-text-primary hover:bg-surface-tertiary disabled:opacity-50 inline-flex items-center gap-1.5">
              {busy === 'save' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Save API key
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Generic form for non-Motive providers (Samsara, morprotms, manual).
 * Same shape as before.
 */
function ProviderForm({ provider, meta, onChange }) {
  if (meta?.disabled) {
    return (
      <p className="text-body-sm text-text-tertiary">
        {provider.status?.reason === 'samsara_not_implemented'
          ? "Coming next. We'll let you know when it's ready to connect."
          : 'Not available yet.'}
      </p>
    );
  }

  // morprotms + manual have no inputs and no actions — just description.
  return (
    <p className="text-body-sm text-text-tertiary">
      {meta?.description}
    </p>
  );
}

function ConnPill({ connected }) {
  const cls = connected
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cls}`}>{connected ? 'connected' : 'not connected'}</span>;
}
