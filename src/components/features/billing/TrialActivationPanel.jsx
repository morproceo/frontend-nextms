/**
 * TrialActivationPanel — opens when the user taps a locked module tile
 * (Operations, Genie Suite, etc.) for the first time.
 *
 * Today this is the moment we ask for a card so the 14-day trial is
 * gated through Stripe Checkout. Under the hood it's the same PaywallModal
 * the global SubscriptionGate uses — just in `mode='trial'`. Stripe creates
 * the subscription with `trial_period_days: 14` (or preserves an existing
 * `trial_ends_at` for grandfathered orgs) so the card is held but not
 * charged for 14 days, then auto-charges.
 *
 * Props:
 *   open    — boolean (caller controls; we ignore `app` now since the
 *             paywall flow lands them in the dashboard via the success
 *             page, which is the right re-entry for any module).
 *   onClose
 */

import { PaywallModal } from '../../billing/PaywallModal';

export function TrialActivationPanel({ open, onClose }) {
  if (!open) return null;
  return <PaywallModal mode="trial" onClose={onClose} />;
}

export default TrialActivationPanel;
