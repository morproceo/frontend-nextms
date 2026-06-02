/**
 * ActivityStream — vertical timeline of the org's most recent events.
 *
 * Backed by /v1/dashboard/activity (last ~10 load_events joined to the
 * load for reference number). Renders one row per event with a kind-
 * specific icon, relative time, and an optional deep link.
 *
 * Activity is mostly read-only awareness, NOT a place users act from —
 * that's what the "What needs you" column is for. Keep this list
 * scannable, not interactive-heavy.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  PencilLine,
  FileText,
  Mail,
  MailX,
  Truck,
  Sparkles,
  Activity,
  Loader2
} from 'lucide-react';
import dashboardApi from '../../../api/dashboard.api';

const KIND_META = {
  status_change:        { Icon: Truck,         tint: 'text-blue-500' },
  field_edit:           { Icon: PencilLine,    tint: 'text-slate-500' },
  document_uploaded:    { Icon: FileText,      tint: 'text-emerald-500' },
  broker_notify:        { Icon: Mail,          tint: 'text-cyan-500' },
  broker_email_sent:    { Icon: Mail,          tint: 'text-cyan-500' },
  broker_email_skipped: { Icon: MailX,         tint: 'text-amber-500' },
  agent_action:         { Icon: Sparkles,      tint: 'text-fuchsia-500' },
  load_delivered:       { Icon: CheckCircle2,  tint: 'text-emerald-500' }
};

export function ActivityStream() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await dashboardApi.getActivity();
        if (cancelled) return;
        setEvents(data.events || []);
      } catch {
        if (!cancelled) setEvents([]);
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
        <Activity className="w-4 h-4 text-accent" />
        <h2 className="text-body font-semibold text-text-primary">Recent activity</h2>
      </header>

      {loading ? (
        <div className="px-5 py-8 flex items-center justify-center text-text-tertiary">
          <Loader2 className="w-4 h-4 animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <Activity className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
          <p className="text-body-sm text-text-secondary">No activity yet</p>
          <p className="text-small text-text-tertiary mt-1">
            Create a load to start the timeline.
          </p>
        </div>
      ) : (
        <ul className="px-5 py-3 space-y-3 relative">
          <span
            aria-hidden
            className="absolute left-[27px] top-5 bottom-5 w-px bg-surface-tertiary"
          />
          {events.map((event) => (
            <EventRow key={event.id} event={event} />
          ))}
        </ul>
      )}
    </section>
  );
}

function EventRow({ event }) {
  const meta = KIND_META[event.kind] || { Icon: Activity, tint: 'text-text-tertiary' };
  const content = (
    <div className="flex items-start gap-3 relative">
      <div className={`w-7 h-7 rounded-full bg-surface-primary border border-surface-tertiary flex items-center justify-center shrink-0 ${meta.tint} z-10`}>
        <meta.Icon className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-body-sm text-text-primary truncate">{event.label}</p>
        <p className="text-small text-text-tertiary mt-0.5">
          {relativeTime(event.ts)}
          {event.actor && <span> · {event.actor}</span>}
        </p>
      </div>
    </div>
  );

  if (event.href) {
    return (
      <li>
        <Link to={event.href} className="block hover:bg-surface-secondary/50 -mx-2 px-2 py-1 rounded-lg transition-colors">
          {content}
        </Link>
      </li>
    );
  }
  return <li>{content}</li>;
}

function relativeTime(ts) {
  if (!ts) return '';
  const ms = Date.now() - new Date(ts).getTime();
  if (ms < 60_000) return 'just now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m ago`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h ago`;
  const days = Math.floor(ms / 86_400_000);
  if (days < 7) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export default ActivityStream;
