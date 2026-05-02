import { motion } from 'framer-motion';
import { cn, getInitials } from '../../lib/utils';
import { RoleLabels } from '@/enums';

export function ProfileCard({ user, currentOrg, currentRole }) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;
  const initials = getInitials(fullName) || (user?.email?.[0] || '?').toUpperCase();
  const planBadge = currentOrg?.subscription_plan
    ? currentOrg.subscription_plan.charAt(0).toUpperCase() + currentOrg.subscription_plan.slice(1)
    : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl',
        'p-8 flex flex-col items-center text-center'
      )}
    >
      <div className="relative mb-5">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-1">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={fullName}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <div className="w-full h-full rounded-full bg-[#0a0e1a] flex items-center justify-center">
              <span className="text-3xl font-semibold text-white">{initials}</span>
            </div>
          )}
        </div>
      </div>

      <h2 className="text-2xl font-semibold text-white mb-1">{fullName}</h2>
      <p className="text-body-sm text-white/50 mb-4">{user?.email}</p>

      {planBadge && (
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span className="text-small font-medium text-white/70">
            morpro {planBadge}
          </span>
        </div>
      )}

      {currentOrg && (
        <div className="mt-6 pt-6 border-t border-white/[0.06] w-full">
          <div className="text-small uppercase tracking-wider text-white/40 mb-2">
            Current organization
          </div>
          <div className="text-body-sm font-medium text-white">{currentOrg.name}</div>
          {currentRole && (
            <div className="text-small text-white/50 mt-0.5">
              {RoleLabels?.[currentRole] || currentRole}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default ProfileCard;
