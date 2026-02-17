import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, RotateCcw, Loader2 } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAtlasSettings, useAtlasMutations } from '../../../hooks/api/useAtlasApi';

const DEFAULT_SETTINGS = {
  auto_create_threshold: 0.85,
  freight_classification_threshold: 0.6,
  notify_on_new_opportunity: true,
  auto_match_broker: true,
  max_daily_emails: 500
};

export default function AtlasSettingsPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const { settings, loading, fetch } = useAtlasSettings();
  const { updateSettings, loading: saving } = useAtlasMutations();

  const [form, setForm] = useState(DEFAULT_SETTINGS);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  useEffect(() => {
    if (settings) {
      setForm({ ...DEFAULT_SETTINGS, ...settings });
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setDirty(true);
  };

  const handleSave = async () => {
    try {
      await updateSettings(form);
      setDirty(false);
      await fetch();
    } catch (err) {
      console.error('Failed to save settings:', err);
    }
  };

  const handleReset = () => {
    setForm(settings ? { ...DEFAULT_SETTINGS, ...settings } : DEFAULT_SETTINGS);
    setDirty(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(orgUrl('/tools/atlas'))} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-title text-text-primary">ATLAS Settings</h1>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Configure how ATLAS processes and classifies emails
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <button onClick={handleReset} className="btn-secondary flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={!dirty || saving}
            className="btn-primary flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Changes
          </button>
        </div>
      </div>

      {/* Classification Settings */}
      <div className="bg-surface-primary border border-border-primary rounded-lg p-6">
        <h2 className="text-body font-medium text-text-primary mb-4">Classification</h2>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-body-sm text-text-primary">
                Freight Classification Threshold
              </label>
              <span className="text-body-sm font-medium text-accent">
                {Math.round(form.freight_classification_threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={form.freight_classification_threshold}
              onChange={(e) => handleChange('freight_classification_threshold', parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-caption text-text-secondary mt-1">
              Minimum confidence to classify an email as a freight opportunity
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-body-sm text-text-primary">
                Auto-Create Threshold
              </label>
              <span className="text-body-sm font-medium text-accent">
                {Math.round(form.auto_create_threshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="1.0"
              step="0.05"
              value={form.auto_create_threshold}
              onChange={(e) => handleChange('auto_create_threshold', parseFloat(e.target.value))}
              className="w-full accent-accent"
            />
            <p className="text-caption text-text-secondary mt-1">
              Auto-accept opportunities above this confidence level
            </p>
          </div>
        </div>
      </div>

      {/* Processing Settings */}
      <div className="bg-surface-primary border border-border-primary rounded-lg p-6">
        <h2 className="text-body font-medium text-text-primary mb-4">Processing</h2>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-body-sm text-text-primary">Auto-match Brokers</p>
              <p className="text-caption text-text-secondary">
                Automatically match extracted broker info to your existing brokers
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={form.auto_match_broker}
                onChange={(e) => handleChange('auto_match_broker', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${form.auto_match_broker ? 'bg-accent' : 'bg-surface-tertiary'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${form.auto_match_broker ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-body-sm text-text-primary">New Opportunity Notifications</p>
              <p className="text-caption text-text-secondary">
                Notify dispatchers when new freight opportunities are detected
              </p>
            </div>
            <div className="relative">
              <input
                type="checkbox"
                checked={form.notify_on_new_opportunity}
                onChange={(e) => handleChange('notify_on_new_opportunity', e.target.checked)}
                className="sr-only"
              />
              <div className={`w-10 h-6 rounded-full transition-colors ${form.notify_on_new_opportunity ? 'bg-accent' : 'bg-surface-tertiary'}`}>
                <div className={`w-4 h-4 bg-white rounded-full shadow absolute top-1 transition-transform ${form.notify_on_new_opportunity ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
            </div>
          </label>

          <div>
            <label className="text-body-sm text-text-primary">Max Daily Emails</label>
            <input
              type="number"
              value={form.max_daily_emails}
              onChange={(e) => handleChange('max_daily_emails', parseInt(e.target.value) || 500)}
              className="input w-32 mt-1"
              min="1"
              max="10000"
            />
            <p className="text-caption text-text-secondary mt-1">
              Maximum emails to process per day per connection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
