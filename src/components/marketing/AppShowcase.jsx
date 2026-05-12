import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import {
  Truck, Network, Wrench, MapPin, AlertTriangle, Sparkles,
  ChevronRight, DollarSign, CheckCircle2, Activity
} from 'lucide-react';

/**
 * AppShowcase — graphic mockups of every ecosystem app inside the same
 * browser-frame chrome used on the hero. Alternates copy + mockup
 * left/right so the rhythm reads as a product tour rather than a list.
 *
 * Mockups are static SVG-ish layouts — no real data — designed to be
 * legible at any breakpoint. The chrome is identical to Hero.jsx so the
 * page feels consistent.
 */
export function AppShowcase() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Soft gradient backdrop, unified with the rest of the marketing */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0a0a0a] to-transparent" />
      <div className="absolute top-1/3 left-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.08)_0%,transparent_70%)]" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.08)_0%,transparent_70%)]" />

      <div className="container relative z-10">
        <SectionHeader />

        <div className="space-y-32 mt-24">
          <ShowcaseRow
            reverse={false}
            tag="NextMS"
            tagColor="#0066FF"
            title="The dispatcher's command center"
            body="Live load tracking, dispatch in two clicks, AI-extracted rate cons, and real-time GPS. Built for fleets that don't have time to babysit a TMS."
            cta="Try NextMS"
            mockup={<NextMsMockup />}
            url="nextms.morpro.io"
          />
          <ShowcaseRow
            reverse
            tag="MorPro Direct"
            tagColor="#A855F7"
            title="Brokerless freight"
            body="A direct line between shippers and verified carriers. Post a load, see bids in minutes, and pay only when delivery is confirmed. No middlemen, no surprise rate cuts."
            cta="See loads"
            mockup={<DirectMockup />}
            url="direct.morpro.io"
          />
          <ShowcaseRow
            reverse={false}
            tag="AiMechanic"
            tagColor="#F97316"
            title="An AI mechanic in every truck"
            body="Fault codes pulled live from your ELD. Tap diagnose and a Claude-powered mechanic explains what's wrong, how serious, and what a fix actually costs. Then file the maintenance record in one click."
            cta="See diagnostics"
            mockup={<AiMechanicMockup />}
            url="ai.morpro.io"
          />
          <ShowcaseRow
            reverse
            tag="Spotty"
            tagColor="#06B6D4"
            title="Parking, solved"
            body="Verified truck parking on every lane. Book before HOS expires, pay through the app, no more circling at midnight."
            cta="Find parking"
            mockup={<SpottyMockup />}
            url="spotty.morpro.io"
          />
          <ShowcaseRow
            reverse={false}
            tag="Genie AI"
            tagColor="#A855F7"
            title="Your wishes, granted"
            body="An AI agent that lives across every morpro app. Ask it for a P&L for last week, post a load to Direct, or pull a driver's HOS — it just does it. Your wish, granted."
            cta="Try Genie"
            mockup={<GenieMockup />}
            url="genie.morpro.io"
            comingSoon
          />
        </div>

        <IntegrationsStrip />
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <div className="max-w-2xl mx-auto text-center">
      <span className="inline-flex items-center gap-2 text-[#A855F7] text-sm font-medium tracking-wide uppercase mb-6">
        <span className="w-2 h-2 rounded-full bg-[#A855F7]" />
        The morpro ecosystem
      </span>
      <h2 className="text-display-sm md:text-display text-white mb-6">
        One login. <span className="gradient-text-purple">Every app you need to run a fleet.</span>
      </h2>
      <p className="text-body-lg text-white/55">
        Built like Apple's ecosystem, priced for owner-ops. Each app
        works on its own — they get smarter when you use them together.
      </p>
    </div>
  );
}

