/**
 * ActionItems — "What needs you today" feed.
 *
 * Backed by /v1/dashboard/action-items (aggregator unioning missing
 * BOLs/rate-cons, overdue invoices, expiring driver+equipment docs).
 * Already curated server-side (capped + sorted by severity); we just
 * render rows.
 *
 * Empty state is its own reward: "All clear" is what owner-ops want to
 * read in the morning.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  AlertCircle,
  FileWarning,
  Receipt,
  ShieldAlert,
  CheckCircle2,
  ChevronRight,
  Loader2
} from 'lucide-react';
import dashboardApi from '../../../api/dashboard.api';

const KIND_META = {
  missing_bol:        { Icon: FileWarning, accent: 'text-amber-500' },
  missing_rate_con:   { Icon: FileWarning, accent: 'text-amber-500' },
  invoice_overdue:    { Icon: Receipt,     accent: 'text-rose-500' },
  doc_expiring:       { Icon: ShieldAlert, accent: 'text-amber-500' }
};

const SEVERITY_BADGE = {
  high:   'bg-rose-500/15 text-rose-600 border-rose-500/30',
  medium: 'bg-amber-500/15 text-amber-700 border-amber-500/30',
  low:    'bg-slate-500/10 text-slate-600 border-slate-500/20'
};

export function ActionItems() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await dashboardApi.getActionItems();
        if (cancelled) return;
        setItems(data.items || []);
      } catch {
        if (!cancelled) setItems([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <section className="rounded-2xl bg-surface-primary border border-surface-tertiary overflow-hidden h-full">
      <header className="px-5 py-4 border-b border-surface-tertiary flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-amber-500" />
        <h2 className="text-body font-semibold text-text-primary">What needs you</h2>
        {items.length > 0 && (
          <span className="ml-auto text-small text-text-tertiary tabular-nums">
            {items.length}
          </span>
        )}
      </header>

      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
          <p className="text-body-sm text-text-primary font-medium">All clear</p>
          <p className="text-small text-text-tertiary mt-1">
            Nothing needs your attention right now.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-surface-tertiary">
          {items.map((item) => (
            <ItemRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </section>
  );
}

function ItemRow({ item }) {
  const meta = KIND_META[item.kind] || { Icon: AlertTriangle, accent: 'text-amber-500' };
  const sev = SEVERITY_BADGE[item.severity] || SEVERITY_BADGE.medium;
  const content = (
    <>
      <div className={`w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center shrink-0 ${meta.accent}`}>
        <meta.Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-body-sm font-medium text-text-primary truncate">{item.headline}</p>
          <span className={`hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-semibold border ${sev}`}>
            {item.severity}
          </span>
        </div>
        {item.subhead && (
          <p className="text-small text-text-tertiary truncate">{item.subhead}</p>
        )}
      </div>
      {item.href && <ChevronRight className="w-4 h-4 text-text-tertiary shrink-0" />}
    </>
  );

  if (item.href) {
    return (
      <li>
        <Link
          to={item.href}
          className="flex items-center gap-3 px-5 py-3 hover:bg-surface-secondary/60 transition-colors"
        >
          {content}
        </Link>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-3 px-5 py-3">
      {content}
    </li>
  );
}

export default ActionItems;
