/**
 * MotiveIntegrationPage
 * Org-level Motive ELD integration setup. Surfaced from
 * /o/:slug/settings/integrations → Motive card.
 *
 * Primary path is OAuth: "Connect with Motive" opens a popup pointed at
 * gomotive.com. After consent, Motive redirects to the backend
 * callback; the popup ends on /oauth/motive/result, which posts a
 * message back to this page so it can re-fetch settings.
 *
 * The legacy "paste an API key" BYOK form is preserved under an
 * Advanced disclosure for Motive accounts that don't have OAuth enabled.
 *
 * Connection state, vehicle list, and webhook URL still come from the
 * /v1/ava/settings endpoint family (the underlying motive.service was
 * named "ava" historically; the data + routes stayed stable when we
 * moved the UI off the TMS Tools menu).
 */

import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import { Spinner } from '../../../components/ui/Spinner';
import * as avaApi from '../../../api/ava.api';
import * as motiveOAuthApi from '../../../api/motiveOAuth.api';
import {
  ArrowLeft,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link2,
  Truck,
  RefreshCw,
  Copy,
  ExternalLink,
  KeyRound,
  ChevronDown
} from 'lucide-react';

export function MotiveIntegrationPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [settings, setSettings] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [connecting, setConnecting] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  // BYOK ("Advanced") state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const popupRef = useRef(null);
  const popupPollRef = useRef(null);

  const webhookUrl = `${window.location.origin}/webhooks/motive`;

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setError(null);
      const res = await avaApi.getSettings();
      setSettings(res.data);
      if (res.data?.configured) {
        fetchVehicles();
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await avaApi.getMotiveVehicles();
      setVehicles(res.data?.vehicles || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // ─── OAuth popup flow ─────────────────────────────────────────────
  // Listen for the result page postMessage. The popup may also just
  // close itself (e.g. user closed the window early) — poll as fallback.
  useEffect(() => {
    const onMessage = (ev) => {
      if (ev.origin !== window.location.origin) return;
      const data = ev.data || {};
      if (data.source !== 'motive-oauth') return;
      if (data.status === 'success') {
        setSuccess(data.company ? `Connected to ${data.company}` : 'Connected to Motive');
        fetchSettings();
      } else {
        setError(data.message || 'Connection failed');
      }
      setConnecting(false);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
    window.addEventListener('message', onMessage);
    return () => {
      window.removeEventListener('message', onMessage);
      if (popupPollRef.current) clearInterval(popupPollRef.current);
    };
  }, []);

  const handleConnectOAuth = async () => {
    try {
      setError(null); setSuccess(null); setConnecting(true);
      const { authUrl } = await motiveOAuthApi.startConnect('org');
      const popup = motiveOAuthApi.openOAuthPopup(authUrl);
      popupRef.current = popup;
      if (!popup) {
        setError('Popup blocked — please allow popups for this site and try again.');
        setConnecting(false);
        return;
      }
      // Fallback poll — if the popup closes without postMessage, refresh
      // settings to detect a connection that completed.
      popupPollRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(popupPollRef.current);
          setConnecting(false);
          fetchSettings();
        }
      }, 700);
    } catch (err) {
      setConnecting(false);
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDisconnect = async () => {
    if (!window.confirm('Disconnect Motive? Your fleet data will stop syncing until you reconnect.')) return;
    try {
      setDisconnecting(true); setError(null); setSuccess(null);
      await motiveOAuthApi.disconnect('org');
      setSuccess('Motive disconnected');
      setVehicles([]);
      await fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setDisconnecting(false);
    }
  };

  // ─── BYOK (advanced) handlers ─────────────────────────────────────
  const handleTest = async () => {
    try {
      setTesting(true); setTestResult(null); setError(null);
      const res = await avaApi.testConnection(apiKey || null);
      setTestResult(res.data);
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.message || err.message });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) { setError('API key is required'); return; }
    try {
      setSaving(true); setError(null); setSuccess(null);
      await avaApi.saveSettings(apiKey);
      setSuccess('Motive API key saved');
      setApiKey('');
      await fetchSettings();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setSuccess('Webhook URL copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const integration = settings?.integration;
  const isOAuth = integration?.auth_type === 'oauth';
  const connected = !!settings?.configured && !!integration?.is_active;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/settings/integrations'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-title text-text-primary flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Motive integration
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Connect your Motive (formerly KeepTruckin) ELD account so MorPro can pull live truck health,
            fault codes, and HOS data for your fleet.
          </p>
        </div>
      </div>

      {/* Success / Error banners */}
      {success && (
        <Card padding="default" className="bg-success/5 border border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-body-sm text-success">{success}</p>
          </div>
        </Card>
      )}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      {/* Primary card: connection state + Connect/Disconnect */}
      <Card padding="default">
        {connected ? (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-body font-medium text-text-primary">
                    {integration?.motive_company_name || 'Motive account'}
                  </p>
                  <p className="text-small text-text-secondary">
                    {isOAuth ? 'Connected via OAuth' : 'Connected via API key'}
                  </p>
                </div>
              </div>
              <Badge variant="green">Connected</Badge>
            </div>

            <div className="mt-4 pt-4 border-t border-surface-tertiary grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-small text-text-tertiary">Vehicles</p>
                <p className="text-body font-medium text-text-primary">
                  {integration.vehicle_count || 0}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Last sync</p>
                <p className="text-body font-medium text-text-primary">
                  {integration.last_sync_at
                    ? new Date(integration.last_sync_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Method</p>
                <p className="text-body font-medium text-text-primary">
                  {isOAuth ? 'OAuth 2.0' : 'API key'}
                </p>
              </div>
            </div>

            {isOAuth && integration.oauth_scopes?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-surface-tertiary">
                <p className="text-small text-text-tertiary mb-2">Granted scopes</p>
                <div className="flex flex-wrap gap-1.5">
                  {integration.oauth_scopes.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full text-[11px] bg-surface-secondary text-text-secondary border border-surface-tertiary">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {integration?.sync_error && (
              <div className="mt-4 p-3 bg-error/5 rounded-lg">
                <p className="text-small text-error">{integration.sync_error}</p>
              </div>
            )}

            <div className="mt-5 flex gap-2">
              <Button variant="secondary" onClick={handleConnectOAuth} disabled={connecting}>
                {connecting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
                Reconnect
              </Button>
              <Button variant="ghost" onClick={handleDisconnect} disabled={disconnecting}>
                {disconnecting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Disconnect
              </Button>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-3">
              <Zap className="w-7 h-7 text-amber-500" />
            </div>
            <h2 className="text-body font-medium text-text-primary">Connect your Motive account</h2>
            <p className="text-body-sm text-text-secondary mt-1 max-w-md mx-auto">
              You'll be sent to gomotive.com to authorize MorPro. No API keys to copy or paste.
            </p>
            <Button onClick={handleConnectOAuth} disabled={connecting} className="mt-4">
              {connecting ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Zap className="w-4 h-4 mr-2" />}
              Connect with Motive
            </Button>
          </div>
        )}
      </Card>

      {/* Webhook Configuration */}
      <Card padding="default">
        <h2 className="text-body font-medium text-text-primary mb-4">Webhook URL</h2>
        <p className="text-body-sm text-text-secondary mb-4">
          Optional — paste this URL into your Motive dashboard's webhook settings to receive
          real-time fault and location updates.
        </p>
        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-surface-secondary rounded-lg font-mono text-small text-text-primary overflow-x-auto">
            {webhookUrl}
          </div>
          <Button variant="secondary" onClick={handleCopyWebhook}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>
        <div className="mt-4">
          <a
            href="https://gomotive.com/developer/docs/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-accent hover:underline flex items-center gap-1"
          >
            Motive webhook documentation
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </Card>

      {/* Linked Vehicles (only when connected) */}
      {connected && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between">
            <h2 className="text-body font-medium text-text-primary">Motive vehicles</h2>
            <Button variant="ghost" size="sm" onClick={fetchVehicles} disabled={loadingVehicles}>
              <RefreshCw className={`w-4 h-4 ${loadingVehicles ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loadingVehicles ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="w-12 h-12 text-text-tertiary mb-3" />
              <p className="text-body-sm text-text-secondary">No vehicles found</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-tertiary">
              {vehicles.map((wrapper) => {
                const v = wrapper.vehicle || wrapper;
                return (
                  <div key={v.id} className="flex items-center gap-3 p-4">
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                      <Truck className="w-5 h-5 text-text-secondary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-body font-medium text-text-primary">
                        {v.number || `Vehicle ${v.id}`}
                      </p>
                      <p className="text-small text-text-secondary">
                        {[v.year, v.make, v.model].filter(Boolean).join(' ')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* Advanced: paste API key */}
      <Card padding="default">
        <button
          type="button"
          className="w-full flex items-center justify-between text-left"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          <div className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-text-tertiary" />
            <span className="text-body-sm font-medium text-text-primary">
              Advanced: use an API key
            </span>
          </div>
          <ChevronDown className={`w-4 h-4 text-text-tertiary transition-transform ${
            showAdvanced ? 'rotate-180' : ''
          }`} />
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <p className="text-body-sm text-text-secondary">
              For Motive accounts where OAuth isn't available, paste an API key from
              <span className="font-mono"> Motive → Settings → Developer</span>.
              Stored encrypted at rest.
            </p>

            <div>
              <label className="block text-small font-medium text-text-secondary mb-1">
                Motive API Key
              </label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Paste your Motive API key"
              />
            </div>

            {testResult && (
              <div className={`p-3 rounded-lg ${testResult.success ? 'bg-success/5' : 'bg-error/5'}`}>
                <div className="flex items-center gap-2">
                  {testResult.success
                    ? <CheckCircle className="w-4 h-4 text-success" />
                    : <XCircle className="w-4 h-4 text-error" />}
                  <p className={`text-small ${testResult.success ? 'text-success' : 'text-error'}`}>
                    {testResult.success
                      ? `Connection successful — ${testResult.vehicle_count || 0} vehicle(s) found.`
                      : testResult.error}
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={handleTest}
                disabled={testing || (!apiKey && !settings?.configured)}
              >
                {testing
                  ? <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                  : <Link2 className="w-4 h-4 mr-2" />}
                Test
              </Button>
              <Button onClick={handleSaveApiKey} disabled={saving || !apiKey.trim()}>
                {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                Save API key
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export default MotiveIntegrationPage;
