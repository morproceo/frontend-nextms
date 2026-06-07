/**
 * CheckoutCancelPage — Stripe Checkout cancel landing.
 *
 * URL: /o/:orgSlug/billing/cancel
 *
 * No charge was made. The org is still in whatever blocked state it
 * was in before — when we navigate back into the app, the
 * SubscriptionGate will detect that and re-open the paywall.
 */

import { Link, useParams } from 'react-router-dom';
import { Info, ArrowRight, Network } from 'lucide-react';

export function CheckoutCancelPage() {
  const { orgSlug } = useParams();
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 p-6">
      <div className="relative max-w-md w-full rounded-3xl bg-white/[0.04] backdrop-blur-md border border-white/[0.08] p-8 shadow-2xl">
        <div
          aria-hidden
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,204,255,0.18) 0%, transparent 70%)' }}
        />
        <div className="relative text-center">
          <div className="w-12 h-12 rounded-2xl bg-white/[0.06] border border-white/[0.08] flex items-center justify-center mx-auto mb-4">
            <Info className="w-5 h-5 text-white/70" />
          </div>
          <h1 className="text-xl font-semibold text-white">No charge made</h1>
          <p className="text-body-sm text-white/60 mt-2">
            We cancelled the checkout. You can come back any time — your
            data is safe.
          </p>
          <div className="mt-5 flex flex-col gap-2">
            <Link
              to={`/o/${orgSlug}/dashboard`}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold"
            >
              Back to paywall
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              to={`/o/${orgSlug}/connect`}
              className="inline-flex items-center justify-center gap-1.5 text-small text-white/55 hover:text-cyan-300"
            >
              <Network className="w-3 h-3" />
              Or open MorPro Connect — always free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CheckoutCancelPage;
