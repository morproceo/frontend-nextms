import { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  LayoutDashboard,
  Package,
  FileText,
  DollarSign,
  Receipt,
  Settings,
  Menu,
  X,
  LogOut,
  User,
  Truck
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn, getInitials } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/driver', icon: LayoutDashboard },
  { name: 'My Loads', href: '/driver/loads', icon: Package },
  { name: 'Documents', href: '/driver/documents', icon: FileText },
  { name: 'Expenses', href: '/driver/expenses', icon: Receipt },
  { name: 'Earnings', href: '/driver/earnings', icon: DollarSign },
  { name: 'Settings', href: '/driver/settings', icon: Settings }
];

// Mobile bottom navigation - most used for drivers
const mobileNavigation = [
  { name: 'Home', href: '/driver', icon: LayoutDashboard, exact: true },
  { name: 'Loads', href: '/driver/loads', icon: Package },
  { name: 'Expenses', href: '/driver/expenses', icon: Receipt },
  { name: 'Earnings', href: '/driver/earnings', icon: DollarSign },
  { name: 'Settings', href: '/driver/settings', icon: Settings }
];

export function DriverShell() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          'fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-card',
          'transform transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-surface-tertiary">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-body font-semibold text-text-primary">TMS</div>
              <div className="text-small text-text-tertiary">Driver Portal</div>
            </div>
          </div>
          <button
            className="lg:hidden p-2 rounded-chip hover:bg-surface-secondary"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-text-secondary" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/driver' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-button',
                  'text-body-sm font-medium transition-colors',
                  isActive
                    ? 'bg-accent/10 text-accent'
                    : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-surface-tertiary">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <span className="text-body-sm font-semibold text-accent">
                {getInitials(user?.first_name || user?.email)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-medium text-text-primary truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Driver'}
              </div>
              <div className="text-small text-text-tertiary truncate">
                {user?.email}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
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

            {/* Page title - mobile */}
            <div className="lg:hidden flex-1 text-center">
              <h1 className="text-body font-semibold text-text-primary">
                {navigation.find(n =>
                  n.href === location.pathname ||
                  (n.href !== '/driver' && location.pathname.startsWith(n.href))
                )?.name || 'Driver Portal'}
              </h1>
            </div>

            {/* Spacer */}
            <div className="hidden lg:block flex-1" />

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
                      {user?.first_name || 'Driver'}
                    </div>
                    <div className="text-small text-text-tertiary truncate">
                      {user?.email}
                    </div>
                  </div>

                  <DropdownMenu.Item
                    className="flex items-center gap-2 px-2 py-2 rounded-chip cursor-pointer hover:bg-surface-secondary outline-none text-body-sm"
                    onSelect={() => window.location.href = '/driver/settings'}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
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
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-surface-tertiary lg:hidden z-40 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavigation.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href) && item.href !== '/driver';

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  isActive ? 'text-accent' : 'text-text-tertiary'
                )}
              >
                <item.icon className={cn('w-5 h-5 mb-1', isActive && 'stroke-[2.5px]')} />
                <span className="text-[10px] font-medium">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default DriverShell;
