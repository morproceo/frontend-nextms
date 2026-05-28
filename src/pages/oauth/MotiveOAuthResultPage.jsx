/**
 * Landing page after the Motive OAuth callback redirects the browser
 * back from gomotive.com. The backend has already exchanged the code
 * and persisted tokens; this page only:
 *
 *   1. Tells the user it worked (or didn't).
 *   2. postMessages the parent window so the integrations page can
 *      refresh itself, then closes the popup.
 *   3. If opened directly (not via popup), links back to integrations.
 */

import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Zap } from 'lucide-react';

export default function MotiveOAuthResultPage() {
  const [params] = useSearchParams();
  const status = params.get('status') || 'error';
  const message = params.get('message') || '';
  const company = params.get('company') || '';
  const mode = params.get('mode') || 'org';

  const isPopup = typeof window !== 'undefined' && !!window.opener && window.opener !== window;
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!isPopup) return;
    try {
      window.opener.postMessage(
        { source: 'motive-oauth', status, mode, company, message },
        window.location.origin
      );
    } catch {
      /* opener may be cross-origin in some setups; the parent can also
         poll the settings endpoint as a fallback. */
    }
    const t = setTimeout(() => {
      setClosing(true);
      window.close();
    }, 1200);
    return () => clearTimeout(t);
  }, [isPopup, status, mode, company, message]);

  const ok = status === 'success';

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="max-w-sm w-full bg-white rounded-card border border-surface-tertiary p-6 text-center">
        <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center ${
          ok ? 'bg-emerald-500/10' : 'bg-red-500/10'
        }`}>
          {ok
            ? <CheckCircle2 className="w-7 h-7 text-emerald-600" />
            : <XCircle className="w-7 h-7 text-red-600" />}
        </div>
        <div className="flex items-center justify-center gap-2 text-text-tertiary mb-2 text-small">
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Motive
        </div>
        <h1 className="text-title text-text-primary">
          {ok ? 'Connected!' : 'Connection failed'}
        </h1>
        <p className="text-body-sm text-text-secondary mt-2 break-words">
          {ok
            ? company
              ? `Connected to ${company}.`
              : 'Your Motive account is connected.'
            : (message || 'Something went wrong. Please try again.')}
        </p>

        {isPopup ? (
          <p className="text-small text-text-tertiary mt-4">
            {closing ? 'Closing…' : 'You can close this window.'}
          </p>
        ) : (
          <Link
            to={mode === 'user' ? '/driver/my-truck' : '/'}
            className="inline-block mt-5 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent/90"
          >
            Go back
          </Link>
        )}
      </div>
    </div>
  );
}
