/**
 * AVA Settings Page
 * Configure Motive integration
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import * as avaApi from '../../api/ava.api';
import {
  ArrowLeft,
  Zap,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Link2,
  Truck,
  RefreshCw,
  Copy,
  ExternalLink,
  Clock
} from 'lucide-react';

export function AvaSettingsPage() {
  const navigate = useNavigate();
  const { orgUrl, currentOrg } = useOrg();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const [settings, setSettings] = useState(null);
  const [apiKey, setApiKey] = useState('');
  const [testResult, setTestResult] = useState(null);

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  // Webhook URL for Motive
  const webhookUrl = `${window.location.origin}/webhooks/motive`;

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await avaApi.getSettings();
      setSettings(res.data);

      if (res.data?.configured) {
        fetchVehicles();
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Motive vehicles
  const fetchVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const res = await avaApi.getMotiveVehicles();
      setVehicles(res.data?.vehicles || []);
    } catch (err) {
      console.error('Error fetching vehicles:', err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  // Test connection
  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setError(null);

      const res = await avaApi.testConnection(apiKey || null);
      setTestResult(res.data);
    } catch (err) {
      console.error('Test error:', err);
      setTestResult({ success: false, error: err.response?.data?.message || err.message });
    } finally {
      setTesting(false);
    }
  };

  // Save settings
  const handleSave = async () => {
    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      await avaApi.saveSettings(apiKey);
      setSuccess('Motive integration configured successfully!');
      setApiKey('');
      await fetchSettings();
    } catch (err) {
      console.error('Save error:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  // Copy webhook URL
  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setSuccess('Webhook URL copied to clipboard');
    setTimeout(() => setSuccess(null), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  const integration = settings?.integration;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate(orgUrl('/tools/ava'))}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-xl sm:text-title text-text-primary flex items-center gap-2">
            <Settings className="w-6 h-6 text-text-secondary" />
            AVA Settings
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Configure Motive ELD integration
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <Card padding="default" className="bg-success/5 border border-success/20">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-success" />
            <p className="text-body-sm text-success">{success}</p>
          </div>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      {/* Connection Status */}
      {settings?.configured && (
        <Card padding="default">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                integration?.is_active ? 'bg-success/10' : 'bg-error/10'
              }`}>
                {integration?.is_active ? (
                  <CheckCircle className="w-5 h-5 text-success" />
                ) : (
                  <XCircle className="w-5 h-5 text-error" />
                )}
              </div>
              <div>
                <p className="text-body font-medium text-text-primary">
                  Motive Connection
                </p>
                <p className="text-small text-text-secondary">
                  {integration?.is_active ? 'Connected and active' : 'Connection error'}
                </p>
              </div>
            </div>
            <Badge variant={integration?.is_active ? 'green' : 'red'}>
              {integration?.is_active ? 'Connected' : 'Disconnected'}
            </Badge>
          </div>

          {integration && (
            <div className="mt-4 pt-4 border-t border-surface-tertiary grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-small text-text-tertiary">Vehicles</p>
                <p className="text-body font-medium text-text-primary">
                  {integration.vehicle_count || 0}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">Last Sync</p>
                <p className="text-body font-medium text-text-primary">
                  {integration.last_sync_at
                    ? new Date(integration.last_sync_at).toLocaleString()
                    : 'Never'}
                </p>
              </div>
              <div>
                <p className="text-small text-text-tertiary">API Key</p>
                <p className="text-body font-medium text-text-primary">
                  {integration.has_api_key ? '••••••••••••' : 'Not set'}
                </p>
              </div>
            </div>
          )}

          {integration?.sync_error && (
            <div className="mt-4 p-3 bg-error/5 rounded-lg">
              <p className="text-small text-error">{integration.sync_error}</p>
            </div>
          )}
        </Card>
      )}

      {/* API Key Configuration */}
      <Card padding="default">
        <h2 className="text-body font-medium text-text-primary mb-4">
          {settings?.configured ? 'Update API Key' : 'Connect to Motive'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1">
              Motive API Key
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your Motive API key"
            />
            <p className="text-small text-text-tertiary mt-1">
              Find your API key in Motive Dashboard {'>'} Settings {'>'} Developer
            </p>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className={`p-3 rounded-lg ${
              testResult.success ? 'bg-success/5' : 'bg-error/5'
            }`}>
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <p className={`text-small ${testResult.success ? 'text-success' : 'text-error'}`}>
                  {testResult.success
                    ? `Connection successful! Found ${testResult.vehicleCount || 0} vehicles.`
                    : testResult.error}
                </p>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={handleTest}
              disabled={testing || (!apiKey && !settings?.configured)}
            >
              {testing ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Link2 className="w-4 h-4 mr-2" />
              )}
              Test Connection
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving || !apiKey.trim()}
            >
              {saving ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {settings?.configured ? 'Update' : 'Connect'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Webhook Configuration */}
      <Card padding="default">
        <h2 className="text-body font-medium text-text-primary mb-4">
          Webhook Configuration
        </h2>

        <p className="text-body-sm text-text-secondary mb-4">
          Configure this webhook URL in your Motive dashboard to receive real-time diagnostic alerts.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 p-3 bg-surface-secondary rounded-lg font-mono text-small text-text-primary overflow-x-auto">
            {webhookUrl}
          </div>
          <Button variant="secondary" onClick={handleCopyWebhook}>
            <Copy className="w-4 h-4" />
          </Button>
        </div>

        <div className="mt-4">
          <a
            href="https://gomotive.com/developer/docs/webhooks"
            target="_blank"
            rel="noopener noreferrer"
            className="text-small text-accent hover:underline flex items-center gap-1"
          >
            Motive Webhook Documentation
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </Card>

      {/* Linked Vehicles */}
      {settings?.configured && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between">
            <h2 className="text-body font-medium text-text-primary">Motive Vehicles</h2>
            <Button variant="ghost" size="sm" onClick={fetchVehicles} disabled={loadingVehicles}>
              <RefreshCw className={`w-4 h-4 ${loadingVehicles ? 'animate-spin' : ''}`} />
            </Button>
          </div>

          {loadingVehicles ? (
            <div className="flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : vehicles.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Truck className="w-12 h-12 text-text-tertiary mb-3" />
              <p className="text-body-sm text-text-secondary">No vehicles found</p>
            </div>
          ) : (
            <div className="divide-y divide-surface-tertiary">
              {vehicles.map((vehicle) => (
                <div key={vehicle.id} className="flex items-center gap-3 p-4">
                  <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
                    <Truck className="w-5 h-5 text-text-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary">
                      {vehicle.number || `Vehicle ${vehicle.id}`}
                    </p>
                    <p className="text-small text-text-secondary">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </p>
                  </div>
                  <Badge variant={vehicle.linked ? 'green' : 'gray'}>
                    {vehicle.linked ? 'Linked' : 'Not Linked'}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Help */}
      <Card padding="default" className="bg-accent/5">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <Zap className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="text-body font-medium text-text-primary">Need help?</h3>
            <p className="text-body-sm text-text-secondary mt-1">
              Contact support if you need assistance setting up your Motive integration. We're here to help get your fleet connected.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default AvaSettingsPage;
