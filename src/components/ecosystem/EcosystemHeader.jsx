import { Link, useParams } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { OrgSwitcher } from '../layout/OrgSwitcher';
import { AppGridMenu } from './AppGridMenu';
import { cn, getInitials } from '../../lib/utils';
import { RoleLabels } from '@/enums';

/**
 * EcosystemHeader
 *
 * Universal top bar across the whole morpro ecosystem. Sits at the top
 * of every shell — Launcher, NextMS dispatcher (AppShell), Spotty, future
 * apps. Mirrors the iCloud pattern: brand on the left (with the active
 * app name appended), nav-agnostic actions on the right (org switcher,
 * 9-dot grid app switcher, avatar dropdown).
 *
 * Pass `appName` from inside an app shell to render "morpro · AppName".
 * Omit it on the launcher home where the user IS at the morpro root.
 */
export function EcosystemHeader({ appName, appId }) {
  const { user, logout, organizations } = useAuth();
  const { currentOrg } = useOrg();
  const { orgSlug } = useParams();
  const slug = orgSlug || currentOrg?.slug || organizations?.[0]?.slug;

  const fullName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    '';
  const initials =
    getInitials(fullName) || (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-glass bg-[#05080f]/85 border-b border-white/[0.06] text-white">
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between gap-3">
        {/* Brand */}
        <div className="flex items-center min-w-0 gap-3">
          <Link
            to={slug ? `/o/${slug}/launcher` : '/'}
            className="flex items-center hover:opacity-80 transition-opacity flex-shrink-0"
            aria-label="morpro home"
          >
            <img
              src="/next_logo_white.png"
              alt="morpro"
              className="h-6 w-auto"
            />
          </Link>
          {appName && (
            <>
              <span className="text-white/25 text-body-sm">·</span>
              <span className="text-body-sm text-white/80 truncate">
                {appName}
              </span>
            </>
          )}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2">
          <OrgSwitcher />
          <AppGridMenu currentAppId={appId} />

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  'flex items-center gap-1 pl-1 pr-1 py-1 rounded-full',
                  'hover:bg-white/[0.08] transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
                aria-label="Account menu"
              >
                <div className="w-7 h-7 rounded-full bg-white/[0.08] border border-white/[0.08] flex items-center justify-center overflow-hidden">
                  {user?.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-small font-semibold text-white">
                      {initials}
                    </span>
                  )}
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-white/40" />
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="min-w-[240px] bg-white rounded-card shadow-elevated p-2 z-50 animate-fade-in"
              >
                <div className="px-2 py-2 border-b border-surface-tertiary mb-1">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {fullName}
                  </div>
                  <div className="text-small text-text-tertiary truncate">
                    {user?.email}
                  </div>
                  {currentOrg && (
                    <div className="text-small text-text-tertiary mt-1">
                      {currentOrg.name}
                      {currentOrg.role && (
                        <span className="ml-1 text-text-tertiary">
                          · {RoleLabels?.[currentOrg.role] || currentOrg.role}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {currentOrg && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-text-secondary"
                    onSelect={() =>
                      (window.location.href = `/o/${currentOrg.slug}/settings`)
                    }
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenu.Item>
                )}
                {currentOrg && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-text-secondary"
                    onSelect={() =>
                      (window.location.href = `/o/${currentOrg.slug}/settings`)
                    }
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </DropdownMenu.Item>
                )}

                <DropdownMenu.Separator className="h-px bg-surface-tertiary my-1" />

                <DropdownMenu.Item
                  className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-error"
                  onSelect={handleLogout}
                >
                  <LogOut className="w-4 h-4" />
                  Sign out
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
        </div>
      </div>
    </header>
  );
}

export default EcosystemHeader;
