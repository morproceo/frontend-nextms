import { forwardRef } from 'react';
import { cn } from '../../lib/utils';

const Input = forwardRef(({
  className,
  type = 'text',
  error,
  label,
  hint,
  ...props
}, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-body-sm font-medium text-text-primary">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          'w-full px-4 py-3',
          'bg-surface-secondary text-text-primary',
          'border border-transparent rounded-input',
          'placeholder:text-text-tertiary',
          'transition-all duration-200',
          'focus:bg-white focus:border-accent focus:shadow-input-focus',
          'focus:outline-none',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          error && 'border-error focus:border-error focus:ring-error/20',
          className
        )}
        {...props}
      />
      {error && (
        <p className="text-small text-error">{error}</p>
      )}
      {hint && !error && (
        <p className="text-small text-text-tertiary">{hint}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export { Input };
export default Input;
