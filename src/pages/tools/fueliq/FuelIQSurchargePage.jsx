/**
 * FuelIQ Surcharge Page - FSC calculator, lookup table, and org settings
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { useFuelIQSurcharge, useFuelIQ } from '../../../hooks/domain/useFuelIQ';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { FuelSurchargeCalculator } from '../../../components/features/fueliq/FuelSurchargeCalculator';
import { FscTable } from '../../../components/features/fueliq/FscTable';
import {
  ArrowLeft,
  Calculator,
  Settings,
  Save
} from 'lucide-react';

export function FuelIQSurchargePage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const { national } = useFuelIQ({ autoFetch: true });

  const {
    config,
    fscTable,
    result,
    loading,
    mutating,
    calculate,
    updateConfig,
    fetchTable
  } = useFuelIQSurcharge();

  // Settings form
  const [basePrice, setBasePrice] = useState('');
  const [defaultMpg, setDefaultMpg] = useState('');
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Pre-fill settings from config
  useState(() => {
    if (config) {
      setBasePrice(config.base_fuel_price?.toString() || '1.20');
      setDefaultMpg(config.default_mpg?.toString() || '6.00');
    }
  }, [config]);

  const handleSaveSettings = async () => {
    await updateConfig({
      base_fuel_price: parseFloat(basePrice) || 1.20,
      default_mpg: parseFloat(defaultMpg) || 6.00
    });
    setSettingsSaved(true);
    setTimeout(() => setSettingsSaved(false), 3000);
  };

  if (loading && !config) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(orgUrl('/tools/fueliq'))}
          className="p-2 rounded-chip hover:bg-surface-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-text-secondary" />
        </button>
        <div>
          <h1 className="text-headline text-text-primary flex items-center gap-2">
            <Calculator className="w-6 h-6 text-accent" />
            Fuel Surcharge
          </h1>
          <p className="text-body-sm text-text-secondary mt-0.5">
            Calculate and manage fuel surcharge rates
          </p>
        </div>
      </div>

      {/* Calculator */}
      <FuelSurchargeCalculator
        config={config}
        nationalAvg={national?.national_avg}
        onCalculate={calculate}
        result={result}
        loading={mutating}
      />

      {/* FSC Table */}
      <FscTable table={fscTable} />

      {/* Settings */}
      <Card variant="elevated" padding="default">
        <div className="flex items-center gap-2 mb-5">
          <Settings className="w-5 h-5 text-text-secondary" />
          <h3 className="text-title-sm text-text-primary">Your Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1.5">
              Base Fuel Price ($/gal)
            </label>
            <input
              type="number"
              step="0.01"
              value={basePrice || config?.base_fuel_price || '1.20'}
              onChange={(e) => setBasePrice(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <span className="text-caption text-text-tertiary mt-1 block">
              Industry standard: $1.20
            </span>
          </div>
          <div>
            <label className="block text-small font-medium text-text-secondary mb-1.5">
              Default Truck MPG
            </label>
            <input
              type="number"
              step="0.1"
              value={defaultMpg || config?.default_mpg || '6.00'}
              onChange={(e) => setDefaultMpg(e.target.value)}
              className="w-full px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
            />
            <span className="text-caption text-text-tertiary mt-1 block">
              Used when a truck has no individual MPG data
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleSaveSettings} disabled={mutating}>
            <Save className="w-4 h-4 mr-1.5" />
            {mutating ? 'Saving...' : 'Save Settings'}
          </Button>
          {settingsSaved && (
            <span className="text-small text-green-600 font-medium">Settings saved</span>
          )}
        </div>
      </Card>
    </div>
  );
}

export default FuelIQSurchargePage;
