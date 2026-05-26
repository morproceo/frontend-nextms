/**
 * DriverDetailPage — contact-card style. LinkedIn-flavored layout with:
 *   - Gradient cover banner + avatar overlap + name + status pills
 *   - Quick-action row (Call / Email / Message / Edit / More)
 *   - Tabs (Profile · Documents · Activity)
 *   - Inline-editable Field rows covering every Driver column the org owns,
 *     wired to useDriver().updateField for one-field-at-a-time PATCH saves.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrg } from '../../contexts/OrgContext';
import { useDriver } from '../../hooks';
import uploadsApi from '../../api/uploads.api';
import {
  DriverStatusConfig,
  DriverTypeConfig,
  PayTypeConfig,
  TaxClassificationConfig
} from '../../config/status';
import { Badge } from '../../components/ui/Badge';
import { Spinner } from '../../components/ui/Spinner';
import { DriverDocumentUploadModal } from '../../components/features/documents/DriverDocumentUploadModal';
import {
  ArrowLeft, UserCheck, UserX, Mail, Phone, MessageSquare, Calendar,
  CreditCard, Send, Clock, CheckCircle, XCircle, AlertCircle, Edit,
  Copy, LogOut, DollarSign, Fuel, Shield, Building, Heart, Upload,
  FileText, Eye, Trash2, AlertTriangle, ChevronDown, Check, X,
  Briefcase, MoreHorizontal, BadgeCheck, ShieldCheck, Truck, Pencil, MapPin
} from 'lucide-react';

const cn = (...xs) => xs.filter(Boolean).join(' ');

const docTypeBadgeConfig = {
  CDL: { label: 'CDL', variant: 'blue' },
  MEDICAL_CARD: { label: 'Medical', variant: 'green' },
  DRUG_TEST: { label: 'Drug Test', variant: 'purple' },
  MVR: { label: 'MVR', variant: 'orange' },
  TRAINING: { label: 'Training', variant: 'blue' },
  W9: { label: 'W-9', variant: 'gray' },
  CONTRACT: { label: 'Contract', variant: 'gray' },
  INSURANCE: { label: 'Insurance', variant: 'green' },
  OTHER: { label: 'Other', variant: 'gray' }
};

const inviteStatusConfig = {
  claimed: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Profile Claimed' },
  accepted: { icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Invite Accepted' },
  pending: { icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Invite Pending' },
  expired: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Invite Expired' },
  not_invited: { icon: Mail, color: 'text-text-secondary', bg: 'bg-surface-secondary', label: 'Not Invited' },
  no_email: { icon: AlertCircle, color: 'text-text-tertiary', bg: 'bg-surface-secondary', label: 'No Email' },
  already_member: { icon: UserCheck, color: 'text-accent', bg: 'bg-accent/10', label: 'Already Member' },
  disconnected: { icon: LogOut, color: 'text-red-600', bg: 'bg-red-50', label: 'Disconnected' }
};

// Pretty enums for sections we don't have configs for.
const ELD_STATUS_OPTIONS = [
  { v: '', label: '—' },
  { v: 'on_duty', label: 'On Duty' },
  { v: 'driving', label: 'Driving' },
  { v: 'sleeper', label: 'Sleeper Berth' },
  { v: 'off_duty', label: 'Off Duty' }
];
const CLEARINGHOUSE_OPTIONS = [
  { v: '', label: '—' },
  { v: 'clear', label: 'Clear' },
  { v: 'not_registered', label: 'Not registered' },
  { v: 'prohibited', label: 'Prohibited' },
  { v: 'unknown', label: 'Unknown' }
];
const DQ_FILE_OPTIONS = [
  { v: '', label: '—' },
  { v: 'complete', label: 'Complete' },
  { v: 'incomplete', label: 'Incomplete' },
  { v: 'under_review', label: 'Under review' },
  { v: 'expired', label: 'Expired' }
];

const fmtDate = (d) => {
  if (!d) return '—';
  const date = new Date(d);
  if (isNaN(date)) return '—';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const daysUntil = (d) => {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.floor(ms / 86400000);
};

const expiryTone = (d) => {
  const days = daysUntil(d);
  if (days == null) return null;
  if (days < 0) return { cls: 'bg-red-50 text-red-700 border-red-200', label: 'Expired' };
  if (days <= 30) return { cls: 'bg-amber-50 text-amber-700 border-amber-200', label: `${days}d left` };
  return { cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', label: 'Valid' };
};

// StatPill tone hint (red / amber / green) keyed off the same days-until math.
const toneOf = (d) => {
  const days = daysUntil(d);
  if (days == null) return null;
  if (days < 0) return 'red';
  if (days <= 30) return 'amber';
  return 'green';
};

// Tenure since a hire date — "3y 4mo" / "8 months" / "12 days" style.
const tenureLabel = (hireDate) => {
  if (!hireDate) return '';
  const start = new Date(hireDate);
  if (isNaN(start)) return '';
  const now = new Date();
  let years = now.getFullYear() - start.getFullYear();
  let months = now.getMonth() - start.getMonth();
  if (now.getDate() < start.getDate()) months -= 1;
  if (months < 0) { years -= 1; months += 12; }
  if (years >= 1) return `${years}y ${months}mo`;
  if (months >= 1) return `${months} ${months === 1 ? 'month' : 'months'}`;
  const days = Math.max(0, Math.floor((now - start) / 86400000));
  return `${days} ${days === 1 ? 'day' : 'days'}`;
};

// ─────────────────────────────────────────────────────────────────────────
// Inline-edit primitives
// ─────────────────────────────────────────────────────────────────────────

function Field({ label, value, display, type = 'text', options, onSave, placeholder = '—', children }) {
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
    try { await onSave(next); setEditing(false); }
    finally { setSaving(false); }
  };

  const shown = children ?? (
    value == null || value === ''
      ? <span className="text-text-tertiary">{placeholder}</span>
      : (display ? display(value) : <span className="text-text-primary">{value}</span>)
  );

  return (
    <div
      className="group flex items-start justify-between gap-3 py-2.5 border-b border-surface-tertiary/60 last:border-0 cursor-pointer sm:cursor-default"
      onClick={(e) => {
        // Mobile: tapping anywhere on the row enters edit mode. On desktop
        // we keep the row passive so click-to-select-text still works; the
        // pencil button handles the click instead. The matchMedia check
        // is cheap and avoids a layout-sensitive coarse-pointer check.
        if (editing) return;
        if (window.matchMedia?.('(hover: hover)').matches) return;
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
            {options?.map((o) => (
              <option key={o.v} value={o.v}>{o.label}</option>
            ))}
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
          className={cn(
            // Mobile: always visible. Desktop: subtle at rest, full on hover.
            'p-1.5 rounded-md text-accent shrink-0 mt-0.5 transition-opacity',
            'opacity-100 sm:opacity-60 sm:group-hover:opacity-100 hover:bg-accent/10'
          )}
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
    try { await onSave(!value); }
    finally { setBusy(false); }
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
        aria-pressed={!!value}
      >
        <span
          className={cn(
            'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform',
            value ? 'translate-x-5' : 'translate-x-0.5'
          )}
        />
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
      <div className={cn(
        'px-5 py-2',
        columns === 2 && 'grid grid-cols-1 sm:grid-cols-2 gap-x-8'
      )}>
        {children}
      </div>
    </section>
  );
}

/**
 * Banner-embedded stat tile. Lives in the hero strip — separated by a 1px
 * surface-tertiary line via `gap-px bg-surface-tertiary` on the parent.
 * No outer border, just an icon + label + value + sub.
 */
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