function ShowcaseRow({ reverse, tag, tagColor, title, body, cta, mockup, url, comingSoon }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-100px' });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.8 }}
      className={`grid lg:grid-cols-2 gap-12 lg:gap-20 items-center ${reverse ? 'lg:[direction:rtl]' : ''}`}
    >
      <div className="lg:[direction:ltr] space-y-6">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 text-sm font-semibold tracking-wide uppercase"
            style={{ color: tagColor }}>
            <span className="w-2 h-2 rounded-full" style={{ background: tagColor }} />
            {tag}
          </span>
          {comingSoon && (
            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-white/10 text-white/70">
              Coming soon
            </span>
          )}
        </div>
        <h3 className="text-display-sm text-white leading-[1.05]">{title}</h3>
        <p className="text-body-lg text-white/55 max-w-[480px]">{body}</p>
        <div>
          <button className="inline-flex items-center gap-2 text-white font-medium group">
            {cta}
            <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      <div className="lg:[direction:ltr] relative">
        <div className="absolute -inset-12 bg-[radial-gradient(ellipse_at_center,rgba(0,102,255,0.12)_0%,transparent_70%)]" />
        <BrowserFrame url={url}>{mockup}</BrowserFrame>
      </div>
    </motion.div>
  );
}

function BrowserFrame({ url, children }) {
  return (
    <div className="relative bg-[#0a0a0a] rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
      <div className="flex items-center gap-2 px-4 py-3 bg-[#141414] border-b border-white/5">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
          <div className="w-3 h-3 rounded-full bg-white/10" />
        </div>
        <div className="flex-1 text-center">
          <span className="text-xs text-white/30">{url}</span>
        </div>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

// ── Mockups ──────────────────────────────────────────────────────────

function NextMsMockup() {
  const stats = [
    { label: 'Active loads', value: '24', tone: '#0066FF' },
    { label: 'Revenue MTD', value: '$148K', tone: '#10B981' },
    { label: 'On-time', value: '98.5%', tone: '#10B981' },
    { label: 'Fleet', value: '18', tone: '#0066FF' }
  ];
  const loads = [
    { id: 'LD-2847', route: 'Chicago → Dallas',  status: 'In transit', tone: 'blue' },
    { id: 'LD-2848', route: 'Atlanta → Miami',   status: 'Loading',    tone: 'amber' },
    { id: 'LD-2849', route: 'Denver → Phoenix',  status: 'Scheduled',  tone: 'gray' },
    { id: 'LD-2850', route: 'Houston → Memphis', status: 'In transit', tone: 'blue' }
  ];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/[0.04]">
            <div className="text-[10px] uppercase tracking-wider text-white/40 mb-1">{s.label}</div>
            <div className="text-lg font-semibold text-white">{s.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white/5 rounded-xl p-4 border border-white/[0.04]">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-white">Active loads</div>
          <span className="text-xs text-[#0066FF]">All →</span>
        </div>
        <div className="space-y-2">
          {loads.map((l, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#0066FF]/15 flex items-center justify-center flex-shrink-0">
                  <Truck className="w-3.5 h-3.5 text-[#0066FF]" />
                </div>
                <div className="min-w-0">
                  <div className="text-sm text-white truncate">{l.route}</div>
                  <div className="text-[10px] text-white/40">{l.id}</div>
                </div>
              </div>
              <StatusPill status={l.status} tone={l.tone} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DirectMockup() {
  const loads = [
    { age: '2s',  org: 'ATL', dest: 'Camden, SC',     wt: '47k', mi: '143', truck: 'F SD', rate: '$2,400' },
    { age: '6s',  org: 'BHM', dest: 'Salisbury, NC',  wt: '48k', mi: '251', truck: 'F',    rate: '$1,950' },
    { age: '12s', org: 'WAS', dest: 'Garden City, GA',wt: '48k', mi: '183', truck: 'F',    rate: '$1,575' },
    { age: '14s', org: 'WAS', dest: 'Vass, NC',       wt: '47k', mi: '294', truck: 'F SD', rate: '$2,200' },
    { age: '19s', org: 'APP', dest: 'Butner, NC',     wt: '48k', mi: '335', truck: 'F',    rate: '$2,650' }
  ];
  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] gap-x-3 gap-y-2 text-[10px] uppercase tracking-wider text-white/40 mb-3 px-2">
        <span>Age</span><span>Origin → Dest</span><span>WT</span><span>Dist</span><span>Truck</span><span className="text-right">Price</span>
      </div>
      <div className="space-y-1">
        {loads.map((l, i) => (
          <div key={i} className="grid grid-cols-[auto_1fr_auto_auto_auto_auto] items-center gap-x-3 px-2 py-2 rounded-lg bg-emerald-500/[0.04] hover:bg-emerald-500/10 border-l-2 border-emerald-500/30 text-sm">
            <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">{l.age}</span>
            <span className="text-white truncate">
              {l.org} <span className="text-white/30">→</span> {l.dest}
            </span>
            <span className="text-white/60 text-xs">{l.wt}</span>
            <span className="text-white/60 text-xs">{l.mi} mi</span>
            <span className="text-white/40 text-[10px] font-semibold">{l.truck}</span>
            <span className="text-white font-semibold text-right">{l.rate}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-[10px] text-white/50">
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/[0.04]">
          <div className="uppercase tracking-wider text-white/30 mb-0.5">Loads found</div>
          <div className="text-lg font-semibold text-white">42</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/[0.04]">
          <div className="uppercase tracking-wider text-white/30 mb-0.5">Avg $/mi</div>
          <div className="text-lg font-semibold text-emerald-400">$2.81</div>
        </div>
        <div className="bg-white/5 rounded-lg p-2.5 border border-white/[0.04]">
          <div className="uppercase tracking-wider text-white/30 mb-0.5">In your lanes</div>
          <div className="text-lg font-semibold text-violet-400">17</div>
        </div>
      </div>
    </div>
  );
}

function AiMechanicMockup() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-2">
        {[
          { label: 'Trucks', v: '4',  c: 'text-white' },
          { label: 'Active codes', v: '5',  c: 'text-amber-400' },
          { label: 'Critical', v: '1',  c: 'text-red-400' },
          { label: 'Maint due', v: '2',  c: 'text-amber-400' }
        ].map((s, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/[0.04]">
            <div className="text-[9px] uppercase tracking-wider text-white/40 mb-1">{s.label}</div>
            <div className={`text-lg font-semibold ${s.c}`}>{s.v}</div>
          </div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-orange-500/10 to-red-500/5 rounded-xl border border-orange-500/20 p-4">
        <div className="flex items-start gap-3 mb-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-sm font-semibold text-white">SPN 521940 FMI 12</span>
              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-500/20 text-red-300">URGENT</span>
            </div>
            <p className="text-xs text-white/60">Bad intelligent device — cooling system. Unit 524278.</p>
          </div>
        </div>
        <div className="bg-white/5 rounded-lg p-3 border border-white/[0.04]">
          <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-violet-400 mb-1.5">
            <Sparkles className="w-3 h-3" /> AI diagnosis
          </div>
          <p className="text-xs text-white/70 leading-relaxed mb-2">
            Likely a coolant temp sensor or the wiring harness to it. Don't ignore — engine could derate or shut down on a long climb.
          </p>
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-white/50">Estimated repair</span>
            <span className="text-white font-semibold">$180–$420</span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1">
            <span className="text-white/50">Drive status</span>
            <span className="inline-flex items-center gap-1 text-amber-300">
              <CheckCircle2 className="w-3 h-3" /> Drive with caution
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function SpottyMockup() {
  const spots = [
    { name: 'Pilot #475 · Macon GA',       miles: '4 mi',  spots: 12, rate: '$20' },
    { name: 'Loves #312 · Forsyth GA',     miles: '18 mi', spots: 5,  rate: '$22' },
    { name: 'TA Travel · Cordele GA',      miles: '52 mi', spots: 24, rate: '$18' },
    { name: 'AmBest · Tifton GA',          miles: '74 mi', spots: 9,  rate: '$25' }
  ];
  return (
    <div className="space-y-4">
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/5 rounded-xl border border-cyan-500/20 p-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
          <Activity className="w-5 h-5 text-cyan-300" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-semibold text-white">2h 15m of HOS left</div>
          <div className="text-xs text-white/50">Book now to protect your reset window.</div>
        </div>
      </div>

      <div className="space-y-2">
        {spots.map((s, i) => (
          <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.04] hover:bg-white/[0.07] transition-colors">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-cyan-300" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white truncate">{s.name}</div>
              <div className="text-[11px] text-white/40">{s.miles} away · {s.spots} spots open</div>
            </div>
            <div className="text-right flex-shrink-0">
              <div className="text-sm font-semibold text-white">{s.rate}</div>
              <div className="text-[10px] text-cyan-300 uppercase tracking-wider">Book</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GenieMockup() {
  return (
    <div className="space-y-3 text-sm">
      {/* User message */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-violet-500/15 border border-violet-500/20 rounded-2xl rounded-tr-sm px-3 py-2 text-white/90 text-[13px]">
          Show me MTD revenue and which truck made the most.
        </div>
      </div>
      {/* Genie response */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <div className="bg-white/5 border border-white/[0.06] rounded-2xl rounded-tl-sm p-3">
            <p className="text-white/85 text-[13px] leading-relaxed mb-3">
              Through May 7 you've billed <span className="font-semibold text-white">$148,420</span> across 24 loads. Top truck: <span className="font-semibold text-white">524277</span> ($31,800).
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Revenue MTD</div>
                <div className="text-base font-semibold text-emerald-400">$148,420</div>
              </div>
              <div className="bg-white/5 rounded-lg p-2.5">
                <div className="text-[9px] uppercase tracking-wider text-white/40">Top truck</div>
                <div className="text-base font-semibold text-white">524277 · $31.8K</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[10px] text-white/40">
            <span className="inline-flex items-center gap-1">
              <DollarSign className="w-3 h-3" /> Pulled from NextMS
            </span>
            <span>·</span>
            <span>2.1s</span>
          </div>
        </div>
      </div>
      {/* User follow-up */}
      <div className="flex justify-end">
        <div className="max-w-[80%] bg-violet-500/15 border border-violet-500/20 rounded-2xl rounded-tr-sm px-3 py-2 text-white/90 text-[13px]">
          Post a load Atlanta → Memphis tomorrow, $2,400, dry van.
        </div>
      </div>
      {/* Genie action */}
      <div className="flex items-start gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Sparkles className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="bg-emerald-500/[0.08] border border-emerald-500/20 rounded-2xl rounded-tl-sm p-3 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-white/85 text-[13px]">Posted on MorPro Direct.</p>
              <p className="text-[11px] text-white/50 mt-0.5">ATL → Memphis · 487 mi · $2,400 · Pickup tomorrow 8 AM</p>
            </div>
          </div>
        </div>
      </div>
      <div className="pt-2">
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/[0.06]">
          <Sparkles className="w-3.5 h-3.5 text-white/40 flex-shrink-0" />
          <span className="text-[12px] text-white/40">Ask Genie anything…</span>
        </div>
      </div>
    </div>
  );
}

function IntegrationsStrip() {
  const items = [
    { name: 'Motive',       iconUrl: '/Intergation-app/motive.avif',  label: 'Live ELD telematics' },
    { name: 'FMCSA',        iconUrl: '/Intergation-app/fmcsa.avif',   label: 'Authority verification' },
    { name: 'ChatGPT',      iconUrl: '/Intergation-app/chatgpt.avif', label: 'AI-powered docs' },
    { name: 'Chase',        iconUrl: '/Intergation-app/Chase.avif',   label: 'Payment processing' },
    { name: 'Relay',        iconUrl: '/Intergation-app/relay.avif',   label: 'Smart bank-account flows' },
    { name: 'Uber Freight', iconUrl: '/Intergation-app/uber.avif',    label: 'Spot rate marketplace' }
  ];
  return (
    <div className="mt-32">
      <div className="text-center mb-12">
        <span className="inline-flex items-center gap-2 text-emerald-400 text-sm font-semibold tracking-wide uppercase mb-4">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Integrations
        </span>
        <h3 className="text-display-sm text-white">
          Plays nicely with the tools you <span className="gradient-text-purple">already use</span>
        </h3>
      </div>

      <div className="max-w-4xl mx-auto">
        <BrowserFrame url="connections.morpro.io">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {items.map((it, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/[0.04] hover:bg-white/[0.07] transition-colors">
                <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                  <img src={it.iconUrl} alt={it.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white truncate">{it.name}</div>
                  <div className="text-[10px] text-white/40 truncate">{it.label}</div>
                </div>
                <span className="text-[10px] uppercase tracking-wider text-emerald-400 font-semibold flex-shrink-0">
                  Connect
                </span>
              </div>
            ))}
          </div>
        </BrowserFrame>
      </div>
    </div>
  );
}

function StatusPill({ status, tone }) {
  const cls = ({
    blue: 'bg-[#0066FF]/15 text-[#5B8DEF]',
    amber: 'bg-amber-500/15 text-amber-300',
    gray: 'bg-white/8 text-white/60'
  })[tone] || 'bg-white/8 text-white/60';
  return (
    <span className={`text-[10px] px-2 py-1 rounded-full whitespace-nowrap ${cls}`}>
      {status}
    </span>
  );
}

export default AppShowcase;
