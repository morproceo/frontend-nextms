import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../lib/utils';

const buttonVariants = {
  primary: 'bg-accent text-white hover:bg-accent-hover active:bg-accent-active shadow-button hover:shadow-card',
  secondary: 'bg-surface-secondary text-text-primary hover:bg-surface-tertiary',
  ghost: 'bg-transparent text-accent hover:bg-accent/5',
  danger: 'bg-error text-white hover:bg-error/90',
  outline: 'border border-surface-tertiary bg-transparent text-text-primary hover:bg-surface-secondary'
};

const buttonSizes = {
  sm: 'px-4 py-2 text-body-sm',
  md: 'px-6 py-3 text-body',
  lg: 'px-8 py-4 text-body'
};

const LoadingSpinner = () => (
  <svg
    className="animate-spin h-4 w-4"
    viewBox="0 0 24 24"
    fill="none"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
    />
  </svg>
);

const Button = forwardRef(({
  className,
  variant = 'primary',
  size = 'md',
  asChild = false,
  loading = false,
  disabled = false,
  children,
  ...props
}, ref) => {
  const Comp = asChild ? Slot : 'button';
  const buttonClassName = cn(
    'inline-flex items-center justify-center gap-2',
    'font-medium transition-all duration-200',
    'rounded-button',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-accent/20',
    buttonVariants[variant],
    buttonSizes[size],
    className
  );

  // When using asChild, we can't add extra children (like loading spinner)
  // The child element must be the only child
  if (asChild) {
    return (
      <Comp
        ref={ref}
        className={buttonClassName}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      ref={ref}
      disabled={disabled || loading}
      className={buttonClassName}
      {...props}
    >
      {loading && <LoadingSpinner />}
      {children}
    </Comp>
  );
});

Button.displayName = 'Button';

export { Button, buttonVariants };
export default Button;
