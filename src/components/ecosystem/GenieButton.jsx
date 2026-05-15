import { cn } from '../../lib/utils';

/**
 * GenieButton — universal trigger for the morpro AI assistant.
 *
 * Design principles (UX):
 *   - SAME visual weight as the other EcosystemHeader buttons (OrgSwitcher,
 *     AppGridMenu, avatar). A loud, pulsing trigger draws attention away
 *     from the user's actual task; an AI affordance should be discoverable
 *     and stay out of the way.
 *   - The icon itself carries the brand gradient (purple → fuchsia → orange)
 *     so the button reads "intelligence" even at idle, without animation.
 *   - Hover lifts the bg slightly and brightens the gradient — the reward
 *     happens on intent, not constantly.
 *   - A small notification dot in the corner signals "Genie has a
 *     suggestion" (placeholder for proactive insights).
 */
export function GenieButton({ onClick, isOpen, hasNotification = true }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Open Genie AI assistant"
      aria-expanded={isOpen}
      className={cn(
        'group relative w-9 h-9 rounded-full flex items-center justify-center',
        'transition-colors duration-150',
        isOpen
          ? 'bg-white/[0.10]'
          : 'bg-white/[0.04] hover:bg-white/[0.10]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30'
      )}
    >
      {/* Inline SVG so we can stroke the sparkles with a gradient. Lucide's
          icon component doesn't support per-instance gradients out of the
          box, so we hand-roll the path with the same geometry. */}
      <svg
        viewBox="0 0 24 24"
        className={cn(
          'w-[18px] h-[18px] transition-transform duration-200',
          'group-hover:scale-110'
        )}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
      >
        <defs>
          <linearGradient id="genie-spark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#ec4899" />
            <stop offset="100%" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <path
          d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"
          stroke="url(#genie-spark)"
        />
        <path d="M20 3v4" stroke="url(#genie-spark)" />
        <path d="M22 5h-4" stroke="url(#genie-spark)" />
        <path d="M4 17v2" stroke="url(#genie-spark)" />
        <path d="M5 18H3" stroke="url(#genie-spark)" />
      </svg>

      {hasNotification && !isOpen && (
        <span
          aria-hidden
          className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-pink-400 ring-2 ring-[#05080f]"
        />
      )}
    </button>
  );
}

export default GenieButton;
