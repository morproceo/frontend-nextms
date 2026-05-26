/**
 * VerificationWizard — the reusable MorPro Verification stepper body.
 *
 * Same staircase (MC → OTP → Identity → Profile → Pending → Approved) the
 * original /direct/verify page renders, just packaged so it can live in
 * a modal on the org settings page too. One-source-of-truth: there's no
 * second copy of the steps — both entry points compose this component.
 *
 * Props:
 *   onApproved?: () => void    fires once the backend reports approved.
 *                              The caller decides what to do next (close
 *                              the modal, navigate, refresh org context).
 *   showHeader?: boolean       hide the inline "Welcome to MorPro Direct"
 *                              header when rendered inside a modal whose
 *                              shell already has its own title.
 */

import { useEffect, useState, useCallback } from 'react';
import { Loader2, AlertCircle, ShieldCheck, BadgeCheck } from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';
import verificationApi from '../../api/networkVerification.api';
import ProgressDots from '../direct/verify/ProgressDots';
import { statusToStep, isApproved } from '../direct/verify/Steps';
import McStep from '../../pages/direct/verify/steps/McStep';
import OtpStep from '../../pages/direct/verify/steps/OtpStep';
import IdentityStep from '../../pages/direct/verify/steps/IdentityStep';
import ProfileStep from '../../pages/direct/verify/steps/ProfileStep';
import PendingStep from '../../pages/direct/verify/steps/PendingStep';

export default function VerificationWizard({ onApproved, showHeader = true }) {
  const { currentOrg } = useOrg();
  const [verification, setVerification] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    try {
      const res = await verificationApi.getMyVerification();
      setVerification(res?.verification || null);
      setSettings(res?.settings || null);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // Once approved, let the caller handle navigation/cleanup.
  useEffect(() => {
    if (isApproved(verification) && typeof onApproved === 'function') {
      onApproved();
    }
  }, [verification?.status]); // eslint-disable-line

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-lg mx-auto px-6 py-16 text-center">
        <AlertCircle className="w-8 h-8 text-error mx-auto mb-3" />
        <h2 className="text-title text-text-primary">Something went wrong</h2>
        <p className="text-body-sm text-text-secondary mt-2">{error}</p>
      </div>
    );
  }

  const stepKey = statusToStep(verification?.status || 'not_started');

  // Approved view — caller may already have closed us, but if not, show a
  // brief confirmation so the user knows the wizard completed.
  if (stepKey === 'pending' && verification?.status === 'approved') {
    return (
      <div className="px-6 py-12 text-center">
        <BadgeCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
        <h2 className="text-title text-text-primary">You're verified</h2>
        <p className="text-body-sm text-text-secondary mt-2">
          Your DOT, MC, and address are now authoritative across Direct and Connect.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 pt-2 pb-2">
        <ProgressDots current={stepKey} />
      </div>
      <div className="flex-1 px-4 py-4 sm:py-6">
        <div className="max-w-xl mx-auto">
          {showHeader && <WizardHeader stepKey={stepKey} />}
          <StepRenderer
            stepKey={stepKey}
            verification={verification}
            settings={settings}
            refresh={refresh}
            currentOrg={currentOrg}
          />
        </div>
      </div>
    </div>
  );
}

function WizardHeader({ stepKey }) {
  // Per-step heading; copy is intentionally neutral (no "Welcome to MorPro
  // Direct") so this same wizard makes sense in org-settings context too.
  const map = {
    mc:       { title: 'Verify your carrier',
                sub: 'A one-time check via MorPro LINQ — DOT lookup, FMCSA email, and owner identity. Used by both Direct and Connect.' },
    otp:      { title: 'Check your email',
                sub: 'We sent a 6-digit code to the email you have on file with FMCSA.' },
    identity: { title: 'Verify your identity',
                sub: 'Quick photo of your driver\'s license + a selfie. Stripe runs this in the background.' },
    profile:  { title: 'Build your public profile',
                sub: 'A few quick details so shippers + drivers can find you.' },
    pending:  { title: '', sub: '' }
  };
  const { title, sub } = map[stepKey] || {};
  if (!title && !sub) return null;
  return (
    <div className="text-center mb-6">
      <ShieldCheck className="w-10 h-10 text-text-secondary mx-auto mb-3" />
      <h1 className="text-title-lg sm:text-headline text-text-primary">{title}</h1>
      {sub && <p className="text-body text-text-secondary mt-2 max-w-md mx-auto">{sub}</p>}
    </div>
  );
}

function StepRenderer({ stepKey, ...props }) {
  switch (stepKey) {
    case 'mc':       return <McStep {...props} />;
    case 'otp':      return <OtpStep {...props} />;
    case 'identity': return <IdentityStep {...props} />;
    case 'profile':  return <ProfileStep {...props} />;
    case 'pending':  return <PendingStep {...props} />;
    default:         return <McStep {...props} />;
  }
}
