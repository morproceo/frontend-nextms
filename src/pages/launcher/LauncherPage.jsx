import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { ProfileCard } from '../../components/launcher/ProfileCard';
import { AppGrid } from '../../components/launcher/AppGrid';
import { TrialActivationPanel } from '../../components/features/billing/TrialActivationPanel';
import { DirectBetaPanel } from '../../components/features/billing/DirectBetaPanel';
import { eligibleApps } from '../../config/apps';

export function LauncherPage() {
  const { user } = useAuth();
  const { currentOrg, currentRole } = useOrg();
  const [trialApp, setTrialApp] = useState(null);

  // Show every eligible tile (active + inactive). Inactive tiles render
  // greyed out with an Activate or Subscribe CTA via AppTile state.
  const apps = eligibleApps({ role: currentRole, org: currentOrg });

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
          MorPro Cloud · every module, one ecosystem
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
          <AppGrid
            apps={apps}
            orgSlug={currentOrg?.slug}
            onRequestTrialActivation={setTrialApp}
          />
        </motion.div>
      </div>

      {/* Load Network has its own invite-only beta gate; everything else
          uses the generic trial-activation panel. */}
      <DirectBetaPanel
        open={trialApp?.id === 'direct'}
        app={trialApp}
        onClose={() => setTrialApp(null)}
      />
      <TrialActivationPanel
        open={!!trialApp && trialApp.id !== 'direct'}
        app={trialApp}
        onClose={() => setTrialApp(null)}
      />
    </div>
  );
}

export default LauncherPage;
