import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { KeyRound, ArrowLeft, Loader2, CheckCircle2, Clock, Mail } from 'lucide-react';
import organizationsApi from '../../api/organizations.api';

/**
 * Onboarding — join an existing organization by code.
 *
 * Submit → POST /v1/organizations/join-request with the typed code.
 * Backend creates an `invited` membership; an admin still has to approve.
 * Frontend shows a friendly "we'll let you know" state and pings the user
 * to look at their email.
 */
export function JoinOrgPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role');

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!code.trim()) {
      setError('Enter the code your admin shared with you.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await organizationsApi.joinByCode(code.trim().toUpperCase());
      setResult(res?.data || res);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return <SuccessCard result={result} />;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
            <KeyRound className="w-7 h-7 text-accent" />
          </div>
          <h1 className="text-headline text-text-primary mb-2">
            Enter your join code
          </h1>
          <p className="text-body text-text-secondary">
            Your org's admin should have shared a code with you.
          </p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="ACME-7F2K"
            autoFocus
            maxLength={20}
            autoCapitalize="characters"
            spellCheck={false}
            className="w-full px-5 py-4 text-2xl font-mono tracking-wider text-center rounded-button border-2 border-border bg-surface-primary text-text-primary uppercase placeholder:text-text-tertiary placeholder:tracking-widest focus:border-accent focus:outline-none"
          />

          {error && (
            <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
              <p className="text-body-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting || !code.trim()}
            className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button bg-accent text-white text-body font-semibold hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Request access'}
          </button>
        </form>

        <div className="mt-6 text-center space-y-2">
          <p className="text-small text-text-tertiary">
            Don't have a code?{' '}
            <Link
              to={role ? `/create-org?role=${role}` : '/onboarding/role'}
              className="text-accent hover:underline"
            >
              Create a new organization instead
            </Link>
          </p>
          <Link
            to={role ? `/onboarding/path?role=${role}` : '/onboarding/role'}
            className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function SuccessCard({ result }) {
  const isAlreadyActive = result?.already_active;
  const isAlreadyPending = result?.already_pending;
  const orgName = result?.organization?.name || 'this organization';

  if (isAlreadyActive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
          </div>
          <h1 className="text-headline text-text-primary mb-2">
            You're already in!
          </h1>
          <p className="text-body text-text-secondary mb-6">
            Looks like you're already a member of <strong>{orgName}</strong>.
          </p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button bg-accent text-white text-body font-semibold hover:bg-accent-hover"
          >
            Sign in to continue
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-md text-center">
        <div className="w-16 h-16 rounded-full bg-amber-500/15 flex items-center justify-center mx-auto mb-4">
          <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
        </div>
        <h1 className="text-headline text-text-primary mb-2">
          {isAlreadyPending ? "You're already in the queue" : "Request sent!"}
        </h1>
        <p className="text-body text-text-secondary mb-6">
          We sent your request to join <strong>{orgName}</strong>. An admin needs to approve it before you're in.
        </p>

        <div className="rounded-card border border-border-subtle bg-surface-primary p-5 text-left mb-6">
          <p className="text-body-sm font-medium text-text-primary mb-2 flex items-center gap-2">
            <Mail className="w-4 h-4 text-text-tertiary" />
            What happens next
          </p>
          <ol className="text-body-sm text-text-secondary space-y-1.5 list-decimal list-inside">
            <li>Your admin sees your request in their members page.</li>
            <li>They approve you. We email you.</li>
            <li>You sign back in and you're in.</li>
          </ol>
        </div>

        <Link
          to="/login"
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default JoinOrgPage;
