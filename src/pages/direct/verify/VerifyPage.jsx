import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, CheckCircle2, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../../contexts/AuthContext';
import { useOrg } from '../../../contexts/OrgContext';
import verificationApi from '../../../api/networkVerification.api';
import ProgressDots from '../../../components/direct/verify/ProgressDots';
import { statusToStep, isApproved } from '../../../components/direct/verify/Steps';
import McStep from './steps/McStep';
import OtpStep from './steps/OtpStep';
import IdentityStep from './steps/IdentityStep';
import ProfileStep from './steps/ProfileStep';
import PendingStep from './steps/PendingStep';

/**
 * Wizard container — drives the staircase by mirroring the backend status
 * onto a visible step. Each step component calls a tiny API method and
 * then `refresh()` to re-pull state; the wizard re-renders the next step
 * automatically.
 *
 * Optimized for owner-ops:
 *  - One decision per screen.
 *  - Big buttons, plain language, no jargon.
 *  - Status is durable — close the tab, come back, pick up where you left.
 */
export default function VerifyPage() {
  const { orgSlug } = useParams();
  const navigate = useNavigate();
  const { refreshOrganizations } = useAuth();
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

  // Whenever verification status changes, also refresh the auth org list so
  // direct_verification on currentOrg stays current. On approval the gate
  // unlocks and the user sails into the dashboard.
  useEffect(() => {
    if (isApproved(verification)) {
      // Reload org context so DirectShell stops gating us.
      refreshOrganizations?.().then(() => {
        navigate(`/o/${orgSlug}/direct`, { replace: true });
      });
    }
  }, [verification?.status]);

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

  return (
    <div className="min-h-[calc(100vh-56px)] flex flex-col">
      <div className="px-4 pt-6 pb-2">
        <ProgressDots current={stepKey} />
      </div>

      <div className="flex-1 px-4 py-6 sm:py-10">
        <div className="max-w-xl mx-auto">
          <Header verification={verification} settings={settings} stepKey={stepKey} />
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

function Header({ stepKey }) {
  // Per-step heading. Title big, subtitle plain.
  const map = {
    mc:       { title: 'Welcome to MorPro Direct',
                sub: 'Five minutes. We\'ll verify your MC, your FMCSA email, and your ID. Then you can start hauling.' },
    otp:      { title: 'Check your email',
                sub: 'We send a 6-digit code to the email you have on file with FMCSA. Whoever owns that inbox is who we trust.' },
    identity: { title: 'Verify your identity',
                sub: 'Quick photo of your driver\'s license + a selfie. Stripe runs this in the background.' },
    profile:  { title: 'Build your public profile',
                sub: 'A few quick details so shippers can find you.' },
    pending:  { title: '',
                sub: '' }
  };
  const { title, sub } = map[stepKey] || {};
  if (!title && !sub) return null;
  return (
    <div className="text-center mb-8">
      <ShieldCheck className="w-10 h-10 text-text-secondary mx-auto mb-4" />
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
