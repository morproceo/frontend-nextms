import { useState, useEffect } from 'react';
import { NavLink, Outlet, useParams, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  MapPin,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search,
  Menu,
  X
} from 'lucide-react';
import { SpottyProvider, useSpotty } from '../../contexts/SpottyContext';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { cn } from '../../lib/utils';

/**
 * SpottyShell
 *
 * Slim chrome dedicated to the Spotty app inside the morpro ecosystem.
 * Mirrors AppShell's mobile drawer pattern: sidebar collapses to a
 * slide-out drawer below `lg`, hamburger trigger lives in a slim mobile
 * sub-bar.
 */
export default function SpottyShell() {
  return (
    <SpottyProvider>
      <ShellLayout />
    </SpottyProvider>
  );
}

function ShellLayout() {
  const { orgSlug } = useParams();
  const basePath = `/o/${orgSlug}/spotty`;
  const { loading, error, profile, relink } = useSpotty();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Auto-close mobile drawer when route changes
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  const nav = [
    { label: 'Dashboard', to: basePath, icon: LayoutDashboard, end: true },
    { label: 'Browse spots', to: `${basePath}/browse`, icon: Search },
    { label: 'Bookings', to: `${basePath}/bookings`, icon: Calendar },
    { label: 'Payments', to: `${basePath}/payments`, icon: CreditCard }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Spotty" appId="spotty" />

      {/* Mobile-only sub-bar with hamburger trigger (lg:hidden) */}
      <div className="lg:hidden h-12 bg-[#0a0e1a] border-b border-white/[0.08] flex items-center px-3 flex-shrink-0">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
          aria-label="Open Spotty navigation"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — drawer on mobile, persistent on lg+ */}
        <aside
          className={cn(
            'bg-[#0a0e1a] text-white flex-shrink-0 flex flex-col',
            // Mobile: fixed drawer that slides from the left
            'fixed top-14 left-0 bottom-0 w-64 z-50',
            'transform transition-transform duration-300 ease-in-out',
            sidebarOpen ? 'translate-x-0' : '-translate-x-full',
            // Desktop: static, in-flow, narrower
            'lg:relative lg:top-0 lg:translate-x-0 lg:w-60 lg:z-auto'
          )}
        >
          <div className="lg:hidden flex items-center justify-end p-3 border-b border-white/[0.08]">
            <button
              onClick={() => setSidebarOpen(false)}
              className="p-2 rounded-chip text-white/70 hover:bg-white/[0.08]"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="flex-1 p-3 pt-3 lg:pt-4 space-y-1 overflow-y-auto">
            {nav.map(({ label, to, icon: Icon, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-button text-body-sm transition-colors',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-white/60 hover:bg-white/[0.04] hover:text-white'
                  )
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{label}</span>
              </NavLink>
            ))}
          </nav>

          <div className="border-t border-white/[0.08] p-3 space-y-1">
            <a
              href="https://www.gospotty.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ExternalLink className="w-4 h-4 flex-shrink-0" />
              <span>Open in gospotty.com</span>
            </a>
            <Link
              to={`/o/${orgSlug}/launcher`}
              className="flex items-center gap-3 px-3 py-2 rounded-button text-body-sm text-white/50 hover:bg-white/[0.04] hover:text-white transition-colors"
            >
              <ArrowLeft className="w-4 h-4 flex-shrink-0" />
              <span>Back to launcher</span>
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto min-w-0">
          {loading ? (
            <CenterPanel>
              <Loader2 className="w-6 h-6 animate-spin text-text-tertiary" />
              <p className="text-body-sm text-text-secondary mt-3">
                Linking your Spotty account…
              </p>
            </CenterPanel>
          ) : error ? (
            <LinkError error={error} onRetry={relink} />
          ) : profile ? (
            <Outlet context={{ profile }} />
          ) : (
            <CenterPanel>
              <p className="text-body-sm text-text-secondary">
                Spotty profile not available.
              </p>
            </CenterPanel>
          )}
        </main>
      </div>
    </div>
  );
}

function LinkError({ error, onRetry }) {
  return (
    <CenterPanel>
      <div className="w-12 h-12 rounded-full bg-error-muted flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-6 h-6 text-error" />
      </div>
      <h2 className="text-title-sm text-text-primary text-center">
        Couldn't link to Spotty
      </h2>
      <p className="text-body-sm text-text-secondary text-center mt-2 max-w-md">
        {error}
      </p>
      <button
        onClick={onRetry}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover transition-colors"
      >
        <RefreshCw className="w-4 h-4" />
        Try again
      </button>
    </CenterPanel>
  );
}

function CenterPanel({ children }) {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      {children}
    </div>
  );
}