function StatPill({ icon: Icon, label, value, sub, tone }) {
  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-xl px-4 py-3 flex items-start gap-3">
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

/**
 * Section dropdown — shows the current section as a button with the icon,
 * label, and a chevron; clicking opens a popover with all items. Click
 * outside or pick an item to close. Works the same on mobile and desktop —
 * no horizontal scroll, no wrapping pill mess.
 */
function SectionMenu({ section, items, onChange }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  // If the active section belongs to this menu, surface it on the button.
  // If the user is on a sibling tab (Documents / Activity), fall back to
  // the first item label so the menu looks passive instead of falsely-active.
  const ownsActive = items.some((i) => i.id === section);
  const current = (ownsActive && items.find((i) => i.id === section)) || items[0];
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) setOpen(false);
    };
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
            // Active-link styling from AppShell.jsx — gradient + white text.
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm hover:from-blue-700 hover:to-blue-600'
            : 'bg-white border border-gray-200 text-text-secondary hover:bg-surface-secondary shadow-[0_1px_2px_rgba(16,24,40,0.04)]'
        )}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="flex items-center gap-2 min-w-0">
          <CurrentIcon className={cn('w-4 h-4 shrink-0', ownsActive ? 'text-white' : 'text-text-tertiary')} />
          <span className={cn('text-body-sm font-semibold truncate', ownsActive ? 'text-white' : 'text-text-primary')}>
            {current.label}
          </span>
        </span>
        <ChevronDown className={cn(
          'w-4 h-4 transition-transform',
          ownsActive ? 'text-white/80' : 'text-text-tertiary',
          open && 'rotate-180'
        )} />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            'absolute z-30 mt-1.5 w-full sm:w-64 left-0 sm:left-0',
            'bg-white border border-gray-200 rounded-xl shadow-[0_8px_28px_rgba(16,24,40,0.10)]',
            'py-1 max-h-[70vh] overflow-y-auto'
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const active = item.id === section;
            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                onClick={() => { onChange(item.id); setOpen(false); }}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg mx-1 my-0.5 text-left transition-all',
                  active
                    // Mirrors the AppShell sidebar active link style.
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

