/**
 * DashboardPage — Executive Briefing for truckerprenuers.
 *
 * The morning a small carrier owner opens this:
 *
 *   1. Greeting + date.
 *   2. Alex narrates the day in plain English (BriefingCard).
 *   3. Four executive numbers (PulseRow): revenue this week, margin,
 *      AR outstanding, pipeline booked.
 *   4. Two columns: The Fleet (left) · What Needs You + Recent Activity
 *      (right, stacked).
 *
 * No hero map. No giant Mapbox canvas. Map lives small inside the Fleet
 * panel as confirmation, not centerpiece. This is a *business* console
 * for an entrepreneur, not a dispatcher cockpit.
 */

import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Receipt, Inbox, TrendingUp } from 'lucide-react';
import { useOrg } from '../../contexts/OrgContext';
import { useDashboard } from '../../hooks';
import dashboardApi from '../../api/dashboard.api';
import { BriefingCard } from './components/BriefingCard';
import { FleetPanel } from './components/FleetPanel';
import { ActionItems } from './components/ActionItems';
import { ActivityStream } from './components/ActivityStream';

export function DashboardPage() {
  const { currentOrg, orgUrl } = useOrg();
  const { metrics } = useDashboard();

  const [pulse, setPulse] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [trucks, setTrucks] = useState([]);

  // Pulse + action items go straight to the briefing card.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const [p, a] = await Promise.all([
          dashboardApi.getFinancePulse(),
          dashboardApi.getActionItems()
        ]);
        if (cancelled) return;
        setPulse(p);
        setActionItems(a?.items || []);
      } catch {
        if (!cancelled) {
          setPulse(null);
          setActionItems([]);
        }
      }
    };
    load();
    const id = setInterval(load, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // FleetPanel polls its own fleet-locations. We snapshot the trucks into
  // state so the BriefingCard can narrate "Joe is rolling near Phoenix"
  // without duplicating the fetch.
  const handleTrucksLoaded = useCallback((list) => {
    setTrucks(list);
  }, []);

  return (
    <div className="space-y-6">
      {/* Greeting + quick actions */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-headline text-text-primary">
            {greeting()}, {personalName(currentOrg)}
          </h1>
          <p className="text-body-sm text-text-tertiary mt-0.5">
            {formattedToday()} · {currentOrg?.name || 'Your operation'}
          </p>
        </div>
        <QuickActions orgUrl={orgUrl} />
      </header>

      {/* Alex briefing — narration + the four executive numbers embedded
          as glass tiles inside the dark gradient card. */}
      <BriefingCard
        pulse={pulse}
        trucks={trucks}
        actionItems={actionItems}
        metrics={metrics}
        orgSlug={currentOrg?.slug}
      />

      {/* Two equal columns — Fleet (list + square map) on the left,
          What Needs You + Recent Activity stacked on the right. The
          50/50 split + the map's aspect-ratio container keeps both
          columns visually balanced regardless of viewport width. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <FleetPanel onTrucksLoaded={handleTrucksLoaded} />
        <div className="grid grid-cols-1 gap-4">
          <div id="what-needs-you">
            <ActionItems />
          </div>
          <ActivityStream />
        </div>
      </div>
    </div>
  );
}

// ── small presentational helpers ──────────────────────────────────────

/**
 * Quick-action pill row. The four most-tapped destinations for an
 * owner-op opening the dashboard: log a new load (most common), drop
 * an expense (fuel/tolls), check the agent inbox, jump to the P&L.
 *
 * On desktop these sit right-aligned in the header; on mobile they
 * wrap into a second row beneath the greeting.
 */
function QuickActions({ orgUrl }) {
  const actions = [
    { to: orgUrl('/loads/new'),   icon: Plus,       label: 'New load',   primary: true },
    { to: orgUrl('/expenses/new'), icon: Receipt,    label: 'Expense' },
    { to: orgUrl('/genie/inbox'),  icon: Inbox,      label: 'Inbox' },
    { to: orgUrl('/pnl'),          icon: TrendingUp, label: 'P&L' }
  ];

  return (
    <div className="flex flex-wrap items-center gap-2">
      {actions.map(({ to, icon: Icon, label, primary }) => (
        <Link
          key={label}
          to={to}
          className={
            primary
              ? 'inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-accent text-white text-body-sm font-semibold hover:bg-accent/90 shadow-sm transition-colors'
              : 'inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-surface-primary border border-surface-tertiary text-body-sm text-text-secondary hover:text-text-primary hover:border-accent/40 transition-colors'
          }
        >
          <Icon className="w-3.5 h-3.5" />
          <span>{label}</span>
        </Link>
      ))}
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function personalName(org) {
  // Owner-ops typically share their first name with the org. Fall back
  // to a friendly noun when neither is available.
  return org?.name?.split(' ')[0] || 'there';
}

function formattedToday() {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

export default DashboardPage;
