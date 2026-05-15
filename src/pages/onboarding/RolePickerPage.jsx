import { useNavigate } from 'react-router-dom';
import { Truck, Package, User, UserCog } from 'lucide-react';

/**
 * Onboarding step 1 — pick how you're going to use morpro.
 *
 * Carrier         → /onboarding/path?role=carrier         (carrier org)
 * Owner-operator  → /onboarding/path?role=owner_operator  (carrier org,
 *                   tagged owner_operator for ecosystem-wide branching)
 * Shipper         → /onboarding/path?role=shipper         (shipper org)
 * Driver          → /onboarding/driver                    (standalone)
 *
 * Owner-operator is functionally a carrier — same flow, same features —
 * but carries a distinct role name so logic can diverge later.
 */
export function RolePickerPage() {
  const navigate = useNavigate();

  const pick = (role) => {
    if (role === 'driver') {
      navigate('/onboarding/driver');
    } else {
      navigate(`/onboarding/path?role=${role}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-secondary p-4">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-10">
          <h1 className="text-headline text-text-primary mb-3">
            How are you going to use morpro?
          </h1>
          <p className="text-body text-text-secondary">
            Pick the one that fits best — you can always change later.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RoleCard
            icon={Truck}
            iconBg="bg-blue-500/10"
            iconColor="text-blue-600 dark:text-blue-400"
            title="I'm a carrier"
            description="I run a fleet and haul freight. I need dispatch, drivers, and loads."
            onClick={() => pick('carrier')}
          />
          <RoleCard
            icon={UserCog}
            iconBg="bg-cyan-500/10"
            iconColor="text-cyan-600 dark:text-cyan-400"
            title="I'm an owner-operator"
            description="I own and drive my own truck. Same tools as a carrier, built for one."
            onClick={() => pick('owner_operator')}
          />
          <RoleCard
            icon={Package}
            iconBg="bg-violet-500/10"
            iconColor="text-violet-600 dark:text-violet-400"
            title="I'm a shipper"
            description="I have freight to move and want to find verified carriers directly."
            onClick={() => pick('shipper')}
          />
          <RoleCard
            icon={User}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600 dark:text-emerald-400"
            title="I'm a driver"
            description="I drive trucks. I want to see my loads, hours, and pay."
            onClick={() => pick('driver')}
          />
        </div>

        <p className="text-center text-small text-text-tertiary mt-8">
          Already part of an organization? You can join with a code on the next step.
        </p>
      </div>
    </div>
  );
}

function RoleCard({ icon: Icon, iconBg, iconColor, title, description, onClick }) {
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

export default RolePickerPage;
