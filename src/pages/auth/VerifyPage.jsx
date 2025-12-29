import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Mail, Truck } from 'lucide-react';
import '../../styles/marketing.css';

export function VerifyPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyOTP, requestOTP, error, clearError } = useAuth();

  const email = location.state?.email;
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const inputRefs = useRef([]);

  useEffect(() => {
    if (!email) {
      navigate('/login');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
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

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    if (value && index === 5 && newCode.every(d => d)) {
      handleSubmit(newCode.join(''));
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);

    if (pastedData) {
      const newCode = [...code];
      pastedData.split('').forEach((digit, i) => {
        if (i < 6) newCode[i] = digit;
      });
      setCode(newCode);

      const lastIndex = Math.min(pastedData.length - 1, 5);
      inputRefs.current[lastIndex]?.focus();

      if (pastedData.length === 6) {
        handleSubmit(pastedData);
      }
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
        if (result.data.organizations.length > 0) {
          const isDriverOnly = result.data.organizations.every(o => o.role === 'driver');
          if (isDriverOnly) {
            navigate('/driver');
          } else {
            const firstOrg = result.data.organizations[0];
            navigate(`/o/${firstOrg.slug}/dashboard`);
          }
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
      // Error handled in context
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="marketing-page min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.12)_0%,transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md px-6">
        {/* Back Link */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4 }}
        >
          <Link
            to="/login"
            className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white/80 transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
        </motion.div>

        {/* Verify Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-[#0066FF]/20 flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-[#0066FF]" />
            </div>
            <h1 className="text-2xl font-semibold text-white mb-2">Check your email</h1>
            <p className="text-white/50 text-sm">
              We sent a 6-digit code to
            </p>
            <p className="text-white font-medium mt-1">{email}</p>
          </div>

          {/* Code Inputs */}
          <div className="flex justify-center gap-2 mb-6">
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
                className={`
                  w-12 h-14 text-center text-xl font-semibold
                  bg-white/[0.04] border-2 rounded-xl text-white
                  focus:outline-none focus:border-[#0066FF] focus:bg-white/[0.08]
                  transition-all duration-200
                  ${error ? 'border-red-500/50' : 'border-white/10'}
                `}
                disabled={loading}
              />
            ))}
          </div>

          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20"
            >
              <p className="text-sm text-red-400 text-center">{error}</p>
            </motion.div>
          )}

          {/* Verify Button */}
          <button
            onClick={() => handleSubmit()}
            disabled={code.some(d => !d) || loading}
            className="w-full h-12 bg-[#0066FF] hover:bg-[#3385FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0066FF]/25 hover:-translate-y-0.5"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              'Verify Code'
            )}
          </button>

          {/* Resend */}
          <div className="mt-6 text-center">
            <p className="text-sm text-white/50">
              Didn't receive the code?{' '}
              {resendCooldown > 0 ? (
                <span className="text-white/30">
                  Resend in {resendCooldown}s
                </span>
              ) : (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="text-[#0066FF] hover:text-[#3385FF] transition-colors disabled:opacity-50"
                >
                  {resending ? 'Sending...' : 'Resend code'}
                </button>
              )}
            </p>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-center"
        >
          <Link to="/" className="inline-flex items-center gap-2 text-white/30 hover:text-white/50 transition-colors">
            <Truck className="w-4 h-4" />
            <span className="text-sm font-medium">NEXT TMS</span>
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

export default VerifyPage;
