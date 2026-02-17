import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { Eye, EyeOff, ArrowRight, Truck, User, CreditCard } from 'lucide-react';
import '../../styles/marketing.css';

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC'
];

export function DriverSignupPage() {
  const navigate = useNavigate();
  const { driverSignup, error, clearError } = useAuth();

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    license_number: '',
    license_state: '',
    license_expiry: '',
    medical_card_expiry: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    try {
      await driverSignup(form);
      navigate('/verify', { state: { email: form.email } });
    } catch (err) {
      // Error is set in context
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full h-12 px-4 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:border-[#0066FF] focus:ring-1 focus:ring-[#0066FF]/50 transition-all";
  const labelClass = "block text-sm font-medium text-white/70 mb-2";

  return (
    <div className="marketing-page min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-mesh" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.12)_0%,transparent_70%)]" />
      </div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[400px]">
        <div className="w-full h-full bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.08)_0%,transparent_70%)]" />
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-lg px-6">
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
            Driver Registration
          </p>
        </motion.div>

        {/* Signup Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.06] rounded-2xl p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-white mb-2">Create your driver account</h1>
            <p className="text-white/50">Sign up to join a fleet and start hauling</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Personal Info Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <User className="w-4 h-4 text-[#0066FF]" />
                <span className="text-sm font-medium text-white/70">Personal Information</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelClass}>First name *</label>
                  <input
                    type="text"
                    placeholder="John"
                    value={form.first_name}
                    onChange={(e) => updateField('first_name', e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Last name *</label>
                  <input
                    type="text"
                    placeholder="Doe"
                    value={form.last_name}
                    onChange={(e) => updateField('last_name', e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className={labelClass}>Email *</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  required
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Phone</label>
                <input
                  type="tel"
                  placeholder="(555) 123-4567"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>Username</label>
                <input
                  type="text"
                  placeholder="e.g., mike_trucker"
                  value={form.username}
                  onChange={(e) => updateField('username', e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                  maxLength={30}
                  className={inputClass}
                />
                <p className="text-xs text-white/30 mt-1">
                  Choose a public username so organizations can find you
                </p>
              </div>
            </div>

            {/* Password Section */}
            <div>
              <label className={labelClass}>Password *</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  value={form.password}
                  onChange={(e) => updateField('password', e.target.value)}
                  required
                  className={`${inputClass} pr-12`}
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

            {/* CDL Information Section */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-4 h-4 text-[#0066FF]" />
                <span className="text-sm font-medium text-white/70">CDL Information</span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className={labelClass}>License number *</label>
                  <input
                    type="text"
                    placeholder="CDL number"
                    value={form.license_number}
                    onChange={(e) => updateField('license_number', e.target.value)}
                    required
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>License state *</label>
                  <select
                    value={form.license_state}
                    onChange={(e) => updateField('license_state', e.target.value)}
                    required
                    className={`${inputClass} appearance-none`}
                  >
                    <option value="" className="bg-gray-900">Select state</option>
                    {US_STATES.map(st => (
                      <option key={st} value={st} className="bg-gray-900">{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>License expiry</label>
                  <input
                    type="date"
                    value={form.license_expiry}
                    onChange={(e) => updateField('license_expiry', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Medical card expiry</label>
                  <input
                    type="date"
                    value={form.medical_card_expiry}
                    onChange={(e) => updateField('medical_card_expiry', e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={!form.email || !form.password || !form.first_name || !form.last_name || !form.license_number || !form.license_state || loading}
              className="w-full h-12 bg-[#0066FF] hover:bg-[#3385FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-[#0066FF]/25 hover:-translate-y-0.5"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Create Account
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-8 pt-6 border-t border-white/[0.06]">
            <p className="text-center text-sm text-white/50">
              Already have an account?{' '}
              <Link to="/login" className="text-[#0066FF] hover:text-[#3385FF] font-medium transition-colors">
                Sign in
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

export default DriverSignupPage;
