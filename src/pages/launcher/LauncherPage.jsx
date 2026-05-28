import { useState, useEffect, createContext, useContext } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { TrialActivationPanel } from '../../components/features/billing/TrialActivationPanel';
import { DirectBetaPanel } from '../../components/features/billing/DirectBetaPanel';
import { eligibleApps } from '../../config/apps';
import { WidgetGrid } from '../../components/widgets/WidgetGrid';
import { AddWidgetSheet } from '../../components/widgets/AddWidgetSheet';
import { loadLayout, saveLayout, defaultLayout } from '../../widgets/layoutStore';
// Importing this module registers every widget shipped today.
import '../../widgets';

// Context lets widgets that need to request trial activation (the
// Apps tile) reach back up to the launcher's modal handler without
// drilling props through the registry.
const LauncherWidgetContext = createContext({ onRequestTrialActivation: null });
export function useLauncherWidget() {
  return useContext(LauncherWidgetContext);
}

export function LauncherPage() {
  const { user } = useAuth();
  const { currentOrg, currentRole } = useOrg();
  const [trialApp, setTrialApp] = useState(null);
  const [layout, setLayout] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);

  const apps = eligibleApps({ role: currentRole, org: currentOrg });
  const activeAppIds = apps.filter((a) => a.isActive).map((a) => a.id);

  // Load (or seed) the user's dashboard layout. Keyed by user + org
  // so each org gets its own arrangement.
  useEffect(() => {
    const existing = loadLayout(user?.id, currentOrg?.id);
    setLayout(existing || defaultLayout());
  }, [user?.id, currentOrg?.id]);

  const handleLayoutChange = (next) => {
    setLayout(next);
    saveLayout(user?.id, currentOrg?.id, next);
  };

  const handleAddWidget = (spec) => {
    const nextY = (layout?.widgets || []).reduce(
      (max, w) => Math.max(max, (w.y || 0) + (w.h || 0)),
      0
    );
    handleLayoutChange({
      widgets: [
        ...(layout?.widgets || []),
        {
          id: `w-${spec.id}-${Date.now()}`,
          widgetId: spec.id,
          x: 0,
          y: nextY,
          w: spec.defaultSize?.w || 6,
          h: spec.defaultSize?.h || 6
        }
      ]
    });
    setGalleryOpen(false);
  };

  const placedWidgetIds = (layout?.widgets || []).map((w) => w.widgetId);

  return (
    <LauncherWidgetContext.Provider value={{ onRequestTrialActivation: setTrialApp }}>
      <div className="max-w-[1080px] mx-auto">
        {/* Soft welcome — kept very lean so the tiles do the heavy
            lifting, like iCloud. */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-4 sm:mb-6"
        >
          <h1 className="text-headline text-white">
            Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
          </h1>
          <p className="text-body-sm text-white/45 mt-1">
            MorPro Cloud · every module, one ecosystem
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <WidgetGrid
            layout={layout}
            onChange={handleLayoutChange}
            onAdd={() => setGalleryOpen(true)}
          />
        </motion.div>

        <AddWidgetSheet
          open={galleryOpen}
          onClose={() => setGalleryOpen(false)}
          onAdd={handleAddWidget}
          placedWidgetIds={placedWidgetIds}
          role={currentRole}
          activeApps={activeAppIds}
        />

        {/* Load Network has its own invite-only beta gate; everything
            else uses the generic trial-activation panel. */}
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
    </LauncherWidgetContext.Provider>
  );
}

export default LauncherPage;
