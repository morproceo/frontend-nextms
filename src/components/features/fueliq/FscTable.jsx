/**
 * FscTable - Fuel surcharge lookup table
 * Reusable in surcharge page and modals
 */

import { Card } from '../../ui/Card';

export function FscTable({ table, className = '' }) {
  if (!table?.rows?.length) return null;

  return (
    <Card variant="elevated" padding="default" className={className}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-title-sm text-text-primary">FSC Lookup Table</h3>
        <div className="text-small text-text-tertiary">
          Base: ${table.base_fuel_price?.toFixed(2)} | MPG: {table.mpg}
        </div>
      </div>
      <div className="overflow-auto max-h-96">
        <table className="w-full text-small">
          <thead>
            <tr className="border-b border-surface-tertiary">
              <th className="text-left py-2 px-3 text-text-secondary font-medium">Diesel Price</th>
              <th className="text-right py-2 px-3 text-text-secondary font-medium">FSC/Mile</th>
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, i) => (
              <tr
                key={row.fuel_price}
                className={`border-b border-surface-tertiary/50 ${
                  i % 2 === 0 ? '' : 'bg-surface-secondary/30'
                }`}
              >
                <td className="py-1.5 px-3 text-text-primary">${row.fuel_price.toFixed(2)}</td>
                <td className="py-1.5 px-3 text-right text-text-primary font-mono">
                  ${row.fsc_per_mile.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

export default FscTable;
