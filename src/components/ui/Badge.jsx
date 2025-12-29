import { cn } from '../../lib/utils';

const badgeVariants = {
  gray: 'bg-surface-tertiary text-text-secondary',
  blue: 'bg-accent/10 text-accent',
  green: 'bg-success/10 text-success',
  yellow: 'bg-warning/10 text-warning',
  red: 'bg-error/10 text-error',
  purple: 'bg-purple-100 text-purple-700'
};

export function Badge({
  className,
  variant = 'gray',
  children,
  ...props
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1',
        'px-2.5 py-1 rounded-chip',
        'text-small font-medium',
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export default Badge;
