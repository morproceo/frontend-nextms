import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Check, X, Loader2, Rocket } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { activateAllApps } from '../../../api/orgAppGrants.api';

/**
 * TrialActivationPanel — the "acknowledge & start your free trial" moment.
 *
 * Opens when the user taps a locked module tile (e.g. Operations) for the
 * first time during their trial. On acknowledge it unlocks every module
 * the org is eligible for (activate-all), then drops the user straight
 * into the module they clicked — no card, no friction.
 *
 * Props:
 *   open   — boolean
 *   app    — the clicked app ({ name, href, ... }); after activation we
 *            navigate into it. Optional (generic activate if absent).
 *   onClose
 */
export function TrialActivationPanel({ open, app, onClose }) {
  const { currentOrg, refreshAppGrants } = useOrg();
  const navigate = useNavigate();
  const [phase, setPhase] = useState('intro'); // intro | working | done
  const [error, setError] = useState(null);

  let daysLeft = 14;
  const t = currentOrg?.subscription?.trial_ends_at;
  if (t) {
    daysLeft = Math.max(
      0,
      Math.ceil((new Date(t) - new Date()) / (1000 * 60 * 60 * 24))
    );
  }

  const activate = async () => {
    if (!currentOrg?.id) return;
    setPhase('working');
    setError(null);
    try {
      await activateAllApps(currentOrg.id);
      if (refreshAppGrants) await refreshAppGrants();
      setPhase('done');
      setTimeout(() => {
        onClose?.();
        setPhase('intro');
        // Drop the user straight into the module they clicked.
        if (app?.href && currentOrg?.slug) {
          const target = app.href({ orgSlug: currentOrg.slug });
          if (target?.startsWith('http')) window.location.href = target;
          else if (target) navigate(target);
        }
      }, 1600);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
      setPhase('intro');
    }
  };

  const close = () => {
    if (phase === 'working') return;
    onClose?.();
    setPhase('intro');
    setError(null);
  };

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-md"
            onClick={close}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, #16335c 0%, #0a1424 55%, #05080f 100%)'
            }}
          >
            {/* glow orbs */}
            <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-[#34CCFF]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-fuchsia-500/15 blur-3xl" />

            {phase !== 'working' && (
              <button
                onClick={close}
                className="absolute right-4 top-4 z-10 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            )}

            <div className="relative px-8 py-10 text-center text-white">
              <AnimatePresence mode="wait">
                {phase === 'done' ? (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 16 }}
                      className="mx-auto w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center mb-5"
                    >
                      <Check className="w-8 h-8 text-emerald-400" strokeWidth={2.5} />
                    </motion.div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                      You’re all set 🎉
                    </h2>
                    <p className="text-white/60 mt-2 text-body-sm">
                      {app?.name
                        ? `Every module is unlocked — opening ${app.name}…`
                        : 'Every module is unlocked. Welcome to MorPro Cloud.'}
                    </p>
                  </motion.div>
                ) : (
                  <motion.div
                    key="intro"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <motion.div
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                      className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
                      style={{ background: 'linear-gradient(135deg,#34CCFF,#7C5CFF)' }}
                    >
                      <Sparkles className="w-8 h-8 text-white" />
                    </motion.div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] uppercase tracking-wider text-[#7fdcff] mb-4">
                      <Rocket className="w-3 h-3" />
                      {daysLeft} days · free
                    </div>

                    <h2 className="text-2xl font-semibold tracking-tight">
                      Activate your free trial
                    </h2>
                    <p className="text-white/60 mt-2 text-body-sm">
                      Unlock the entire ecosystem for {daysLeft} days — no card,
                      cancel anytime.
                    </p>

                    <div className="mt-6 space-y-2.5 text-left">
                      {[
                        'Every module unlocked — Operations, Parking, Load Network, Fleet Health, Genie Suite',
                        'No credit card required',
                        `Full access for ${daysLeft} days, cancel anytime`
                      ].map((b) => (
                        <div key={b} className="flex items-start gap-2.5">
                          <span className="mt-0.5 w-4 h-4 rounded-full bg-[#34CCFF]/20 flex items-center justify-center flex-shrink-0">
                            <Check className="w-2.5 h-2.5 text-[#34CCFF]" strokeWidth={3} />
                          </span>
                          <span className="text-body-sm text-white/75">{b}</span>
                        </div>
                      ))}
                    </div>

                    {error && (
                      <p className="mt-4 text-small text-red-300 bg-red-500/10 rounded-lg px-3 py-2">
                        {error}
                      </p>
                    )}

                    <button
                      onClick={activate}
                      disabled={phase === 'working'}
                      className="group relative mt-7 w-full overflow-hidden rounded-xl py-3.5 font-semibold text-white disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg,#34CCFF,#7C5CFF)' }}
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <span className="relative flex items-center justify-center gap-2">
                        {phase === 'working'
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Activating…</>
                          : <>Acknowledge &amp; activate free trial</>}
                      </span>
                    </button>
                    <p className="mt-3 text-[11px] text-white/40">
                      You can subscribe to a plan anytime from Organization → Billing.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default TrialActivationPanel;
