import { Link } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { LogOut, User, Settings, Truck } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { OrgSwitcher } from '../layout/OrgSwitcher';
import { cn, getInitials } from '../../lib/utils';

export function EcosystemTopbar() {
  const { user, logout } = useAuth();
  const { currentOrg } = useOrg();

  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.email;
  const initials = getInitials(fullName) || (user?.email?.[0] || '?').toUpperCase();

  const handleLogout = async () => {
    await logout();
    window.location.href = '/login';
  };

  return (
    <header className="sticky top-0 z-30 backdrop-blur-glass bg-black/30 border-b border-white/[0.06]">
      <div className="max-w-[1400px] mx-auto px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-white">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Truck className="w-4 h-4 text-white" strokeWidth={2} />
          </div>
          <span className="text-body-sm font-semibold tracking-tight">morpro</span>
        </Link>

        <div className="flex items-center gap-2">
          <OrgSwitcher />

          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                className={cn(
                  'w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.08]',
                  'flex items-center justify-center',
                  'hover:bg-white/[0.1] transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
                )}
              >
                {user?.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={fullName}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="text-small font-semibold text-white">{initials}</span>
                )}
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                align="end"
                sideOffset={8}
                className="min-w-[220px] bg-white rounded-card shadow-elevated p-2 z-50 animate-fade-in"
              >
                <div className="px-2 py-2 border-b border-surface-tertiary mb-1">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {fullName}
                  </div>
                  <div className="text-small text-text-tertiary truncate">{user?.email}</div>
                </div>

                {currentOrg && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-text-secondary"
                    onSelect={() => (window.location.href = `/o/${currentOrg.slug}/settings`)}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenu.Item>
                )}

                {currentOrg && (
                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-text-secondary"
                    onSelect={() => (window.location.href = `/o/${currentOrg.slug}/settings`)}
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

export default EcosystemTopbar;
