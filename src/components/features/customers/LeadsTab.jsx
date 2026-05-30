/**
 * LeadsTab — Alex-found freight leads, surfaced as a CRM tab.
 *
 * Replaces the old /tools/atlas/opportunities surface (which 403'd for
 * any org that hired Alex without Atlas). Same data model
 * (atlas_opportunities), normal customer-tab UX, no agent gate.
 *
 * MVP scope:
 *   - Status filter pills (All / New / Reviewed / Accepted / Rejected / Converted)
 *   - Search by broker name / lane
 *   - Card grid like Brokers
 *   - Click card → side sheet with full details + Accept / Reject / Edit
 *
 * Future hooks (intentionally easy to extend):
 *   - Outreach log per lead
 *   - "Alex contact this lead" action
 *   - Manual lead creation (currently only Atlas pipeline writes new rows)
 */

import { useEffect, useMemo, useState, useCallback } from 'react';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import { Spinner } from '../../ui/Spinner';
import leadsApi from '../../../api/leads.api';
import {
  Search, Mail, Phone, ArrowRight, X, Check, Loader2,
  AlertCircle, Sparkles, Truck, MapPin, DollarSign, Calendar
} from 'lucide-react';
import { cn } from '../../../lib/utils';

const STATUSES = [
  { v: 'all',       label: 'All',       tone: 'default' },
  { v: 'new',       label: 'New',       tone: 'amber' },
  { v: 'reviewed',  label: 'Reviewed',  tone: 'blue' },
  { v: 'accepted',  label: 'Accepted',  tone: 'green' },
  { v: 'converted', label: 'Converted', tone: 'green' },
  { v: 'rejected',  label: 'Rejected',  tone: 'red' },
  { v: 'expired',   label: 'Expired',   tone: 'gray' }
];

function statusBadgeVariant(s) {
  if (s === 'new') return 'amber';
  if (s === 'reviewed') return 'blue';
  if (s === 'accepted' || s === 'converted') return 'green';
  if (s === 'rejected') return 'red';
  return 'gray';
}

function lane(lead) {
  const o = [lead.origin_city, lead.origin_state].filter(Boolean).join(', ');
  const d = [lead.destination_city, lead.destination_state].filter(Boolean).join(', ');
  if (!o && !d) return null;
  return `${o || '?'} → ${d || '?'}`;
}

