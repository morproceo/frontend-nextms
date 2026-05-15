import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Waypoints, Check, X, Loader2, Clock, ShieldCheck,
  TrendingUp, HeartHandshake, ArrowRight
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { getBetaStatus, requestBetaAccess } from '../../../api/directBeta.api';

/**
 * DirectBetaPanel — gate + explainer for MorPro Direct (Load Network).
 *
 * Distinct from the generic trial-activation panel: Direct is invite-only
 * during beta. Tapping the locked tile opens this card, which explains
 * what Direct is (mobile-first) and lets the owner request beta access.
 * A MorPro admin approves it in Super Admin → Approvals; only then does
 * the Direct sign-up/verification unlock.
 */
export function DirectBetaPanel({ open, app, onClose }) {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('none'); // none|requested|approved|rejected
  const [reason, setReason] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const r = await getBetaStatus();
      setStatus(r?.status || 'none');
      setReason(r?.rejection_reason || null);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const request = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await requestBetaAccess();
      setStatus(r?.status || 'requested');
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  const goToDirect = () => {
    onClose?.();
    if (currentOrg?.slug) navigate(`/o/${currentOrg.slug}/direct`);
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
          <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            className="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/10"
            style={{
              background:
                'radial-gradient(120% 90% at 50% 0%, #2a1c4a 0%, #131029 55%, #05080f 100%)'
            }}
          >
            <div className="pointer-events-none absolute -top-20 -right-16 w-56 h-56 rounded-full bg-[#A78BFA]/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-[#34CCFF]/15 blur-3xl" />

            <button
              onClick={onClose}
              className="absolute right-4 top-4 z-10 p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative px-7 py-9 text-white">
              <div
                className="mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: 'linear-gradient(135deg,#A78BFA,#34CCFF)' }}
              >
                <Waypoints className="w-7 h-7 text-white" />
              </div>

              <div className="text-center">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] uppercase tracking-wider text-[#c5b3ff] mb-3">
                  Invite-only beta
                </div>
                <h2 className="text-2xl font-semibold tracking-tight">
                  Load Network
                </h2>
                <p className="text-white/60 mt-2 text-body-sm leading-relaxed">
                  MorPro’s brokerless freight network. Connect directly with
                  vetted shippers and carriers — book loads, bid, and get
                  paid without a broker skimming the middle.
                </p>
              </div>

              <div className="mt-6 space-y-3">
                {[
                  [HeartHandshake, 'Work direct', 'Deal straight with shippers & carriers — no broker margin.'],
                  [ShieldCheck, 'Verified network', 'Every org is MC/identity-checked before they can transact.'],
                  [TrendingUp, 'Keep more per load', 'Cut the brokerage cut; bid and counter in real time.']
                ].map(([Icon, t, d]) => (
                  <div key={t} className="flex items-start gap-3">
                    <span className="mt-0.5 w-8 h-8 rounded-lg bg-white/8 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-[#c5b3ff]" />
                    </span>
                    <div>
                      <div className="text-body-sm font-medium text-white">{t}</div>
                      <div className="text-small text-white/55 leading-snug">{d}</div>
                    </div>
                  </div>
                ))}
              </div>

              {error && (
                <p className="mt-5 text-small text-red-300 bg-red-500/10 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              {/* Status-aware footer */}
              <div className="mt-7">
                {loading ? (
                  <div className="flex justify-center py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-white/50" />
                  </div>
                ) : status === 'approved' ? (
                  <>
                    <div className="flex items-center gap-2 justify-center text-emerald-300 text-body-sm mb-3">
                      <Check className="w-4 h-4" /> You’re approved for the beta
                    </div>
                    <button
                      onClick={goToDirect}
                      className="w-full rounded-xl py-3.5 font-semibold text-white flex items-center justify-center gap-2"
                      style={{ background: 'linear-gradient(135deg,#A78BFA,#34CCFF)' }}
                    >
                      Continue to sign up <ArrowRight className="w-4 h-4" />
                    </button>
                  </>
                ) : status === 'requested' ? (
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white/8 text-white/80 text-body-sm">
                      <Clock className="w-4 h-4 text-[#c5b3ff]" />
                      Beta access requested — a MorPro admin is reviewing it.
                    </div>
                    <p className="text-[11px] text-white/40 mt-3">
                      We’ll unlock Load Network for your org once approved.
                    </p>
                  </div>
                ) : (
                  <>
                    {status === 'rejected' && (
                      <p className="text-small text-amber-300/90 bg-amber-500/10 rounded-lg px-3 py-2 mb-3">
                        Your previous request wasn’t approved
                        {reason ? `: ${reason}` : ''}. You can request again.
                      </p>
                    )}
                    <button
                      onClick={request}
                      disabled={busy}
                      className="group relative w-full overflow-hidden rounded-xl py-3.5 font-semibold text-white disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg,#A78BFA,#34CCFF)' }}
                    >
                      <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                      <span className="relative flex items-center justify-center gap-2">
                        {busy
                          ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>
                          : 'Request beta access'}
                      </span>
                    </button>
                    <p className="mt-3 text-[11px] text-white/40 text-center">
                      Sends a request to the MorPro team. No card, no commitment.
                    </p>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export default DirectBetaPanel;
