import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Plus, ArrowRightLeft, Pencil, StickyNote, FileText,
  Sparkles, User as UserIcon, Cpu, Settings2
} from 'lucide-react';
import { getLoadEvents } from '../../api/loads.api';

/**
 * LoadActivityTimeline — the load's narrative.
 *
 * Renders the structured event log (same data the agent layer reads) as
 * an elegant vertical timeline, plus a calm "Full details" grid that
 * surfaces every Load field — including the ones the edit UI doesn't
 * show — so nothing is hidden, without cluttering the edit tabs.
 */

const EVENT_META = {
  created: { icon: Plus, tint: '#34CCFF', label: 'Load created' },
  status_change: { icon: ArrowRightLeft, tint: '#34D399', label: 'Status changed' },
  field_edit: { icon: Pencil, tint: '#A78BFA', label: 'Edited' },
  note: { icon: StickyNote, tint: '#FBBF24', label: 'Note' },
  document: { icon: FileText, tint: '#60A5FA', label: 'Document' },
  agent_action: { icon: Sparkles, tint: '#E879F9', label: 'Agent action' }
};

const rel = (d) => {
  const t = new Date(d).getTime();
  const s = Math.floor((Date.now() - t) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

const ActorBadge = ({ type }) => {
  if (type === 'agent') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-fuchsia-600 bg-fuchsia-500/10 rounded-full px-1.5 py-0.5">
        <Cpu className="w-2.5 h-2.5" /> agent
      </span>
    );
  }
  if (type === 'system') {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-gray-500 bg-gray-100 rounded-full px-1.5 py-0.5">
        <Settings2 className="w-2.5 h-2.5" /> system
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-blue-600 bg-blue-500/10 rounded-full px-1.5 py-0.5">
      <UserIcon className="w-2.5 h-2.5" /> person
    </span>
  );
};

function EventRow({ e, last }) {
  const meta = EVENT_META[e.event_type] || EVENT_META.field_edit;
  const Icon = meta.icon;
  return (
    <li className="relative flex gap-3 pb-5">
      {!last && (
        <span className="absolute left-[15px] top-8 bottom-0 w-px bg-gray-200" aria-hidden />
      )}
      <span
        className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ background: `${meta.tint}1f`, border: `1px solid ${meta.tint}40` }}
      >
        <Icon className="w-4 h-4" style={{ color: meta.tint }} />
      </span>
      <div className="min-w-0 flex-1 pt-1">
        <div className="flex items-center flex-wrap gap-x-2 gap-y-1">
          <span className="text-sm font-medium text-gray-900">
            {e.event_type === 'status_change'
              ? <>Status → <span className="capitalize">{e.new_value}</span></>
              : e.event_type === 'field_edit'
                ? <>{e.field} updated</>
                : meta.label}
          </span>
          <ActorBadge type={e.actor_type} />
          <span className="text-xs text-gray-400">{rel(e.created_at)}</span>
        </div>
        {(e.event_type === 'field_edit' || e.event_type === 'status_change') &&
          (e.old_value || e.new_value) && (
          <div className="text-xs text-gray-500 mt-0.5 truncate">
            <span className="line-through opacity-60">{e.old_value || '—'}</span>
            {'  →  '}
            <span className="text-gray-700">{e.new_value || '—'}</span>
          </div>
        )}
        {e.note && <div className="text-xs text-gray-600 mt-0.5">{e.note}</div>}
        <div className="text-[11px] text-gray-400 mt-0.5">
          {e.actor_label || (e.actor_type === 'agent' ? 'Agent' : e.actor_type === 'system' ? 'System' : 'Unknown')}
          {e.source ? ` · ${e.source}` : ''}
        </div>
      </div>
    </li>
  );
}

const fmt = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
};

function DetailGrid({ load }) {
  if (!load) return null;
  const s = load.schedule || {};
  const groups = [
    ['Identity', [
      ['Reference #', load.reference_number],
      ['Customer load #', load.customer_load_number],
      ['Status', load.status],
      ['Billing status', load.billing_status],
      ['Load type', load.load_type],
      ['Created', load.created_at && new Date(load.created_at).toLocaleString()]
    ]],
    ['Handling', [
      ['Customer criticality', load.customer_criticality],
      ['Appointment rigidity', load.appointment_rigidity],
      ['Hazmat', load.hazmat],
      ['Hazmat class', load.hazmat_class],
      ['Temp controlled', load.temp_controlled],
      ['High value', load.high_value],
      ['Requires team', load.requires_team],
      ['Recovery difficulty', load.recovery_difficulty]
    ]],
    ['Schedule', [
      ['Pickup date', s.pickup_date],
      ['Pickup window', [s.pickup_time_start, s.pickup_time_end].filter(Boolean).join('–')],
      ['Delivery date', s.delivery_date],
      ['Delivery window', [s.delivery_time_start, s.delivery_time_end].filter(Boolean).join('–')],
      ['Completed at', s.completed_at && new Date(s.completed_at).toLocaleString()]
    ]],
    ['Broker', [
      ['Broker', load.broker?.name],
      ['Broker MC', load.broker?.mc]
    ]]
  ];
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
      {groups.map(([title, rows]) => (
        <div key={title} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{title}</div>
          <dl className="space-y-1.5">
            {rows.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm">
                <dt className="text-gray-500 flex-shrink-0">{k}</dt>
                <dd className="text-gray-800 text-right truncate">{fmt(v)}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function LoadActivityTimeline({ loadId, load }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load_ = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLoadEvents(loadId);
      setEvents(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [loadId]);

  useEffect(() => { if (loadId) load_(); }, [loadId, load_]);

  // Newest first for display.
  const ordered = [...events].reverse();

  return (
    <div className="space-y-6 py-4">
      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Activity</h3>
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
          </div>
        ) : error ? (
          <div className="text-sm text-red-500">{error}</div>
        ) : ordered.length === 0 ? (
          <div className="text-sm text-gray-400 py-6 text-center bg-gray-50 rounded-xl border border-gray-200">
            No activity recorded yet. Changes from now on are tracked here.
          </div>
        ) : (
          <ul className="relative">
            {ordered.map((e, i) => (
              <EventRow key={e.id} e={e} last={i === ordered.length - 1} />
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Full details</h3>
        <p className="text-xs text-gray-400 mb-2">
          Everything on this load — including fields the edit tabs don’t surface.
        </p>
        <DetailGrid load={load} />
      </section>
    </div>
  );
}

export default LoadActivityTimeline;
