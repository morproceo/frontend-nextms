import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Truck } from 'lucide-react';
import '../../styles/marketing.css';

export function LoginPage() {
  const navigate = useNavigate();
  const { requestOTP, loginWithPassword, error, clearError } = useAuth();

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
      navigate('/verify', { state: { email } });
    } catch (err) {
      // Error is set in context
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
            navigate(`/o/${response.data.organizations[0].slug}/dashboard`);
          }
        } else {
          navigate('/create-org');
        }
      }
    } catch (err) {
      // Error is set in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.12)_0%,transparent_70%)]" />
      </div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-10"
        >
          <Link to="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-[#0066FF] flex items-center justify-center">
              <Truck className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white">NEXT TMS</span>
          </Link>
          <p className="text-white/50 text-sm">
            Transportation Management System
          </p>
        </motion.div>

        {/* Login Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Welcome back</h1>
            <p className="text-white/50">Sign in to your account</p>
          </div>

          {/* Login Method Tabs */}
          <div className="flex rounded-xl bg-white/[0.04] p-1 mb-6">
            <button
              type="button"
              onClick={() => { setLoginMethod('email'); clearError(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                loginMethod === 'email'
                  ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Mail className="w-4 h-4" />
              Email Code
            </button>
            <button
              type="button"
              onClick={() => { setLoginMethod('password'); clearError(); }}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium rounded-lg transition-all duration-200 ${
                loginMethod === 'password'
                  ? 'bg-[#0066FF] text-white shadow-lg shadow-[#0066FF]/25'
                  : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Lock className="w-4 h-4" />
              Password
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm text-red-400">{error}</p>
            </motion.div>
          )}

          {loginMethod === 'email' ? (
            /* Email/OTP Login */
            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/50 transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={!email || loading}
                className="w-full h-12 bg-[#0066FF] hover:bg-[#3385FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0066FF]/25 hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Send Login Code
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-white/40">
                We'll send a verification code to your email
              </p>
            </form>
          ) : (
            /* Password Login */
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Email address
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                  required
                  className="w-full h-12 px-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/50 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/70 mb-2">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full h-12 px-4 pr-12 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/50 transition-all"
                  />
                  <button
                    type="button"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={!email || !password || loading}
                className="w-full h-12 bg-[#0066FF] hover:bg-[#3385FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0066FF]/25 hover:-translate-y-0.5"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Sign In
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center text-sm text-white/40">
                Forgot password?{' '}
                <button
                  type="button"
                  onClick={() => setLoginMethod('email')}
                  className="text-[#0066FF] hover:text-[#3385FF] transition-colors"
                >
                  Use email code instead
                </button>
              </p>
            </form>
          )}

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-center text-sm text-white/50">
              Don't have an account?{' '}
              <Link to="/signup" className="text-[#0066FF] hover:text-[#3385FF] font-medium transition-colors">
                Start free trial
              </Link>
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 text-center text-xs text-white/30"
        >
          By continuing, you agree to our{' '}
          <Link to="/terms" className="hover:text-white/50 transition-colors">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" className="hover:text-white/50 transition-colors">Privacy Policy</Link>
        </motion.p>
      </div>
    </div>
  );
}

export default LoginPage;
