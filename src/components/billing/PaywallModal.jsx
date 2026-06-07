/**
 * PaywallModal — full-screen 3-step subscription flow.
 *
 *   Step 1 · Plan        Basic / Standard · monthly | annual toggle
 *   Step 2 · Add-ons     Optional Genie Suite agents (skippable)
 *   Step 3 · Review      Order summary → "Continue to secure checkout"
 *                        → Stripe-hosted Checkout
 *
 * Returns to /o/:slug/billing/success?session_id=... after Stripe
 * collects payment; the success page polls access-state until the
 * webhook flips the org to active, then redirects to the dashboard.
 *
 * Connect tile in the launcher remains active throughout — there's an
 * "Open MorPro Connect" escape hatch in the modal footer so a stuck
 * user never feels trapped.
 */

import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  Sparkles, Check, ArrowRight, ArrowLeft, X,
  Loader2, Network, AlertCircle
} from 'lucide-react';
import billingApi from '../../api/billing.api';

const fmt$ = (n) => '$' + Math.round(Number(n) || 0).toLocaleString('en-US');

const BLOCK_HEADLINE = {
  trial_expired: 'Your trial has ended',
  cancelled: 'Your subscription was cancelled',
  past_due_locked: 'Your payment is past due'
};
const BLOCK_SUBHEAD = {
  trial_expired: 'Pick a plan to keep your operation running.',
  cancelled: 'Resubscribe to get back to work.',
  past_due_locked: 'Update your card or pick a new plan to continue.'
};

const TRIAL_HEADLINE = 'Start your 14-day free trial';
const TRIAL_SUBHEAD =
  'Pick a plan and add your card. No charge for 14 days — cancel anytime before then.';

export function PaywallModal({
  accessState,
  onClose,
  mode = 'paid' // 'paid' | 'trial'
}) {
  const { orgSlug } = useParams();
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(null);
  const [step, setStep] = useState(1);

  // Form state
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [selectedPlan, setSelectedPlan] = useState('basic');
  const [selectedAddons, setSelectedAddons] = useState([]); // slugs
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    billingApi.getPaywallCatalog()
      .then((data) => { if (!cancelled) setCatalog(data); })
      .catch(() => { if (!cancelled) setCatalogError('Could not load plan catalog.'); });
    return () => { cancelled = true; };
  }, []);

  const plan = useMemo(() => {
    return catalog?.plans?.find((p) => p.id === selectedPlan) || null;
  }, [catalog, selectedPlan]);

  const planPrice = plan
    ? (billingPeriod === 'annual' ? plan.annual_price : plan.monthly_price)
    : 0;
  const addonsTotal = useMemo(() => {
    if (!catalog) return 0;
    return selectedAddons.reduce((s, slug) => {
      const a = catalog.addons.find((x) => x.slug === slug);
      return s + (a?.monthly_price || 0);
    }, 0);
  }, [catalog, selectedAddons]);

  // Annual plan + monthly add-ons display: the add-ons are still
  // monthly because the agent add-on env vars are MONTHLY only today.
  // Total in the review step makes the cadence explicit.
  const total = planPrice + (billingPeriod === 'annual' ? addonsTotal * 12 : addonsTotal);
  const cadenceLabel = billingPeriod === 'annual' ? '/yr' : '/mo';

  const blockReason = accessState?.block_reason || 'trial_expired';
  const isTrial = mode === 'trial';
  // When no add-ons are configured (no Stripe price IDs set), the
  // modal collapses to 2 steps (Plan → Review).
  const hasAddons = (catalog?.addons?.length || 0) > 0;
  const totalSteps = hasAddons ? 3 : 2;
  const headline = isTrial
    ? TRIAL_HEADLINE
    : (BLOCK_HEADLINE[blockReason] || 'Subscribe to continue');
  const subhead = isTrial
    ? TRIAL_SUBHEAD
    : (BLOCK_SUBHEAD[blockReason] || 'Pick a plan to unlock your operation.');
  const ctaLabel = isTrial
    ? 'Start free trial — no charge today'
    : 'Continue to secure checkout';

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    try {
      const { url } = await billingApi.createCheckoutWithAddons({
        plan: selectedPlan,
        billing_period: billingPeriod,
        addon_slugs: selectedAddons,
        mode
      });
      if (url) {
        window.location.href = url;
      } else {
        setSubmitError('Could not open checkout. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setSubmitError(
        err?.response?.data?.error?.message
        || err?.message
        || 'Could not open checkout.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 border border-white/[0.08] shadow-2xl overflow-hidden">
        {/* Ambient glow */}
        <div
          aria-hidden
          className="absolute -top-32 -right-32 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(52,204,255,0.22) 0%, transparent 70%)' }}
        />

        {/* Close button — informational only; the gate stays blocked
            until the org actually subscribes. */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] flex items-center justify-center text-white/60 z-10"
          aria-label="Dismiss"
          title="You'll still be locked out until you subscribe."
        >
          <X className="w-4 h-4" />
        </button>

        <div className="relative p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold text-white">
                {headline}
              </h2>
              <p className="text-body-sm text-white/60 mt-0.5">
                {subhead}
              </p>
            </div>
          </div>

          {/* Step indicator */}
          <StepBar step={step === 3 && !hasAddons ? 2 : step} totalSteps={totalSteps} />

          {/* Body */}
          {!catalog && !catalogError && (
            <div className="py-12 flex items-center justify-center text-white/60">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          )}

          {catalogError && (
            <div className="py-8 px-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span className="text-body-sm">{catalogError}</span>
            </div>
          )}

          {catalog && step === 1 && (
            <StepPlan
              plans={catalog.plans}
              selected={selectedPlan}
              setSelected={setSelectedPlan}
              billingPeriod={billingPeriod}
              setBillingPeriod={setBillingPeriod}
            />
          )}

          {catalog && step === 2 && (
            <StepAddons
              addons={catalog.addons}
              selected={selectedAddons}
              setSelected={setSelectedAddons}
            />
          )}

          {catalog && step === 3 && (
            <StepReview
              plan={plan}
              billingPeriod={billingPeriod}
              addons={catalog.addons.filter((a) => selectedAddons.includes(a.slug))}
              addonsTotal={addonsTotal}
              planPrice={planPrice}
              total={total}
              cadenceLabel={cadenceLabel}
              isTrial={isTrial}
            />
          )}

          {submitError && (
            <div className="mt-4 p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-200 text-body-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Navigation */}
          {catalog && (
            <div className="mt-6 flex items-center justify-between gap-3 pt-6 border-t border-white/[0.08]">
              <div className="flex items-center gap-3">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      // Skip step 2 when add-ons aren't configured: from
                      // review we jump back to plan, not the empty
                      // add-ons step.
                      const target = step === 3 && !hasAddons ? 1 : step - 1;
                      setStep(target);
                    }}
                    disabled={submitting}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/70 hover:text-white text-body-sm"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </button>
                ) : <span />}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => { setSelectedAddons([]); setStep(3); }}
                    className="text-body-sm text-white/55 hover:text-white/80 underline underline-offset-2"
                  >
                    Skip add-ons
                  </button>
                )}
              </div>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={() => {
                    // From plan-pick, skip directly to review if there
                    // are no add-ons configured.
                    const next = step === 1 && !hasAddons ? 3 : step + 1;
                    setStep(next);
                  }}
                  disabled={!selectedPlan}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={submit}
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-body-sm font-semibold disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  {ctaLabel}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {/* Escape hatch: MorPro Connect is always free. */}
          <div className="mt-5 text-center">
            <Link
              to={`/o/${orgSlug}/connect`}
              className="inline-flex items-center gap-1.5 text-small text-white/50 hover:text-cyan-300"
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

