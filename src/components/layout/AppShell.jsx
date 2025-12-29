import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as Tooltip from '@radix-ui/react-tooltip';
import {
  LayoutDashboard,
  Truck,
  Package,
  Users,
  FileText,
  DollarSign,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Container,
  ChevronDown,
  Building2,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Receipt
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { OrgSwitcher } from './OrgSwitcher';
import { TrialBanner } from '../features/billing/TrialBanner';
import { SubscriptionBlocker } from '../features/billing/SubscriptionBlocker';
import { cn, getInitials } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Loads', href: '/loads', icon: Package },
  { name: 'Dispatch', href: '/dispatch', icon: Truck },
  { name: 'Drivers', href: '/drivers', icon: Users },
  { name: 'Customers', href: '/customers', icon: Building2 },
  {
    name: 'Assets',
    icon: Container,
    children: [
      { name: 'Trucks', href: '/assets/trucks', icon: Truck },
      { name: 'Trailers', href: '/assets/trailers', icon: Container }
    ]
  },
  { name: 'Documents', href: '/documents', icon: FileText },
  { name: 'Expenses', href: '/expenses', icon: Receipt },
  { name: 'Invoices', href: '/invoices', icon: DollarSign },
  {
    name: 'Settings',
    icon: Settings,
    children: [
      { name: 'General', href: '/settings', icon: Settings },
      { name: 'Billing', href: '/settings/billing', icon: CreditCard }
    ]
  }
];

