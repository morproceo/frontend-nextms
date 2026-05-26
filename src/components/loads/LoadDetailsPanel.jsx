import { useState } from 'react';
import {
  Building2, Package, Truck, FileText, Plus, ExternalLink,
  MapPin, PackageCheck,
  Pencil, CircleDot, StickyNote, Receipt, Map as MapIcon, X,
  ChevronDown, BadgeCheck, Check, Phone, Mail, UserRound,
  CheckCircle2, Circle, Activity
} from 'lucide-react';
import { LoadStatusConfig } from '../../config/status';
import { LoadStatus } from '../../enums/loadStatus';

// Full lifecycle the Status card lets you pick from (ordered), incl. the
// manual side-states. Draft/paid are appended only if a load is in them.
// Full status list shown in the panel's status dropdown. Users can pick
// any value here — forward or backward — including PAID. Backend allows
// arbitrary transitions; the activity timeline preserves the audit trail.
const STATUS_ORDER = [
  LoadStatus.NEW, LoadStatus.BOOKED, LoadStatus.DISPATCHED,
  LoadStatus.PICKED_UP, LoadStatus.IN_TRANSIT, LoadStatus.DELAYED,
  LoadStatus.DELIVERED, LoadStatus.REVIEW, LoadStatus.INVOICED,
  LoadStatus.PAID, LoadStatus.COMPLETED, LoadStatus.CANCELLED
];

/**
 * LoadDetailsPanel — the load command center.
 *
 * Layout: Broker + Load Info on top → full-width Route → the
 * Assignment · Status · Billing trio (one consistent entity design) →
 * Classification, Documents, Notes. The page-level status stepper is
 * gone; status is now this designed card. Non-redundant: $ KPIs in the
 * FinancialStrip; map/stop CRUD in the RouteSlideOver.
 */

const BLUE = '#34CCFF';
const GREEN = '#34D399';

// Tailwind color name (from LoadStatusConfig) → hex for the status banner.
const TONE = {
  gray: '#94A3B8', blue: '#3B82F6', indigo: '#6366F1', purple: '#8B5CF6',
  violet: '#A78BFA', orange: '#F97316', amber: '#F59E0B', green: '#22C55E',
  cyan: '#06B6D4', teal: '#14B8A6', emerald: '#10B981', red: '#EF4444'
};

const initials = (name) =>
  (name || '?').trim().split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
const titleCase = (s) =>
  s ? String(s).replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) : '';
const brokerMc = (b) => b?.mc_number || b?.mc || '';

const BILL_TONE = {
  pending: '#F59E0B', not_invoiced: '#94A3B8', invoiced: '#34CCFF',
  submitted: '#34CCFF', partially_paid: '#A78BFA', paid: '#34D399',
  partial: '#A78BFA', overdue: '#EF4444', disputed: '#EF4444'
};

