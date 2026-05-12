import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Inbox, Send, Loader2, ChevronRight, Building2 } from 'lucide-react';
import networkApi from '../../../api/network.api';
import { useOrg } from '../../../contexts/OrgContext';

const TABS = [
  { value: '', label: 'All' },
  { value: 'sent', label: 'Sent' },
  { value: 'viewed', label: 'Viewed' },
  { value: 'countered', label: 'Countered' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Declined' },
  { value: 'cancelled', label: 'Cancelled' }
];

export default function RequestsPage() {
  const { currentOrg } = useOrg();
  const networkRoles = currentOrg?.network_roles || [];
  const isCarrier = networkRoles.includes('carrier');
  const isShipperSide =
    networkRoles.includes('shipper') ||
    networkRoles.includes('3pl') ||
    networkRoles.includes('manufacturer');

  // Hybrid orgs default to incoming view (carrier side feels more inbox-like).
  const initialMode = isCarrier ? 'incoming' : isShipperSide ? 'outgoing' : 'outgoing';
  const [mode, setMode] = useState(initialMode);
  return (
    <div className="px-6 py-10 max-w-4xl mx-auto">
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
            {mode === 'incoming' ? <Inbox className="w-5 h-5 text-white" /> : <Send className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h1 className="text-title text-text-primary">
              {mode === 'incoming' ? 'Direct requests' : 'Outgoing requests'}
            </h1>
            <p className="text-body-sm text-text-secondary">
              {mode === 'incoming'
                ? 'Shippers asking you specifically for capacity.'
                : 'Carriers you reached out to directly.'}
            </p>
          </div>
        </div>
        {isCarrier && isShipperSide && (
          <div className="inline-flex rounded-button border border-border overflow-hidden">
            <button onClick={() => setMode('incoming')}
              className={`px-3 py-1.5 text-small font-medium ${mode === 'incoming' ? 'bg-accent text-white' : 'text-text-secondary'}`}>
              Incoming
            </button>
            <button onClick={() => setMode('outgoing')}
              className={`px-3 py-1.5 text-small font-medium ${mode === 'outgoing' ? 'bg-accent text-white' : 'text-text-secondary'}`}>
              Outgoing
            </button>
          </div>
        )}
      </header>

      <RequestsList mode={mode} />
    </div>
  );
}

function RequestsList({ mode }) {
  const { orgSlug } = useParams();
  const [status, setStatus] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = async () => {
    setLoading(true); setError(null);
    try {
      const list = mode === 'incoming'
        ? await networkApi.listIncomingRequests(status || undefined)
        : await networkApi.listOutgoingRequests(status || undefined);
      setItems(list || []);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { refresh(); /* eslint-disable-line */ }, [mode, status]);

  return (
    <>
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
      ) : items.length === 0 ? (
        <div className="rounded-card border border-border-subtle p-10 text-center">
          <Inbox className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="text-body-sm text-text-secondary">No requests in this state.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((r) => {
            const counterparty = mode === 'incoming' ? r.shipperOrganization : r.carrierOrganization;
            return (
              <li key={r.id}>
                <Link to={`/o/${orgSlug}/direct/requests/${r.id}`}
                  className="flex items-center justify-between gap-3 p-4 rounded-card border border-border-subtle bg-surface-primary hover:border-border transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    {counterparty?.logo_url ? (
                      <img src={counterparty.logo_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-surface-secondary flex items-center justify-center">
                        <Building2 className="w-4 h-4 text-text-tertiary" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-body font-medium text-text-primary truncate">{counterparty?.name}</p>
                        <RequestStatusPill status={r.status} />
                      </div>
                      <p className="text-small text-text-tertiary truncate">
                        {r.pickup?.city}, {r.pickup?.state} → {r.delivery?.city}, {r.delivery?.state}
                        {r.rate_offered ? ` · $${Number(r.rate_offered).toFixed(2)}` : ''}
                        {r.counter_amount != null ? ` · counter $${Number(r.counter_amount).toFixed(2)}` : ''}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export function RequestStatusPill({ status }) {
  const cfg = ({
    draft: 'bg-gray-500/10 text-gray-600',
    sent: 'bg-blue-500/10 text-blue-700 dark:text-blue-400',
    viewed: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400',
    countered: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    accepted: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    rejected: 'bg-red-500/10 text-red-700 dark:text-red-400',
    expired: 'bg-orange-500/10 text-orange-700 dark:text-orange-400',
    cancelled: 'bg-gray-500/10 text-gray-600'
  })[status] || 'bg-gray-500/10 text-gray-600';
  return (
    <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>
      {status}
    </span>
  );
}
