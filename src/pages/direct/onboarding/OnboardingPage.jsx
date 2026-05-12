import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  CheckCircle2, Circle, Loader2, ShieldCheck, FileText, Fingerprint,
  Wallet, ExternalLink, AlertCircle
} from 'lucide-react';
import networkApi from '../../../api/network.api';

/**
 * Carrier onboarding wizard — Phase 5.
 *
 * 4-gate progress:
 *   1. Profile submitted (Phase 1)
 *   2. MorPro doc review (Phase 1)
 *   3. Stripe Identity KYC (Phase 5)
 *   4. Custom Connect account (Phase 5)
 *
 * In stub mode (no STRIPE_SECRET_KEY): step 3 + 4 each have a "Mark complete (stub)"
 * button so we can walk the flow without real Stripe.
 */
export default function OnboardingPage() {
  const { orgSlug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(null);
  const [error, setError] = useState(null);

  const refresh = async () => {
    try {
      const r = await networkApi.getOnboarding();
      setData(r);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, []);

  const onStartIdentity = async () => {
    setActing('identity');
    try {
      const r = await networkApi.startIdentity();
      if (r.redirect_url) window.open(r.redirect_url, '_blank');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };
  const onStubVerifyIdentity = async () => {
    setActing('identity-stub');
    try { await networkApi.stubVerifyIdentity(); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };
  const onProvisionConnect = async () => {
    setActing('connect');
    try {
      const r = await networkApi.provisionConnect();
      if (r.onboarding_url) window.open(r.onboarding_url, '_blank');
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setActing(null); }
  };
  const onStubActivateConnect = async () => {
    setActing('connect-stub');
    try { await networkApi.stubActivateConnect(); await refresh(); }
    catch (err) { setError(err.response?.data?.error?.message || err.message); }
    finally { setActing(null); }
  };

  if (loading) return <div className="px-6 py-10 max-w-3xl mx-auto"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!data) return <div className="px-6 py-10 max-w-3xl mx-auto"><p className="text-error">{error || 'Failed to load.'}</p></div>;

  const stub = data.stripeMode === 'stub';

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Payment onboarding</h1>
          <p className="text-body-sm text-text-secondary">
            Complete these four steps so you can accept paid loads.
            {stub && <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-400 font-medium">Stub mode</span>}
          </p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {data.canAcceptPayments && (
        <div className="rounded-card border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-body-sm font-medium text-text-primary">All four gates clear.</p>
            <p className="text-small text-text-secondary mt-0.5">Your org is fully onboarded for payments.</p>
          </div>
        </div>
      )}

      <ol className="space-y-3">
        <Step
          num={1}
          icon={FileText}
          title="Profile submitted"
          done={data.gates[1].done}
          description={data.gates[1].done
            ? 'Your carrier profile is submitted to MorPro.'
            : 'Submit your public carrier profile.'}
          action={!data.gates[1].done && (
            <Link to={`/o/${orgSlug}/direct/me/profile`}
              className="px-3 py-1.5 rounded-button text-small font-medium bg-accent text-white">
              Open profile
            </Link>
          )}
        />
        <Step
          num={2}
          icon={ShieldCheck}
          title="MorPro doc review"
          done={data.gates[2].done}
          description={data.gates[2].done
            ? 'A MorPro super-admin verified your business docs.'
            : 'A MorPro super-admin must review your insurance + W-9 + MC authority.'}
          extra={data.gates[2].rejection_reason && (
            <p className="text-small text-error mt-1">Last rejection: {data.gates[2].rejection_reason}</p>
          )}
        />
        <Step
          num={3}
          icon={Fingerprint}
          title="Identity verification (Stripe Identity)"
          done={data.gates[3].done}
          description={data.gates[3].done
            ? 'Your admin identity has been verified.'
            : stub
              ? 'Stub mode: click "Mark verified" to simulate the Stripe Identity flow.'
              : 'Complete Stripe Identity (selfie + ID upload).'}
          locked={!data.gates[2].done}
          action={!data.gates[3].done && data.gates[2].done && (
            <div className="flex gap-2">
              <button onClick={onStartIdentity} disabled={!!acting}
                className="px-3 py-1.5 rounded-button text-small font-medium bg-accent text-white inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {acting === 'identity' ? 'Opening…' : 'Start verification'}
              </button>
              {stub && (
                <button onClick={onStubVerifyIdentity} disabled={!!acting}
                  className="px-3 py-1.5 rounded-button text-small font-medium border border-border">
                  {acting === 'identity-stub' ? 'Marking…' : 'Mark verified (stub)'}
                </button>
              )}
            </div>
          )}
        />
        <Step
          num={4}
          icon={Wallet}
          title="Connect payout account"
          done={data.gates[4].done}
          description={data.gates[4].done
            ? 'Your Stripe Connect account is provisioned and payouts are enabled.'
            : stub
              ? 'Stub mode: click "Mark active" to simulate provisioning + bank link.'
              : 'Provision your Stripe Custom Connect account and complete bank onboarding.'}
          locked={!data.gates[3].done}
          action={!data.gates[4].done && data.gates[3].done && (
            <div className="flex gap-2">
              <button onClick={onProvisionConnect} disabled={!!acting}
                className="px-3 py-1.5 rounded-button text-small font-medium bg-accent text-white inline-flex items-center gap-1">
                <ExternalLink className="w-3 h-3" />
                {acting === 'connect' ? 'Opening…' : 'Provision + link bank'}
              </button>
              {stub && (
                <button onClick={onStubActivateConnect} disabled={!!acting}
                  className="px-3 py-1.5 rounded-button text-small font-medium border border-border">
                  {acting === 'connect-stub' ? 'Marking…' : 'Mark active (stub)'}
                </button>
              )}
            </div>
          )}
        />
      </ol>
    </div>
  );
}

function Step({ num, icon: Icon, title, description, done, locked, action, extra }) {
  return (
    <li className={`rounded-card border p-4 flex gap-3 ${
      done ? 'border-emerald-500/30 bg-emerald-500/5' :
      locked ? 'border-border-subtle bg-surface-secondary opacity-60' :
      'border-border-subtle bg-surface-primary'
    }`}>
      <div className="flex-shrink-0">
        {done ? (
          <CheckCircle2 className="w-6 h-6 text-emerald-500" />
        ) : locked ? (
          <Circle className="w-6 h-6 text-text-tertiary" />
        ) : (
          <div className="w-6 h-6 rounded-full bg-accent text-white text-small font-medium flex items-center justify-center">
            {num}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-text-tertiary flex-shrink-0" />
          <p className="text-body-sm font-medium text-text-primary">{title}</p>
        </div>
        <p className="text-small text-text-secondary mt-1">{description}</p>
        {extra}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </li>
  );
}
