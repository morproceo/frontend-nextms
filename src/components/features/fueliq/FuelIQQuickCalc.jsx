/**
 * FuelIQQuickCalc - Compact, modal-ready fuel cost estimator
 * Pick a load → see estimated fuel cost instantly
 */

import { useState, useEffect } from 'react';
import { Fuel, ChevronRight } from 'lucide-react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { formatCurrency } from '../../../lib/utils';
import * as fueliqApi from '../../../api/fueliq.api';

export function FuelIQQuickCalc({ loads = [], className = '' }) {
  const [selectedLoadId, setSelectedLoadId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleCalculate = async () => {
    if (!selectedLoadId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fueliqApi.getTripForLoad(selectedLoadId);
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Could not calculate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card variant="elevated" padding="default" className={className}>
      <div className="flex items-center gap-2 mb-4">
        <Fuel className="w-5 h-5 text-accent" />
        <h3 className="text-title-sm text-text-primary">Quick Fuel Estimate</h3>
      </div>

      <div className="flex gap-2 mb-4">
        <select
          value={selectedLoadId}
          onChange={(e) => { setSelectedLoadId(e.target.value); setResult(null); }}
          className="flex-1 px-3 py-2 rounded-input border border-border-primary bg-white text-body text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
        >
          <option value="">Select a load...</option>
          {loads.map(l => (
            <option key={l.id} value={l.id}>
              #{l.reference_number || l.id.slice(0, 8)} — {l.shipper_city}, {l.shipper_state} → {l.consignee_city}, {l.consignee_state}
            </option>
          ))}
        </select>
        <Button onClick={handleCalculate} disabled={!selectedLoadId || loading} size="sm">
          {loading ? <Spinner size="xs" /> : <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>

      {error && (
        <div className="text-small text-red-500 mb-2">{error}</div>
      )}

      {result && (
        <div className="grid grid-cols-3 gap-3 p-3 bg-accent/5 rounded-button">
          <div>
            <div className="text-caption text-text-tertiary">Miles</div>
            <div className="text-body font-semibold text-text-primary">{result.total_miles}</div>
          </div>
          <div>
            <div className="text-caption text-text-tertiary">Gallons</div>
            <div className="text-body font-semibold text-text-primary">{result.total_gallons?.toFixed(1)}</div>
          </div>
          <div>
            <div className="text-caption text-text-tertiary">Fuel Cost</div>
            <div className="text-body font-semibold text-accent">{formatCurrency(result.total_fuel_cost)}</div>
          </div>
        </div>
      )}
    </Card>
  );
}

export default FuelIQQuickCalc;
