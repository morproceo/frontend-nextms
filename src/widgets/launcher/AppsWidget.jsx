import { Plus, Layers } from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';
import { eligibleApps } from '../../config/apps';
import { AppTile } from '../../components/launcher/AppTile';
import { useLauncherWidget } from '../../pages/launcher/LauncherPage';

/**
 * AppsWidget — the app launcher icon grid, as a tile.
 *
 * Stripped of the outer card (WidgetHost provides it); just an
 * internal "Apps" heading + the same icon grid pattern the old
 * AppGrid used. Trial activation bubbles up via the launcher
 * widget context so the modal still lives at the page level.
 */
export function AppsWidget() {
  const { currentOrg, currentRole } = useOrg();
  const { onRequestTrialActivation } = useLauncherWidget();
  const apps = eligibleApps({ role: currentRole, org: currentOrg });

  return (
    <div className="h-full w-full p-5 sm:p-6 flex flex-col">
      <header className="flex items-center gap-2 mb-4 sm:mb-5">
        <Layers className="w-3.5 h-3.5 text-white/60" />
        <span className="text-body-sm font-semibold text-white">Apps</span>
      </header>

      {/* 4-col grid: 6 apps + AddMore = 7 tiles → 4+3 over two rows.
          Wider cols (~155px at 684px tile width) let 2-word labels
          like "Load Network" sit on one line instead of wrapping. */}
      <div className="flex-1 grid grid-cols-3 sm:grid-cols-4 gap-x-4 gap-y-5 content-center">
        {apps.map((app) => (
          <AppTile
            key={app.id}
            app={app}
            orgSlug={currentOrg?.slug}
            onRequestTrialActivation={onRequestTrialActivation}
          />
        ))}
        <AddMoreTile />
      </div>
    </div>
  );
}

function AddMoreTile() {
  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 p-2 opacity-50">
      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-[20px] sm:rounded-[22px] border-2 border-dashed border-white/15 flex items-center justify-center">
        <Plus className="w-6 h-6 sm:w-7 sm:h-7 text-white/30" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <div className="text-[11px] sm:text-body-sm font-medium text-white/40">More soon</div>
      </div>
    </div>
  );
}

export default AppsWidget;
