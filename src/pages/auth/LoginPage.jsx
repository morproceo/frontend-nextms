import { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Truck,
  MapPin,
  Zap
} from 'lucide-react';
import '../../styles/marketing.css';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestOTP, loginWithPassword, error, clearError } = useAuth();

  const params = new URLSearchParams(location.search);
  const redirect = params.get('redirect');

  const [loginMethod, setLoginMethod] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      await requestOTP(email);
      navigate('/verify', { state: { email, redirect } });
    } catch (err) {
      // surfaced via context
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);
    try {
      const response = await loginWithPassword(email, password);
      if (response.success) {
        if (response.data.organizations?.length > 0) {
          const isDriverOnly = response.data.organizations.every(o => o.role === 'driver');
          if (isDriverOnly) {
            navigate('/driver');
          } else {
            navigate(`/o/${response.data.organizations[0].slug}/launcher`);
          }
        } else if (response.data.user.is_driver) {
          navigate('/driver');
        } else {
          navigate('/create-org');
        }
      }
    } catch (err) {
      // surfaced via context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page min-h-screen bg-black text-white">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] min-h-screen">
        {/* LEFT — auth form */}
        <div className="relative flex flex-col px-6 py-8 sm:px-10 lg:px-16 lg:py-12">
          {/* subtle bg glow */}
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.18)_0%,transparent_60%)]" />
            <div className="absolute bottom-0 right-0 w-[380px] h-[380px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.10)_0%,transparent_70%)]" />
          </div>

          {/* Logo top */}
          <div className="relative z-10 flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <img
                src="/next_logo_white.png"
                alt="NEXT"
                className="h-7 sm:h-8 w-auto opacity-95"
                draggable={false}
              />
            </Link>
            <Link
              to="/signup"
              className="hidden sm:inline-flex items-center gap-1 text-xs text-white/50 hover:text-white transition-colors"
            >
              New here?
              <span className="text-white">Start free trial</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Form card */}
          <div className="relative z-10 flex-1 flex items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-md mx-auto lg:mx-0"
            >
              <div className="mb-10">
                <h1 className="text-[40px] sm:text-[52px] leading-[1] font-semibold tracking-tight">
                  Welcome back.
                </h1>
                <p className="mt-3 text-[15px] text-white/50">
                  Sign in to your morpro account.
                </p>
              </div>

              {/* Method tabs */}
              <div className="flex p-1 rounded-xl bg-white/[0.04] border border-white/[0.06] mb-5">
                <button
                  type="button"
                  onClick={() => { setLoginMethod('email'); clearError(); }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-lg transition-all ${
                    loginMethod === 'email'
                      ? 'bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.08)]'
                      : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  <Mail className="w-4 h-4" />
                  Email code
                </button>
                <button
                  type="button"
                  onClick={() => { setLoginMethod('password'); clearError(); }}
                  className={`flex-1 inline-flex items-center justify-center gap-2 h-10 text-sm font-medium rounded-lg transition-all ${
                    loginMethod === 'password'
                      ? 'bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.08)]'
                      : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  <Lock className="w-4 h-4" />
                  Password
                </button>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25"
                  >
                    <p className="text-sm text-red-300">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {loginMethod === 'email' ? (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <PrimaryButton disabled={!email || loading} loading={loading}>
                    Send login code
                  </PrimaryButton>
                  <p className="text-center text-xs text-white/40">
                    We'll send a one-time code to that inbox.
                  </p>
                </form>
              ) : (
                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  <Field
                    label="Email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full h-12 px-4 pr-12 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-white/40 hover:text-white/80 transition-colors"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <PrimaryButton disabled={!email || !password || loading} loading={loading}>
                    Sign in
                  </PrimaryButton>
                  <p className="text-center text-xs text-white/40">
                    Forgot password?{' '}
                    <button
                      type="button"
                      onClick={() => setLoginMethod('email')}
                      className="text-white hover:text-[#3385FF] transition-colors"
                    >
                      Use email code
                    </button>
                  </p>
                </form>
              )}

              {/* Footer links */}
              <div className="mt-8 pt-6 border-t border-white/[0.06] text-sm text-white/45 space-y-1.5">
                <p>
                  Don't have an account?{' '}
                  <Link to="/signup" className="text-white hover:text-[#3385FF] transition-colors font-medium">
                    Start free trial
                  </Link>
                </p>
                <p>
                  Driving?{' '}
                  <Link to="/driver-signup" className="text-white hover:text-[#3385FF] transition-colors font-medium">
                    Register as a driver
                  </Link>
                </p>
              </div>

              <div className="mt-8 flex items-center gap-2 text-[11px] text-white/35">
                <ShieldCheck className="w-3.5 h-3.5" />
                Encrypted connection · 2FA available
              </div>
            </motion.div>
          </div>

          <div className="relative z-10 mt-6 text-[11px] text-white/30">
            By continuing you agree to the{' '}
            <Link to="/terms" className="hover:text-white/60 transition-colors">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>.
          </div>
        </div>

        {/* RIGHT — marketing panel (desktop only) */}
        <MarketingPanel />
      </div>
    </div>
  );
}

/* ============================== sub-components ============================== */

function Field({ label, ...props }) {
  return (
    <div>
      <label className="block text-[11px] uppercase tracking-wider text-white/45 mb-2">
        {label}
      </label>
      <input
        {...props}
        className="w-full h-12 px-4 bg-white/[0.04] border border-white/[0.08] rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:border-white/30 focus:bg-white/[0.06] transition-all"
      />
    </div>
  );
}

function PrimaryButton({ children, disabled, loading }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="group relative w-full h-12 rounded-xl text-sm font-semibold text-white overflow-hidden transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      style={{
        background: 'linear-gradient(180deg, #0A7BFF 0%, #0052E0 100%)',
        boxShadow: '0 10px 30px -10px rgba(0,102,255,0.55), inset 0 1px 0 rgba(255,255,255,0.18)'
      }}
    >
      <span className="relative z-10 inline-flex items-center justify-center gap-2 w-full h-full">
        {loading ? (
          <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            {children}
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
          </>
        )}
      </span>
      <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </button>
  );
}

function MarketingPanel() {
  return (
    <div className="hidden lg:flex relative overflow-hidden bg-[#06070b] border-l border-white/[0.06]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-0 w-[700px] h-[700px] rounded-full bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.16)_0%,transparent_60%)]" />
      </div>

      <div className="relative z-10 flex flex-col justify-center w-full px-12 xl:px-20 py-16">
        <motion.h2
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="text-[48px] xl:text-[64px] leading-[1] font-semibold tracking-tight max-w-2xl"
        >
          The trucking industry,
          <br />
          <span className="text-white/55">reimagined.</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-6 text-[17px] leading-relaxed text-white/50 max-w-md"
        >
          One account, every app. The network that moves freight.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="mt-14 max-w-md"
        >
          <LiveActivityCard />
        </motion.div>
      </div>
    </div>
  );
}

function LiveActivityCard() {
  const events = [
    { icon: Truck, title: 'Load #4821 dispatched', meta: 'Long Beach → Phoenix' },
    { icon: MapPin, title: 'Spot booked via Spotty', meta: 'Fontana, CA' },
    { icon: Zap, title: 'Settlement cleared', meta: 'Acme Logistics · $4,820' }
  ];

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
      <div className="flex items-center gap-2 px-5 py-3.5 border-b border-white/[0.05]">
        <span className="relative flex w-1.5 h-1.5">
          <span className="absolute inline-flex w-full h-full rounded-full bg-emerald-400 opacity-60 animate-ping" />
          <span className="relative inline-flex w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </span>
        <span className="text-[11px] font-medium text-white/55 uppercase tracking-wider">
          Live on the network
        </span>
      </div>
      <div className="px-2 py-2">
        {events.map((e, i) => (
          <ActivityRow key={i} event={e} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ event }) {
  const Icon = event.icon;
  return (
    <div className="flex items-center gap-3 px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
        <Icon className="w-3.5 h-3.5 text-white/70" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-white/85 truncate">{event.title}</p>
        <p className="text-[11px] text-white/40 truncate">{event.meta}</p>
      </div>
    </div>
  );
}

export default LoginPage;
