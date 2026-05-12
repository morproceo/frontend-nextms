import { useState } from 'react';
import { ArrowRight, Loader2 } from 'lucide-react';
import verificationApi from '../../../../api/networkVerification.api';

/**
 * Screen 1 — MC + DOT entry. Doubles as the welcome screen with the
 * 5-step roadmap shown above the form.
 *
 * On submit:
 *   - Backend hits LINQ for SAFER + Chameleon.
 *   - Stores legalName + FMCSA email + risk snapshot.
 *   - Advances status → otp_pending.
 * On error (most common: no email on FMCSA file), we surface plain-English
 * guidance instead of an HTTP code.
 */
export default function McStep({ refresh }) {
  const [mc, setMc] = useState('');
  const [dot, setDot] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (!mc.trim() || !dot.trim()) {
      setError('We need both your MC number and your DOT number.');
      return;
    }
    setBusy(true);
    try {
      await verificationApi.submitMc({ mc_number: mc.trim(), dot_number: dot.trim() });
      // status flipped to otp_pending — wizard re-renders into OtpStep.
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="bg-surface-primary border border-border-subtle rounded-card p-5">
        <p className="text-[10px] uppercase tracking-wider text-text-tertiary font-semibold mb-3">
          Here's what's coming
        </p>
        <ol className="space-y-2.5">
          <Item num={1}>Your MC number</Item>
          <Item num={2}>6-digit code to your FMCSA email</Item>
          <Item num={3}>Quick photo of your ID + a selfie</Item>
          <Item num={4}>Your public profile</Item>
          <Item num={5}>Submit</Item>
        </ol>
      </div>

      <div className="space-y-4">
        <Field label="MC number" hint="Found on your FMCSA authority. Numbers only.">
          <input
            type="text"
            inputMode="numeric"
            value={mc}
            onChange={(e) => setMc(e.target.value.replace(/\D/g, ''))}
            placeholder="123456"
            className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body text-text-primary"
            autoFocus
          />
        </Field>
        <Field label="DOT number" hint="Also on your FMCSA authority.">
          <input
            type="text"
            inputMode="numeric"
            value={dot}
            onChange={(e) => setDot(e.target.value.replace(/\D/g, ''))}
            placeholder="3456789"
            className="w-full px-4 py-3 rounded-button border border-border bg-surface-primary text-body text-text-primary"
          />
        </Field>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Continue <ArrowRight className="w-5 h-5" /></>}
      </button>

      <p className="text-small text-text-tertiary text-center">
        We pull your business name + FMCSA email from public records. We don't change anything on your FMCSA record.
      </p>
    </form>
  );
}

function Item({ num, children }) {
  return (
    <li className="flex items-start gap-3">
      <span className="w-5 h-5 rounded-full bg-surface-secondary text-text-secondary flex items-center justify-center text-[10px] font-semibold flex-shrink-0">
        {num}
      </span>
      <span className="text-body-sm text-text-primary pt-0.5">{children}</span>
    </li>
  );
}

function Field({ label, hint, children }) {
  return (
    <label className="block">
      <span className="block text-body-sm font-medium text-text-primary mb-1">{label}</span>
      {children}
      {hint && <span className="block text-small text-text-tertiary mt-1.5">{hint}</span>}
    </label>
  );
}
