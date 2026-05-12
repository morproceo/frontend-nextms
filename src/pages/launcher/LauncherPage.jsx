import { motion } from 'framer-motion';
import {
  AlertTriangle, MapPin, Truck, Network, Sparkles, TrendingUp,
  Gavel, Wrench, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';
import { ProfileCard } from '../../components/launcher/ProfileCard';
import { AppGrid } from '../../components/launcher/AppGrid';
import { eligibleApps } from '../../config/apps';

export function LauncherPage() {
  const { user } = useAuth();
  const { currentOrg, currentRole } = useOrg();

  // Show every eligible tile (active + inactive). Inactive tiles render
  // greyed out with an Activate or Subscribe CTA via AppTile state.
  const apps = eligibleApps({ role: currentRole, org: currentOrg });

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-headline text-white">
          Welcome back{user?.first_name ? `, ${user.first_name}` : ''}
        </h1>
        <p className="text-body-sm text-white/50 mt-1">
          Your morpro ecosystem
        </p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-6 items-start">
        <ProfileCard user={user} currentOrg={currentOrg} currentRole={currentRole} />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="space-y-6"
        >
          <AppGrid apps={apps} orgSlug={currentOrg?.slug} />

          <ActivityFeed />
        </motion.div>
      </div>
    </div>
  );
}

/**
 * Recent activity feed — visual filler stitched from the apps in the
 * ecosystem. Cards aren't real (no backend wire-up); they're hand-picked
 * to read like a busy fleet's morning glance: fault codes from AiMechanic,
 * load wins from Direct, parking from Spotty, NextMS dispatch updates,
 * and a "Genie AI" insight on top.
 */
const ACTIVITY = [
  {
    id: 'a1',
    app: 'AiMechanic',
    accent: 'from-orange-500 to-amber-600',
    icon: AlertTriangle,
    title: 'Critical fault on Unit 524278',
    body: 'SPN 521940 FMI 12 · "Bad intelligent device or component" · cooling system',
    cta: 'Diagnose',
    time: '4 min ago',
    tone: 'critical'
  },
  {
    id: 'a2',
    app: 'Genie AI',
    accent: 'from-violet-500 to-fuchsia-500',
    icon: Sparkles,
    title: 'Insight: lane utilization down 8% this week',
    body: 'Atlanta ↔ Memphis ran 11 loads vs. 12 last week. Fuel savings 4% offset shortfall.',
    cta: 'Open',
    time: '22 min ago',
    tone: 'insight'
  },
  {
    id: 'a3',
    app: 'MorPro Direct',
    accent: 'from-violet-500 to-fuchsia-500',
    icon: Gavel,
    title: 'Bid won — $2,400 Atlanta → Memphis',
    body: 'Acme Shipping accepted. Load is in your dispatch queue.',
    cta: 'View',
    time: '1 hr ago',
    tone: 'success'
  },
  {
    id: 'a4',
    app: 'NextMS',
    accent: 'from-blue-500 to-cyan-500',
    icon: Truck,
    title: 'Load #ACME-2026-0042 delivered on time',
    body: 'Driver J. Perez · Memphis, TN · 487 mi · POD uploaded',
    cta: 'Open',
    time: '2 hr ago',
    tone: 'success'
  },
  {
    id: 'a5',
    app: 'Spotty',
    accent: 'from-cyan-400 to-blue-600',
    icon: MapPin,
    title: 'Parking booked: Pilot #475, exit 134',
    body: 'Tomorrow 8 PM – 5 AM · $20 · ELD hours protected',
    cta: 'View',
    time: '3 hr ago',
    tone: 'info'
  },
  {
    id: 'a6',
    app: 'AiMechanic',
    accent: 'from-orange-500 to-amber-600',
    icon: Wrench,
    title: 'Recurring code on Unit 524277',
    body: '3 cooling-system codes in 30 days — schedule a coolant inspection.',
    cta: 'Schedule',
    time: '5 hr ago',
    tone: 'warning'
  },
  {
    id: 'a7',
    app: 'NextMS',
    accent: 'from-blue-500 to-cyan-500',
    icon: TrendingUp,
    title: 'J. Perez hit 9.8 mpg this week',
    body: '+12% over fleet average · top performer this period',
    cta: 'See report',
    time: 'Yesterday',
    tone: 'success'
  },
  {
    id: 'a8',
    app: 'MorPro Direct',
    accent: 'from-violet-500 to-fuchsia-500',
    icon: Network,
    title: '3 new shippers posted in your lanes',
    body: 'Reefer Atlanta → Charlotte · Flatbed Macon → Birmingham · Dry van Savannah → Jacksonville',
    cta: 'Browse',
    time: 'Yesterday',
    tone: 'info'
  }
];

function ActivityFeed() {
  return (
    <div className="bg-white/[0.04] backdrop-blur-glass border border-white/[0.06] rounded-3xl p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-title-sm text-white">Recent activity</h3>
          <p className="text-body-sm text-white/40 mt-0.5">
            Cross-app updates from your ecosystem
          </p>
        </div>
        <button className="text-body-sm text-white/40 hover:text-white/70 transition-colors">
          See all
        </button>
      </div>
      <ul className="divide-y divide-white/[0.06] -mx-2">
        {ACTIVITY.map((item) => <ActivityRow key={item.id} item={item} />)}
      </ul>
    </div>
  );
}

function ActivityRow({ item }) {
  const Icon = item.icon;
  return (
    <li className="px-2 py-3 flex items-start gap-3 hover:bg-white/[0.03] rounded-xl transition-colors cursor-pointer group">
      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${item.accent} flex items-center justify-center flex-shrink-0 shadow-sm`}>
        <Icon className="w-4 h-4 text-white" strokeWidth={2} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <p className="text-body-sm font-medium text-white truncate">{item.title}</p>
          <ToneTag tone={item.tone} />
        </div>
        <p className="text-small text-white/45 line-clamp-2">{item.body}</p>
        <div className="flex items-center gap-2 mt-1 text-[11px] text-white/35">
          <span>{item.app}</span>
          <span>·</span>
          <span>{item.time}</span>
        </div>
      </div>
      <button className="text-small text-white/50 group-hover:text-white inline-flex items-center gap-0.5 flex-shrink-0 mt-1">
        {item.cta} <ChevronRight className="w-3 h-3" />
      </button>
    </li>
  );
}

function ToneTag({ tone }) {
  if (tone === 'critical') {
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300">URGENT</span>;
  }
  if (tone === 'warning') {
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300">WATCH</span>;
  }
  if (tone === 'insight') {
    return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-violet-500/20 text-violet-200">AI</span>;
  }
  return null;
}

export default LauncherPage;
