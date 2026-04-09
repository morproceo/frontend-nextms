import { useState, useEffect } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Truck,
  DollarSign,
  Settings,
  Menu,
  X,
  LogOut
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { cn, getInitials } from '../../lib/utils';

const navigation = [
  { name: 'Dashboard', href: '/investor', icon: LayoutDashboard },
  { name: 'Loads', href: '/investor/loads', icon: Package },
  { name: 'Fleet', href: '/investor/fleet', icon: Truck },
  { name: 'Financials', href: '/investor/financials', icon: DollarSign },
  { name: 'Settings', href: '/investor/settings', icon: Settings },
];

const mobileNavigation = [
  { name: 'Dashboard', href: '/investor', icon: LayoutDashboard, exact: true },
  { name: 'Loads', href: '/investor/loads', icon: Package },
  { name: 'Fleet', href: '/investor/fleet', icon: Truck },
  { name: 'Financials', href: '/investor/financials', icon: DollarSign },
  { name: 'Settings', href: '/investor/settings', icon: Settings },
];

export function InvestorShell() {
  const { user, organizations, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Store org slug for API calls (investor portal isn't under /o/:slug)
  useEffect(() => {
    if (organizations?.length > 0) {
      localStorage.setItem('tms_portal_org_slug', organizations[0].slug);
    }
  }, [organizations]);

  const orgName = organizations?.[0]?.name || 'Organization';

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
          'fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#1a1f36] to-[#0f1225] shadow-card flex flex-col',
          'transform transition-transform duration-200 ease-out',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10 flex-shrink-0">
          <Link to="/investor" className="flex flex-col">
            <img src="/next_logo_white.png" alt="neXt TMS" className="w-36 h-auto" />
            <span className="text-[11px] text-white/40 uppercase tracking-wider">
              Investor Portal
            </span>
          </Link>
          <button
            className="lg:hidden p-2 rounded-chip hover:bg-white/10"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5 text-white/70" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href ||
              (item.href !== '/investor' && location.pathname.startsWith(item.href));

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-button',
                  'text-body-sm font-medium transition-colors',
                  isActive
                    ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-sm'
                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        {/* User info at bottom */}
        <div className="flex-shrink-0 border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-body-sm font-semibold text-white">
                {getInitials(user?.first_name || user?.email)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-body-sm font-medium text-white truncate">
                {user?.first_name ? `${user.first_name} ${user.last_name || ''}`.trim() : 'Investor'}
              </div>
              <div className="text-small text-white/50 truncate">
                {user?.email}
              </div>
              <div className="text-[10px] text-white/40 uppercase tracking-wider">
                Investor
              </div>
            </div>
            <button
              onClick={logout}
              className="p-2 rounded-chip hover:bg-white/10 text-white/50 hover:text-white transition-colors"
              title="Sign out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar (mobile) */}
        <header className="sticky top-0 z-30 h-16 bg-gradient-to-r from-[#1a1f36] to-[#252b48] border-b border-white/10 lg:hidden">
          <div className="h-full px-4 flex items-center justify-between">
            {/* Mobile menu button */}
            <button
              className="p-2 rounded-chip hover:bg-white/10"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5 text-white/70" />
            </button>

            {/* Page title - mobile */}
            <div className="flex-1 text-center">
              <h1 className="text-body font-semibold text-white">
                {navigation.find(n =>
                  n.href === location.pathname ||
                  (n.href !== '/investor' && location.pathname.startsWith(n.href))
                )?.name || 'Investor Portal'}
              </h1>
            </div>

            {/* Spacer for alignment */}
            <div className="w-9" />
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8 pb-24 lg:pb-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-[#1a1f36] to-[#252b48] border-t border-white/10 lg:hidden z-40 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {mobileNavigation.map((item) => {
            const isActive = item.exact
              ? location.pathname === item.href
              : location.pathname.startsWith(item.href) && item.href !== '/investor';

            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  isActive ? 'text-white' : 'text-white/40'
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

export default InvestorShell;