function Card({ icon: Icon, title, tint = BLUE, action, span, children }) {
  return (
    <section
      className={`group relative bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 overflow-hidden ${span || ''}`}
    >
      <div className="absolute inset-x-0 top-0 h-px opacity-60"
        style={{ background: `linear-gradient(90deg, transparent, ${tint}, transparent)` }} aria-hidden />
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 min-w-0">
            {Icon && (
              <span className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${tint}14`, border: `1px solid ${tint}2e` }}>
                <Icon className="w-4 h-4" style={{ color: tint }} />
              </span>
            )}
            <h3 className="text-[13px] font-semibold text-gray-900 tracking-tight truncate">{title}</h3>
          </div>
          {action}
        </div>
        {children}
      </div>
    </section>
  );
}

function Field({ label, children }) {
  return (
    <div className="min-w-0">
      <p className="text-[10.5px] uppercase tracking-[0.08em] text-gray-400 font-medium mb-1">{label}</p>
      {children}
    </div>
  );
}

function Medallion({ name, tint }) {
  return (
    <span className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-bold flex-shrink-0"
      style={{ background: `${tint}1a`, color: tint, border: `1px solid ${tint}33` }}>
      {initials(name)}
    </span>
  );
}

function GhostSelect({ value, onChange, children }) {
  return (
    <div className="relative">
      <select value={value} onChange={onChange}
        className="w-full appearance-none text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg pl-3 pr-8 py-2 cursor-pointer focus:outline-none focus:border-[#34CCFF] focus:ring-4 focus:ring-[#34CCFF]/15 transition-all">
        {children}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-gray-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  );
}

function EditPen({ active, onClick }) {
  return (
    <button onClick={onClick}
      className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors ${
        active ? 'bg-[#34CCFF]/12 text-[#34CCFF]' : 'text-gray-300 hover:text-[#34CCFF] hover:bg-[#34CCFF]/10'
      }`} aria-label={active ? 'Done' : 'Edit'}>
      {active ? <Check className="w-3.5 h-3.5" /> : <Pencil className="w-3.5 h-3.5" />}
    </button>
  );
}

/** Big status banner shared by the Status + Billing cards. */
function StatusBanner({ icon: Icon, tone, caption, label }) {
  return (
    <div className="rounded-xl p-3.5 flex items-center gap-2.5"
      style={{ background: `${tone}12`, border: `1px solid ${tone}30` }}>
      <Icon className="w-5 h-5 flex-shrink-0" style={{ color: tone }} />
      <div className="min-w-0">
        <div className="text-[10px] uppercase tracking-[0.08em] text-gray-400 font-medium">{caption}</div>
        <div className="text-[15px] font-bold truncate" style={{ color: tone }}>{label}</div>
      </div>
    </div>
  );
}

function DocChecklist({ documents }) {
  const has = (t) => documents.some((d) => d.type === t);
  const reqs = [
    { key: 'rate_con', label: 'Rate Confirmation', ok: has('rate_con') },
    { key: 'bol', label: 'Signed BOL', ok: has('bol') }
  ];
  const allOk = reqs.every((r) => r.ok);
  return (
    <div className="rounded-xl p-3 mb-3"
      style={{ background: allOk ? '#34D39912' : '#F59E0B10', border: `1px solid ${allOk ? '#34D39933' : '#F59E0B33'}` }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] uppercase tracking-[0.08em] font-semibold"
          style={{ color: allOk ? '#059669' : '#B45309' }}>Required to complete</span>
        {allOk && (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ready
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {reqs.map((r) => (
          <div key={r.key} className="flex items-center gap-2 text-sm">
            {r.ok ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              : <Circle className="w-4 h-4 text-amber-500 flex-shrink-0" />}
            <span className={r.ok ? 'text-gray-700' : 'text-gray-500'}>{r.label}</span>
            {!r.ok && <span className="ml-auto text-[10px] uppercase tracking-wide text-amber-600 font-medium">Missing</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

const cityLine = (p) => {
  const cs = [p?.city, p?.state].filter(Boolean).join(', ');
  return [cs, p?.zip].filter(Boolean).join(' ') || '';
};
const whenLine = (d, a, b) => {
  if (!d && !a && !b) return null;
  const win = [a, b].filter(Boolean).join('–');
  return [d, win].filter(Boolean).join(' · ');
};

function NodeContent({ node, horizontal, onEdit, EditableField, updateField }) {
  const { tint, eyebrow, title, sub, when, editable, ref: refField } = node;
  return (
    <div className={horizontal ? 'text-center px-2' : 'min-w-0'}>
      <div className="flex items-center gap-1.5" style={horizontal ? { justifyContent: 'center' } : undefined}>
        <span className="text-[10px] uppercase tracking-[0.1em] font-semibold" style={{ color: tint }}>{eyebrow}</span>
        {editable && (
          <button onClick={onEdit} className="text-gray-300 hover:text-[#34CCFF] transition-colors" aria-label={`Edit ${eyebrow}`}>
            <Pencil className="w-3 h-3" />
          </button>
        )}
      </div>
      <div className="text-sm font-semibold text-gray-900 truncate">{title}</div>
      {sub && <div className="text-xs text-gray-500 truncate">{sub}</div>}
      {when && <div className="text-xs text-gray-400 mt-0.5">{when}</div>}
      {refField && EditableField && updateField && (
        <div className={`mt-1 text-xs text-gray-500 ${horizontal ? '' : 'truncate'}`}>
          <span className="text-gray-400 mr-1">{refField.label}</span>
          <EditableField
            value={refField.value}
            onSave={(v) => updateField(refField.field, v)}
            placeholder="—"
            className="font-mono text-gray-700"
          />
        </div>
      )}
    </div>
  );
}

function Dot({ node }) {
  const Icon = node.icon;
  if (node.isStop) {
    return (
      <span className="w-[18px] h-[18px] rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
        <CircleDot className="w-2.5 h-2.5 text-gray-400" />
      </span>
    );
  }
  return (
    <span className="w-7 h-7 rounded-full flex items-center justify-center"
      style={{ background: `${node.tint}1a`, border: `2px solid ${node.tint}` }}>
      <Icon className="w-3.5 h-3.5" style={{ color: node.tint }} />
    </span>
  );
}

export function LoadDetailsPanel({
  load, stops = [], drivers = [], brokers = [], documents = [], billingOptions = [],
  updateField, updateLoadFields, EditableField, onUpload, onEditRoute, onStatusChange
}) {
  const [editing, setEditing] = useState(null);
  const [edit, setEdit] = useState({ broker: false, driver: false, billing: false, status: false });
  const toggle = (k) => setEdit((p) => ({ ...p, [k]: !p[k] }));
  if (!load) return null;

  const s = load.schedule || {};
  const shipper = load.shipper || {};
  const consignee = load.consignee || {};
  const orderedStops = [...stops].sort((a, b) => (a.stop_number ?? 0) - (b.stop_number ?? 0));

  const nodes = [
    {
      key: 'pickup', icon: MapPin, tint: BLUE, eyebrow: 'Pickup', editable: true,
      title: shipper.name || 'Add shipper',
      sub: [shipper.address, cityLine(shipper)].filter(Boolean).join(' · ') || 'No address',
      when: whenLine(s.pickup_date, s.pickup_time_start, s.pickup_time_end)
    },
    ...orderedStops.map((st, i) => ({
      key: st.id || `stop-${i}`, isStop: true, tint: '#94A3B8',
      eyebrow: `Stop ${st.stop_number ?? i + 1}${st.type ? ` · ${titleCase(st.type)}` : ''}`,
      title: st.facility_name || st.address || 'Stop',
      sub: cityLine(st) || null,
      when: whenLine(st.scheduled_date, st.scheduled_time_start, st.scheduled_time_end)
    })),
    {
      key: 'delivery', icon: PackageCheck, tint: GREEN, eyebrow: 'Delivery', editable: true,
      title: consignee.name || 'Add consignee',
      sub: [consignee.address, cityLine(consignee)].filter(Boolean).join(' · ') || 'No address',
      when: whenLine(s.delivery_date, s.delivery_time_start, s.delivery_time_end)
    }
  ];

  const editTarget = editing === 'shipper'
    ? { p: shipper, prefix: 'shipper', dateF: 'pickup_date', sF: 'pickup_time_start', eF: 'pickup_time_end',
        date: s.pickup_date, ws: s.pickup_time_start, we: s.pickup_time_end, label: 'Pickup' }
    : editing === 'consignee'
      ? { p: consignee, prefix: 'consignee', dateF: 'delivery_date', sF: 'delivery_time_start', eF: 'delivery_time_end',
          date: s.delivery_date, ws: s.delivery_time_start, we: s.delivery_time_end, label: 'Delivery' }
      : null;

  const onBrokerSelect = (id) => {
    if (!id) return updateLoadFields?.({ broker_id: null });
    const b = brokers.find((x) => x.id === id);
    updateLoadFields?.({ broker_id: id, broker_name: b?.name ?? load.broker_name, broker_mc: brokerMc(b) || load.broker_mc });
  };

  const selectedBroker = brokers.find((b) => b.id === load.broker_id) || load.brokerRecord || null;
  const brokerName = load.broker?.name || load.broker_name;
  const brokerMcVal = load.broker?.mc || load.broker_mc;
  const bContact = selectedBroker?.contact_name;
  const bPhone = selectedBroker?.phone;
  const bEmail = selectedBroker?.email;

  const driver = drivers.find((d) => d.id === load.driver_id);
  const driverName = driver ? `${driver.first_name} ${driver.last_name}` : null;

  const billStatus = load.billing_status || 'pending';
  const billTone = BILL_TONE[billStatus] || '#94A3B8';
  const billLabel = billingOptions.find((b) => b.value === billStatus)?.label || titleCase(billStatus);

  const statusCfg = LoadStatusConfig[load.status] || {};
  const statusTone = TONE[statusCfg.color] || '#94A3B8';
  const statusLabel = statusCfg.label || titleCase(load.status);
  const statusOptions = STATUS_ORDER.includes(load.status)
    ? STATUS_ORDER
    : [load.status, ...STATUS_ORDER];

  return (
    <div className="space-y-4">
      {/* ── Row 1: Broker + Load Info ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Broker */}
        <Card icon={Building2} title="Broker" tint="#A78BFA"
          action={<EditPen active={edit.broker} onClick={() => toggle('broker')} />}>
          {!edit.broker ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Medallion name={brokerName || 'NA'} tint="#A78BFA" />
                <div className="min-w-0">
                  <div className="text-[15px] font-bold text-gray-900 truncate">{brokerName || 'No broker'}</div>
                  {brokerMcVal && (
                    <span className="inline-flex items-center gap-1 mt-0.5 text-[11px] font-medium text-[#A78BFA] bg-[#A78BFA]/10 border border-[#A78BFA]/25 rounded-full px-2 py-0.5">
                      MC {brokerMcVal}
                    </span>
                  )}
                </div>
              </div>
              {(bContact || bPhone || bEmail) && (
                <div className="space-y-1.5 pt-1 border-t border-gray-100">
                  {bContact && (
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <UserRound className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{bContact}</span>
                    </div>
                  )}
                  {bPhone && (
                    <a href={`tel:${bPhone}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#34CCFF] transition-colors">
                      <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{bPhone}</span>
                    </a>
                  )}
                  {bEmail && (
                    <a href={`mailto:${bEmail}`} className="flex items-center gap-2 text-xs text-gray-600 hover:text-[#34CCFF] transition-colors">
                      <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" /><span className="truncate">{bEmail}</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2.5">
              <GhostSelect value={load.broker_id || ''} onChange={(e) => onBrokerSelect(e.target.value)}>
                <option value="">Select a broker…</option>
                {brokers.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}{brokerMc(b) ? ` · MC ${brokerMc(b)}` : ''}</option>
                ))}
              </GhostSelect>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Or type new">
                  <EditableField value={brokerName} onSave={(v) => updateField('broker_name', v)} placeholder="Broker name" className="text-sm text-gray-700" />
                </Field>
                <Field label="MC #">
                  <EditableField value={brokerMcVal} onSave={(v) => updateField('broker_mc', v)} placeholder="—" className="text-sm text-gray-700" />
                </Field>
              </div>
              <Field label="Customer PO">
                <EditableField value={load.customer_load_number} onSave={(v) => updateField('customer_load_number', v)} placeholder="—" className="text-sm text-gray-700" />
              </Field>
            </div>
          )}
        </Card>

        {/* Load Info (was Cargo & Equipment) — spans 2 columns */}
        <Card icon={Package} title="Load Info" tint="#34D399" span="lg:col-span-2">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <Field label="Commodity">
              <EditableField value={load.cargo?.commodity} onSave={(v) => updateField('commodity', v)}
                placeholder="General freight" className="text-sm text-gray-700" />
            </Field>
            <Field label="Load type">
              <EditableField value={titleCase(load.load_type)}
                onSave={(v) => updateField('load_type', v.toLowerCase().replace(/ /g, '_'))}
                placeholder="standard" className="text-sm text-gray-700" />
            </Field>
            <Field label="Weight">
              <EditableField value={load.cargo?.weight_lbs?.toLocaleString()}
                onSave={(v) => updateField('weight_lbs', parseInt(v.replace(/,/g, '')))}
                suffix=" lbs" className="text-sm text-gray-700" />
            </Field>
            <Field label="Pieces">
              <EditableField value={load.cargo?.pieces?.toString()}
                onSave={(v) => updateField('pieces', parseInt(v))} className="text-sm text-gray-700" />
            </Field>
            <Field label="Reference #">
              <span className="text-sm text-gray-700">{load.reference_number || '—'}</span>
            </Field>
            <Field label="Customer PO">
              <EditableField value={load.customer_load_number}
                onSave={(v) => updateField('customer_load_number', v)} placeholder="—" className="text-sm text-gray-700" />
            </Field>
            <Field label="Pickup #">
              <EditableField value={load.schedule?.pickup_number || load.pickup_number}
                onSave={(v) => updateField('pickup_number', v)} placeholder="—" className="text-sm text-gray-700" />
            </Field>
          </div>
        </Card>
      </div>

      {/* ── Row 2: Route (full width) ────────────────────────────── */}
      <Card icon={MapIcon} title="Route"
        action={
          <button onClick={onEditRoute}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#34CCFF] hover:bg-[#34CCFF]/10 px-2.5 py-1.5 rounded-lg transition-colors">
            <MapIcon className="w-3.5 h-3.5" /> Map & stops
          </button>
        }>
        <div className="relative lg:hidden">
          <span className="absolute left-[13px] top-3 bottom-3 w-0.5"
            style={{ background: `linear-gradient(${BLUE}66, #e5e7eb, ${GREEN}66)` }} aria-hidden />
          <div className="space-y-5">
            {nodes.map((n) => (
              <div key={n.key} className="relative pl-9">
                <span className="absolute left-0 top-0.5"><Dot node={n} /></span>
                <NodeContent node={n} horizontal={false}
                  onEdit={() => setEditing(n.key === 'pickup' ? 'shipper' : 'consignee')}
                  EditableField={EditableField}
                  updateField={updateField} />
              </div>
            ))}
          </div>
        </div>
        <div className="hidden lg:flex lg:items-start">
          {nodes.map((n, i) => (
            <div key={n.key} className="flex-1 relative flex flex-col items-center min-w-0">
              {i > 0 && <span className="absolute top-[13px] right-1/2 w-full h-0.5" style={{ background: '#e5e7eb' }} aria-hidden />}
              <div className="relative z-10 mb-3"><Dot node={n} /></div>
              <NodeContent node={n} horizontal
                onEdit={() => setEditing(n.key === 'pickup' ? 'shipper' : 'consignee')}
                EditableField={EditableField}
                updateField={updateField} />
            </div>
          ))}
        </div>

        {editTarget && (
          <div className="mt-5 rounded-xl bg-gray-50/70 border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] uppercase tracking-[0.08em] font-semibold text-gray-500">Edit {editTarget.label}</span>
              <button onClick={() => setEditing(null)} className="text-gray-400 hover:text-gray-700" aria-label="Close editor">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Name">
                <EditableField value={editTarget.p.name} onSave={(v) => updateField(`${editTarget.prefix}_name`, v)} placeholder="Company" className="text-sm font-medium text-gray-900" />
              </Field>
              <Field label="Street">
                <EditableField value={editTarget.p.address} onSave={(v) => updateField(`${editTarget.prefix}_address`, v)} placeholder="Street address" className="text-sm text-gray-700" />
              </Field>
              <div className="grid grid-cols-6 gap-2 sm:col-span-2">
                <div className="col-span-3"><Field label="City">
                  <EditableField value={editTarget.p.city} onSave={(v) => updateField(`${editTarget.prefix}_city`, v)} className="text-sm text-gray-700" /></Field></div>
                <div className="col-span-1"><Field label="St">
                  <EditableField value={editTarget.p.state} onSave={(v) => updateField(`${editTarget.prefix}_state`, v)} className="text-sm text-gray-700" /></Field></div>
                <div className="col-span-2"><Field label="ZIP">
                  <EditableField value={editTarget.p.zip} onSave={(v) => updateField(`${editTarget.prefix}_zip`, v)} className="text-sm text-gray-700" /></Field></div>
              </div>
              <Field label={`${editTarget.label} date`}>
                <EditableField value={editTarget.date} onSave={(v) => updateField(editTarget.dateF, v)} placeholder="YYYY-MM-DD" className="text-sm text-gray-800" />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label="Window start">
                  <EditableField value={editTarget.ws} onSave={(v) => updateField(editTarget.sF, v)} placeholder="--:--" className="text-sm text-gray-700" /></Field>
                <Field label="Window end">
                  <EditableField value={editTarget.we} onSave={(v) => updateField(editTarget.eF, v)} placeholder="--:--" className="text-sm text-gray-700" /></Field>
              </div>
            </div>
          </div>
        )}

        <button onClick={onEditRoute}
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-[#34CCFF] border border-dashed border-gray-300 hover:border-[#34CCFF]/50 rounded-lg px-3 py-1.5 transition-colors">
          <Plus className="w-3.5 h-3.5" /> {orderedStops.length ? 'Edit stops' : 'Add a stop'}
        </button>
      </Card>

      {/* ── Row 3: Assignment · Status · Billing (one design) ────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Assignment */}
        <Card icon={Truck} title="Assignment" tint="#8B5CF6"
          action={<EditPen active={edit.driver} onClick={() => toggle('driver')} />}>
          {!edit.driver ? (
            <div className="flex items-center gap-3">
              <Medallion name={driverName || 'NA'} tint="#8B5CF6" />
              <div className="min-w-0">
                <div className="text-[15px] font-bold text-gray-900 truncate">{driverName || 'Unassigned'}</div>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                    <Truck className="w-3 h-3" /> {load.truck?.unit_number || 'No truck'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 bg-gray-100 rounded-full px-2 py-0.5">
                    {load.trailer?.unit_number || 'No trailer'}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <GhostSelect value={load.driver_id || ''} onChange={(e) => updateField('driver_id', e.target.value || null)}>
              <option value="">Assign driver…</option>
              {drivers.map((d) => (
                <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
              ))}
            </GhostSelect>
          )}
        </Card>

        {/* Status — designed card, replaces the page stepper */}
        <Card icon={Activity} title="Status" tint={statusTone}
          action={<EditPen active={edit.status} onClick={() => toggle('status')} />}>
          {!edit.status ? (
            <StatusBanner icon={BadgeCheck} tone={statusTone} caption="Current status" label={statusLabel} />
          ) : (
            <div className="space-y-2">
              <GhostSelect value={load.status}
                onChange={(e) => { onStatusChange?.(e.target.value); toggle('status'); }}>
                {statusOptions.map((v) => (
                  <option key={v} value={v}>{LoadStatusConfig[v]?.label || titleCase(v)}</option>
                ))}
              </GhostSelect>
              <p className="text-[11px] text-gray-400">
                Completing requires the Rate Con + signed BOL below.
              </p>
            </div>
          )}
        </Card>

        {/* Billing */}
        <Card icon={Receipt} title="Billing" tint={billTone}
          action={<EditPen active={edit.billing} onClick={() => toggle('billing')} />}>
          {!edit.billing ? (
            <StatusBanner icon={BadgeCheck} tone={billTone} caption="Billing status" label={billLabel} />
          ) : (
            <div className="space-y-2.5">
              <GhostSelect value={billStatus} onChange={(e) => updateField('billing_status', e.target.value)}>
                {billingOptions.map((b) => (
                  <option key={b.value} value={b.value}>{b.label}</option>
                ))}
              </GhostSelect>
              <Field label="Carrier cost">
                <EditableField
                  value={load.financials?.carrier_cost != null ? `$${load.financials.carrier_cost}` : ''}
                  onSave={(v) => updateField('carrier_cost', parseFloat(v.replace(/[^0-9.-]/g, '')))}
                  placeholder="$0" className="text-sm font-semibold text-gray-900" />
              </Field>
            </div>
          )}
        </Card>
      </div>

      {/* ── Classification · Documents · Notes ───────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card icon={FileText} title="Documents" tint="#60A5FA"
          action={
            <button onClick={onUpload}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-[#34CCFF] hover:bg-[#34CCFF]/10 transition-colors" aria-label="Upload documents">
              <Plus className="w-4 h-4" />
            </button>
          }>
          <DocChecklist documents={documents} />
          {documents.length > 0 ? (
            <div className="space-y-1">
              {documents.map((doc) => (
                <div key={doc.id} onClick={() => doc.viewUrl && window.open(doc.viewUrl, '_blank')}
                  className="flex items-center gap-2.5 p-2.5 hover:bg-[#34CCFF]/[0.06] rounded-xl cursor-pointer text-sm group/doc transition-colors">
                  <FileText className="w-4 h-4 text-gray-400 group-hover/doc:text-[#34CCFF] transition-colors" />
                  <span className="flex-1 truncate text-gray-700">{doc.file_name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-gray-300 opacity-0 group-hover/doc:opacity-100 transition-opacity" />
                </div>
              ))}
            </div>
          ) : (
            <button onClick={onUpload}
              className="w-full py-5 border-2 border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-[#34CCFF]/50 hover:text-[#34CCFF] hover:bg-[#34CCFF]/[0.03] transition-all">
              Upload documents
            </button>
          )}
        </Card>

        <Card icon={StickyNote} title="Notes" tint="#94A3B8">
          <textarea
            value={load.notes || ''}
            onChange={(e) => updateField('notes', e.target.value)}
            placeholder="Notes for the team or for the AI to act on…"
            rows={3}
            className="w-full bg-gray-50/80 border border-gray-200 rounded-xl p-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-[#34CCFF] focus:ring-4 focus:ring-[#34CCFF]/15 resize-none transition-all"
            style={{ minHeight: '88px' }}
          />
        </Card>
      </div>
    </div>
  );
}

export default LoadDetailsPanel;