// ───────────────────────────────────────────────────────────────────
// Step content
// ───────────────────────────────────────────────────────────────────

function StepBar({ step, totalSteps = 3 }) {
  const dots = Array.from({ length: totalSteps }, (_, i) => i + 1);
  return (
    <div className="flex items-center gap-2 mb-6">
      {dots.map((n) => (
        <div
          key={n}
          className={`flex-1 h-1 rounded-full transition-colors ${
            n <= step ? 'bg-cyan-400' : 'bg-white/[0.08]'
          }`}
        />
      ))}
      <span className="text-[10px] uppercase tracking-wider font-semibold text-white/55 ml-2">
        Step {step} / {totalSteps}
      </span>
    </div>
  );
}

function StepPlan({ plans, selected, setSelected, billingPeriod, setBillingPeriod }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h3 className="text-body font-semibold text-white">Pick the plan that fits</h3>
        <PeriodToggle value={billingPeriod} onChange={setBillingPeriod} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {plans.map((p) => {
          const price = billingPeriod === 'annual' ? p.annual_price : p.monthly_price;
          const cadence = billingPeriod === 'annual' ? '/yr' : '/mo';
          const isSelected = selected === p.id;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelected(p.id)}
              className={`text-left p-4 rounded-2xl border transition-all relative overflow-hidden ${
                isSelected
                  ? 'border-cyan-400/60 bg-cyan-500/10 shadow-lg shadow-cyan-500/10'
                  : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07] hover:border-white/[0.15]'
              }`}
            >
              {isSelected && (
                <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-cyan-400 flex items-center justify-center">
                  <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />
                </div>
              )}
              <div className="text-body-sm font-semibold text-white">{p.name}</div>
              <div className="text-[11px] text-white/55 mt-0.5">{p.tagline}</div>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-2xl font-semibold text-white tabular-nums">
                  {fmt$(price)}
                </span>
                <span className="text-small text-white/55">{cadence}</span>
              </div>
              {billingPeriod === 'annual' && p.annual_save_pct > 0 && (
                <div className="mt-1 inline-block px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] uppercase tracking-wider font-semibold text-emerald-300">
                  Save {p.annual_save_pct}%
                </div>
              )}
              <ul className="mt-3 space-y-1">
                {(p.features || []).map((f) => (
                  <li key={f} className="text-small text-white/70 flex items-start gap-1.5">
                    <Check className="w-3 h-3 text-cyan-300 mt-1 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepAddons({ addons, selected, setSelected }) {
  const toggle = (slug) => {
    setSelected(selected.includes(slug)
      ? selected.filter((s) => s !== slug)
      : [...selected, slug]);
  };
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-body font-semibold text-white">Add the Genie Suite</h3>
        <span className="text-[10px] uppercase tracking-wider font-semibold text-white/55">Optional</span>
      </div>
      <p className="text-small text-white/60 mb-4">
        Hire an AI teammate. Each works alongside you — load review, finance, lead scanning.
      </p>
      <div className="space-y-2.5">
        {addons.map((a) => {
          const isSelected = selected.includes(a.slug);
          return (
            <button
              key={a.slug}
              type="button"
              onClick={() => toggle(a.slug)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                isSelected
                  ? 'border-cyan-400/60 bg-cyan-500/10'
                  : 'border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.07]'
              }`}
            >
              <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                isSelected ? 'bg-cyan-400 border-cyan-400' : 'border-white/30'
              }`}>
                {isSelected && <Check className="w-3 h-3 text-slate-950" strokeWidth={3} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-semibold text-white">{a.name}</div>
                <div className="text-small text-white/55 truncate">{a.tagline}</div>
              </div>
              <div className="text-body-sm font-semibold text-white tabular-nums shrink-0">
                {fmt$(a.monthly_price)}<span className="text-white/55 text-small font-normal">/mo</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function StepReview({ plan, billingPeriod, addons, addonsTotal, planPrice, total, cadenceLabel, isTrial }) {
  if (!plan) return null;
  const planCadence = billingPeriod === 'annual' ? '/yr' : '/mo';
  return (
    <div>
      <h3 className="text-body font-semibold text-white mb-4">Review your order</h3>
      <div className="rounded-xl bg-white/[0.04] border border-white/[0.08] divide-y divide-white/[0.05]">
        <div className="p-4 flex items-baseline justify-between">
          <div>
            <div className="text-body-sm font-semibold text-white">{plan.name}</div>
            <div className="text-[11px] text-white/55">{plan.tagline}</div>
          </div>
          <div className="text-body-sm font-semibold text-white tabular-nums">
            {fmt$(planPrice)}<span className="text-white/55 text-small font-normal">{planCadence}</span>
          </div>
        </div>

        {addons.length > 0 && addons.map((a) => (
          <div key={a.slug} className="p-4 flex items-baseline justify-between">
            <div>
              <div className="text-body-sm text-white">{a.name}</div>
              <div className="text-[11px] text-white/55">{a.tagline}</div>
            </div>
            <div className="text-body-sm text-white tabular-nums">
              {fmt$(a.monthly_price)}<span className="text-white/55 text-small">/mo</span>
            </div>
          </div>
        ))}

        {addons.length === 0 && (
          <div className="p-4 text-small text-white/55 italic">No add-ons selected.</div>
        )}

        {isTrial ? (
          <>
            <div className="p-4 flex items-baseline justify-between bg-emerald-500/10">
              <div className="text-body-sm font-semibold text-emerald-200">Due today</div>
              <div className="text-xl font-semibold text-emerald-200 tabular-nums">
                $0.00
              </div>
            </div>
            <div className="p-4 flex items-baseline justify-between bg-white/[0.02]">
              <div className="text-small text-white/65">After 14-day free trial</div>
              <div className="text-body-sm text-white tabular-nums">
                {fmt$(total)}<span className="text-white/55 text-small font-normal">{cadenceLabel}</span>
              </div>
            </div>
          </>
        ) : (
          <div className="p-4 flex items-baseline justify-between bg-white/[0.02]">
            <div className="text-body-sm font-semibold text-white">Total today</div>
            <div className="text-xl font-semibold text-white tabular-nums">
              {fmt$(total)}<span className="text-white/55 text-small font-normal">{cadenceLabel}</span>
            </div>
          </div>
        )}
      </div>
      <p className="text-[11px] text-white/45 mt-3 text-center">
        {isTrial
          ? 'Stripe holds your card. We charge after the 14-day trial — cancel anytime before then in Billing Settings.'
          : 'Stripe handles payment. Cancel any time from Billing Settings.'}
      </p>
    </div>
  );
}

function PeriodToggle({ value, onChange }) {
  return (
    <div className="flex bg-white/[0.05] rounded-lg p-0.5 border border-white/[0.08]">
      <button
        type="button"
        onClick={() => onChange('monthly')}
        className={`px-3 py-1.5 text-small font-medium rounded-md transition-colors ${
          value === 'monthly' ? 'bg-cyan-400 text-slate-950' : 'text-white/70 hover:text-white'
        }`}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange('annual')}
        className={`px-3 py-1.5 text-small font-medium rounded-md transition-colors ${
          value === 'annual' ? 'bg-cyan-400 text-slate-950' : 'text-white/70 hover:text-white'
        }`}
      >
        Annual
      </button>
    </div>
  );
}

export default PaywallModal;
