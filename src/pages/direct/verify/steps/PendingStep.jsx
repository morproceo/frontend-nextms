import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircle2, Hourglass, AlertCircle, ArrowRight, Mail } from 'lucide-react';

/**
 * Final screen — three states:
 *   - submitted  → "We're reviewing — typically within 24h."
 *   - approved   → "You're in! Open Direct →" (parent auto-redirects)
 *   - rejected   → reason + how to fix.
 *
 * VerifyPage handles the auto-redirect on approval. We poll for status
 * updates every 5s while submitted, so if an admin approves the carrier
 * sees it without refreshing.
 */
export default function PendingStep({ verification, refresh }) {
  const status = verification?.status;

  useEffect(() => {
    if (status !== 'submitted') return;
    const t = setInterval(() => { refresh(); }, 5000);
    return () => clearInterval(t);
  }, [status, refresh]);

  if (status === 'approved') {
    return <Approved />;
  }
  if (status === 'rejected') {
    return <Rejected reason={verification?.rejection_reason} />;
  }
  return <Submitted />;
}

function Submitted() {
  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-amber-500/15 flex items-center justify-center">
        <Hourglass className="w-7 h-7 text-amber-600 dark:text-amber-400" />
      </div>
      <div>
        <h2 className="text-title-lg text-text-primary">We're reviewing</h2>
        <p className="text-body text-text-secondary mt-2 max-w-md mx-auto">
          Most carriers hear back within 24 hours. We'll email you the moment you're approved.
        </p>
      </div>
      <div className="bg-surface-primary border border-border-subtle rounded-card p-4 text-left max-w-md mx-auto">
        <p className="text-body-sm font-medium text-text-primary mb-2 flex items-center gap-2">
          <Mail className="w-4 h-4" /> What happens next
        </p>
        <ol className="text-body-sm text-text-secondary space-y-1.5 list-decimal list-inside">
          <li>A reviewer checks your submission.</li>
          <li>You get an email with the decision.</li>
          <li>If approved, MorPro Direct unlocks — refresh and you're in.</li>
        </ol>
      </div>
      <p className="text-small text-text-tertiary">You can close this tab. We'll email you.</p>
    </div>
  );
}

function Approved() {
  // Parent handles the actual redirect on this state. This is what flashes
  // for a moment before the redirect fires.
  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/15 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
      </div>
      <div>
        <h2 className="text-title-lg text-text-primary">You're in!</h2>
        <p className="text-body text-text-secondary mt-2">Welcome to MorPro Direct. Loading your dashboard…</p>
      </div>
    </div>
  );
}

function Rejected({ reason }) {
  return (
    <div className="text-center space-y-5">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-500/15 flex items-center justify-center">
        <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>
      <div>
        <h2 className="text-title-lg text-text-primary">We couldn't approve this</h2>
        {reason && (
          <p className="text-body text-text-secondary mt-2 max-w-md mx-auto">
            {reason}
          </p>
        )}
      </div>
      <p className="text-small text-text-tertiary max-w-md mx-auto">
        If you think this is a mistake, reply to the email we sent and a real
        person will look at your case.
      </p>
    </div>
  );
}
