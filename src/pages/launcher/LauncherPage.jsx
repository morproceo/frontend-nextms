import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { ProfileCard } from '../../components/launcher/ProfileCard';
import { AppGrid } from '../../components/launcher/AppGrid';
import { visibleApps } from '../../config/apps';

export function LauncherPage() {
  const { user } = useAuth();
  const { currentOrg, currentRole } = useOrg();

  const apps = visibleApps({ role: currentRole, org: currentOrg });

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-headline text-white">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-body-sm text-white/50 mt-1">
          Your morpro ecosystem
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <ProfileCard user={user} currentOrg={currentOrg} currentRole={currentRole} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <AppGrid apps={apps} orgSlug={currentOrg?.slug} />

          <ActivityPlaceholder />
        </motion.div>
      </div>
    </div>
  );
}

function ActivityPlaceholder() {
  return (
    <div className="bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-title-sm text-white">Recent activity</h3>
          <p className="text-body-sm text-white/40 mt-0.5">
            Cross-app updates will appear here
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 text-body-sm text-white/30">
        Nothing yet — open an app to get started
      </div>
    </div>
  );
}

export default LauncherPage;
