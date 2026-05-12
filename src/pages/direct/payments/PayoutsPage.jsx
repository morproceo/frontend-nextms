import { useEffect, useState } from 'react';
import { Wallet, Loader2, Package } from 'lucide-react';
import networkApi from '../../../api/network.api';

/**
 * Carrier payouts — Phase 5.
 * Lists every payment transaction where this org is the carrier.
 */
export default function PayoutsPage() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    networkApi.listMyPayouts()
      .then(setRows)
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="px-6 py-10 max-w-5xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
          <Wallet className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Payouts</h1>
          <p className="text-body-sm text-text-secondary">Money owed for loads you've carried.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Package className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No payouts yet.</p>
        </div>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-primary overflow-x-auto">
          <table className="w-full text-body-sm">
            <thead className="bg-surface-secondary">
              <tr>
                <th className="text-left p-3 font-medium text-text-tertiary text-small">Load</th>
                <th className="text-right p-3 font-medium text-text-tertiary text-small">Gross</th>
                <th className="text-right p-3 font-medium text-text-tertiary text-small">Fee</th>
                <th className="text-right p-3 font-medium text-text-tertiary text-small">Net</th>
                <th className="text-left p-3 font-medium text-text-tertiary text-small">Status</th>
                <th className="text-left p-3 font-medium text-text-tertiary text-small">Released</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-border-subtle">
                  <td className="p-3">{r.networkLoad?.reference_number || r.network_load_id?.slice(0, 8)}</td>
                  <td className="p-3 text-right">${cents(r.gross_load_amount_cents)}</td>
                  <td className="p-3 text-right text-text-tertiary">-${cents(r.carrier_platform_fee_cents)}</td>
                  <td className="p-3 text-right font-medium">${cents(r.carrier_net_payout_cents)}</td>
                  <td className="p-3"><PayoutStatusPill status={r.status} /></td>
                  <td className="p-3 text-text-tertiary">{r.released_at ? new Date(r.released_at).toLocaleDateString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function cents(c) { return ((Number(c) || 0) / 100).toFixed(2); }

function PayoutStatusPill({ status }) {
  const cfg = ({
    awaiting_payment_method: 'bg-amber-500/10 text-amber-700',
    pending_payment: 'bg-amber-500/10 text-amber-700',
    authorized: 'bg-blue-500/10 text-blue-700',
    awaiting_pod: 'bg-violet-500/10 text-violet-700',
    awaiting_release: 'bg-cyan-500/10 text-cyan-700',
    held: 'bg-orange-500/10 text-orange-700',
    captured: 'bg-emerald-500/10 text-emerald-700',
    released: 'bg-emerald-500/10 text-emerald-700',
    refunded: 'bg-red-500/10 text-red-700',
    disputed: 'bg-red-500/10 text-red-700'
  })[status] || 'bg-gray-500/10 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {String(status).replace(/_/g, ' ')}
    </span>
  );
}
