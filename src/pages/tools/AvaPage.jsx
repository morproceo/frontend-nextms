/**
 * AVA AI Mechanic - Fleet Dashboard
 * Shows fleet health overview and truck diagnostics
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import * as avaApi from '../../api/ava.api';
import {
  Zap,
  Truck,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Settings,
  ChevronRight,
  Wrench,
  Activity,
  Clock,
  MessageSquare
} from 'lucide-react';

// Severity badge configs
const SeverityConfig = {
  critical: { label: 'Critical', variant: 'red', icon: AlertTriangle },
  warning: { label: 'Warning', variant: 'yellow', icon: AlertCircle },
  info: { label: 'Info', variant: 'blue', icon: Activity }
};

export function AvaPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [fleetHealth, setFleetHealth] = useState(null);
  const [settings, setSettings] = useState(null);

  // Fetch fleet health data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, settingsRes] = await Promise.all([
        avaApi.getFleetHealth(),
        avaApi.getSettings()
      ]);

      setFleetHealth(healthRes.data);
      setSettings(settingsRes.data);
    } catch (err) {
      console.error('Error fetching AVA data:', err);
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Sync diagnostics from Motive
  const handleSync = async () => {
    try {
      setSyncing(true);
      await avaApi.syncDiagnostics();
      await fetchData();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  // Navigate to truck detail
  const handleTruckClick = (truckId) => {
    navigate(orgUrl(`/tools/ava/${truckId}`));
  };

  // Navigate to settings
  const handleSettings = () => {
    navigate(orgUrl('/tools/ava/settings'));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  // Not configured state
  if (!settings?.configured) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl sm:text-title text-text-primary flex items-center gap-2">
              <Zap className="w-6 h-6 text-accent" />
              AVA AI Mechanic
            </h1>
            <p className="text-body-sm text-text-secondary mt-1">
              AI-powered truck diagnostics and repair advisor
            </p>
          </div>
        </div>

        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-20 h-20 bg-accent/10 rounded-full flex items-center justify-center mb-6">
              <Wrench className="w-10 h-10 text-accent" />
            </div>
            <h2 className="text-headline text-text-primary mb-2">Connect to Motive</h2>
            <p className="text-body-sm text-text-secondary text-center max-w-md mb-6">
              AVA needs access to your Motive ELD system to monitor truck diagnostics and provide AI-powered repair recommendations.
            </p>
            <Button onClick={handleSettings}>
              <Settings className="w-4 h-4 mr-2" />
              Configure Motive Integration
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const { summary, trucks, recentAlerts } = fleetHealth || {};

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-title text-text-primary flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            AVA AI Mechanic
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            Fleet health monitoring and AI diagnostics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={handleSync} disabled={syncing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
          <Button variant="ghost" onClick={handleSettings}>
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-error">Error loading data</p>
              <p className="text-small text-text-secondary">{error}</p>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              Retry
            </Button>
          </div>
        </Card>
      )}

      {/* Fleet Health Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card padding="compact">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-text-primary/5 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-small text-text-secondary">Total Trucks</p>
              <p className="text-headline text-text-primary">{summary?.total || 0}</p>
            </div>
          </div>
        </Card>

        <Card padding="compact">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-success/10 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-small text-text-secondary">Healthy</p>
              <p className="text-headline text-success">{summary?.healthy || 0}</p>
            </div>
          </div>
        </Card>

        <Card padding="compact">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-warning/10 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-small text-text-secondary">Warnings</p>
              <p className="text-headline text-warning">{summary?.withWarnings || 0}</p>
            </div>
          </div>
        </Card>

        <Card padding="compact">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-error/10 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-small text-text-secondary">Critical</p>
              <p className="text-headline text-error">{summary?.withCritical || 0}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Trucks with Issues */}
      {trucks && trucks.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-surface-tertiary">
            <h2 className="text-body font-medium text-text-primary">Fleet Status</h2>
          </div>
          <div className="divide-y divide-surface-tertiary">
            {trucks.map((truck) => {
              const hasCritical = truck.diagnostics?.some(d => d.severity === 'critical');
              const hasWarning = truck.diagnostics?.some(d => d.severity === 'warning');
              const statusColor = hasCritical ? 'error' : hasWarning ? 'warning' : 'success';

              return (
                <div
                  key={truck.id}
                  onClick={() => handleTruckClick(truck.id)}
                  className="flex items-center gap-4 p-4 hover:bg-surface-secondary/50 cursor-pointer transition-colors group"
                >
                  {/* Truck Icon with Status */}
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                    statusColor === 'error' ? 'bg-error/10' :
                    statusColor === 'warning' ? 'bg-warning/10' : 'bg-success/10'
                  }`}>
                    <Truck className={`w-6 h-6 ${
                      statusColor === 'error' ? 'text-error' :
                      statusColor === 'warning' ? 'text-warning' : 'text-success'
                    }`} />
                  </div>

                  {/* Truck Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-body font-medium text-text-primary">
                      Unit #{truck.unit_number}
                    </p>
                    <p className="text-small text-text-secondary">
                      {truck.year} {truck.make} {truck.model}
                    </p>
                  </div>

                  {/* Active Codes */}
                  <div className="hidden sm:flex items-center gap-2">
                    {truck.diagnostics?.slice(0, 3).map((diag) => {
                      const config = SeverityConfig[diag.severity] || SeverityConfig.info;
                      return (
                        <Badge key={diag.id} variant={config.variant} size="sm">
                          {diag.code}
                        </Badge>
                      );
                    })}
                    {truck.diagnostics?.length > 3 && (
                      <Badge variant="gray" size="sm">
                        +{truck.diagnostics.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Status Badge */}
                  <Badge variant={statusColor === 'error' ? 'red' : statusColor === 'warning' ? 'yellow' : 'green'}>
                    {hasCritical ? 'Critical' : hasWarning ? 'Warning' : 'Healthy'}
                  </Badge>

                  <ChevronRight className="w-5 h-5 text-text-tertiary group-hover:text-text-secondary" />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Recent Alerts */}
      {recentAlerts && recentAlerts.length > 0 && (
        <Card padding="none">
          <div className="px-4 py-3 border-b border-surface-tertiary flex items-center justify-between">
            <h2 className="text-body font-medium text-text-primary">Recent Alerts</h2>
            <Badge variant="gray">{recentAlerts.length}</Badge>
          </div>
          <div className="divide-y divide-surface-tertiary">
            {recentAlerts.slice(0, 5).map((alert) => {
              const config = SeverityConfig[alert.severity] || SeverityConfig.info;
              const Icon = config.icon;

              return (
                <div key={alert.id} className="flex items-start gap-3 p-4">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    alert.severity === 'critical' ? 'bg-error/10' :
                    alert.severity === 'warning' ? 'bg-warning/10' : 'bg-blue-500/10'
                  }`}>
                    <Icon className={`w-4 h-4 ${
                      alert.severity === 'critical' ? 'text-error' :
                      alert.severity === 'warning' ? 'text-warning' : 'text-blue-500'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Badge variant={config.variant} size="sm">{alert.code}</Badge>
                      <span className="text-small text-text-tertiary">
                        Unit #{alert.truck?.unit_number || 'Unknown'}
                      </span>
                    </div>
                    <p className="text-body-sm text-text-secondary mt-1 line-clamp-2">
                      {alert.description || 'No description available'}
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-small text-text-tertiary">
                      <Clock className="w-3 h-3" />
                      {new Date(alert.first_seen_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Empty State */}
      {(!trucks || trucks.length === 0) && !error && (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">Fleet is Healthy</h3>
            <p className="text-body-sm text-text-secondary text-center max-w-md">
              No active diagnostic codes detected. AVA will alert you when issues are found.
            </p>
          </div>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card padding="compact" className="hover:bg-surface-secondary/50 cursor-pointer transition-colors" onClick={() => navigate(orgUrl('/tools/ava/chat'))}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-accent" />
            </div>
            <div>
              <p className="text-body font-medium text-text-primary">Chat with AVA</p>
              <p className="text-small text-text-secondary">Ask questions about truck repairs</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary ml-auto" />
          </div>
        </Card>

        <Card padding="compact" className="hover:bg-surface-secondary/50 cursor-pointer transition-colors" onClick={handleSettings}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center">
              <Settings className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-body font-medium text-text-primary">Integration Settings</p>
              <p className="text-small text-text-secondary">Manage Motive connection</p>
            </div>
            <ChevronRight className="w-5 h-5 text-text-tertiary ml-auto" />
          </div>
        </Card>
      </div>
    </div>
  );
}

export default AvaPage;
