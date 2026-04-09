import { cn } from '../../lib/utils';

const badgeVariants = {
  gray: 'bg-gray-100 text-gray-600 border border-gray-200',
  blue: 'bg-blue-500 text-white',
  green: 'bg-emerald-500 text-white',
  yellow: 'bg-amber-400 text-white',
  red: 'bg-red-500 text-white',
  purple: 'bg-purple-500 text-white',
  orange: 'bg-orange-500 text-white',
  indigo: 'bg-indigo-500 text-white',
  teal: 'bg-teal-500 text-white',
  emerald: 'bg-green-500 text-white',
  cyan: 'bg-cyan-500 text-white'
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
