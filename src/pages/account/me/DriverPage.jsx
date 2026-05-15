/**
 * DriverPage — driver-specific personal fields (CDL + medical card).
 *
 * Only mounted in the nav when `user.is_driver` is true. The form is the
 * same subset of fields the auth `/me` PATCH endpoint accepts that already
 * exist for the driver portal.
 */

import { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import {
  BadgeCheck,
  CalendarDays,
  Save,
  Loader2,
  Check,
  X,
  AlertCircle
} from 'lucide-react';

const STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
];

export default function DriverPage() {
  const { user, updateProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({
    license_number: '',
    license_state: '',
    license_expiry: '',
    medical_card_expiry: ''
  });

  useEffect(() => {
    if (user) {
      setForm({
        license_number: user.license_number || '',
        license_state: user.license_state || '',
        license_expiry: user.license_expiry ? user.license_expiry.substring(0, 10) : '',
        medical_card_expiry: user.medical_card_expiry ? user.medical_card_expiry.substring(0, 10) : ''
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
      await updateProfile({
        license_number: form.license_number || null,
        license_state: form.license_state || null,
        license_expiry: form.license_expiry || null,
        medical_card_expiry: form.medical_card_expiry || null
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  if (!user?.is_driver) {
    return (
      <div className="max-w-2xl">
        <h1 className="text-title text-text-primary">Driver</h1>
        <p className="text-body-sm text-text-secondary mt-1">
          You don't have a driver profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <BadgeCheck className="w-6 h-6" />
          Driver
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Your CDL and medical card details
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

      <form onSubmit={handleSave} className="bg-surface-primary rounded-card border border-surface-tertiary p-6 space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              CDL number
            </label>
            <input
              type="text"
              name="license_number"
              value={form.license_number}
              onChange={handleChange}
              placeholder="e.g., D1234567"
              className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary font-mono focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              Issuing state
            </label>
            <select
              name="license_state"
              value={form.license_state}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            >
              <option value="">Select state</option>
              {STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              <CalendarDays className="w-4 h-4 inline mr-1" />
              CDL expiration
            </label>
            <input
              type="date"
              name="license_expiry"
              value={form.license_expiry}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-2">
              <CalendarDays className="w-4 h-4 inline mr-1" />
              Medical card expiration
            </label>
            <input
              type="date"
              name="medical_card_expiry"
              value={form.medical_card_expiry}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 pt-2">
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
