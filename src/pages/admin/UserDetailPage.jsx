/**
 * Super Admin — user detail / support view.
 *
 * Edit basic profile, set a temporary password, and inspect every org
 * the user belongs to with that org's Stripe + network-verification state.
 */

import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft, Loader2, AlertCircle, Check, KeyRound, Save, Building2
} from 'lucide-react';
import superAdminApi from '../../api/superAdmin.api';

const STRIPE_TONE = {
  active: 'bg-success-muted text-success',
  trialing: 'bg-accent-muted text-accent',
  past_due: 'bg-warning-muted text-warning',
  cancelled: 'bg-error-muted text-error',
  expired: 'bg-error-muted text-error'
};
const VERIF_TONE = {
  approved: 'bg-success-muted text-success',
  rejected: 'bg-error-muted text-error',
  submitted: 'bg-accent-muted text-accent'
};

export default function AdminUserDetailPage() {
  const { orgSlug, userId } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', phone: '' });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [pw, setPw] = useState('');
  const [pwBusy, setPwBusy] = useState(false);
  const [pwDone, setPwDone] = useState(false);
  const [pwErr, setPwErr] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const u = await superAdminApi.getUser(userId);
      setUser(u);
      setForm({
        first_name: u.first_name || '',
        last_name: u.last_name || '',
        email: u.email || '',
        phone: u.phone || ''
      });
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { load(); }, [load]);

  const saveProfile = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const u = await superAdminApi.updateUser(userId, form);
      setUser(u);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err?.response?.data?.error?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  const setPassword = async () => {
    setPwBusy(true);
    setPwErr(null);
    setPwDone(false);
    try {
      await superAdminApi.setUserPassword(userId, pw);
      setPwDone(true);
      setPw('');
      setTimeout(() => setPwDone(false), 4000);
    } catch (err) {
      setPwErr(err?.response?.data?.error?.message || err.message);
    } finally {
      setPwBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (error && !user) {
    return (
      <div className="max-w-2xl">
        <div className="flex items-center gap-2 p-3 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link
        to={`/o/${orgSlug}/admin`}
        className="inline-flex items-center gap-1.5 text-body-sm text-text-tertiary hover:text-text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Users
      </Link>

      <h1 className="text-headline text-text-primary">
        {[user.first_name, user.last_name].filter(Boolean).join(' ') || user.email}
      </h1>
      <p className="text-body-sm text-text-secondary mt-1">
        {user.email}
        {user.last_login_at
          ? ` · last login ${new Date(user.last_login_at).toLocaleString()}`
          : ' · never logged in'}
      </p>

      {error && (
        <div className="flex items-center gap-2 p-3 mt-4 rounded-button bg-error-muted text-error text-body-sm">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Edit profile */}
      <section className="bg-surface-primary border border-surface-tertiary rounded-card p-5 mt-6">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-4">
          Profile
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            ['first_name', 'First name'],
            ['last_name', 'Last name'],
            ['email', 'Email'],
            ['phone', 'Phone']
          ].map(([k, label]) => (
            <div key={k}>
              <label className="block text-small text-text-tertiary mb-1">{label}</label>
              <input
                value={form[k]}
                onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
                className="w-full px-3 py-2 rounded-button bg-surface-secondary border border-surface-tertiary text-body-sm text-text-primary focus:outline-none focus:border-accent"
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveProfile}
          disabled={saving}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" />
            : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
          {saved ? 'Saved' : 'Save changes'}
        </button>
      </section>

      {/* Set temp password */}
      <section className="bg-surface-primary border border-surface-tertiary rounded-card p-5 mt-4">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-2">
          Set temporary password
        </div>
        <p className="text-small text-text-tertiary mb-3">
          Sets the password immediately (no email). Read it back to the user
          and have them change it after they log in.
        </p>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="flex-1 px-3 py-2 rounded-button bg-surface-secondary border border-surface-tertiary text-body-sm text-text-primary focus:outline-none focus:border-accent"
          />
          <button
            onClick={setPassword}
            disabled={pwBusy || pw.length < 8}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-button bg-text-primary text-white text-body-sm font-medium hover:opacity-90 disabled:opacity-40"
          >
            {pwBusy ? <Loader2 className="w-4 h-4 animate-spin" />
              : pwDone ? <Check className="w-4 h-4" /> : <KeyRound className="w-4 h-4" />}
            {pwDone ? 'Password set' : 'Set password'}
          </button>
        </div>
        {pwErr && (
          <div className="flex items-center gap-2 mt-2 text-small text-error">
            <AlertCircle className="w-3.5 h-3.5" /> {pwErr}
          </div>
        )}
      </section>

      {/* Org memberships + Stripe + verification */}
      <section className="mt-4">
        <div className="text-[10px] uppercase tracking-wider text-text-tertiary mb-3 px-1">
          Organizations ({user.memberships.length})
        </div>
        <div className="space-y-3">
          {user.memberships.length === 0 && (
            <div className="bg-surface-primary border border-surface-tertiary rounded-card p-5 text-body-sm text-text-tertiary">
              Not a member of any organization.
            </div>
          )}
          {user.memberships.map((m) => {
            const s = m.organization.stripe;
            const v = m.organization.verification;
            return (
              <div
                key={m.membership_id}
                className="bg-surface-primary border border-surface-tertiary rounded-card p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-text-tertiary" />
                      <span className="text-body-sm font-medium text-text-primary truncate">
                        {m.organization.name}
                      </span>
                    </div>
                    <div className="text-small text-text-tertiary mt-0.5">
                      {m.role} · {m.status}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 justify-end">
                    {s?.status && (
                      <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${STRIPE_TONE[s.status] || 'bg-surface-secondary text-text-secondary'}`}>
                        {s.status}{s.plan ? ` · ${s.plan}` : ''}
                      </span>
                    )}
                    {v?.status && (
                      <span className={`text-[10px] uppercase tracking-wider rounded-full px-2 py-0.5 ${VERIF_TONE[v.status] || 'bg-surface-secondary text-text-secondary'}`}>
                        verif: {v.status}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-small">
                  <Field label="Stripe customer" value={s?.customer_id || '—'} mono />
                  <Field label="Plan" value={s?.plan || '—'} />
                  <Field
                    label="Trial ends"
                    value={s?.trial_ends_at ? new Date(s.trial_ends_at).toLocaleDateString() : '—'}
                  />
                  <Field label="Payments" value={s?.payment_onboarding_status || '—'} />
                  {v && (
                    <>
                      <Field label="MC #" value={v.mc_number || '—'} />
                      <Field label="DOT #" value={v.dot_number || '—'} />
                      <Field label="Identity" value={v.identity_status || '—'} />
                      <Field
                        label="Submitted"
                        value={v.submitted_at ? new Date(v.submitted_at).toLocaleDateString() : '—'}
                      />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function Field({ label, value, mono }) {
  return (
    <div className="min-w-0">
      <div className="text-text-tertiary">{label}</div>
      <div className={`text-text-primary truncate ${mono ? 'font-mono text-[11px]' : ''}`}>
        {value}
      </div>
    </div>
  );
}
