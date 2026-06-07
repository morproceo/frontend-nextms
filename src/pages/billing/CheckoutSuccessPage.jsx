/**
 * CheckoutSuccessPage — landing page after Stripe Checkout completes.
 *
 * URL: /o/:orgSlug/billing/success?session_id=cs_...
 *
 * The session ID is informational; we don't trust the redirect to mean
 * activated. Instead we poll /v1/billing/access-state until the
 * webhook flips the org to `active`. On flip:
 *   - call refreshOrganization() so currentOrg gets the new plan +
 *     limits without a hard refresh
 *   - navigate to /o/:slug/dashboard
 *
 * If 30s pass without a flip, show a manual "Refresh" + a "Reconcile
 * with Stripe" button (calls /v1/billing/checkout/verify) so the user
 * isn't stuck on a spinner.
 */

import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle, RefreshCcw } from 'lucide-react';
import billingApi from '../../api/billing.api';
import { useOrg } from '../../contexts/OrgContext';

const POLL_INTERVAL_MS = 1500;
const POLL_TIMEOUT_MS = 30_000;

export function CheckoutSuccessPage() {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { refreshOrganization } = useOrg();
  const [phase, setPhase] = useState('activating'); // activating | success | timeout
  const [reconciling, setReconciling] = useState(false);
  const startedAtRef = useRef(Date.now());

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      if (cancelled) return;
      try {
        const state = await billingApi.getAccessState();
        if (cancelled) return;
        if (state?.blocked === false) {
          setPhase('success');
          if (refreshOrganization) await refreshOrganization();
          setTimeout(() => {
            if (!cancelled) navigate(`/o/${orgSlug}/dashboard`, { replace: true });
          }, 800);
          return;
        }
        if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
          setPhase('timeout');
          return;
        }
        setTimeout(tick, POLL_INTERVAL_MS);
      } catch {
        if (Date.now() - startedAtRef.current > POLL_TIMEOUT_MS) {
          setPhase('timeout');
        } else {
          setTimeout(tick, POLL_INTERVAL_MS);
        }
      }
    };
    tick();
    return () => { cancelled = true; };
  }, [navigate, orgSlug, refreshOrganization]);

  const reconcile = async () => {
    setReconciling(true);
    try {
      await billingApi.verifyCheckout();
      startedAtRef.current = Date.now();
      setPhase('activating');
    } catch {
      // Stay in timeout; user can refresh manually.
    } finally {
      setReconciling(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="relative max-w-md w-full rounded-3xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-8 shadow-2xl">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,204,255,0.22) 0%, transparent 70%)' }}
        />
        <div className="relative">
          {phase === 'activating' && <ActivatingState />}
          {phase === 'success' && <SuccessState />}
          {phase === 'timeout' && (
            <TimeoutState
              onReconcile={reconcile}
              reconciling={reconciling}
              orgSlug={orgSlug}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function ActivatingState() {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center mx-auto mb-4">
        <Loader2 className="w-5 h-5 text-cyan-300 animate-spin" />
      </div>
      <h1 className="text-xl font-semibold text-white">Activating your subscription</h1>
      <p className="text-body-sm text-white/60 mt-2">
        Hang tight — Stripe is sending us confirmation. This usually takes a couple of seconds.
      </p>
    </div>
  );
}

function SuccessState() {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
        <CheckCircle2 className="w-6 h-6 text-emerald-400" />
      </div>
      <h1 className="text-xl font-semibold text-white">You're in!</h1>
      <p className="text-body-sm text-white/60 mt-2">
        Welcome aboard. Sending you to your dashboard…
      </p>
    </div>
  );
}

function TimeoutState({ onReconcile, reconciling, orgSlug }) {
  return (
    <div className="text-center">
      <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-5 h-5 text-amber-300" />
      </div>
      <h1 className="text-xl font-semibold text-white">Still processing</h1>
      <p className="text-body-sm text-white/60 mt-2">
        Stripe took longer than usual to confirm. Your payment likely went through — try one of these:
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <button
          type="button"
          onClick={onReconcile}
          disabled={reconciling}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold disabled:opacity-50"
        >
          {reconciling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCcw className="w-3.5 h-3.5" />}
          Reconcile with Stripe
        </button>
        <Link
          to={`/o/${orgSlug}/dashboard`}
          className="text-small text-white/60 hover:text-white"
        >
          Take me to the dashboard
        </Link>
      </div>
    </div>
  );
}

export default CheckoutSuccessPage;
