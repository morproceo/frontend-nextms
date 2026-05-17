/**
 * Genie Suite — the six-agent team.
 *
 * Single source of truth for agent metadata used across the Suite:
 * sidebar nav, team dashboard cards, activity feed avatars, the hire
 * catalog, per-agent pages. When a new agent is added, this file is the
 * only place to touch.
 *
 * Per-agent fields:
 *   slug              - kebab-case identifier (also the agent_slug used
 *                       by the backend BaseAgent registry + agent_catalog)
 *   name              - human name
 *   role              - one-liner job title
 *   tagline           - short pitch shown under the name
 *   capabilities      - bullet list of what the agent does (UI catalog)
 *   hands             - which morpro apps / external systems the agent
 *                       calls — "Ava calls MorPro Direct"
 *   accent            - tailwind `from-* via-* to-*` gradient classes used
 *                       for the agent's avatar disc + buttons
 *   solidColor        - tailwind text-color for inline labels (e.g. bg pills)
 *   monthlyPriceCents - per-agent hire price (matches agent_catalog row)
 *   isCeo             - true for Genie — affects sidebar ordering + copy
 */

export const GENIE_TEAM = [
  {
    slug: 'genie',
    name: 'Genie',
    role: 'Chief Executive',
    tagline: 'Reads your whole business. Tells you what to do next.',
    isCeo: true,
    monthlyPriceCents: 0, // Genie comes free with any agent (or the bundle)
    capabilities: [
      'Reads loads, fuel, settlements, cash across NextMS',
      'Writes your weekly review on Sundays',
      'Daily Friday cash projection',
      'Strategic lane recommendations with numbers behind them'
    ],
    hands: ['NextMS', 'MorPro Direct', 'Spotty', 'LINQ', 'AiMechanic'],
    accent: 'from-violet-500 via-fuchsia-500 to-orange-400',
    solidColor: 'fuchsia'
  },
  {
    slug: 'ava',
    name: 'Ava',
    role: 'Load Negotiator',
    tagline: 'Books loads off MorPro Direct + verified marketplaces.',
    monthlyPriceCents: 4900,
    capabilities: [
      'Books loads off MorPro Direct + verified marketplaces',
      'Negotiates rates with brokers via chat',
      'Picks lanes that compound — not just fill capacity'
    ],
    hands: ['MorPro Direct', 'External load boards'],
    accent: 'from-pink-500 to-rose-500',
    solidColor: 'pink'
  },
  {
    slug: 'alex',
    name: 'Alex',
    role: 'Operations',
    tagline: 'Updates brokers, pings drivers, manages delays.',
    monthlyPriceCents: 4900,
    capabilities: [
      'Updates brokers, pings drivers, manages delays',
      'Pre-books Spotty parking on every load',
      'Reroutes when HOS or weather forces a change'
    ],
    hands: ['Spotty', 'NextMS Dispatch'],
    accent: 'from-cyan-500 to-blue-500',
    solidColor: 'cyan'
  },
  {
    slug: 'cece',
    name: 'Cece',
    role: 'Finance',
    tagline: 'Auto-reconciles loads, factoring, fuel cards, IFTA.',
    monthlyPriceCents: 4900,
    capabilities: [
      'Auto-reconciles loads, factoring, fuel cards, IFTA',
      'Files quarterly taxes and uploads receipts',
      'Pays the driver every Friday without you touching it'
    ],
    hands: ['NextMS Settlements', 'IFTA', 'Factoring'],
    accent: 'from-emerald-500 to-green-500',
    solidColor: 'emerald'
  },
  {
    slug: 'mia',
    name: 'Mia',
    role: 'Knowledge',
    tagline: 'Answers any trucking question in seconds.',
    monthlyPriceCents: 2900,
    capabilities: [
      'Answers any trucking question in seconds',
      'Reads contracts, rate cons, broker MSAs',
      'Pulls real lane rates from your historical data'
    ],
    hands: ['Contract library', 'Lane history', 'Public knowledge'],
    accent: 'from-amber-500 to-orange-500',
    solidColor: 'amber'
  },
  {
    slug: 'sage',
    name: 'Sage',
    role: 'Compliance',
    tagline: 'Watches HOS, ELD logs, DVIRs in real time.',
    monthlyPriceCents: 3900,
    capabilities: [
      'Watches HOS, ELD logs, DVIRs in real time',
      'Cross-checks every assigned carrier against LINQ',
      'Flags exposure before FMCSA does'
    ],
    hands: ['LINQ', 'AiMechanic', 'ELD feeds'],
    accent: 'from-red-500 to-pink-500',
    solidColor: 'rose'
  }
];

/**
 * Bundle SKU — hires the whole team at a discount. Activating the bundle
 * marks every individual agent as `inBundle: true`; per-agent hire CTAs
 * collapse into "Included in Suite" badges.
 */
export const GENIE_BUNDLE = {
  slug: 'genie-suite',
  name: 'Genie Suite',
  tagline: 'Hire the whole team — every agent on shift 24/7',
  monthlyPriceCents: 19900, // $199/mo (vs. $234 if hired individually)
  includes: GENIE_TEAM.map((a) => a.slug),
  savings: GENIE_TEAM.reduce((sum, a) => sum + a.monthlyPriceCents, 0) - 19900
};

/**
 * Look up an agent by slug. Returns null if not found.
 */
export function getAgent(slug) {
  return GENIE_TEAM.find((a) => a.slug === slug) || null;
}

export default { GENIE_TEAM, GENIE_BUNDLE, getAgent };