export function AppShell() {
  const { user, logout } = useAuth();
  const { currentOrg, organization } = useOrg();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    return saved ? JSON.parse(saved) : false;
  });
  const [expandedMenus, setExpandedMenus] = useState(['Assets']);

  // Save sidebar state to localStorage
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(sidebarCollapsed));
  }, [sidebarCollapsed]);

  // Check if subscription is expired (but allow billing page access)
  const subscription = organization?.subscription || {};
  const isExpired = subscription.status === 'expired';
  const isBillingPage = location.pathname.includes('/settings/billing');

  const basePath = currentOrg ? `/o/${currentOrg.slug}` : '';

  const toggleMenu = (name) => {
    if (sidebarCollapsed) return; // Don't toggle submenus when collapsed
    setExpandedMenus(prev =>
      prev.includes(name) ? prev.filter(n => n !== name) : [...prev, name]
    );
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(prev => !prev);
  };

  // Navigation item component for tooltip support
  const NavItem = ({ item, isActive, href, isChild = false }) => {
    const content = (
      <Link
        to={href}
        className={cn(
          'flex items-center gap-3 rounded-button transition-all duration-200',
          isChild ? 'px-3 py-2' : 'px-3 py-2.5',
          sidebarCollapsed && !isChild ? 'justify-center px-2' : '',
          'text-body-sm font-medium',
          isActive
            ? 'bg-accent/10 text-accent'
            : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
        )}
      >
        <item.icon className={cn('flex-shrink-0', isChild ? 'w-4 h-4' : 'w-5 h-5')} />
        <span className={cn(
          'transition-all duration-200 whitespace-nowrap',
          sidebarCollapsed ? 'w-0 opacity-0 overflow-hidden' : 'w-auto opacity-100'
        )}>
          {item.name}
        </span>
      </Link>
    );

    if (sidebarCollapsed && !isChild) {
      return (
        <Tooltip.Provider delayDuration={0}>
          <Tooltip.Root>
            <Tooltip.Trigger asChild>
              {content}
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content
                className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm z-[100]"
                side="right"
                sideOffset={8}
              >
                {item.name}
                <Tooltip.Arrow className="fill-gray-900" />
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        </Tooltip.Provider>
      );
    }

    return content;
  };

  return (
    <div className="min-h-screen bg-surface-secondary">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 bg-white shadow-card',
          'transform transition-all duration-300 ease-in-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
          sidebarCollapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-tertiary">
          <Link to={basePath || '/dashboard'} className="flex items-center overflow-hidden">
            {sidebarCollapsed ? (
              <img src="/app-icon.svg" alt="Next TMS" className="w-10 h-10 flex-shrink-0" />
            ) : (
              <img src="/next_tms_logo.svg" alt="Next TMS" className="w-40 h-auto" />
            )}
          </Link>
          <button
            className="lg:hidden p-2 rounded-chip hover:bg-surface-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className={cn('p-4 space-y-1', sidebarCollapsed && 'px-2')}>
          {navigation.map((item) => {
            if (item.children) {
              const isExpanded = expandedMenus.includes(item.name) && !sidebarCollapsed;
              const isChildActive = item.children.some(child =>
                location.pathname.startsWith(`${basePath}${child.href}`)
              );

              // When collapsed, show as dropdown menu
              if (sidebarCollapsed) {
                return (
                  <DropdownMenu.Root key={item.name}>
                    <Tooltip.Provider delayDuration={0}>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <DropdownMenu.Trigger asChild>
                            <button
                              className={cn(
                                'w-full flex items-center justify-center p-2.5 rounded-button',
                                'text-body-sm font-medium transition-colors',
                                isChildActive
                                  ? 'bg-accent/10 text-accent'
                                  : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                              )}
                            >
                              <item.icon className="w-5 h-5 flex-shrink-0" />
                            </button>
                          </DropdownMenu.Trigger>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-gray-900 text-white px-3 py-1.5 rounded-md text-sm z-[100]"
                            side="right"
                            sideOffset={8}
                          >
                            {item.name}
                            <Tooltip.Arrow className="fill-gray-900" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        className="min-w-[160px] bg-white rounded-card shadow-elevated p-2 z-[60]"
                        side="right"
                        sideOffset={8}
                      >
                        {item.children.map((child) => {
                          const childHref = `${basePath}${child.href}`;
                          const isChildItemActive = location.pathname.startsWith(childHref);
                          return (
                            <DropdownMenu.Item key={child.name} asChild>
                              <Link
                                to={childHref}
                                className={cn(
                                  'flex items-center gap-2 px-3 py-2 rounded-chip outline-none',
                                  'text-body-sm transition-colors cursor-pointer',
                                  isChildItemActive
                                    ? 'bg-accent/10 text-accent font-medium'
                                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                                )}
                              >
                                <child.icon className="w-4 h-4" />
                                {child.name}
                              </Link>
                            </DropdownMenu.Item>
                          );
                        })}
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                );
              }

              return (
                <div key={item.name}>
                  <button
                    onClick={() => toggleMenu(item.name)}
                    className={cn(
                      'w-full flex items-center gap-3 px-3 py-2.5 rounded-button',
                      'text-body-sm font-medium transition-colors',
                      isChildActive
                        ? 'bg-accent/10 text-accent'
                        : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                    )}
                  >
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1 text-left">{item.name}</span>
                    <ChevronDown
                      className={cn(
                        'w-4 h-4 transition-transform duration-200',
                        isExpanded ? 'rotate-180' : ''
                      )}
                    />
                  </button>
                  <div className={cn(
                    'ml-4 space-y-1 overflow-hidden transition-all duration-200',
                    isExpanded ? 'mt-1 max-h-40 opacity-100' : 'max-h-0 opacity-0'
                  )}>
                    {item.children.map((child) => {
                      const childHref = `${basePath}${child.href}`;
                      const isChildItemActive = location.pathname.startsWith(childHref);

                      return (
                        <Link
                          key={child.name}
                          to={childHref}
                          className={cn(
                            'flex items-center gap-3 px-3 py-2 rounded-button',
                            'text-body-sm transition-colors',
                            isChildItemActive
                              ? 'bg-accent/10 text-accent font-medium'
                              : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            }

            const href = `${basePath}${item.href}`;
            const isActive = location.pathname.startsWith(href);

            return (
              <NavItem
                key={item.name}
                item={item}
                isActive={isActive}
                href={href}
              />
            );
          })}
        </nav>

        {/* Collapse Toggle Button */}
        <div className="absolute bottom-4 left-0 right-0 px-4">
          <button
            onClick={toggleSidebar}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-button',
              'text-body-sm font-medium transition-all duration-200',
              'text-text-secondary hover:bg-surface-secondary hover:text-text-primary',
              sidebarCollapsed && 'justify-center px-2'
            )}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <>
                <ChevronLeft className="w-5 h-5" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className={cn(
        'transition-all duration-300 ease-in-out',
        sidebarCollapsed ? 'lg:pl-[72px]' : 'lg:pl-64'
      )}>
        {/* Trial Banner */}
        <TrialBanner />

        {/* Top bar */}
        <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-glass border-b border-surface-tertiary">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="lg:hidden p-2 rounded-chip hover:bg-surface-secondary"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-text-secondary" />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Right side controls */}
            <div className="flex items-center gap-2">
              {/* Organization Switcher */}
              <OrgSwitcher />

              {/* User menu */}
              <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="flex items-center gap-2 p-2 rounded-button hover:bg-surface-secondary">
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <span className="text-small font-semibold text-accent">
                      {getInitials(user?.first_name || user?.email)}
                    </span>
                  </div>
                </button>
              </DropdownMenu.Trigger>

              <DropdownMenu.Portal>
                <DropdownMenu.Content
                  className="min-w-[200px] bg-white rounded-card shadow-elevated p-2 z-50 animate-fade-in"
                  sideOffset={8}
                  align="end"
                >
                  <div className="px-2 py-2 border-b border-surface-tertiary mb-2">
                    <div className="text-body-sm font-medium text-text-primary">
                      {user?.first_name || 'User'}
                    </div>
                    <div className="text-small text-text-tertiary truncate">
                      {user?.email}
                    </div>
                  </div>

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm"
                    onSelect={() => window.location.href = '/profile'}
                  >
                    <User className="w-4 h-4" />
                    Profile
                  </DropdownMenu.Item>

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm text-error"
                    onSelect={logout}
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

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Subscription Blocker (show when expired, except on billing page) */}
      {isExpired && !isBillingPage && <SubscriptionBlocker />}
    </div>
  );
}

export default AppShell;
