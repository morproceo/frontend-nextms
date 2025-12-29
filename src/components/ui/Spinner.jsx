import { cn } from '../../lib/utils';

export function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3'
  };

  return (
    <div
      className={cn(
        'border-current border-t-transparent rounded-full animate-spin',
        sizes[size],
        className
      )}
    />
  );
}

export function LoadingScreen({ message = 'Loading...' }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface">
      <Spinner size="lg" className="text-accent" />
      <p className="mt-4 text-text-secondary">{message}</p>
    </div>
  );
}

export default Spinner;
