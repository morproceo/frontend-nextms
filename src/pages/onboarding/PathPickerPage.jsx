import { useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Building2, KeyRound, ArrowLeft } from 'lucide-react';

/**
 * Onboarding step 2 — for carrier/shipper, choose join vs create.
 *
 * If no `role` query param → bounce back to step 1.
 */
export function PathPickerPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const role = params.get('role');

  useEffect(() => {
    if (role !== 'carrier' && role !== 'shipper') {
      navigate('/onboarding/role', { replace: true });
    }
  }, [role, navigate]);

  if (role !== 'carrier' && role !== 'shipper') return null;

  const verbCopy = role === 'carrier'
    ? 'Whoever runs your trucks is probably set up already.'
    : 'Whoever ships your freight is probably set up already.';

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-10">
          <h1 className="text-headline text-text-primary mb-3">
            Are you joining an existing team, or starting fresh?
          </h1>
          <p className="text-body text-text-secondary">
            {verbCopy}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <PathCard
            icon={KeyRound}
            iconBg="bg-accent/10"
            iconColor="text-accent"
            title="Join with a code"
            description="Your org's admin shared a join code with you. Paste it on the next screen."
            onClick={() => navigate(`/onboarding/join?role=${role}`)}
          />
          <PathCard
            icon={Building2}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            title="Create new organization"
            description={
              role === 'carrier'
                ? "Set up your trucking company. We'll verify your MC + DOT."
                : "Set up your shipping company so you can post loads."
            }
            onClick={() => navigate(`/create-org?role=${role}`)}
          />
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            to="/onboarding/role"
            className="inline-flex items-center gap-1.5 text-body-sm text-text-secondary hover:text-text-primary"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </div>
    </div>
  );
}

function PathCard({ icon: Icon, iconBg, iconColor, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="group text-left rounded-card border border-border-subtle bg-surface-primary p-6 hover:border-accent hover:shadow-elevated transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
    >
      <div className={`w-14 h-14 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
        <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={1.75} />
      </div>
      <h3 className="text-title-sm text-text-primary mb-2">{title}</h3>
      <p className="text-body-sm text-text-secondary leading-relaxed">{description}</p>
      <p className="mt-4 text-body-sm text-accent font-medium group-hover:translate-x-0.5 transition-transform">
        Continue →
      </p>
    </button>
  );
}

export default PathPickerPage;
