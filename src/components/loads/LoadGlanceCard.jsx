import {
  Flame, Snowflake, Gem, Users, AlertTriangle, Star, Clock3
} from 'lucide-react';

/**
 * LoadGlanceCard — the "informative at a quick glance" header for a load.
 *
 * Surfaces the classification/handling fields the edit tabs never showed
 * (hazmat, temp, high-value, team, criticality, appointment rigidity,
 * recovery difficulty, load type, billing status, completed). Chips only
 * render when set, so it's rich when the load is complex and quiet when
 * it's routine — never noisy. Read-only by design; editing lives in the
 * existing sections + the Activity tab's full grid.
 */

const titleCase = (s) =>
  s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : s;

function Chip({ icon: Icon, label, tint }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function LoadGlanceCard({ load }) {
  if (!load) return null;

  const chips = [];
  if (load.hazmat) {
    chips.push({ icon: Flame, tint: '#EF4444', label: `Hazmat${load.hazmat_class ? ` · ${load.hazmat_class}` : ''}` });
  }
  if (load.temp_controlled) chips.push({ icon: Snowflake, tint: '#06B6D4', label: 'Temp controlled' });
  if (load.high_value) chips.push({ icon: Gem, tint: '#F59E0B', label: 'High value' });
  if (load.requires_team) chips.push({ icon: Users, tint: '#8B5CF6', label: 'Team required' });
  if (load.customer_criticality && load.customer_criticality !== 'standard') {
    chips.push({ icon: Star, tint: '#A855F7', label: `${titleCase(load.customer_criticality)} customer` });
  }
  if (load.appointment_rigidity && load.appointment_rigidity !== 'flexible') {
    chips.push({ icon: Clock3, tint: '#3B82F6', label: titleCase(load.appointment_rigidity) });
  }
  if (load.recovery_difficulty && !['low', 'easy'].includes(String(load.recovery_difficulty).toLowerCase())) {
    chips.push({ icon: AlertTriangle, tint: '#F97316', label: `${titleCase(load.recovery_difficulty)} recovery` });
  }

  const meta = [
    ['Load type', titleCase(load.load_type)],
    ['Billing', titleCase(load.billing_status)],
    ['Customer PO', load.customer_load_number],
    load.schedule?.completed_at && ['Completed', new Date(load.schedule.completed_at).toLocaleDateString()]
  ].filter(Boolean).filter(([, v]) => v != null && v !== '');

  if (chips.length === 0 && meta.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 mb-4">
      <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-2.5">
        At a glance
      </div>
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {chips.map((c) => <Chip key={c.label} {...c} />)}
        </div>
      )}
      {meta.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-2">
          {meta.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <div className="text-[11px] text-gray-400">{k}</div>
              <div className="text-sm text-gray-800 truncate">{v}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default LoadGlanceCard;
