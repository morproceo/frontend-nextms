import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, ArrowLeft, ArrowRight, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { authApi } from '../../api/auth.api';

/**
 * Onboarding — standalone driver account.
 *
 * No carrier invite required: the user picks "I'm a driver" and we flip
 * their `is_driver` flag. They land on /driver where they can manage their
 * personal CDL, medical card, and (later) accept carrier invites.
 */
export function DriverStandalonePage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      await authApi.becomeDriver();
      navigate('/driver');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-headline text-text-primary mb-2">
            Set up your driver profile
          </h1>
          <p className="text-body text-text-secondary">
            Get started even before a carrier adds you. You can join their team later with one tap.
          </p>
        </div>

        <div className="rounded-card border border-border-subtle bg-surface-primary p-6 mb-6">
          <p className="text-body-sm font-medium text-text-primary mb-3">
            What you'll get
          </p>
          <ul className="space-y-2.5">
            <Bullet>Track your CDL, medical card, and other doc expirations</Bullet>
            <Bullet>Accept carrier invites by code when one shows up</Bullet>
            <Bullet>See your loads, hours, and pay once you're on a fleet</Bullet>
          </ul>
        </div>

        {error && (
          <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <p className="text-body-sm">{error}</p>
          </div>
        )}

        <button
          onClick={start}
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button bg-accent text-white text-body font-semibold hover:bg-accent-hover disabled:opacity-50"
        >
          {busy
            ? <Loader2 className="w-5 h-5 animate-spin" />
            : <>Continue <ArrowRight className="w-5 h-5" /></>}
        </button>

        <div className="mt-6 text-center">
          <Link
            to="/onboarding/role"
            className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function Bullet({ children }) {
  return (
    <li className="flex items-start gap-2 text-body-sm text-text-secondary">
      <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
      <span>{children}</span>
    </li>
  );
}

export default DriverStandalonePage;
