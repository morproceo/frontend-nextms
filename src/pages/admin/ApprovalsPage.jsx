/**
 * Super Admin — approvals.
 *
 * Two queues, one screen:
 *   • Carrier verification — /v1/network/admin/verifications*
 *   • Direct beta access   — /v1/admin/direct-beta*
 * Both behind the same requireNetworkAdmin gate.
 */

import { useState, useEffect, useCallback } from 'react';
import { Loader2, AlertCircle, Check, X } from 'lucide-react';
import {
  adminListVerifications, adminApprove, adminReject
} from '../../api/networkVerification.api';
import {
  adminListBeta, adminApproveBeta, adminRejectBeta
} from '../../api/directBeta.api';

const DOMAINS = [
  { key: 'carrier', label: 'Carrier verification' },
  { key: 'beta', label: 'Direct beta' }
];
const STATUS_TABS = {
  carrier: [
    { key: 'submitted', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' }
  ],
  beta: [
    { key: 'requested', label: 'Pending' },
    { key: 'approved', label: 'Approved' },
    { key: 'rejected', label: 'Rejected' }
  ]
};
const fmt = (d) => (d ? new Date(d).toLocaleString() : '—');

export default function AdminApprovalsPage() {
  const [domain, setDomain] = useState('carrier');
  const [tab, setTab] = useState('submitted');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const pendingKey = domain === 'beta' ? 'requested' : 'submitted';

  const load = useCallback(async (dom, status) => {
    setLoading(true);
    setError(null);
    try {
      const data = dom === 'beta'
        ? await adminListBeta(status)
        : await adminListVerifications(status);
      setRows(Array.isArray(data) ? data : data?.verifications || []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(domain, tab); }, [domain, tab, load]);

  const switchDomain = (d) => {
    setDomain(d);
    setTab(d === 'beta' ? 'requested' : 'submitted');
  };

  const approve = async (row) => {
    const id = domain === 'beta' ? row.id : (row.organization?.id || row.organization_id);
    setBusyId(id);
    try {
      if (domain === 'beta') await adminApproveBeta(row.id);
      else await adminApprove(id);
      await load(domain, tab);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  const reject = async (row) => {
    const reason = window.prompt('Rejection reason (shown to the org):');
    if (reason == null) return;
    const id = domain === 'beta' ? row.id : (row.organization?.id || row.organization_id);
    setBusyId(id);
    try {
      if (domain === 'beta') await adminRejectBeta(row.id, reason);
      else await adminReject(id, reason);
      await load(domain, tab);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="max-w-4xl">
      <h1 className="text-headline text-text-primary">Approvals</h1>
      <p className="text-body-sm text-text-secondary mt-1">
        {domain === 'beta'
          ? 'Organizations requesting MorPro Direct beta access.'
          : 'Carrier identity / MC verification queue.'}
      </p>

      {/* Domain switch */}
      <div className="flex gap-1 mt-6 p-1 bg-surface-primary border border-surface-tertiary rounded-button w-fit">
        {DOMAINS.map((d) => (
          <button
            key={d.key}
            onClick={() => switchDomain(d.key)}
            className={`px-4 py-1.5 rounded-chip text-body-sm font-medium transition-colors ${
              domain === d.key
                ? 'bg-text-primary text-white'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 mt-3 mb-4 p-1 bg-surface-primary border border-surface-tertiary rounded-button w-fit">
        {STATUS_TABS[domain].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-1.5 rounded-chip text-body-sm transition-colors ${
              tab === t.key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      <div className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
        {loading ? (
          <div className="p-12 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center text-body-sm text-text-tertiary">
            Nothing {tab === pendingKey ? 'pending' : tab}.
          </div>
        ) : (
          <ul className="divide-y divide-surface-tertiary">
            {rows.map((p) => {
              const o = p.organization || {};
              const key = domain === 'beta' ? p.id : (p.id || o.id || p.organization_id);
              const sub = domain === 'beta'
                ? `${p.requested_by?.name || p.requested_by?.email || 'Unknown'} · requested ${fmt(p.requested_at)}`
                : `MC ${o.mc_number || p.mc_number || '—'} · DOT ${o.dot_number || p.dot_number || '—'} · submitted ${fmt(p.submitted_at || p.updated_at)}`;
              const busy = busyId === (domain === 'beta' ? p.id : (o.id || p.organization_id));
              return (
                <li key={key} className="flex items-center gap-4 px-5 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="text-body-sm font-medium text-text-primary truncate">
                      {o.name || 'Unknown org'}
                    </div>
                    <div className="text-small text-text-tertiary truncate">{sub}</div>
                  </div>
                  {tab === pendingKey ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => approve(p)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-success text-white text-small font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        Approve
                      </button>
                      <button
                        onClick={() => reject(p)}
                        disabled={busy}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-button bg-error-muted text-error text-small font-medium hover:opacity-90 disabled:opacity-50"
                      >
                        <X className="w-3.5 h-3.5" /> Reject
                      </button>
                    </div>
                  ) : (
                    <span className="text-small text-text-tertiary">{p.status}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
