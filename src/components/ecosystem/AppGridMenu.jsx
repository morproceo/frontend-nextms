import { useNavigate, useParams } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LayoutGrid, ArrowRight, Plus } from 'lucide-react';
import { APPS, visibleApps } from '../../config/apps';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { cn } from '../../lib/utils';

/**
 * AppGridMenu
 *
 * The 9-dot grid in the universal header. Same data source as the launcher
 * tile grid (`config/apps.js`) so adding a new app appears in both places
 * automatically. Click → navigate. Tiles invisible to the current user
 * (per app `visible({role, org})`) are dimmed instead of hidden so the
 * grid layout stays stable.
 */
export function AppGridMenu({ currentAppId }) {
  const navigate = useNavigate();
  const { orgSlug } = useParams();
  const { organizations } = useAuth();
  const { currentOrg, currentRole } = useOrg();

  const slug = orgSlug || currentOrg?.slug || organizations?.[0]?.slug;
  const visible = visibleApps({ role: currentRole, org: currentOrg }).map((a) => a.id);

  const go = (app) => {
    if (!slug) return;
    const target = app.href({ orgSlug: slug });
    if (target.startsWith('http')) window.location.href = target;
    else navigate(target);
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'w-9 h-9 rounded-button flex items-center justify-center',
            'text-white/70 hover:text-white hover:bg-white/[0.08] transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
          )}
          aria-label="Switch app"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          className={cn(
            'w-[320px] bg-[#0e1422] border border-white/[0.08] rounded-2xl',
            'shadow-elevated z-50 animate-fade-in text-white flex flex-col',
            'max-h-[80vh]'
          )}
        >
          <div className="overflow-y-auto p-3 flex-1">
            <div className="text-small uppercase tracking-wider text-white/40 px-2 pb-2">
              Apps
            </div>

            <div className="grid grid-cols-3 gap-1">
              {APPS.map((app) => {
                const Icon = app.icon;
                const isCurrent = app.id === currentAppId;
                const canSee = visible.includes(app.id);
                return (
                  <button
                    key={app.id}
                    onClick={() => canSee && go(app)}
                    disabled={!canSee}
                    className={cn(
                      'group flex flex-col items-center gap-1.5 p-3 rounded-button',
                      'transition-colors text-center',
                      canSee
                        ? 'hover:bg-white/[0.06] cursor-pointer'
                        : 'opacity-40 cursor-not-allowed',
                      isCurrent && 'bg-white/[0.06]'
                    )}
                  >
                    <div
                      className={cn(
                        'w-12 h-12 rounded-[14px] shadow overflow-hidden',
                        !app.iconUrl && 'bg-gradient-to-br flex items-center justify-center',
                        !app.iconUrl && (app.accent || 'from-slate-600 to-slate-800')
                      )}
                    >
                      {app.iconUrl ? (
                        <img src={app.iconUrl} alt={app.name}
                          className="w-full h-full object-cover" draggable={false} />
                      ) : (
                        <Icon className="w-6 h-6 text-white" strokeWidth={1.75} />
                      )}
                    </div>
                    <div className="text-[11px] font-medium leading-tight">
                      {app.name}
                    </div>
                  </button>
                );
              })}
            </div>

          </div>

          <div className="px-3 pb-3 pt-2 border-t border-white/[0.08]">
            <DropdownMenu.Item
              onSelect={() => slug && navigate(`/o/${slug}/launcher`)}
              className={cn(
                'flex items-center justify-between px-2 py-2 rounded-chip cursor-pointer',
                'text-body-sm text-white/70 hover:bg-white/[0.06] hover:text-white outline-none'
              )}
            >
              morpro home
              <ArrowRight className="w-4 h-4" />
            </DropdownMenu.Item>
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default AppGridMenu;
