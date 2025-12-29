import { useState } from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Building2, Plus, Check, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { cn, getInitials } from '../../lib/utils';
import { Badge } from '../ui/Badge';
import { RoleLabels } from '@/enums';

export function OrgSwitcher({ className }) {
  const { organizations } = useAuth();
  const { currentOrg, switchOrg } = useOrg();
  const [open, setOpen] = useState(false);

  if (!currentOrg) return null;

  const currentRole = organizations.find(o => o.id === currentOrg.id)?.role;

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-button',
            'hover:bg-surface-secondary transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/50',
            className
          )}
        >
          {/* Org Avatar */}
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
            <span className="text-small font-semibold text-accent">
              {getInitials(currentOrg.name)}
            </span>
          </div>

          {/* Org Info */}
          <div className="flex-1 text-left hidden sm:block">
            <div className="text-body-sm font-medium text-text-primary truncate max-w-[140px]">
              {currentOrg.name}
            </div>
            <div className="text-small text-text-tertiary">
              {RoleLabels[currentRole] || currentRole}
            </div>
          </div>

          <ChevronDown className="w-4 h-4 text-text-tertiary" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={cn(
            'min-w-[240px] bg-white rounded-card shadow-elevated p-2',
            'animate-fade-in',
            'z-50'
          )}
          sideOffset={8}
          align="end"
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-small text-text-tertiary font-medium">
            Organizations
          </DropdownMenu.Label>

          {organizations.map((org) => (
            <DropdownMenu.Item
              key={org.id}
              className={cn(
                'flex items-center gap-3 px-2 py-2 rounded-chip cursor-pointer',
                'hover:bg-surface-secondary outline-none',
                'transition-colors'
              )}
              onSelect={() => switchOrg(org)}
            >
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                <span className="text-small font-semibold text-accent">
                  {getInitials(org.name)}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="text-body-sm font-medium text-text-primary truncate">
                  {org.name}
                </div>
                <div className="text-small text-text-tertiary">
                  {RoleLabels[org.role] || org.role}
                </div>
              </div>

              {org.id === currentOrg.id && (
                <Check className="w-4 h-4 text-accent flex-shrink-0" />
              )}
            </DropdownMenu.Item>
          ))}

          <DropdownMenu.Separator className="h-px bg-surface-tertiary my-2" />

          <DropdownMenu.Item
            className={cn(
              'flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer',
              'hover:bg-surface-secondary outline-none',
              'text-body-sm text-text-secondary'
            )}
            onSelect={() => window.location.href = '/create-org'}
          >
            <Plus className="w-4 h-4" />
            Create Organization
          </DropdownMenu.Item>

          <DropdownMenu.Item
            className={cn(
              'flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer',
              'hover:bg-surface-secondary outline-none',
              'text-body-sm text-text-secondary'
            )}
            onSelect={() => window.location.href = `/o/${currentOrg.slug}/settings`}
          >
            <Settings className="w-4 h-4" />
            Organization Settings
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default OrgSwitcher;
