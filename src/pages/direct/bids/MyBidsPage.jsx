import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Gavel, Loader2, ChevronRight, Package } from 'lucide-react';
import networkApi from '../../../api/network.api';
import { StatusPill } from '../loads/MyLoadsPage';

const TABS = [
  { value: '', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'countered', label: 'Countered' },
  { value: 'accepted', label: 'Won' },
  { value: 'rejected', label: 'Lost' },
  { value: 'withdrawn', label: 'Withdrawn' }
];

export default function MyBidsPage() {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('');
  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await networkApi.listMyBids(status || undefined);
      setBids(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, [status]);

  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <Gavel className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">My bids</h1>
          <p className="text-body-sm text-text-secondary">Bids you've placed in MorPro Direct.</p>
        </div>
      </header>

      <div className="flex gap-1 mb-4 border-b border-border-subtle overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.value} onClick={() => setStatus(t.value)}
            className={`px-4 py-2 text-body-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              status === t.value
                ? 'border-accent text-accent'
                : 'border-transparent text-text-secondary hover:text-text-primary'
            }`}>
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="w-5 h-5 animate-spin text-text-tertiary" /></div>
      ) : bids.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Package className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No bids in this state.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {bids.map((b) => {
            const l = b.networkLoad || {};
            return (
              <li key={b.id}>
                <Link to={`/o/${orgSlug}/direct/loads/${l.id}/view`}
                  className="flex items-center justify-between gap-3 p-4 rounded-card border border-border-subtle bg-surface-primary hover:border-border transition-colors">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-body font-medium text-text-primary truncate">
                        {l.reference_number || `#${l.id?.slice(0, 6)}`}
                      </p>
                      <BidStatusPill status={b.status} />
                    </div>
                    <p className="text-small text-text-tertiary truncate">
                      {l.pickup?.city}, {l.pickup?.state} → {l.delivery?.city}, {l.delivery?.state}
                      {l.commodity ? ` · ${l.commodity}` : ''}
                    </p>
                    <p className="text-small text-text-secondary mt-1">
                      Your bid: ${Number(b.bid_amount).toFixed(2)}
                      {b.counter_amount != null ? ` · counter: $${Number(b.counter_amount).toFixed(2)}` : ''}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function BidStatusPill({ status }) {
  const cfg = ({
    pending: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    countered: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
    withdrawn: 'bg-gray-500/10 text-gray-600',
    expired: 'bg-orange-500/10 text-orange-700 dark:text-orange-400'
  })[status] || 'bg-gray-500/10 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {status}
    </span>
  );
}
