/**
 * ProfilePage — personal user profile (name, phone, username, email display).
 *
 * Email is shown but not editable here — changing email is its own ceremony
 * involving re-verification, deferred to a later phase.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  User,
  Mail,
  Phone,
  AtSign,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    phone: '',
    username: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        username: user.username || ''
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setSaved(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateProfile(form);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-title text-text-primary">Profile</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Your personal information across the morpro ecosystem
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6">
          <h2 className="text-title-sm text-text-primary mb-6 flex items-center gap-2">
            <User className="w-5 h-5" />
            Personal information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                First name
              </label>
              <input
                type="text"
                name="first_name"
                value={form.first_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                Last name
              </label>
              <input
                type="text"
                name="last_name"
                value={form.last_name}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-4 py-3 bg-surface-tertiary/40 border border-surface-tertiary rounded-input text-text-tertiary cursor-not-allowed"
              />
              <p className="text-small text-text-tertiary mt-1">
                Email cannot be changed here. Contact support to migrate.
              </p>
            </div>

            <div>
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="(555) 123-4567"
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-body-sm font-medium text-text-primary mb-2">
                <AtSign className="w-4 h-4 inline mr-1" />
                Username
              </label>
              <input
                type="text"
                name="username"
                value={form.username}
                onChange={(e) => {
                  setForm((p) => ({ ...p, username: e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, '') }));
                  setSaved(false);
                }}
                placeholder="e.g., jane.doe"
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
              <p className="text-small text-text-tertiary mt-1">
                Optional. Lowercase letters, numbers, and ._- only.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4">
          {saved && (
            <span className="text-body-sm text-success flex items-center gap-1">
              <Check className="w-4 h-4" />
              Saved
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
