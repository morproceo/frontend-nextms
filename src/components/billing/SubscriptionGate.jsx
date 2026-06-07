/**
 * SubscriptionGate — wraps AppShell + DirectShell. Renders children
 * always; if the org's subscription is blocked (expired/cancelled/past-
 * due-locked), overlays the PaywallModal on top and disables clicks on
 * the page underneath.
 *
 * MorPro Connect is NOT wrapped — that's the loss leader, free even
 * when the org's subscription is dead.
 *
 * Super-admins see no paywall (backend `access-state` returns
 * blocked=false for them).
 *
 * Also listens for the global `paywall:show` event emitted by the API
 * client's 402 interceptor — so a stale tab that didn't catch the
 * status flip via poll can still open the paywall when its first
 * paid API call returns 402.
 */

import { useEffect, useState } from 'react';
import { useAccessState } from '../../hooks/billing/useAccessState';
import { PaywallModal } from './PaywallModal';

export function SubscriptionGate({ children }) {
  const { state, loading } = useAccessState();
  const [forceShow, setForceShow] = useState(false);

  // Listen for the 402 interceptor's `paywall:show` event so any paid
  // API call that returns 402 opens the paywall, even if the gate
  // hadn't yet detected the block via its 30s poll.
  useEffect(() => {
    const handler = () => setForceShow(true);
    window.addEventListener('paywall:show', handler);
    return () => window.removeEventListener('paywall:show', handler);
  }, []);

  const blocked = !loading && (state?.blocked === true || forceShow);

  return (
    <>
      {/* Children always render so the page paints (the paywall is an
          overlay, not a redirect). When blocked, we slightly fade the
          children and disable pointer events so they can't act. */}
      <div
        aria-hidden={blocked}
        style={{
          filter: blocked ? 'blur(2px) saturate(0.85)' : undefined,
          pointerEvents: blocked ? 'none' : undefined,
          userSelect: blocked ? 'none' : undefined,
          transition: 'filter 200ms ease'
        }}
      >
        {children}
      </div>

      {blocked && (
        <PaywallModal
          accessState={state}
          onClose={() => {
            // Closing is informational only — the gate stays blocked
            // until the org actually subscribes (state.blocked === false)
            // or the user navigates to Connect. We toggle the force flag
            // off so the next poll's truth wins.
            setForceShow(false);
          }}
        />
      )}
    </>
  );
}

export default SubscriptionGate;
