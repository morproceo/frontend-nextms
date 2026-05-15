/**
 * SecurityPage — password management + session revocation.
 *
 * Two cards: change/set password (the set-password path runs when the user
 * has only ever logged in via OTP and has no password_hash), and a button
 * to revoke every refresh token on every device.
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../contexts/AuthContext';
import authApi from '../../../api/auth.api';
import {
  ShieldCheck,
  KeyRound,
  LogOut,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export default function SecurityPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const hasPassword = !!user?.password_hash || user?.has_password;

  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);
  const [revoking, setRevoking] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    setError(null);
    if (form.new_password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (form.new_password !== form.confirm_password) {
      setError("Passwords don't match");
      return;
    }
    setSaving(true);
    try {
      if (hasPassword) {
        await authApi.changePassword(form.current_password, form.new_password);
      } else {
        await authApi.setPassword(form.new_password);
      }
      setForm({ current_password: '', new_password: '', confirm_password: '' });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutAll = async () => {
    if (!confirm('Sign out everywhere? This revokes every device including this one.')) return;
    setRevoking(true);
    try {
      await authApi.logoutAll();
      await logout();
      navigate('/login');
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
      setRevoking(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <ShieldCheck className="w-6 h-6" />
          Security
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Manage your password and active sessions
        </p>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      <form onSubmit={handleSavePassword} className="bg-surface-primary rounded-card border border-surface-tertiary p-6 space-y-5">
        <div>
          <h2 className="text-title-sm text-text-primary flex items-center gap-2">
            <KeyRound className="w-5 h-5" />
            {hasPassword ? 'Change password' : 'Set a password'}
          </h2>
          <p className="text-body-sm text-text-secondary mt-1">
            {hasPassword
              ? 'Update the password used to sign in.'
              : "You're currently signed in via OTP only. Set a password to enable password login."}
          </p>
        </div>

        {hasPassword && (
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Current password
            </label>
            <input
              type="password"
              name="current_password"
              value={form.current_password}
              onChange={handleChange}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        )}

        <div>
          <label className="block text-body-sm font-medium text-text-primary mb-2">
            New password
          </label>
          <input
            type="password"
            name="new_password"
            value={form.new_password}
            onChange={handleChange}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
          <p className="text-small text-text-tertiary mt-1">At least 8 characters.</p>
        </div>

        <div>
          <label className="block text-body-sm font-medium text-text-primary mb-2">
            Confirm new password
          </label>
          <input
            type="password"
            name="confirm_password"
            value={form.confirm_password}
            onChange={handleChange}
            required
            autoComplete="new-password"
            className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
          />
        </div>

        <div className="flex items-center justify-end gap-4 pt-2">
          {saved && (
            <span className="text-body-sm text-success flex items-center gap-1">
              <Check className="w-4 h-4" />
              Password updated
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {hasPassword ? 'Update password' : 'Set password'}
          </button>
        </div>
      </form>

      <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
        <h2 className="text-title-sm text-text-primary flex items-center gap-2">
          <LogOut className="w-5 h-5" />
          Active sessions
        </h2>
        <p className="text-body-sm text-text-secondary mt-1 mb-4">
          Sign out of every device. You'll need to sign back in on each one.
        </p>
        <button
          onClick={handleLogoutAll}
          disabled={revoking}
          className="flex items-center gap-2 px-4 py-2 bg-error/10 hover:bg-error/20 text-error rounded-button text-body-sm font-medium transition-colors disabled:opacity-50"
        >
          {revoking ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          Sign out everywhere
        </button>
      </div>
    </div>
  );
}
