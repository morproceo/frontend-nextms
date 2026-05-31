/**
 * TruckDetailPage — contact-card style, same design language as the
 * Driver detail page. Inline-editable fields covering every Truck
 * column the org owns, plus assignment + documents sub-tabs.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useTruck, useDriversList, useTrailersList } from '../../hooks';
import uploadsApi from '../../api/uploads.api';
import {
  AssetStatusConfig,
  TruckTypeConfig
} from '../../config/status';
import { Spinner } from '../../components/ui/Spinner';
import { EquipmentDocumentUploadModal } from '../../components/features/documents/EquipmentDocumentUploadModal';
import {
  ArrowLeft, Truck, Edit, Calendar, Wrench, Shield, Gauge, Settings,
  Fuel, DollarSign, User, Container, FileText, Eye, Trash2, Upload,
  CheckCircle, XCircle, AlertCircle, ChevronDown, Check, X, Pencil,
  Clock, Activity, BadgeCheck, Power, MapPin, ShieldCheck, Building
} from 'lucide-react';

const cn = (...xs) => xs.filter(Boolean).join(' ');

const FUEL_OPTIONS = [
  { v: '', label: '—' },
  { v: 'diesel', label: 'Diesel' },
  { v: 'def', label: 'DEF' },
  { v: 'unleaded_regular', label: 'Unleaded Regular' },
  { v: 'unleaded_mid', label: 'Unleaded Mid-Grade' },
  { v: 'unleaded_premium', label: 'Unleaded Premium' },
  { v: 'biodiesel', label: 'Biodiesel' },
  { v: 'cng', label: 'CNG' },
  { v: 'lng', label: 'LNG' },
  { v: 'other', label: 'Other' }
];

const OWNERSHIP_OPTIONS = [
  { v: '', label: '—' },
  { v: 'owned', label: 'Owned' },
  { v: 'leased', label: 'Leased' },
  { v: 'rented', label: 'Rented' },
  { v: 'financed', label: 'Financed' }
];

const docTypeBadge = {
  REGISTRATION: { label: 'Registration', cls: 'bg-blue-50 text-blue-700 border-blue-200' },
  INSURANCE:    { label: 'Insurance',    cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  IRP:          { label: 'IRP',          cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  IFTA:         { label: 'IFTA',         cls: 'bg-purple-50 text-purple-700 border-purple-200' },
  INSPECTION:   { label: 'Inspection',   cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  OTHER:        { label: 'Other',        cls: 'bg-surface-secondary text-text-secondary border-surface-tertiary' }
};

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysUntil = (d) => {
  if (!d) return null;
  return Math.floor((new Date(d).getTime() - Date.now()) / 86400000);
};

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
  const toggle = async () => {
    if (busy) return;
    setBusy(true);
    try { await onSave(!value); } finally { setBusy(false); }
  };
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-surface-tertiary/60 last:border-0">
      <div className="text-body-sm">
        <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-1">{label}</p>
        <span className={value ? 'text-emerald-700 font-medium' : 'text-text-tertiary'}>
          {value ? 'Yes' : 'No'}
        </span>
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
                  active
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                    : 'text-text-primary hover:bg-surface-secondary'
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

export function TruckDetailPage() {
  const { truckId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();

  const { truck, loading, error, updateTruck, assignDriver, assignTrailer } = useTruck(truckId);
  const { drivers, fetchDrivers } = useDriversList();
  const { trailers, fetchTrailers } = useTrailersList();

  const [section, setSection] = useState('identity');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);

  // Field-grained updater so each edit is a single PATCH
  const updateField = useCallback((field, value) => updateTruck({ [field]: value }), [updateTruck]);

  const fetchDocuments = useCallback(async () => {
    if (!truckId) return;
    setDocumentsLoading(true);
    try {
      const res = await uploadsApi.getEquipmentDocuments('truck', truckId);
      setDocuments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setDocumentsLoading(false); }
  }, [truckId]);

  // Mount-only fetches. fetchDocuments / fetchDrivers / fetchTrailers
  // are NOT stable references (useApiState recreates the inner fetch
  // each render because its fetcher closes over fresh args), so listing
  // them as deps creates an infinite refetch loop. Run once on mount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDocuments(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchDrivers(); fetchTrailers({ is_active: true }); }, []);

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return;
    setDeletingDocId(documentId);
    try {
      await uploadsApi.deleteEquipmentDocument('truck', truckId, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) { console.error(err); alert('Delete failed'); }
    finally { setDeletingDocId(null); }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
  if (error || !truck) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(orgUrl('/assets/trucks'))} className="flex items-center gap-1.5 text-accent text-body-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Trucks
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <Truck className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-body text-red-700">{error || 'Truck not found'}</p>
        </div>
      </div>
    );
  }

  const statusCfg = truck.statusConfig || AssetStatusConfig[truck.status] || { label: truck.status, variant: 'gray' };
  const driver = drivers.find((d) => d.id === truck.current_driver_id);
  const trailer = trailers.find((t) => t.id === truck.current_trailer_id);

  return (
    <div className="space-y-5 pb-12">
      <button
        onClick={() => navigate(orgUrl('/assets/trucks'))}
        className="flex items-center gap-1.5 text-accent text-body-sm hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Trucks
      </button>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 overflow-hidden relative">
        {/* Status pill — top-right */}
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
              value={truck.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
              aria-label="Truck status"
            >
              {Object.values(AssetStatusConfig).map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="px-5 sm:px-7 pt-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            {/* Truck icon avatar */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-accent flex items-center justify-center shrink-0 mx-auto sm:mx-0">
              <Truck className="w-9 h-9 sm:w-12 sm:h-12 text-white" />
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-title sm:text-title-lg font-semibold text-text-primary">
                  Unit #{truck.unit_number}
                </h1>
                {truck.is_power_only && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    <Power className="w-3 h-3" /> Power Only
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-text-secondary text-body-sm">
                <span>{[truck.year, truck.make, truck.model].filter(Boolean).join(' ') || 'Vehicle details unknown'}</span>
                {truck.vin && <span className="text-text-tertiary">VIN: {truck.vin}</span>}
                {truck.license_plate && (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {truck.license_plate}{truck.license_state ? ` · ${truck.license_state}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-5">
            <button
              type="button"
              onClick={() => setShowUploadModal(true)}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="w-11 h-11 rounded-full bg-accent text-white flex items-center justify-center mb-1">
                <Upload className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-text-secondary">Document</span>
            </button>
            <button
              type="button"
              onClick={() => navigate(orgUrl(`/assets/trucks/${truckId}/edit`))}
              className="flex flex-col items-center cursor-pointer"
            >
              <span className="w-11 h-11 rounded-full bg-surface-secondary text-text-primary flex items-center justify-center mb-1">
                <Edit className="w-5 h-5" />
              </span>
              <span className="text-[11px] font-medium text-text-secondary">Full edit</span>
            </button>
          </div>
        </div>

        {/* Stat band — always visible */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <HeroStat
            icon={ShieldCheck}
            label="License"
            value={truck.license_expiry ? fmtDate(truck.license_expiry) : 'Not set'}
            sub={expiryTone(truck.license_expiry)?.label}
            tone={truck.license_expiry ? toneOf(truck.license_expiry) : null}
          />
          <HeroStat
            icon={Wrench}
            label="Inspection"
            value={truck.annual_inspection_expiry ? fmtDate(truck.annual_inspection_expiry) : 'Not set'}
            sub={expiryTone(truck.annual_inspection_expiry)?.label}
            tone={truck.annual_inspection_expiry ? toneOf(truck.annual_inspection_expiry) : null}
          />
          <HeroStat
            icon={Shield}
            label="Insurance"
            value={truck.insurance_expiry ? fmtDate(truck.insurance_expiry) : 'Not set'}
            sub={expiryTone(truck.insurance_expiry)?.label}
            tone={truck.insurance_expiry ? toneOf(truck.insurance_expiry) : null}
          />
          <HeroStat
            icon={Gauge}
            label="Odometer"
            value={truck.current_odometer != null ? `${Number(truck.current_odometer).toLocaleString()} mi` : '—'}
            sub={truck.mpg_estimate ? `${truck.mpg_estimate} MPG` : null}
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
            { id: 'identity',     label: 'Identity',         icon: Truck },
            { id: 'engine',       label: 'Engine & Specs',   icon: Settings },
            { id: 'cab',          label: 'Cab',              icon: Container },
            { id: 'registration', label: 'Registration',     icon: ShieldCheck },
            { id: 'compliance',   label: 'Compliance',       icon: Shield },
            { id: 'usage',        label: 'Usage & ELD',      icon: Gauge },
            { id: 'ownership',    label: 'Ownership',        icon: DollarSign },
            { id: 'assignments',  label: 'Assignments',      icon: User }
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
        <SectionCard icon={Truck} title="Identity" columns={2}>
          <Field label="Unit #" value={truck.unit_number} onSave={(v) => updateField('unit_number', v)} />
          <Field label="VIN" value={truck.vin} onSave={(v) => updateField('vin', v)} />
          <Field label="Make" value={truck.make} onSave={(v) => updateField('make', v)} />
          <Field label="Model" value={truck.model} onSave={(v) => updateField('model', v)} />
          <Field label="Year" type="number" value={truck.year} onSave={(v) => updateField('year', v ? parseInt(v, 10) : null)} />
          <Field label="Color" value={truck.color} onSave={(v) => updateField('color', v)} />
          <Field
            label="Notes" type="textarea" value={truck.notes}
            onSave={(v) => updateField('notes', v)}
            placeholder="Preferences, quirks, anything worth remembering."
          />
        </SectionCard>
      )}

      {section === 'engine' && (
        <SectionCard icon={Settings} title="Engine & Specs" columns={2}>
          <Field label="Engine make" value={truck.engine_make} onSave={(v) => updateField('engine_make', v)} />
          <Field label="Engine model" value={truck.engine_model} onSave={(v) => updateField('engine_model', v)} />
          <Field label="Horsepower" type="number" value={truck.engine_hp} onSave={(v) => updateField('engine_hp', v ? parseInt(v, 10) : null)} />
          <Field
            label="Fuel type" type="select" options={FUEL_OPTIONS}
            value={truck.fuel_type}
            display={(v) => FUEL_OPTIONS.find((o) => o.v === v)?.label || v}
            onSave={(v) => updateField('fuel_type', v)}
          />
          <Field label="Transmission" value={truck.transmission_type} onSave={(v) => updateField('transmission_type', v)} />
          <Field label="Axle count" type="number" value={truck.axle_count} onSave={(v) => updateField('axle_count', v ? parseInt(v, 10) : null)} />
          <Field
            label="GVWR (lbs)" type="number" value={truck.gvwr_lbs}
            display={(v) => Number(v).toLocaleString() + ' lbs'}
            onSave={(v) => updateField('gvwr_lbs', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="GCWR (lbs)" type="number" value={truck.gcwr_lbs}
            display={(v) => Number(v).toLocaleString() + ' lbs'}
            onSave={(v) => updateField('gcwr_lbs', v ? parseInt(v, 10) : null)}
          />
        </SectionCard>
      )}

      {section === 'cab' && (
        <SectionCard icon={Container} title="Cab" columns={2}>
          <Field
            label="Truck type" type="select"
            options={[{ v: '', label: '—' }, ...Object.entries(TruckTypeConfig).map(([v, c]) => ({ v, label: c.label }))]}
            value={truck.truck_type}
            display={(v) => TruckTypeConfig[v]?.label || v}
            onSave={(v) => updateField('truck_type', v)}
          />
          <Field label="Sleeper size" value={truck.sleeper_size} onSave={(v) => updateField('sleeper_size', v)} placeholder='e.g. 72", 80", High-roof' />
          <BoolField label="Has APU" value={truck.has_apu} onSave={(v) => updateField('has_apu', v)} />
          <BoolField label="Power only" value={truck.is_power_only} onSave={(v) => updateField('is_power_only', v)} />
        </SectionCard>
      )}

      {section === 'registration' && (
        <SectionCard icon={ShieldCheck} title="Registration & License" columns={2}>
          <Field label="License plate" value={truck.license_plate} onSave={(v) => updateField('license_plate', v)} />
          <Field label="License state" value={truck.license_state} onSave={(v) => updateField('license_state', v)} />
          <Field
            label="License expiry" type="date" value={truck.license_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('license_expiry', v)}
          />
          <Field
            label="Registration expiry" type="date" value={truck.registration_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('registration_expiry', v)}
          />
        </SectionCard>
      )}

      {section === 'compliance' && (
        <SectionCard icon={Shield} title="Compliance & Inspections" columns={2}>
          <Field
            label="Annual inspection" type="date" value={truck.annual_inspection_date}
            onSave={(v) => updateField('annual_inspection_date', v)}
          />
          <Field
            label="Inspection expiry" type="date" value={truck.annual_inspection_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('annual_inspection_expiry', v)}
          />
          <Field label="Last service" type="date" value={truck.last_service_date} onSave={(v) => updateField('last_service_date', v)} />
          <Field label="Next service" type="date" value={truck.next_service_date} onSave={(v) => updateField('next_service_date', v)} />
          <Field
            label="Next service @ miles" type="number" value={truck.next_service_miles}
            display={(v) => Number(v).toLocaleString() + ' mi'}
            onSave={(v) => updateField('next_service_miles', v ? parseInt(v, 10) : null)}
          />
          <Field label="IRP account" value={truck.irp_account} onSave={(v) => updateField('irp_account', v)} />
          <Field
            label="IRP expiry" type="date" value={truck.irp_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('irp_expiry', v)}
          />
          <Field label="IFTA account" value={truck.ifta_account} onSave={(v) => updateField('ifta_account', v)} />
          <Field
            label="IFTA expiry" type="date" value={truck.ifta_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('ifta_expiry', v)}
          />
          <Field label="Insurance policy" value={truck.insurance_policy} onSave={(v) => updateField('insurance_policy', v)} />
          <Field
            label="Insurance expiry" type="date" value={truck.insurance_expiry}
            display={(v) => <ExpiryRow date={v} />}
            onSave={(v) => updateField('insurance_expiry', v)}
          />
        </SectionCard>
      )}

      {section === 'usage' && (
        <SectionCard icon={Gauge} title="Usage & ELD" columns={2}>
          <Field
            label="Odometer (mi)" type="number" value={truck.current_odometer}
            display={(v) => Number(v).toLocaleString() + ' mi'}
            onSave={(v) => updateField('current_odometer', v ? parseInt(v, 10) : null)}
          />
          <Field
            label="MPG estimate" type="number" value={truck.mpg_estimate}
            onSave={(v) => updateField('mpg_estimate', v ? parseFloat(v) : null)}
            placeholder="For FuelIQ calculations"
          />
          <Field label="ELD provider" value={truck.eld_provider} onSave={(v) => updateField('eld_provider', v)} />
          <Field label="ELD device ID" value={truck.eld_device_id} onSave={(v) => updateField('eld_device_id', v)} />
          <Field label="Motive vehicle ID" value={truck.motive_vehicle_id} onSave={(v) => updateField('motive_vehicle_id', v)} placeholder="Auto-linked from Motive (AVA)" />
        </SectionCard>
      )}

      {section === 'ownership' && (
        <SectionCard icon={DollarSign} title="Ownership & Financials" columns={2}>
          <Field
            label="Ownership type" type="select" options={OWNERSHIP_OPTIONS}
            value={truck.ownership_type}
            display={(v) => OWNERSHIP_OPTIONS.find((o) => o.v === v)?.label || v}
            onSave={(v) => updateField('ownership_type', v)}
          />
          <Field label="Owner name" value={truck.owner_name} onSave={(v) => updateField('owner_name', v)} placeholder="For owner-operator trucks" />
          <Field label="Lease company" value={truck.lease_company} onSave={(v) => updateField('lease_company', v)} />
          <Field label="Lease end" type="date" value={truck.lease_end_date} onSave={(v) => updateField('lease_end_date', v)} />
          <Field label="Purchase date" type="date" value={truck.purchase_date} onSave={(v) => updateField('purchase_date', v)} />
          <Field
            label="Purchase price" type="number" value={truck.purchase_price}
            display={(v) => <span>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
            onSave={(v) => updateField('purchase_price', v ? parseFloat(v) : null)}
          />
        </SectionCard>
      )}

      {section === 'assignments' && (
        <SectionCard icon={User} title="Current Assignments">
          {/* Driver */}
          <div className="py-3 border-b border-surface-tertiary/60">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-2">Driver</p>
            <div className="flex items-center gap-3">
              <select
                value={truck.current_driver_id || ''}
                onChange={(e) => assignDriver(e.target.value || null)}
                className="flex-1 px-3 py-2 rounded-lg border border-surface-tertiary bg-surface-primary text-body-sm focus:outline-none focus:border-accent"
              >
                <option value="">— Unassigned —</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>{d.first_name} {d.last_name}</option>
                ))}
              </select>
              {driver && (
                <button
                  type="button"
                  onClick={() => navigate(orgUrl(`/drivers/${driver.id}`))}
                  className="text-body-sm font-medium text-accent hover:underline whitespace-nowrap"
                >
                  View →
                </button>
              )}
            </div>
          </div>
          {/* Trailer */}
          <div className="py-3 border-b border-surface-tertiary/60 last:border-0">
            <p className="text-[11px] font-medium uppercase tracking-wide text-text-tertiary mb-2">Trailer</p>
            <div className="flex items-center gap-3">
              <select
                value={truck.current_trailer_id || ''}
                onChange={(e) => assignTrailer(e.target.value || null)}
                className="flex-1 px-3 py-2 rounded-lg border border-surface-tertiary bg-surface-primary text-body-sm focus:outline-none focus:border-accent"
              >
                <option value="">— Unassigned —</option>
                {trailers.map((t) => (
                  <option key={t.id} value={t.id}>#{t.unit_number} {t.trailer_type ? `· ${t.trailer_type}` : ''}</option>
                ))}
              </select>
              {trailer && (
                <button
                  type="button"
                  onClick={() => navigate(orgUrl(`/assets/trailers/${trailer.id}`))}
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
                Upload registration, insurance, IRP, IFTA, inspection reports, anything.
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
                      <button
                        type="button"
                        onClick={() => window.open(doc.viewUrl, '_blank')}
                        className="p-2 rounded-md hover:bg-surface-secondary text-text-secondary"
                        aria-label="View"
                      >
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

      {/* Upload modal */}
      {showUploadModal && (
        <EquipmentDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          equipmentType="truck"
          equipmentId={truckId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

export default TruckDetailPage;
