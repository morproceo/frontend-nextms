/**
 * TrailerDetailPage — same contact-card design language as Driver and
 * Truck. All editable Trailer columns exposed across grouped sections.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTrailer, useTrucksList } from '../../hooks';
import uploadsApi from '../../api/uploads.api';
import {
  AssetStatusConfig,
  TrailerTypeConfig
} from '../../config/status';
import { Spinner } from '../../components/ui/Spinner';
import { EquipmentDocumentUploadModal } from '../../components/features/documents/EquipmentDocumentUploadModal';
import {
  ArrowLeft, Container, Edit, Wrench, Shield, Settings, DollarSign,
  Truck, FileText, Eye, Trash2, Upload, ChevronDown, Check, Pencil,
  ShieldCheck, Snowflake, Ruler, Sliders
} from 'lucide-react';

const cn = (...xs) => xs.filter(Boolean).join(' ');

const OWNERSHIP_OPTIONS = [
  { v: '', label: '—' },
  { v: 'owned', label: 'Owned' },
  { v: 'leased', label: 'Leased' },
  { v: 'rented', label: 'Rented' },
  { v: 'customer', label: 'Customer / shipper trailer' },
  { v: 'financed', label: 'Financed' }
];

const docTypeBadge = {
  REGISTRATION: { label: 'Registration', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  INSURANCE:    { label: 'Insurance',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IRP:          { label: 'IRP',          cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  INSPECTION:   { label: 'Inspection',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  OTHER:        { label: 'Other',        cls: 'bg-surface-secondary text-text-secondary border-surface-tertiary' }
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};
const daysUntil = (d) => d ? Math.floor((new Date(d).getTime() - Date.now()) / 86400000) : null;
const expiryTone = (d) => {
  const days = daysUntil(d);
  if (days == null) return null;
  if (days < 0) return { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Expired' };
  if (days <= 30) return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: `${days}d left` };
  return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Valid' };
};
const toneOf = (d) => {
  const days = daysUntil(d);
  if (days == null) return null;
  if (days < 0) return 'red';
  if (days <= 30) return 'amber';
  return 'green';
};

// ─── Primitives ────────────────────────────────────────────────────────

function Field({ label, value, display, type = 'text', options, onSave, placeholder = '—' }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  const start = () => {
    setDraft(value ?? '');
    setEditing(true);
    setTimeout(() => inputRef.current?.focus?.(), 30);
  };
  const cancel = () => { setEditing(false); setDraft(''); };
  const commit = async () => {
    if (saving) return;
    const next = draft === '' ? null : draft;
    if (next === (value ?? null)) { cancel(); return; }
    setSaving(true);
    try { await onSave(next); setEditing(false); } finally { setSaving(false); }
  };

  const shown = value == null || value === ''
    ? <span className="text-text-tertiary">{placeholder}</span>
    : (display ? display(value) : <span className="text-text-primary">{value}</span>);

  return (
    <div
      className="group flex items-start justify-between gap-3 py-2.5 border-b border-surface-tertiary/60 last:border-0 cursor-pointer sm:cursor-default"
      onClick={(e) => {
        if (editing) return;
        if (typeof window !== 'undefined' && window.matchMedia?.('(hover: hover)').matches) return;
        if (e.target.closest('input,select,textarea,button,a')) return;
        start();
      }}
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">{label}</p>
        {!editing ? (
          <div className="text-body-sm">{shown}</div>
        ) : type === 'select' ? (
          <select
            ref={inputRef}
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            className="w-full text-body-sm rounded-md border border-accent/40 bg-surface-primary px-2 py-1.5 focus:outline-none focus:border-accent"
          >
            {options?.map((o) => <option key={o.v} value={o.v}>{o.label}</option>)}
          </select>
        ) : type === 'textarea' ? (
          <textarea
            ref={inputRef}
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            rows={3}
            className="w-full text-body-sm rounded-md border border-accent/40 bg-surface-primary px-2 py-1.5 focus:outline-none focus:border-accent resize-vertical"
          />
        ) : (
          <input
            ref={inputRef}
            type={type === 'date' ? 'date' : (type === 'number' ? 'number' : 'text')}
            step={type === 'number' ? '0.01' : undefined}
            value={draft ?? ''}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') cancel(); }}
            className="w-full text-body-sm rounded-md border border-accent/40 bg-surface-primary px-2 py-1.5 focus:outline-none focus:border-accent"
          />
        )}
      </div>
      {!editing && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); start(); }}
          className="p-1.5 rounded-md text-accent shrink-0 mt-0.5 transition-opacity opacity-100 sm:opacity-60 sm:group-hover:opacity-100 hover:bg-accent/10"
          aria-label={`Edit ${label}`}
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
      )}
      {editing && saving && <Spinner size="sm" />}
    </div>
  );
}

function BoolField({ label, value, onSave }) {
  const [busy, setBusy] = useState(false);
  const toggle = async () => { if (busy) return; setBusy(true); try { await onSave(!value); } finally { setBusy(false); } };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-tertiary/60 last:border-0">
      <div className="text-body-sm">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">{label}</p>
        <span className={value ? 'text-emerald-700 font-medium' : 'text-text-tertiary'}>{value ? 'Yes' : 'No'}</span>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={busy}
        className={cn(
          'relative w-11 h-6 rounded-full transition-colors',
          value ? 'bg-accent' : 'bg-surface-tertiary',
          busy && 'opacity-60'
        )}
      >
        <span className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', value ? 'translate-x-5' : 'translate-x-0.5')} />
      </button>
    </div>
  );
}

function SectionCard({ icon: Icon, title, action, children, columns = 1 }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 overflow-hidden">
      <header className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-text-secondary" />}
          <h3 className="text-body font-semibold text-text-primary">{title}</h3>
        </div>
        {action}
      </header>
      <div className={cn('px-5 py-2', columns === 2 && 'grid grid-cols-1 sm:grid-cols-2 gap-x-8')}>
        {children}
      </div>
    </section>
  );
}

function HeroStat({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-surface-primary px-4 py-3 flex items-start gap-3">
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
        tone === 'red'    && 'bg-red-50 text-red-600',
        tone === 'amber'  && 'bg-amber-50 text-amber-600',
        tone === 'green'  && 'bg-emerald-50 text-emerald-600',
        tone === 'accent' && 'bg-accent/10 text-accent',
        !tone && 'bg-surface-secondary text-text-secondary'
      )}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] uppercase tracking-wide text-text-tertiary">{label}</p>
        <p className="text-body-sm font-semibold text-text-primary truncate">{value}</p>
        {sub && <p className="text-small text-text-tertiary truncate">{sub}</p>}
      </div>
    </div>
  );
}

function SectionMenu({ section, items, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const ownsActive = items.some((i) => i.id === section);
  const current = (ownsActive && items.find((i) => i.id === section)) || items[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => { if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false); };
    const esc = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', esc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', esc);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative inline-block w-full sm:w-auto">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          'w-full sm:w-auto flex items-center justify-between gap-3 px-4 py-2.5 rounded-xl transition-all',
          ownsActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:from-blue-700 hover:to-blue-600'
            : 'bg-white border border-gray-200 text-text-secondary hover:bg-surface-secondary shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
        )}
      >
        <span className="flex items-center gap-2 min-w-0">
          <CurrentIcon className={cn('w-4 h-4 shrink-0', ownsActive ? 'text-white' : 'text-text-tertiary')} />
          <span className={cn('text-body-sm font-semibold truncate', ownsActive ? 'text-white' : 'text-text-primary')}>{current.label}</span>
        </span>
        <ChevronDown className={cn('w-4 h-4 transition-transform', ownsActive ? 'text-white/80' : 'text-text-tertiary', open && 'rotate-180')} />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full sm:w-64 left-0 bg-white border border-gray-200 rounded-xl shadow-[0_8px_28px_rgba(16,24,40,0.10)] py-1 max-h-[70vh] overflow-y-auto">
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === section;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => { onChange(item.id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg mx-1 my-0.5 text-left transition-all',
                  active ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm' : 'text-text-primary hover:bg-surface-secondary'
                )}
              >
                <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-text-tertiary')} />
                <span className="text-body-sm font-medium">{item.label}</span>
                {active && <Check className="w-4 h-4 text-white ml-auto" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SideTabButton({ icon: Icon, label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full sm:w-auto flex items-center justify-center sm:justify-start gap-2 px-3 sm:px-4 py-2.5 rounded-xl transition-all',
        active
          ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:from-blue-700 hover:to-blue-600'
          : 'bg-white border border-gray-200 text-text-secondary hover:bg-surface-secondary shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
      )}
    >
      <Icon className={cn('w-4 h-4 shrink-0', active ? 'text-white' : 'text-text-tertiary')} />
      <span className="text-body-sm font-semibold whitespace-nowrap truncate">{label}</span>
    </button>
  );
}

function ExpiryRow({ date }) {
  const tone = expiryTone(date);
  return (
    <span className="inline-flex items-center gap-2">
      <span className="text-text-primary">{fmtDate(date)}</span>
      {tone && (
        <span className={cn('text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full border', tone.cls)}>
          {tone.label}
        </span>
      )}
    </span>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────

export function TrailerDetailPage() {
  const { trailerId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const { trailer, loading, error, updateTrailer, assignToTruck } = useTrailer(trailerId);
  const { trucks, fetchTrucks } = useTrucksList();

  const [section, setSection] = useState('identity');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);

  const updateField = useCallback((field, value) => updateTrailer({ [field]: value }), [updateTrailer]);

  const fetchDocuments = useCallback(async () => {
    if (!trailerId) return;
    setDocumentsLoading(true);
    try {
      const res = await uploadsApi.getEquipmentDocuments('trailer', trailerId);
      setDocuments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setDocumentsLoading(false); }
  }, [trailerId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);
  useEffect(() => { fetchTrucks({ is_active: true }); }, [fetchTrucks]);

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return;
    setDeletingDocId(documentId);
    try {
      await uploadsApi.deleteEquipmentDocument('trailer', trailerId, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) { console.error(err); alert('Delete failed'); }
    finally { setDeletingDocId(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
  if (error || !trailer) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(orgUrl('/assets/trailers'))} className="flex items-center gap-1.5 text-accent text-body-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Trailers
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <Container className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-body text-red-700">{error || 'Trailer not found'}</p>
        </div>
      </div>
    );
  }

  const statusCfg = trailer.statusConfig || AssetStatusConfig[trailer.status] || { label: trailer.status, variant: 'gray' };
  const typeCfg = trailer.typeConfig || TrailerTypeConfig[trailer.type] || { label: trailer.type };
  const truck = trucks.find((t) => t.id === trailer.current_truck_id);
  const isReefer = ['reefer', 'reefer_multi_temp', 'refrigerated'].includes(trailer.type)
    || !!trailer.reefer_make || trailer.has_multi_temp;

  return (
    <div className="space-y-5 pb-12">
      <button onClick={() => navigate(orgUrl('/assets/trailers'))} className="flex items-center gap-1.5 text-accent text-body-sm hover:underline">
        <ArrowLeft className="w-4 h-4" /> Back to Trailers
      </button>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 overflow-hidden relative">
        <div className="absolute top-4 right-4 z-10">
          <label className={cn(
            'relative inline-flex items-center gap-1 rounded-full text-[10px] uppercase tracking-wide font-semibold cursor-pointer transition-colors pl-2.5 pr-1.5 py-1',
            statusCfg.variant === 'green' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            statusCfg.variant === 'blue' && 'bg-blue-50 text-blue-700 border border-blue-200',
            (statusCfg.variant === 'amber' || statusCfg.variant === 'yellow') && 'bg-amber-50 text-amber-700 border border-amber-200',
            statusCfg.variant === 'red' && 'bg-red-50 text-red-700 border border-red-200',
            (!statusCfg.variant || statusCfg.variant === 'gray') && 'bg-surface-secondary text-text-secondary border border-surface-tertiary'
          )}>
            {statusCfg.label}
            <ChevronDown className="w-3 h-3 opacity-60" />
            <select
              value={trailer.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
              aria-label="Trailer status"
            >
              {Object.values(AssetStatusConfig).map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
          </label>
        </div>

        <div className="px-5 sm:px-7 pt-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Container className="w-9 h-9 sm:w-12 sm:h-12 text-white" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-title sm:text-title-lg font-semibold text-text-primary">
                  Unit #{trailer.unit_number}
                </h1>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-accent/10 text-accent border border-accent/20">
                  {typeCfg.label}
                </span>
                {isReefer && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Snowflake className="w-3 h-3" /> Reefer
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-text-secondary text-body-sm">
                <span>{[trailer.year, trailer.make, trailer.model].filter(Boolean).join(' ') || 'Vehicle details unknown'}</span>
                {trailer.vin && <span className="text-text-tertiary">VIN: {trailer.vin}</span>}
                {trailer.license_plate && (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {trailer.license_plate}{trailer.license_state ? ` · ${trailer.license_state}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-5">
            <button type="button" onClick={() => setShowUploadModal(true)} className="flex flex-col items-center cursor-pointer">
              <span className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center mb-1"><Upload className="w-5 h-5" /></span>
              <span className="text-[11px] font-medium text-text-secondary">Document</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(orgUrl(`/assets/trailers/${trailerId}/edit`))}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="w-11 h-11 rounded-full bg-surface-secondary text-text-primary flex items-center justify-center mb-1"><Edit className="w-5 h-5" /></span>
              <span className="text-[11px] font-medium text-text-secondary">Full edit</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <HeroStat
            icon={ShieldCheck}
            label="License"
            value={trailer.license_expiry ? fmtDate(trailer.license_expiry) : 'Not set'}
            sub={expiryTone(trailer.license_expiry)?.label}
            tone={trailer.license_expiry ? toneOf(trailer.license_expiry) : null}
          />
          <HeroStat
            icon={Wrench}
            label="Inspection"
            value={trailer.annual_inspection_expiry ? fmtDate(trailer.annual_inspection_expiry) : 'Not set'}
            sub={expiryTone(trailer.annual_inspection_expiry)?.label}
            tone={trailer.annual_inspection_expiry ? toneOf(trailer.annual_inspection_expiry) : null}
          />
          <HeroStat
            icon={Shield}
            label="Insurance"
            value={trailer.insurance_expiry ? fmtDate(trailer.insurance_expiry) : 'Not set'}
            sub={expiryTone(trailer.insurance_expiry)?.label}
            tone={trailer.insurance_expiry ? toneOf(trailer.insurance_expiry) : null}
          />
          <HeroStat
            icon={Ruler}
            label="Length"
            value={trailer.length_ft != null ? `${trailer.length_ft} ft` : '—'}
            sub={trailer.max_payload_lbs ? `${Number(trailer.max_payload_lbs).toLocaleString()} lbs max` : null}
            tone="accent"
          />
        </div>
      </div>

      {/* ── Section nav ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-stretch gap-2">
        <SectionMenu
          section={section}
          onChange={setSection}
          items={[
            { id: 'identity',     label: 'Identity',         icon: Container },
            { id: 'dimensions',   label: 'Dimensions',       icon: Ruler },
            ...(isReefer ? [{ id: 'reefer', label: 'Reefer', icon: Snowflake }] : []),
            { id: 'registration', label: 'Registration',     icon: ShieldCheck },
            { id: 'compliance',   label: 'Compliance',       icon: Shield },
            { id: 'features',     label: 'Features',         icon: Sliders },
            { id: 'ownership',    label: 'Ownership',        icon: DollarSign },
            { id: 'assignment',   label: 'Assignment',       icon: Truck }
          ]}
        />
        <SideTabButton
          icon={FileText}
          label={`Documents${documents.length ? ` (${documents.length})` : ''}`}
          active={section === 'documents'}
          onClick={() => setSection('documents')}
        />
      </div>

      {/* ── Sections ────────────────────────────────────────────────────── */}
      {section === 'identity' && (
        <SectionCard icon={Container} title="Identity" columns={2}>
          <Field label="Unit #" value={trailer.unit_number} onSave={(v) => updateField('unit_number', v)} />
          <Field
            label="Type" type="select"
            options={Object.entries(TrailerTypeConfig).map(([v, c]) => ({ v, label: c.label }))}
            value={trailer.type}
            display={(v) => TrailerTypeConfig[v]?.label || v}
            onSave={(v) => updateField('type', v)}
          />
          <Field label="VIN" value={trailer.vin} onSave={(v) => updateField('vin', v)} />
          <Field label="Make" value={trailer.make} onSave={(v) => updateField('make', v)} />
          <Field label="Model" value={trailer.model} onSave={(v) => updateField('model', v)} />
          <Field label="Year" type="number" value={trailer.year} onSave={(v) => updateField('year', v ? parseInt(v, 10) : null)} />
          <Field label="Color" value={trailer.color} onSave={(v) => updateField('color', v)} />
          <Field
            label="Notes" type="textarea" value={trailer.notes}
            onSave={(v) => updateField('notes', v)}
            placeholder="Anything worth remembering."
          />
        </SectionCard>
      )}

      {section === 'dimensions' && (
        <SectionCard icon={Ruler} title="Dimensions & Specs" columns={2}>
          <Field
            label="Length (ft)" type="number" value={trailer.length_ft}
            display={(v) => `${v} ft`}
            onSave={(v) => updateField('length_ft', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="Width (in)" type="number" value={trailer.width_inches}
            display={(v) => `${v}"`}
            onSave={(v) => updateField('width_inches', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="Interior height (in)" type="number" value={trailer.height_inches}
            display={(v) => `${v}"`}
            onSave={(v) => updateField('height_inches', v ? parseInt(v, 10) : null)}
          />
          <Field label="Door type" value={trailer.door_type} onSave={(v) => updateField('door_type', v)} placeholder="Swing, Roll-up…" />
          <Field label="Axle count" type="number" value={trailer.axle_count} onSave={(v) => updateField('axle_count', v ? parseInt(v, 10) : null)} />
          <Field
            label="GVWR (lbs)" type="number" value={trailer.gvwr_lbs}
            display={(v) => Number(v).toLocaleString() + ' lbs'}
            onSave={(v) => updateField('gvwr_lbs', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="Empty weight (lbs)" type="number" value={trailer.empty_weight_lbs}
            display={(v) => Number(v).toLocaleString() + ' lbs'}
            onSave={(v) => updateField('empty_weight_lbs', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="Max payload (lbs)" type="number" value={trailer.max_payload_lbs}
            display={(v) => Number(v).toLocaleString() + ' lbs'}
            onSave={(v) => updateField('max_payload_lbs', v ? parseInt(v, 10) : null)}
          />
          <Field label="Floor type" value={trailer.floor_type} onSave={(v) => updateField('floor_type', v)} placeholder="Wood, Aluminum, Steel…" />
        </SectionCard>
      )}

      {section === 'reefer' && isReefer && (
        <SectionCard icon={Snowflake} title="Reefer Unit" columns={2}>
          <Field label="Reefer make" value={trailer.reefer_make} onSave={(v) => updateField('reefer_make', v)} placeholder="Carrier, Thermo King…" />
          <Field label="Reefer model" value={trailer.reefer_model} onSave={(v) => updateField('reefer_model', v)} />
          <Field label="Reefer year" type="number" value={trailer.reefer_year} onSave={(v) => updateField('reefer_year', v ? parseInt(v, 10) : null)} />
          <Field label="Serial #" value={trailer.reefer_serial} onSave={(v) => updateField('reefer_serial', v)} />
          <Field
            label="Hours" type="number" value={trailer.reefer_hours}
            display={(v) => Number(v).toLocaleString() + ' hrs'}
            onSave={(v) => updateField('reefer_hours', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="Min temp (°F)" type="number" value={trailer.min_temp_f}
            display={(v) => `${v}°F`}
            onSave={(v) => updateField('min_temp_f', v ? parseInt(v, 10) : null)}
          />
          <BoolField label="Multi-temp zones" value={trailer.has_multi_temp} onSave={(v) => updateField('has_multi_temp', v)} />
        </SectionCard>
      )}

      {section === 'registration' && (
        <SectionCard icon={ShieldCheck} title="Registration & License" columns={2}>
          <Field label="License plate" value={trailer.license_plate} onSave={(v) => updateField('license_plate', v)} />
          <Field label="License state" value={trailer.license_state} onSave={(v) => updateField('license_state', v)} />
          <Field
            label="License expiry" type="date" value={trailer.license_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('license_expiry', v)}
          />
          <Field
            label="Registration expiry" type="date" value={trailer.registration_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('registration_expiry', v)}
          />
          <Field label="IRP account" value={trailer.irp_account} onSave={(v) => updateField('irp_account', v)} />
          <Field
            label="IRP expiry" type="date" value={trailer.irp_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('irp_expiry', v)}
          />
        </SectionCard>
      )}

      {section === 'compliance' && (
        <SectionCard icon={Shield} title="Compliance & Inspections" columns={2}>
          <Field label="Annual inspection" type="date" value={trailer.annual_inspection_date} onSave={(v) => updateField('annual_inspection_date', v)} />
          <Field
            label="Inspection expiry" type="date" value={trailer.annual_inspection_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('annual_inspection_expiry', v)}
          />
          <Field label="Last service" type="date" value={trailer.last_service_date} onSave={(v) => updateField('last_service_date', v)} />
          <Field label="Next service" type="date" value={trailer.next_service_date} onSave={(v) => updateField('next_service_date', v)} />
          <Field label="Insurance policy" value={trailer.insurance_policy} onSave={(v) => updateField('insurance_policy', v)} />
          <Field
            label="Insurance expiry" type="date" value={trailer.insurance_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('insurance_expiry', v)}
          />
        </SectionCard>
      )}

      {section === 'features' && (
        <SectionCard icon={Sliders} title="Features & Equipment" columns={2}>
          <BoolField label="Liftgate" value={trailer.has_liftgate} onSave={(v) => updateField('has_liftgate', v)} />
          <BoolField label="Pallet jack" value={trailer.has_pallet_jack} onSave={(v) => updateField('has_pallet_jack', v)} />
          <BoolField label="E-track" value={trailer.has_e_track} onSave={(v) => updateField('has_e_track', v)} />
          <BoolField label="Load bars" value={trailer.has_load_bars} onSave={(v) => updateField('has_load_bars', v)} />
          <BoolField label="Straps" value={trailer.has_straps} onSave={(v) => updateField('has_straps', v)} />
          <BoolField label="Vents" value={trailer.has_vents} onSave={(v) => updateField('has_vents', v)} />
        </SectionCard>
      )}

      {section === 'ownership' && (
        <SectionCard icon={DollarSign} title="Ownership & Financials" columns={2}>
          <Field
            label="Ownership type" type="select" options={OWNERSHIP_OPTIONS}
            value={trailer.ownership_type}
            display={(v) => OWNERSHIP_OPTIONS.find((o) => o.v === v)?.label || v}
            onSave={(v) => updateField('ownership_type', v)}
          />
          <Field label="Owner name" value={trailer.owner_name} onSave={(v) => updateField('owner_name', v)} placeholder="Customer / shipper trailer" />
          <Field label="Lease company" value={trailer.lease_company} onSave={(v) => updateField('lease_company', v)} />
          <Field label="Lease end" type="date" value={trailer.lease_end_date} onSave={(v) => updateField('lease_end_date', v)} />
          <Field label="Purchase date" type="date" value={trailer.purchase_date} onSave={(v) => updateField('purchase_date', v)} />
          <Field
            label="Purchase price" type="number" value={trailer.purchase_price}
            display={(v) => <span>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
            onSave={(v) => updateField('purchase_price', v ? parseFloat(v) : null)}
          />
        </SectionCard>
      )}

      {section === 'assignment' && (
        <SectionCard icon={Truck} title="Current Assignment">
          <div className="py-3">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-2">Assigned to truck</p>
            <div className="flex items-center gap-3">
              <select
                value={trailer.current_truck_id || ''}
                onChange={(e) => assignToTruck(e.target.value || null)}
                className="flex-1 px-3 py-2 rounded-lg border border-surface-tertiary bg-surface-primary text-body-sm focus:outline-none focus:border-accent"
              >
                <option value="">— Unassigned —</option>
                {trucks.map((t) => (
                  <option key={t.id} value={t.id}>
                    Unit #{t.unit_number} {[t.year, t.make, t.model].filter(Boolean).join(' ') ? `· ${[t.year, t.make, t.model].filter(Boolean).join(' ')}` : ''}
                  </option>
                ))}
              </select>
              {truck && (
                <button
                  type="button"
                  onClick={() => navigate(orgUrl(`/assets/trucks/${truck.id}`))}
                  className="text-body-sm font-medium text-accent hover:underline whitespace-nowrap"
                >
                  View →
                </button>
              )}
            </div>
          </div>
        </SectionCard>
      )}

      {section === 'documents' && (
        <SectionCard
          icon={FileText}
          title={`Documents (${documents.length})`}
          action={
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="px-3 py-1.5 rounded-full bg-accent text-white text-body-sm font-medium hover:bg-accent/90 flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload
            </button>
          }
        >
          {documentsLoading ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : documents.length === 0 ? (
            <div className="py-10 text-center text-text-secondary">
              <FileText className="w-10 h-10 mx-auto text-text-tertiary mb-2" />
              <p className="text-body-sm">No documents yet</p>
              <p className="text-small text-text-tertiary mt-0.5">
                Upload registration, insurance, IRP, inspection reports, anything.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-tertiary/70">
              {documents.map((doc) => {
                const cfg = docTypeBadge[doc.type] || docTypeBadge.OTHER;
                const expired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                return (
                  <div key={doc.id} className="flex items-center gap-3 py-3">
                    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-semibold border', cfg.cls)}>
                      {cfg.label}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-body-sm font-medium text-text-primary truncate">{doc.file_name}</p>
                      <p className="text-small text-text-tertiary">
                        {doc.expiry_date
                          ? `Expires ${fmtDate(doc.expiry_date)}${expired ? ' · expired' : ''}`
                          : `Uploaded ${fmtDate(doc.created_at)}`}
                      </p>
                    </div>
                    {doc.viewUrl && (
                      <button type="button" onClick={() => window.open(doc.viewUrl, '_blank')} className="p-2 rounded-md hover:bg-surface-secondary text-text-secondary" aria-label="View">
                        <Eye className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteDocument(doc.id)}
                      disabled={deletingDocId === doc.id}
                      className="p-2 rounded-md hover:bg-red-50 text-text-tertiary hover:text-red-600"
                      aria-label="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </SectionCard>
      )}

      {showUploadModal && (
        <EquipmentDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          equipmentType="trailer"
          equipmentId={trailerId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

export default TrailerDetailPage;
