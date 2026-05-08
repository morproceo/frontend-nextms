import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api/client';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import '../../styles/marketing.css';

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, requestOTP, error, clearError } = useAuth();

  const email = location.state?.email;
  const pendingRedirect = location.state?.redirect;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) navigate('/login');
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const t = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendCooldown]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index, value) => {
    if (value && !/^\d$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    clearError();
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (value && index === 5 && newCode.every(d => d)) handleSubmit(newCode.join(''));
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const newCode = [...code];
      pasted.split('').forEach((d, i) => { if (i < 6) newCode[i] = d; });
      setCode(newCode);
      const lastIndex = Math.min(pasted.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();
      if (pasted.length === 6) handleSubmit(pasted);
    }
  };

  const handleSubmit = async (codeString) => {
    const fullCode = codeString || code.join('');
    if (fullCode.length !== 6) return;

    setLoading(true);
    clearError();

    try {
      const result = await verifyOTP(email, fullCode);

      if (result.success) {
        if (pendingRedirect && pendingRedirect.includes('/invitations/')) {
          try {
            const token = pendingRedirect.split('/invitations/')[1]?.split('/')[0];
            if (token) await api.post(`/v1/organizations/invitations/${token}/accept`);
          } catch (inviteErr) {
            console.log('Invite accept:', inviteErr.response?.data?.error?.message || inviteErr.message);
          }
          window.location.href = '/';
          return;
        }

        if (result.data.organizations.length > 0) {
          const isDriverOnly = result.data.organizations.every(o => o.role === 'driver');
          const isInvestorOnly = result.data.organizations.every(o => o.role === 'investor');
          if (isDriverOnly) {
            navigate('/driver');
          } else if (isInvestorOnly) {
            navigate('/investor');
          } else {
            const firstOrg = result.data.organizations[0];
            navigate(`/o/${firstOrg.slug}/launcher`);
          }
        } else if (result.data.user.is_driver) {
          navigate('/driver');
        } else {
          navigate('/create-org');
        }
      }
    } catch (err) {
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await requestOTP(email);
      setResendCooldown(60);
    } catch (err) {
      // Surfaced via context
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="marketing-page min-h-screen bg-black text-white relative overflow-hidden">
      {/* ambient background */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[700px] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.18)_0%,transparent_60%)]" />
        <div className="absolute bottom-0 right-0 w-[600px] h-[400px] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.08)_0%,transparent_70%)]" />
        <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="vgrid" width="48" height="48" patternUnits="userSpaceOnUse">
              <path d="M 48 0 L 0 0 0 48" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#vgrid)" />
        </svg>
      </div>

      {/* top bar */}
      <header className="relative z-10 flex items-center justify-between px-6 sm:px-10 lg:px-16 py-6">
        <Link to="/" className="flex items-center">
          <img src="/next_logo_white.png" alt="NEXT" className="h-7 sm:h-8 w-auto opacity-95" draggable={false} />
        </Link>
        <Link
          to="/login"
          className="inline-flex items-center gap-1.5 text-xs text-white/50 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to sign in
        </Link>
      </header>

      {/* main */}
      <div className="relative z-10 flex items-center justify-center px-6 pb-16 pt-6 sm:pt-12">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
              <span className="text-[11px] font-medium tracking-wide text-white/70 uppercase">
                Verifying access
              </span>
            </div>
            <h1 className="text-[34px] sm:text-[40px] leading-[1] font-semibold tracking-tight">
              Check your email.
            </h1>
            <p className="mt-3 text-[15px] text-white/55">
              We sent a 6-digit code to
            </p>
            <p className="mt-1 text-white font-medium">{email}</p>
          </div>

          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl p-6 sm:p-8">
            <div className="flex justify-center gap-2 sm:gap-2.5 mb-6">
              {code.map((digit, index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={handlePaste}
                  disabled={loading}
                  className={`
                    w-11 sm:w-12 h-14 text-center text-xl font-semibold tabular-nums
                    bg-white/[0.04] border rounded-xl text-white
                    focus:outline-none focus:border-white/40 focus:bg-white/[0.08]
                    transition-all duration-200
                    ${error ? 'border-red-500/50' : 'border-white/10'}
                  `}
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25"
                >
                  <p className="text-sm text-red-300 text-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              onClick={() => handleSubmit()}
              disabled={code.some(d => !d) || loading}
              className="group relative w-full h-12 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(180deg, #0A7BFF 0%, #0052E0 100%)',
                boxShadow: '0 10px 30px -10px rgba(0,102,255,0.55), inset 0 1px 0 rgba(255,255,255,0.18)'
              }}
            >
              <span className="relative z-10 inline-flex items-center justify-center gap-2 w-full h-full">
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  'Verify code'
                )}
              </span>
              <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>

            <div className="mt-5 text-center">
              <p className="text-sm text-white/45">
                Didn't receive the code?{' '}
                {resendCooldown > 0 ? (
                  <span className="text-white/30">Resend in {resendCooldown}s</span>
                ) : (
                  <button
                    onClick={handleResend}
                    disabled={resending}
                    className="text-white hover:text-[#3385FF] transition-colors disabled:opacity-50 font-medium"
                  >
                    {resending ? 'Sending…' : 'Resend code'}
                  </button>
                )}
              </p>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-2 text-[11px] text-white/35">
            <ShieldCheck className="w-3.5 h-3.5" />
            Encrypted connection · 2FA available
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default VerifyPage;
