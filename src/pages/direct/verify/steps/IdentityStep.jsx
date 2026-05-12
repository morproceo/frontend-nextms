import { useState } from 'react';
import { Loader2, ArrowRight, Fingerprint } from 'lucide-react';
import verificationApi from '../../../../api/networkVerification.api';

/**
 * Screen 3 — Stripe Identity. Two phases:
 *   a) "start" — open the Stripe-hosted flow in a new tab.
 *   b) "complete" — after they finish in the new tab, they come back and
 *      tap "I'm done." We poll Stripe (or accept stub_name in stub mode).
 *
 * In stub mode (no STRIPE_SECRET_KEY), instead of opening a tab we show a
 * "Mark complete (stub)" button + an editable name field that mimics
 * Stripe's verified output. Useful for local dev.
 */
export default function IdentityStep({ verification, refresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [phase, setPhase] = useState(verification?.identity_session_id ? 'complete' : 'start');
  const [stub, setStub] = useState({ url: null, sessionId: null, isStub: false });
  const [stubName, setStubName] = useState(verification?.linq_legal_name || '');

  const start = async () => {
    setBusy(true); setError(null);
    try {
      const r = await verificationApi.startIdentity();
      setStub({ url: r.url, sessionId: r.sessionId, isStub: !!r.stub });
      if (r.url && !r.stub) window.open(r.url, '_blank');
      setPhase('complete');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  const complete = async () => {
    setBusy(true); setError(null);
    try {
      // In stub mode we pass the user-typed name as the verified output.
      const isStubSession = (verification?.identity_session_id || stub.sessionId || '').startsWith('vs_stub_');
      await verificationApi.completeIdentity(isStubSession ? { stub_name: stubName } : {});
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  if (phase === 'start') {
    return (
      <div className="space-y-6">
        <div className="bg-surface-primary border border-border-subtle rounded-card p-5 text-center">
          <Fingerprint className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary">Stripe will guide you through:</p>
          <ul className="text-body-sm text-text-primary mt-3 space-y-1.5 inline-block text-left">
            <li>• Photo of your driver's license</li>
            <li>• A quick selfie (used to match the photo on your ID)</li>
          </ul>
          <p className="text-small text-text-tertiary mt-4">It opens in a new tab. Comes back here when you're done.</p>
        </div>

        {error && (
          <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        <button onClick={start} disabled={busy}
          className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90 disabled:opacity-50">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Start verification <ArrowRight className="w-5 h-5" /></>}
        </button>
      </div>
    );
  }

  // phase === 'complete'
  const isStubSession = (verification?.identity_session_id || '').startsWith('vs_stub_');
  return (
    <div className="space-y-6">
      <div className="bg-surface-primary border border-border-subtle rounded-card p-5">
        <p className="text-body-sm text-text-primary font-medium mb-2">Finished in the other tab?</p>
        <p className="text-body-sm text-text-secondary">Tap below and we'll pull the result from Stripe.</p>
        {isStubSession && (
          <div className="mt-4 pt-4 border-t border-border-subtle">
            <label className="block text-small text-text-tertiary mb-1 uppercase tracking-wider">Stub-mode: pretend Stripe verified this name</label>
            <input
              type="text"
              value={stubName}
              onChange={(e) => setStubName(e.target.value)}
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm text-text-primary"
            />
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <button onClick={complete} disabled={busy}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90 disabled:opacity-50">
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>I'm done <ArrowRight className="w-5 h-5" /></>}
      </button>

      <button type="button" onClick={() => setPhase('start')}
        className="text-body-sm text-text-secondary hover:text-text-primary block mx-auto">
        Re-open Stripe verification
      </button>
    </div>
  );
}
