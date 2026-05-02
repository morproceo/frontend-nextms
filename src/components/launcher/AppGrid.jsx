import { Plus } from 'lucide-react';
import { AppTile } from './AppTile';

export function AppGrid({ apps, orgSlug }) {
  return (
    <div className="bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl p-8">
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-x-6 gap-y-8">
        {apps.map((app) => (
          <AppTile key={app.id} app={app} orgSlug={orgSlug} />
        ))}
        <ComingSoonTile />
      </div>
    </div>
  );
}

function ComingSoonTile() {
  return (
    <div className="flex flex-col items-center gap-3 p-2 opacity-50">
      <div className="w-20 h-20 rounded-[22px] border-2 border-dashed border-white/15 flex items-center justify-center">
        <Plus className="w-7 h-7 text-white/30" strokeWidth={1.5} />
      </div>
      <div className="text-center">
        <div className="text-body-sm font-medium text-white/40">More apps</div>
        <div className="text-small text-white/30 mt-0.5">Coming soon</div>
      </div>
    </div>
  );
}

export default AppGrid;
