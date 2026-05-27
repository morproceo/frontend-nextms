import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Mail,
  Loader2,
  AlertTriangle,
  Check,
  CheckCircle2,
  Trash2,
  Send,
  Plug,
  Link as LinkIcon,
  AlertCircle,
  Zap,
  ChevronRight
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import orgEmailApi from '../../../api/orgEmailConnections.api';
import * as avaApi from '../../../api/ava.api';
import { cn } from '../../../lib/utils';

/**
 * Organization → Integrations page.
 *
 * Org-level external system connections. Email is the first card.
 * LINQ / Spotty / Telematics will surface here too (currently managed
 * elsewhere; moving them here is a follow-up cleanup).
 *
 * Email card:
 *   - Lists connected accounts (read-only token metadata).
 *   - Connect Gmail button → POST /oauth/gmail/start → window redirects to Google.
 *   - After consent, Google redirects to our callback → callback redirects
 *     back to `${origin}/oauth/result` (or returnTo).
 *   - Test email button sends a self-test ping.
 *   - Revoke removes the local connection.
 */
export default function IntegrationsPage() {
  const { currentOrg, orgUrl } = useOrg();
  const navigate = useNavigate();
  const orgId = currentOrg?.id;
  const [searchParams, setSearchParams] = useSearchParams();

  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [flash, setFlash] = useState(null);

  // Motive status (so the integrations list shows a green dot when active)
  const [motive, setMotive] = useState(null);
  useEffect(() => {
    avaApi.getSettings().then((r) => setMotive(r?.data || r)).catch(() => setMotive(null));
  }, [orgId]);

  const successEmail = searchParams.get('email');
  const errorMessage = searchParams.get('message');
  const status = searchParams.get('status');

  useEffect(() => {
    if (status === 'success' && successEmail) {
      setFlash({ type: 'success', text: `Connected ${decodeURIComponent(successEmail)}` });
      const next = new URLSearchParams(searchParams);
      next.delete('status'); next.delete('email');
      setSearchParams(next, { replace: true });
    } else if (status === 'error') {
      setFlash({ type: 'error', text: errorMessage ? decodeURIComponent(errorMessage) : 'Connection failed' });
      const next = new URLSearchParams(searchParams);
      next.delete('status'); next.delete('message');
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const fetchConnections = async () => {
    if (!orgId) return;
    setLoading(true);
    try {
      const data = await orgEmailApi.listConnections(orgId);
      setConnections(data?.connections || []);
      setError(null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); /* eslint-disable-next-line */ }, [orgId]);

  const connectGmail = async () => {
    setBusy(true);
    setError(null);
    try {
      const here = `/o/${currentOrg.slug}/settings/integrations`;
      const { authUrl } = await orgEmailApi.startGmailOAuth(orgId, here);
      // Hand the browser off to Google. The user comes back to `here`.
      window.location.href = authUrl;
    } catch (err) {
      const msg = err?.response?.data?.error?.message || err.message;
      if (err?.response?.status === 503) {
        setError(
          'Gmail OAuth is not configured on this backend. Add GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REDIRECT_URI to backend .env and restart.'
        );
      } else {
        setError(msg);
      }
      setBusy(false);
    }
  };

  const revoke = async (cid) => {
    if (!confirm('Revoke this email connection? Agents will lose access immediately.')) return;
    try {
      await orgEmailApi.revokeConnection(orgId, cid);
      await fetchConnections();
      setFlash({ type: 'success', text: 'Connection revoked' });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    }
  };

  const test = async (cid) => {
    setBusy(true);
    setError(null);
    try {
      await orgEmailApi.testConnection(orgId, cid);
      setFlash({ type: 'success', text: 'Test email sent — check your inbox.' });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const active = connections.filter((c) => c.status === 'active');

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <Plug className="w-6 h-6" />
          Integrations
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          External systems your organization connects to. Email is the first one — every app
          and every Genie agent sends + reads through it.
        </p>
      </div>

      {flash && (
        <div className={cn(
          'mb-4 p-3 rounded-button flex items-center gap-2 text-body-sm',
          flash.type === 'success'
            ? 'bg-success/10 text-success border border-success/20'
            : 'bg-error/10 text-error border border-error/20'
        )}>
          {flash.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          {flash.text}
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded-button bg-error/10 text-error border border-error/20 text-body-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* ── Email card ────────────────────────────────────────────── */}
      <section className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
        <header className="px-5 py-4 border-b border-surface-tertiary flex items-start gap-3">
          <div className="w-10 h-10 rounded-button bg-gradient-to-br from-fuchsia-500/15 to-violet-500/15 flex items-center justify-center">
            <Mail className="w-5 h-5 text-fuchsia-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-body font-semibold text-text-primary">Email</h2>
            <p className="text-body-sm text-text-secondary mt-0.5 leading-snug">
              Lets Genie agents send broker updates, ETA pushes, receipt requests,
              and read your inbox for rate-cons + factoring notices. Connection
              is per-org; OAuth tokens stored encrypted, revocable any time.
            </p>
          </div>
        </header>

        {loading ? (
          <div className="p-6 flex items-center gap-2 text-body-sm text-text-tertiary">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading connections…
          </div>
        ) : active.length === 0 ? (
          <div className="p-6 flex flex-col items-start gap-3">
            <div className="text-body-sm text-text-secondary">
              No email connected yet. Connect a Gmail account so your agents can send + read mail
              on behalf of <span className="font-medium text-text-primary">{currentOrg?.name}</span>.
            </div>
            <button
              type="button"
              onClick={connectGmail}
              disabled={busy}
              className={cn(
                'flex items-center gap-2 px-4 py-2 rounded-button text-white text-body-sm font-medium transition-all',
                'bg-gradient-to-br from-violet-500 via-fuchsia-500 to-orange-400 hover:scale-[1.02]',
                busy && 'opacity-60 cursor-not-allowed'
              )}
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <LinkIcon className="w-4 h-4" />}
              Connect Gmail
            </button>
            <div className="text-small text-text-tertiary mt-1">
              Microsoft 365 + IMAP support coming next.
            </div>
          </div>
        ) : (
          <>
            <div className="divide-y divide-surface-tertiary">
              {active.map((c) => (
                <ConnectionRow
                  key={c.id}
                  connection={c}
                  busy={busy}
                  onRevoke={() => revoke(c.id)}
                  onTest={() => test(c.id)}
                />
              ))}
            </div>
            <div className="px-5 py-3 border-t border-surface-tertiary bg-surface-secondary/30">
              <button
                type="button"
                onClick={connectGmail}
                disabled={busy}
                className="flex items-center gap-1.5 text-body-sm text-fuchsia-600 hover:text-fuchsia-700 disabled:opacity-50"
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Connect another account
              </button>
            </div>
          </>
        )}
      </section>

      {/* ── Motive (ELD) card ─────────────────────────────────────── */}
      <IntegrationCard
        icon={Zap}
        iconCls="from-amber-500/15 to-orange-500/15 text-amber-500"
        title="Motive (ELD)"
        description="Pull live truck health, fault codes, and HOS data from your Motive (KeepTruckin) account. Powers Fleet Health, Driver Genie, and dispatch readiness checks."
        connected={!!motive?.configured && motive?.integration?.is_active}
        statusText={motive?.configured && motive?.integration?.is_active
          ? `Connected · ${motive?.integration?.vehicle_count ?? 0} vehicles`
          : 'Not connected'}
        onOpen={() => navigate(orgUrl('/settings/integrations/motive'))}
      />

      {/* Footer note */}
      <p className="text-small text-text-tertiary mt-4">
        Tokens are encrypted with AES-256-GCM at rest. Plaintext credentials never touch the database or logs.
        Revoke any time from this page — or from the provider's dashboard.
      </p>
    </div>
  );
}

/**
 * Generic integration card — icon + title + description + status + chevron.
 * Used for any integration whose settings live on a dedicated page.
 */
function IntegrationCard({ icon: Icon, iconCls, title, description, connected, statusText, onOpen }) {
  return (
    <section className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden mt-4">
      <button
        type="button"
        onClick={onOpen}
        className="w-full px-5 py-4 flex items-start gap-3 text-left hover:bg-surface-secondary/40 transition-colors"
      >
        <div className={cn('w-10 h-10 rounded-button bg-gradient-to-br flex items-center justify-center', iconCls)}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-body font-semibold text-text-primary">{title}</h2>
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-semibold border',
              connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-surface-secondary text-text-secondary border-surface-tertiary'
            )}>
              {connected ? <CheckCircle2 className="w-2.5 h-2.5" /> : <AlertCircle className="w-2.5 h-2.5" />}
              {connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p className="text-body-sm text-text-secondary mt-0.5 leading-snug">{description}</p>
          {statusText && (
            <p className="text-small text-text-tertiary mt-1.5">{statusText}</p>
          )}
        </div>
        <ChevronRight className="w-4 h-4 text-text-tertiary self-center shrink-0" />
      </button>
    </section>
  );
}

function ConnectionRow({ connection, busy, onRevoke, onTest }) {
  return (
    <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
      <div className="w-9 h-9 rounded-full bg-success/10 flex items-center justify-center flex-shrink-0">
        <Check className="w-4 h-4 text-success" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-medium text-text-primary truncate">
          {connection.email_address}
        </div>
        <div className="text-small text-text-secondary truncate">
          {connection.display_name ? `${connection.display_name} · ` : ''}
          {connection.provider.toUpperCase()}
          {connection.last_synced_at && (
            <> · last synced {new Date(connection.last_synced_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}</>
          )}
        </div>
        <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
          {connection.has_send_scope && (
            <ScopeBadge label="Send" />
          )}
          {connection.has_read_scope && (
            <ScopeBadge label="Read" />
          )}
          {connection.send_count_24h > 0 && (
            <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
              {connection.send_count_24h} sent (24h)
            </span>
          )}
        </div>
        {connection.last_error && (
          <div className="text-small text-error mt-1.5">{connection.last_error}</div>
        )}
      </div>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0 w-full sm:w-auto justify-end pl-[48px] sm:pl-0">
        <button
          type="button"
          onClick={onTest}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-body-sm text-text-secondary hover:text-text-primary hover:bg-surface-secondary disabled:opacity-50"
        >
          <Send className="w-3.5 h-3.5" />
          Test
        </button>
        <button
          type="button"
          onClick={onRevoke}
          disabled={busy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-chip text-body-sm text-error hover:bg-error/10 disabled:opacity-50"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Revoke
        </button>
      </div>
    </div>
  );
}

function ScopeBadge({ label }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-emerald-500/10 text-emerald-700 border border-emerald-500/20">
      <Check className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}