/**
 * Standalone tab button that lives beside the section menu — same height,
 * same chrome, gradient when active so it mirrors the dropdown's active
 * state. Used for "Documents" and "Activity" which are list views, not
 * field forms, so they don't belong inside the editing-section menu.
 */
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

function QuickAction({ icon: Icon, label, onClick, href, tone = 'default' }) {
  const body = (
    <>
      <span
        className={cn(
          'w-11 h-11 rounded-full flex items-center justify-center mb-1',
          tone === 'accent' && 'bg-accent text-white',
          tone === 'default' && 'bg-surface-secondary text-text-primary'
        )}
      >
        <Icon className="w-5 h-5" />
      </span>
      <span className="text-[11px] font-medium text-text-secondary">{label}</span>
    </>
  );
  const cls = 'flex flex-col items-center cursor-pointer';
  return href
    ? <a href={href} className={cls}>{body}</a>
    : <button type="button" onClick={onClick} className={cls}>{body}</button>;
}

// ─────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────

export function DriverDetailPage() {
  const { driverId } = useParams();
  const navigate = useNavigate();
  const { currentOrg, orgUrl } = useOrg();

  const {
    driver, loading, error,
    updateField, sendInvite, resendInvite, inviteStatus, inviteLoading
  } = useDriver(driverId);

  // Single flat tab strip — Contact / Compliance / Pay / Equipment /
  // Emergency / Documents / Activity. No outer Profile tab.
  const [section, setSection] = useState('contact');
  const [documents, setDocuments] = useState([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState(null);
  const [codeCopied, setCodeCopied] = useState(false);

  const fetchDocuments = useCallback(async () => {
    if (!driverId) return;
    setDocumentsLoading(true);
    try {
      const res = await uploadsApi.getDriverDocuments(driverId);
      setDocuments(res.data || []);
    } catch (err) { console.error(err); }
    finally { setDocumentsLoading(false); }
  }, [driverId]);

  useEffect(() => { fetchDocuments(); }, [fetchDocuments]);

  const handleDeleteDocument = async (documentId) => {
    if (!confirm('Delete this document?')) return;
    setDeletingDocId(documentId);
    try {
      await uploadsApi.deleteDriverDocument(driverId, documentId);
      setDocuments((prev) => prev.filter((d) => d.id !== documentId));
    } catch (err) { console.error(err); alert('Delete failed'); }
    finally { setDeletingDocId(null); }
  };

  const handleCopyCode = async () => {
    if (!inviteStatus?.invite_code) return;
    try {
      await navigator.clipboard.writeText(inviteStatus.invite_code);
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch {/* noop */}
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner size="lg" /></div>;
  }
  if (error || !driver) {
    return (
      <div className="space-y-6">
        <button onClick={() => navigate(orgUrl('/drivers'))} className="flex items-center gap-1.5 text-accent text-body-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Drivers
        </button>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
          <UserX className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="text-body text-red-700">{error || 'Driver not found'}</p>
        </div>
      </div>
    );
  }

  const initials = `${driver.first_name?.[0] || ''}${driver.last_name?.[0] || ''}`.toUpperCase() || 'D';
  const statusCfg = DriverStatusConfig[driver.status] || { label: driver.status, variant: 'gray' };
  const inviteCfg = inviteStatusConfig[inviteStatus?.status] || inviteStatusConfig.not_invited;
  const InviteIcon = inviteCfg.icon;
  const isClaimed = !!driver.user_id;

  return (
    <div className="space-y-5 pb-12">
      {/* Back */}
      <button
        onClick={() => navigate(orgUrl('/drivers'))}
        className="flex items-center gap-1.5 text-accent text-body-sm hover:underline"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Drivers
      </button>

      {/* ── Hero (clean, no banner) ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-[0_1px_2px_rgba(16,24,40,0.04)] hover:shadow-[0_8px_28px_rgba(16,24,40,0.06)] transition-all duration-300 overflow-hidden relative">
        {/* Status pill — anchored to the top-right corner of the card */}
        <div className="absolute top-4 right-4 z-10">
          <label className={cn(
            'relative inline-flex items-center gap-1 rounded-full text-[10px] uppercase tracking-wide font-semibold cursor-pointer transition-colors',
            'pl-2.5 pr-1.5 py-1',
            statusCfg.variant === 'green' && 'bg-emerald-50 text-emerald-700 border border-emerald-200',
            statusCfg.variant === 'blue' && 'bg-blue-50 text-blue-700 border border-blue-200',
            (statusCfg.variant === 'amber' || statusCfg.variant === 'yellow') && 'bg-amber-50 text-amber-700 border border-amber-200',
            statusCfg.variant === 'red' && 'bg-red-50 text-red-700 border border-red-200',
            (!statusCfg.variant || statusCfg.variant === 'gray') && 'bg-surface-secondary text-text-secondary border border-surface-tertiary'
          )}>
            {statusCfg.label}
            <ChevronDown className="w-3 h-3 opacity-60" />
            <select
              value={driver.status}
              onChange={(e) => updateField('status', e.target.value)}
              className="absolute opacity-0 inset-0 w-full h-full cursor-pointer"
              aria-label="Driver status"
            >
              {Object.entries(DriverStatusConfig).map(([v, c]) => (
                <option key={v} value={v}>{c.label}</option>
              ))}
            </select>
          </label>
        </div>

        <div className="px-5 sm:px-7 pt-6 pb-5">
          {/* Identity row */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full shrink-0 mx-auto sm:mx-0 overflow-hidden">
              {driver.user?.avatar_url ? (
                <img
                  src={driver.user.avatar_url}
                  alt={`${driver.first_name} ${driver.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-accent flex items-center justify-center">
                  <span className="text-white text-xl sm:text-2xl font-semibold">{initials}</span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 text-center sm:text-left">
              {/* Name row — claim check + name */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h1 className="text-title sm:text-title-lg font-semibold text-text-primary">
                  {driver.first_name} {driver.last_name}
                </h1>
                {/* Blue check-button — title carries the textual meaning. */}
                {['claimed', 'accepted', 'already_member'].includes(inviteStatus?.status) && (
                  <button
                    type="button"
                    title={inviteCfg.label}
                    aria-label={inviteCfg.label}
                    className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center shadow-sm hover:bg-accent/90"
                  >
                    <Check className="w-3.5 h-3.5" strokeWidth={3} />
                  </button>
                )}
              </div>

              {/* Email + phone on one line */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1 mt-2 text-text-secondary text-body-sm">
                {driver.email && (
                  <a href={`mailto:${driver.email}`} className="flex items-center gap-1.5 hover:text-accent">
                    <Mail className="w-3.5 h-3.5" /> {driver.email}
                  </a>
                )}
                {driver.phone && (
                  <a href={`tel:${driver.phone}`} className="flex items-center gap-1.5 hover:text-accent">
                    <Phone className="w-3.5 h-3.5" /> {driver.phone}
                  </a>
                )}
              </div>

              {/* City on its own line, map-pin */}
              {driver.home_terminal && (
                <div className="flex items-center justify-center sm:justify-start gap-1.5 mt-1 text-text-secondary text-body-sm">
                  <MapPin className="w-3.5 h-3.5" /> {driver.home_terminal}
                </div>
              )}

              {/* Invite actions (only when relevant) */}
              {(inviteStatus?.status === 'not_invited' && driver.email) || ['pending', 'expired'].includes(inviteStatus?.status) || inviteStatus?.invite_code ? (
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  {inviteStatus?.status === 'not_invited' && driver.email && (
                    <button
                      type="button" onClick={sendInvite} disabled={inviteLoading}
                      className="px-3 py-1.5 rounded-full bg-accent text-white text-body-sm font-medium hover:bg-accent/90 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> {inviteLoading ? 'Sending…' : 'Send invite'}
                    </button>
                  )}
                  {['pending', 'expired'].includes(inviteStatus?.status) && (
                    <button
                      type="button" onClick={resendInvite} disabled={inviteLoading}
                      className="px-3 py-1.5 rounded-full border border-accent text-accent text-body-sm font-medium hover:bg-accent/5 disabled:opacity-60 flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> Resend
                    </button>
                  )}
                  {inviteStatus?.invite_code && (
                    <button
                      type="button" onClick={handleCopyCode}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-secondary border border-surface-tertiary hover:bg-surface-tertiary transition-colors text-[11px] font-mono"
                    >
                      {inviteStatus.invite_code}
                      {codeCopied ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-text-tertiary" />}
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex items-center justify-center sm:justify-start gap-3 sm:gap-5 mt-5 overflow-x-auto -mx-1 px-1">
            {driver.phone && <QuickAction icon={Phone} label="Call" href={`tel:${driver.phone}`} tone="accent" />}
            {driver.email && <QuickAction icon={Mail} label="Email" href={`mailto:${driver.email}`} />}
            {driver.phone && <QuickAction icon={MessageSquare} label="Message" href={`sms:${driver.phone}`} />}
            <QuickAction icon={Edit} label="Full edit" onClick={() => navigate(orgUrl(`/drivers/${driverId}/edit`))} />
            <QuickAction icon={Upload} label="Document" onClick={() => setShowUploadModal(true)} />
          </div>
        </div>

        {/* Stat band — same card, always visible across tabs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 border-t border-gray-100 divide-x divide-gray-100">
          <HeroStat
            icon={ShieldCheck}
            label="License"
            value={driver.license_expiry ? fmtDate(driver.license_expiry) : 'Not set'}
            sub={expiryTone(driver.license_expiry)?.label}
            tone={driver.license_expiry ? toneOf(driver.license_expiry) : null}
          />
          <HeroStat
            icon={Heart}
            label="Medical card"
            value={driver.medical_card_expiry ? fmtDate(driver.medical_card_expiry) : 'Not set'}
            sub={expiryTone(driver.medical_card_expiry)?.label}
            tone={driver.medical_card_expiry ? toneOf(driver.medical_card_expiry) : null}
          />
          <HeroStat
            icon={Calendar}
            label="Hire date"
            value={driver.hire_date ? fmtDate(driver.hire_date) : 'Not set'}
            sub={driver.hire_date ? `${tenureLabel(driver.hire_date)} with us` : null}
            tone="accent"
          />
          <HeroStat
            icon={BadgeCheck}
            label="Status"
            value={statusCfg.label}
            sub={driver.eld_hours_remaining != null ? `${driver.eld_hours_remaining} hrs HOS left` : null}
            tone={driver.status === 'available' ? 'green' : driver.status === 'on_load' ? 'accent' : null}
          />
        </div>
      </div>

      {/* ── Section nav ─────────────────────────────────────────────────
          Dropdown for the data-editing sections (Contact/Compliance/etc).
          Documents and Activity sit beside it as their own pills — they're
          different surfaces (lists, not field forms) so they get top-level
          access. On mobile the three controls share the row as 3 equal
          columns; on desktop they sit inline with auto widths. */}
      <div className="grid grid-cols-3 sm:flex sm:flex-wrap items-stretch gap-2">
        <SectionMenu
          section={section}
          onChange={setSection}
          items={[
            { id: 'contact',    label: 'Contact',     icon: Mail },
            { id: 'compliance', label: 'Compliance',  icon: Shield },
            { id: 'pay',        label: 'Pay',         icon: DollarSign },
            { id: 'equipment',  label: 'Equipment',   icon: Truck },
            { id: 'emergency',  label: 'Emergency',   icon: Heart }
          ]}
        />
        <SideTabButton
          icon={FileText}
          label={`Documents${documents.length ? ` (${documents.length})` : ''}`}
          active={section === 'documents'}
          onClick={() => setSection('documents')}
        />
        <SideTabButton
          icon={Clock}
          label="Activity"
          active={section === 'activity'}
          onClick={() => setSection('activity')}
        />
      </div>

      {/* ── Active section ────────────────────────────────────────────── */}
      {/* contact / compliance / pay / equipment / emergency / documents / activity */}
          {section === 'contact' && (
            <SectionCard icon={Mail} title="Contact info" columns={2}>
              <Field label="First name" value={driver.first_name} onSave={(v) => updateField('first_name', v)} />
              <Field label="Last name" value={driver.last_name} onSave={(v) => updateField('last_name', v)} />
              <Field label="Email" value={driver.email} onSave={(v) => updateField('email', v)} />
              <Field label="Phone" value={driver.phone} onSave={(v) => updateField('phone', v)} />
              <Field label="Home terminal" value={driver.home_terminal} onSave={(v) => updateField('home_terminal', v)} />
              <Field
                label="Notes" type="textarea" value={driver.notes}
                onSave={(v) => updateField('notes', v)}
                placeholder="Preferences, training notes, anything worth remembering."
              />
            </SectionCard>
          )}

          {section === 'compliance' && (
            <SectionCard icon={Shield} title="License & Compliance" columns={2}>
              <Field label="CDL number" value={driver.license_number} onSave={(v) => updateField('license_number', v)} />
              <Field label="License state" value={driver.license_state} onSave={(v) => updateField('license_state', v)} />
              <Field
                label="License expiry" type="date" value={driver.license_expiry}
                display={(v) => <ExpiryRow date={v} />}
                onSave={(v) => updateField('license_expiry', v)}
              />
              <Field
                label="Medical card expiry" type="date" value={driver.medical_card_expiry}
                display={(v) => <ExpiryRow date={v} />}
                onSave={(v) => updateField('medical_card_expiry', v)}
              />
              <Field label="Drug test date" type="date" value={driver.drug_test_date} onSave={(v) => updateField('drug_test_date', v)} />
              <Field
                label="Drug test expiry" type="date" value={driver.drug_test_expiry}
                display={(v) => <ExpiryRow date={v} />}
                onSave={(v) => updateField('drug_test_expiry', v)}
              />
              <Field label="MVR date" type="date" value={driver.mvr_date} onSave={(v) => updateField('mvr_date', v)} />
              <Field
                label="MVR expiry" type="date" value={driver.mvr_expiry}
                display={(v) => <ExpiryRow date={v} />}
                onSave={(v) => updateField('mvr_expiry', v)}
              />
              <Field label="Endorsements" value={driver.endorsements} onSave={(v) => updateField('endorsements', v)} placeholder="e.g. H, N, T" />
              <Field
                label="Experience (months OTR)" type="number"
                value={driver.experience_years_months}
                onSave={(v) => updateField('experience_years_months', v ? parseInt(v, 10) : null)}
              />
              <BoolField label="Hazmat" value={driver.hazmat_endorsement} onSave={(v) => updateField('hazmat_endorsement', v)} />
              <BoolField label="Tanker" value={driver.tanker_endorsement} onSave={(v) => updateField('tanker_endorsement', v)} />
              <BoolField label="Doubles / Triples" value={driver.doubles_triples_endorsement} onSave={(v) => updateField('doubles_triples_endorsement', v)} />
              <BoolField label="PSP report on file" value={driver.psp_report_on_file} onSave={(v) => updateField('psp_report_on_file', v)} />
              <Field label="PSP report date" type="date" value={driver.psp_report_date} onSave={(v) => updateField('psp_report_date', v)} />
              <Field
                label="Clearinghouse" type="select" options={CLEARINGHOUSE_OPTIONS}
                value={driver.clearinghouse_status}
                onSave={(v) => updateField('clearinghouse_status', v)}
              />
              <Field
                label="DQ file" type="select" options={DQ_FILE_OPTIONS}
                value={driver.dq_file_status}
                onSave={(v) => updateField('dq_file_status', v)}
              />
            </SectionCard>
          )}

          {section === 'pay' && (
            <SectionCard icon={DollarSign} title="Pay & Classification" columns={2}>
              <Field
                label="Driver type" type="select"
                options={[{ v: '', label: '—' }, ...Object.entries(DriverTypeConfig).map(([v, c]) => ({ v, label: c.label }))]}
                value={driver.driver_type}
                display={(v) => DriverTypeConfig[v]?.label || v}
                onSave={(v) => updateField('driver_type', v)}
              />
              <Field
                label="Pay type" type="select"
                options={[{ v: '', label: '—' }, ...Object.entries(PayTypeConfig).map(([v, c]) => ({ v, label: c.label }))]}
                value={driver.pay_type}
                display={(v) => PayTypeConfig[v]?.label || v}
                onSave={(v) => updateField('pay_type', v)}
              />
              <Field
                label="Pay rate" type="number" value={driver.pay_rate}
                display={(v) => <span>${Number(v).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>}
                onSave={(v) => updateField('pay_rate', v ? parseFloat(v) : null)}
              />
              <Field label="Employee #" value={driver.employee_number} onSave={(v) => updateField('employee_number', v)} />
              <Field
                label="Tax classification" type="select"
                options={[{ v: '', label: '—' }, ...Object.entries(TaxClassificationConfig).map(([v, c]) => ({ v, label: c.label }))]}
                value={driver.tax_classification}
                display={(v) => TaxClassificationConfig[v]?.label || v}
                onSave={(v) => updateField('tax_classification', v)}
              />
              <Field label="Hire date" type="date" value={driver.hire_date} onSave={(v) => updateField('hire_date', v)} />
              <Field label="Termination date" type="date" value={driver.termination_date} onSave={(v) => updateField('termination_date', v)} />
            </SectionCard>
          )}

          {section === 'equipment' && (
            <SectionCard icon={Truck} title="Equipment & Operations" columns={2}>
              <Field label="Fuel card #" value={driver.fuel_card_number} onSave={(v) => updateField('fuel_card_number', v)} />
              <Field label="ELD provider" value={driver.eld_provider} onSave={(v) => updateField('eld_provider', v)} />
              <Field label="ELD serial" value={driver.eld_serial} onSave={(v) => updateField('eld_serial', v)} />
              <Field
                label="ELD status" type="select" options={ELD_STATUS_OPTIONS}
                value={driver.eld_status}
                onSave={(v) => updateField('eld_status', v)}
              />
              <Field
                label="HOS hours remaining" type="number" value={driver.eld_hours_remaining}
                onSave={(v) => updateField('eld_hours_remaining', v ? parseFloat(v) : null)}
              />
              <Field
                label="Hours driven today" type="number" value={driver.eld_hours_driven}
                onSave={(v) => updateField('eld_hours_driven', v ? parseFloat(v) : null)}
              />
            </SectionCard>
          )}

          {section === 'emergency' && (
            <SectionCard icon={Heart} title="Emergency Contact" columns={2}>
              <Field label="Name" value={driver.emergency_contact_name} onSave={(v) => updateField('emergency_contact_name', v)} />
              <Field label="Phone" value={driver.emergency_contact_phone} onSave={(v) => updateField('emergency_contact_phone', v)} />
              <Field label="Relationship" value={driver.emergency_contact_relationship} onSave={(v) => updateField('emergency_contact_relationship', v)} placeholder="Spouse, parent, sibling…" />
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
                Upload CDL, medical card, drug test, MVR, training, contracts and more.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-surface-tertiary/70">
              {documents.map((doc) => {
                const cfg = docTypeBadgeConfig[doc.type] || docTypeBadgeConfig.OTHER;
                const expired = doc.expiry_date && new Date(doc.expiry_date) < new Date();
                return (
                  <div key={doc.id} className="flex items-center gap-3 py-3">
                    <Badge variant={cfg.variant} className="flex-shrink-0">{cfg.label}</Badge>
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

      {section === 'activity' && (
        <SectionCard icon={Clock} title="Activity">
          <div className="py-10 text-center text-text-secondary">
            <Clock className="w-10 h-10 mx-auto text-text-tertiary mb-2" />
            <p className="text-body-sm">Activity feed coming soon</p>
            <p className="text-small text-text-tertiary mt-0.5">
              Load assignments, status changes, comms, and audit events will land here.
            </p>
          </div>
        </SectionCard>
      )}

      {/* Upload modal */}
      {showUploadModal && (
        <DriverDocumentUploadModal
          isOpen={showUploadModal}
          onClose={() => setShowUploadModal(false)}
          driverId={driverId}
          onSuccess={fetchDocuments}
        />
      )}
    </div>
  );
}

// Expiry display helper (used inside Field's `display` prop)
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

export default DriverDetailPage;