function fmtMoney(v) {
  if (v == null || v === '') return null;
  const n = typeof v === 'string' ? parseFloat(v) : v;
  if (!Number.isFinite(n)) return null;
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtDate(d) {
  if (!d) return null;
  const dt = new Date(d);
  if (isNaN(dt)) return null;
  return dt.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function LeadsTab({ initialLeadId = null }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('new');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(initialLeadId);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await leadsApi.listLeads(
        status === 'all' ? {} : { status }
      );
      // Response is an array OR { opportunities: [...], total }
      const list = Array.isArray(res) ? res : (res?.opportunities || []);
      setLeads(list);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { refetch(); }, [refetch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return leads;
    return leads.filter((l) => {
      const blob = [
        l.broker_name, l.broker_email,
        l.origin_city, l.origin_state, l.origin_zip,
        l.destination_city, l.destination_state, l.destination_zip,
        l.message_summary, l.reference_number
      ].filter(Boolean).join(' ').toLowerCase();
      return blob.includes(q);
    });
  }, [leads, search]);

  const counts = useMemo(() => {
    const c = {};
    for (const l of leads) c[l.status] = (c[l.status] || 0) + 1;
    return c;
  }, [leads]);

  const selected = selectedId ? leads.find((l) => l.id === selectedId) : null;

  return (
    <div className="space-y-4">
      {/* Status filter pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {STATUSES.map((s) => {
          const active = status === s.v;
          const n = s.v === 'all' ? leads.length : counts[s.v];
          return (
            <button
              key={s.v}
              type="button"
              onClick={() => setStatus(s.v)}
              className={cn(
                'px-3 py-1.5 rounded-full text-[13px] font-medium border whitespace-nowrap transition-colors',
                active
                  ? 'bg-accent text-white border-accent'
                  : 'bg-white border-gray-200 text-text-secondary hover:bg-surface-secondary'
              )}
            >
              {s.label}
              {n != null && n > 0 && (
                <span className={cn('ml-1.5 text-[11px]', active ? 'text-white/80' : 'text-text-tertiary')}>
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
        <input
          type="text"
          placeholder="Search by broker, lane, or reference…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-3 py-2 bg-surface-secondary border-0 rounded-lg text-body-sm placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-accent/20"
        />
      </div>

      {error && (
        <Card padding="default" className="bg-error/5 border border-error/20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-error" />
            <p className="text-body-sm text-error">{error}</p>
          </div>
        </Card>
      )}

      {loading && leads.length === 0 ? (
        <div className="flex items-center justify-center py-16"><Spinner size="lg" /></div>
      ) : filtered.length === 0 ? (
        <Card padding="default">
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-3">
              <Sparkles className="w-6 h-6 text-accent" />
            </div>
            <h3 className="text-body font-medium text-text-primary mb-1">
              {status === 'new' ? 'No new leads' : `No ${STATUSES.find((s) => s.v === status)?.label.toLowerCase() || ''} leads`}
            </h3>
            <p className="text-body-sm text-text-secondary text-center max-w-sm">
              Alex surfaces freight leads from your inbox here. Connect Gmail and Alex will start working.
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((lead) => <LeadCard key={lead.id} lead={lead} onSelect={() => setSelectedId(lead.id)} />)}
        </div>
      )}

      {selected && (
        <LeadDetailSheet
          lead={selected}
          onClose={() => setSelectedId(null)}
          onChanged={async () => { await refetch(); }}
        />
      )}
    </div>
  );
}

function LeadCard({ lead, onSelect }) {
  const rate = fmtMoney(lead.rate);
  const ln = lane(lead);
  const pickup = fmtDate(lead.pickup_date);
  return (
    <button
      type="button"
      onClick={onSelect}
      className="text-left bg-white rounded-card border border-surface-tertiary p-4 hover:border-accent/40 hover:shadow-sm transition-all"
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-text-primary truncate">
            {lead.broker_name || 'Unknown broker'}
          </p>
          {lead.broker_email && (
            <p className="text-small text-text-tertiary truncate flex items-center gap-1">
              <Mail className="w-3 h-3 flex-shrink-0" />{lead.broker_email}
            </p>
          )}
        </div>
        <Badge variant={statusBadgeVariant(lead.status)} size="sm">{lead.status}</Badge>
      </div>

      <div className="space-y-1">
        {ln && (
          <div className="flex items-center gap-1.5 text-body-sm text-text-secondary">
            <MapPin className="w-3.5 h-3.5 text-text-tertiary flex-shrink-0" />
            <span className="truncate">{ln}</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-body-sm">
          {rate && (
            <span className="inline-flex items-center gap-1 text-text-primary font-medium">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />{rate}
            </span>
          )}
          {pickup && (
            <span className="inline-flex items-center gap-1 text-text-tertiary">
              <Calendar className="w-3.5 h-3.5" />{pickup}
            </span>
          )}
          {lead.equipment_type && (
            <span className="inline-flex items-center gap-1 text-text-tertiary">
              <Truck className="w-3.5 h-3.5" />{lead.equipment_type}
            </span>
          )}
        </div>
      </div>

      {lead.message_summary && (
        <p className="text-small text-text-tertiary mt-2 line-clamp-2">
          {lead.message_summary}
        </p>
      )}

      {lead.overall_confidence != null && (
        <p className="text-[11px] text-text-tertiary mt-2">
          Alex confidence: {Math.round(parseFloat(lead.overall_confidence) * 100)}%
        </p>
      )}
    </button>
  );
}

function LeadDetailSheet({ lead, onClose, onChanged }) {
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    broker_name: lead.broker_name || '',
    broker_email: lead.broker_email || '',
    broker_phone: lead.broker_phone || '',
    origin_city: lead.origin_city || '',
    origin_state: lead.origin_state || '',
    destination_city: lead.destination_city || '',
    destination_state: lead.destination_state || '',
    rate: lead.rate || '',
    miles: lead.miles || '',
    equipment_type: lead.equipment_type || '',
    weight_lbs: lead.weight_lbs || '',
    commodity: lead.commodity || '',
    pickup_date: lead.pickup_date ? String(lead.pickup_date).slice(0, 10) : '',
    delivery_date: lead.delivery_date ? String(lead.delivery_date).slice(0, 10) : '',
    message_summary: lead.message_summary || ''
  });

  const isActionable = lead.status === 'new' || lead.status === 'reviewed';

  const onAccept = async () => {
    setBusy('accept'); setError(null);
    try {
      await leadsApi.acceptLead(lead.id);
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  const onReject = async () => {
    const reason = window.prompt('Why are you rejecting this lead? (helps Alex learn)');
    if (reason === null) return;
    setBusy('reject'); setError(null);
    try {
      await leadsApi.rejectLead(lead.id, reason.trim() || 'no reason given');
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  const onSave = async () => {
    setBusy('save'); setError(null);
    try {
      // Strip blanks so we don't overwrite with empty strings the user
      // didn't intentionally change.
      const dirty = Object.fromEntries(
        Object.entries(form).filter(([_, v]) => v !== '')
      );
      await leadsApi.updateLead(lead.id, dirty);
      await onChanged();
      setEditing(false);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(null); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full sm:max-w-2xl bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-surface-tertiary">
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-0.5">
              {lead.source === 'manual' ? 'Manual lead' : 'Found by Alex'}
              {lead.overall_confidence != null && ` · ${Math.round(parseFloat(lead.overall_confidence) * 100)}% confidence`}
            </p>
            <h2 className="text-title text-text-primary truncate">
              {lead.broker_name || 'Unknown broker'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-surface-secondary text-text-tertiary"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {error && (
            <div className="p-3 bg-error/5 border border-error/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-error mt-0.5" />
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={statusBadgeVariant(lead.status)}>{lead.status}</Badge>
          </div>

          {lead.message_summary && !editing && (
            <div className="p-3 bg-surface-secondary rounded-lg">
              <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1">Summary</p>
              <p className="text-body-sm text-text-primary">{lead.message_summary}</p>
            </div>
          )}

          {editing ? (
            <EditForm form={form} setForm={setForm} />
          ) : (
            <DetailView lead={lead} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-surface-tertiary p-4 flex items-center gap-2 flex-wrap">
          {editing ? (
            <>
              <Button onClick={onSave} disabled={busy === 'save'}>
                {busy === 'save' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Save
              </Button>
              <Button variant="ghost" onClick={() => setEditing(false)} disabled={busy === 'save'}>
                Cancel
              </Button>
            </>
          ) : (
            <>
              {isActionable && (
                <Button onClick={onAccept} disabled={!!busy}>
                  {busy === 'accept' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
                  Accept &amp; create load
                </Button>
              )}
              <Button variant="secondary" onClick={() => setEditing(true)} disabled={!!busy}>
                Edit
              </Button>
              {isActionable && (
                <Button variant="ghost" onClick={onReject} disabled={!!busy} className="text-error hover:bg-error/10">
                  {busy === 'reject' ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <X className="w-4 h-4 mr-2" />}
                  Reject
                </Button>
              )}
              {lead.converted_load_id && (
                <span className="text-small text-text-tertiary ml-auto">
                  Converted to Load
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DetailView({ lead }) {
  const ln = lane(lead);
  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-body-sm">
      <KV label="Broker" value={lead.broker_name} />
      <KV label="MC #" value={lead.broker_mc_number} />
      <KV label="Email" value={lead.broker_email} />
      <KV label="Phone" value={lead.broker_phone} />
      <KV label="Lane" value={ln} colSpan />
      <KV label="Pickup" value={fmtDate(lead.pickup_date)} />
      <KV label="Delivery" value={fmtDate(lead.delivery_date)} />
      <KV label="Rate" value={fmtMoney(lead.rate)} />
      <KV label="Miles" value={lead.miles ? `${lead.miles}` : null} />
      <KV label="Equipment" value={lead.equipment_type} />
      <KV label="Commodity" value={lead.commodity} />
      <KV label="Weight" value={lead.weight_lbs ? `${lead.weight_lbs} lbs` : null} />
      <KV label="Reference #" value={lead.reference_number} />
    </div>
  );
}

function KV({ label, value, colSpan }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary">{label}</p>
      <p className="text-body-sm text-text-primary">{value || <span className="text-text-tertiary italic">—</span>}</p>
    </div>
  );
}

function EditForm({ form, setForm }) {
  const update = (k) => (e) => setForm({ ...form, [k]: e.target.value });
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormInput label="Broker name" value={form.broker_name} onChange={update('broker_name')} colSpan />
      <FormInput label="Broker email" value={form.broker_email} onChange={update('broker_email')} type="email" />
      <FormInput label="Broker phone" value={form.broker_phone} onChange={update('broker_phone')} />
      <FormInput label="Origin city" value={form.origin_city} onChange={update('origin_city')} />
      <FormInput label="Origin state" value={form.origin_state} onChange={update('origin_state')} />
      <FormInput label="Destination city" value={form.destination_city} onChange={update('destination_city')} />
      <FormInput label="Destination state" value={form.destination_state} onChange={update('destination_state')} />
      <FormInput label="Pickup date" value={form.pickup_date} onChange={update('pickup_date')} type="date" />
      <FormInput label="Delivery date" value={form.delivery_date} onChange={update('delivery_date')} type="date" />
      <FormInput label="Rate ($)" value={form.rate} onChange={update('rate')} type="number" />
      <FormInput label="Miles" value={form.miles} onChange={update('miles')} type="number" />
      <FormInput label="Equipment" value={form.equipment_type} onChange={update('equipment_type')} />
      <FormInput label="Commodity" value={form.commodity} onChange={update('commodity')} />
      <FormInput label="Weight (lbs)" value={form.weight_lbs} onChange={update('weight_lbs')} type="number" />
    </div>
  );
}

function FormInput({ label, value, onChange, type = 'text', colSpan = false }) {
  return (
    <div className={colSpan ? 'col-span-2' : ''}>
      <label className="block text-[10px] uppercase tracking-wider text-text-tertiary mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 rounded-input border border-surface-tertiary text-body-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
      />
    </div>
  );
}

export default LeadsTab;
