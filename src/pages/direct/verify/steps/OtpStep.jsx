import { useEffect, useRef, useState } from 'react';
import { Loader2, Mail, AlertCircle, RefreshCw, ArrowRight } from 'lucide-react';
import verificationApi from '../../../../api/networkVerification.api';

/**
 * Screen 2 — Email OTP. Two phases:
 *
 *   a) "send" — we haven't sent the code yet (no otp_sent_at). Show the
 *      redacted email on file and ask the user to confirm before we send.
 *      This catches the "I don't own that inbox anymore" case before they
 *      get stuck.
 *   b) "enter" — code sent. Show big single-input + resend timer + attempts
 *      remaining.
 *
 * Errors are mapped to plain-English microcopy, not HTTP codes.
 */
export default function OtpStep({ verification, settings, refresh }) {
  const sent = !!verification?.otp_sent_at;
  const [phase, setPhase] = useState(sent ? 'enter' : 'send');

  if (phase === 'send') {
    return <SendOtp verification={verification} onSent={() => { setPhase('enter'); }} refresh={refresh} />;
  }
  return <EnterOtp verification={verification} settings={settings} refresh={refresh} onResend={async () => {
    await refresh();
  }} />;
}

function SendOtp({ verification, onSent, refresh }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const email = verification?.linq_email || '';
  const redacted = redactEmail(email);

  const send = async () => {
    setBusy(true); setError(null);
    try {
      await verificationApi.sendOtp();
      await refresh();
      onSent();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-6">
      <div className="bg-surface-primary border border-border-subtle rounded-card p-5 text-center">
        <Mail className="w-7 h-7 text-text-tertiary mx-auto mb-2" />
        <p className="text-body-sm text-text-secondary">FMCSA has this email on file:</p>
        <p className="text-title-sm text-text-primary font-mono mt-2 mb-1">{redacted}</p>
        <p className="text-small text-text-tertiary">If that's not your inbox anymore, update FMCSA first.</p>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <button
        onClick={send}
        disabled={busy}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Send code <ArrowRight className="w-5 h-5" /></>}
      </button>

      <p className="text-small text-text-tertiary text-center">
        That email isn't right? <a href="https://fmcsa.dot.gov" target="_blank" rel="noreferrer" className="underline">Update with FMCSA</a>, then come back.
      </p>
    </div>
  );
}

function EnterOtp({ verification, settings, refresh }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [resendAt, setResendAt] = useState(0);
  const inputRef = useRef(null);

  // Start the resend cooldown timer based on otp_sent_at.
  useEffect(() => {
    const sentAt = verification?.otp_sent_at ? new Date(verification.otp_sent_at).getTime() : 0;
    const cooldownSec = 60;
    const elapsed = (Date.now() - sentAt) / 1000;
    if (elapsed < cooldownSec) {
      setResendAt(sentAt + cooldownSec * 1000);
    }
  }, [verification?.otp_sent_at]);

  const [countdown, setCountdown] = useState(0);
  useEffect(() => {
    if (!resendAt) return;
    const tick = () => {
      const left = Math.max(0, Math.ceil((resendAt - Date.now()) / 1000));
      setCountdown(left);
      if (left === 0) clearInterval(t);
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [resendAt]);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    if (code.length !== 6) {
      setError('The code is 6 digits.');
      return;
    }
    setBusy(true);
    try {
      await verificationApi.verifyOtp(code);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setCode('');
      inputRef.current?.focus();
    } finally { setBusy(false); }
  };

  const resend = async () => {
    setBusy(true); setError(null);
    try {
      await verificationApi.sendOtp({ force: false });
      await refresh();
      setResendAt(Date.now() + 60_000);
      setCode('');
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally { setBusy(false); }
  };

  const attempts = verification?.otp_attempts || 0;
  const maxAttempts = settings?.otpMaxAttempts || 3;
  const remaining = Math.max(0, maxAttempts - attempts);

  return (
    <form onSubmit={submit} className="space-y-6">
      <div>
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="••••••"
          className="w-full px-4 py-5 rounded-button border-2 border-border bg-surface-primary text-center font-mono tracking-[0.6em] text-3xl text-text-primary focus:border-text-primary focus:outline-none"
          maxLength={6}
        />
        <p className="text-small text-text-tertiary mt-2 text-center">
          Sent to {redactEmail(verification?.linq_email)}.
          {remaining > 0 && remaining < maxAttempts && ` ${remaining} ${remaining === 1 ? 'try' : 'tries'} left.`}
        </p>
      </div>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={busy || code.length !== 6}
        className="inline-flex items-center justify-center gap-2 w-full px-6 py-3 rounded-button bg-text-primary text-surface-primary text-body font-semibold hover:opacity-90 disabled:opacity-50"
      >
        {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify'}
      </button>

      <button
        type="button"
        onClick={resend}
        disabled={busy || countdown > 0}
        className="text-body-sm text-text-secondary hover:text-text-primary inline-flex items-center justify-center gap-1.5 mx-auto w-full disabled:opacity-50"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        {countdown > 0 ? `Resend in ${countdown}s` : 'Resend code'}
      </button>
    </form>
  );
}

function redactEmail(email) {
  if (!email) return '';
  const at = email.indexOf('@');
  if (at < 1) return email;
  const local = email.slice(0, at);
  const domain = email.slice(at + 1);
  if (local.length <= 2) return `${local[0]}***@${domain}`;
  return `${local[0]}${'*'.repeat(Math.min(local.length - 2, 6))}${local.slice(-1)}@${domain}`;
}
