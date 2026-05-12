import { motion } from 'framer-motion';
import { cn, getInitials } from '../../lib/utils';
import { RoleLabels } from '@/enums';

// Local-dev placeholder avatar. The Facebook CDN URL has signed query
// params that expire periodically — when it 403s we fall back to initials
// via onError. Replace with a stable URL or wire up real avatar upload.
const DEV_DEFAULT_AVATAR =
  'https://scontent-lax3-2.xx.fbcdn.net/v/t39.30808-6/481133970_10232004350204199_5593546398013922937_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=53a332&_nc_ohc=DnNasq_3YCwQ7kNvwHu3gvH&_nc_oc=Adp2Yy8viuhN-l3DQ8tOJENdaL33a4c0_k1mgbqXEyP6yCH8qqdjTvoQEgLJJRfLuDg&_nc_zt=23&_nc_ht=scontent-lax3-2.xx&_nc_gid=T2oyBr7I1ZHsIpoevtOU3g&_nc_ss=7b2a8&oh=00_Af5sX86jEuKOl42ZNqHR7MkA_eW1m0PVPjNSZh7mrGPaUQ&oe=6A02C343';

export function ProfileCard({ user, currentOrg, currentRole }) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;
  const initials = getInitials(fullName) || (user?.email?.[0] || '?').toUpperCase();
  const planBadge = currentOrg?.subscription_plan
    ? currentOrg.subscription_plan.charAt(0).toUpperCase() + currentOrg.subscription_plan.slice(1)
    : null;

  // Avatar element shared between layouts.
  const Avatar = ({ size }) => (
    <div className={cn(
      'rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 p-1 flex-shrink-0',
      size === 'sm' ? 'w-14 h-14' : 'w-32 h-32'
    )}>
      <img
        src={user?.avatar_url || DEV_DEFAULT_AVATAR}
        alt={fullName}
        className="w-full h-full rounded-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          const next = e.currentTarget.nextElementSibling;
          if (next) next.style.display = 'flex';
        }}
      />
      <div
        style={{ display: 'none' }}
        className="w-full h-full rounded-full bg-[#0a0e1a] items-center justify-center"
      >
        <span className={cn('font-semibold text-white', size === 'sm' ? 'text-base' : 'text-3xl')}>
          {initials}
        </span>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn(
        'bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl',
        // Compact horizontal on mobile, centered vertical on lg+
        'p-4 lg:p-8'
      )}
    >
      {/* Mobile: horizontal compact row */}
      <div className="flex items-center gap-3 lg:hidden">
        <Avatar size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-body font-semibold text-white truncate">{fullName}</p>
          {currentOrg && (
            <p className="text-small text-white/50 truncate">
              {currentOrg.name}
              {currentRole && (
                <span className="text-white/35"> · {RoleLabels?.[currentRole] || currentRole}</span>
              )}
            </p>
          )}
        </div>
        {planBadge && (
          <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.06] border border-white/[0.08]">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
            <span className="text-[10px] font-medium text-white/70 uppercase tracking-wider">{planBadge}</span>
          </span>
        )}
      </div>

      {/* Desktop: centered vertical card */}
      <div className="hidden lg:flex flex-col items-center text-center">
        <div className="relative mb-5">
          <Avatar size="lg" />
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
      </div>
    </motion.div>
  );
}

export default ProfileCard;
