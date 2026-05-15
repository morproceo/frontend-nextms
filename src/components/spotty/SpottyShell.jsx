import { NavLink, Outlet, useParams, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  CreditCard,
  ExternalLink,
  ArrowLeft,
  AlertCircle,
  Loader2,
  RefreshCw,
  Search
} from 'lucide-react';
import { SpottyProvider, useSpotty } from '../../contexts/SpottyContext';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { MobileTabBar } from '../ecosystem/MobileTabBar';
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

  const nav = [
    { label: 'Dashboard', to: basePath, icon: LayoutDashboard, end: true },
    { label: 'Browse spots', to: `${basePath}/browse`, icon: Search },
    { label: 'Bookings', to: `${basePath}/bookings`, icon: Calendar },
    { label: 'Payments', to: `${basePath}/payments`, icon: CreditCard }
  ];

  const moreLinks = [
    {
      label: 'Open in gospotty.com',
      href: 'https://www.gospotty.com',
      icon: ExternalLink,
      external: true
    },
    {
      label: 'Back to launcher',
      to: `/o/${orgSlug}/launcher`,
      icon: ArrowLeft
    }
  ];

  return (
    <div className="min-h-screen bg-surface-secondary flex flex-col">
      <EcosystemHeader appName="Parking" appId="spotty" />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar — desktop only; mobile uses the bottom tab bar */}
        <aside
          className="hidden lg:flex bg-[#05080f] text-white flex-shrink-0 flex-col lg:w-60"
        >
          <nav className="flex-1 p-3 pt-4 space-y-1 overflow-y-auto">
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
        <main className="flex-1 overflow-y-auto min-w-0 pb-20 lg:pb-0">
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

      <MobileTabBar items={nav} moreLinks={moreLinks} />
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
