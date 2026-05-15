import { cn } from '../../lib/utils';

/**
 * AgentAvatar — circular gradient disc with the agent's initial.
 *
 * Sizes:
 *   sm   - 28px (sidebar, inline)
 *   md   - 40px (team cards)
 *   lg   - 64px (page header)
 *   xl   - 96px (hire/marketing)
 *
 * When `muted` is true (e.g. agent not hired), the gradient drops to
 * grayscale + low opacity. Same component, different posture.
 */
export function AgentAvatar({ agent, size = 'md', muted = false, className = '' }) {
  const sizeClass = {
    sm: 'w-7 h-7 text-[11px]',
    md: 'w-10 h-10 text-body-sm',
    lg: 'w-16 h-16 text-title-sm',
    xl: 'w-24 h-24 text-title'
  }[size];

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center flex-shrink-0',
        'bg-gradient-to-br shadow-elevated',
        agent.accent,
        muted && 'grayscale opacity-50',
        sizeClass,
        className
      )}
      aria-hidden="true"
    >
      <span className="font-semibold text-white drop-shadow">
        {agent.name?.[0]?.toUpperCase() || '?'}
      </span>
    </div>
  );
}

export default AgentAvatar;
