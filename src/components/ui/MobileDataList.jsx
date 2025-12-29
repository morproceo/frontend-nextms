/**
 * MobileDataList Component
 * Displays data as cards on mobile, replaces tables
 */

import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * A mobile-friendly card-based data list
 * @param {Object} props
 * @param {Array} props.items - Array of data items
 * @param {Function} props.renderItem - Function to render each item (receives item, index)
 * @param {Function} props.onItemClick - Optional click handler for items
 * @param {string} props.emptyMessage - Message when no items
 * @param {boolean} props.loading - Loading state
 * @param {string} props.className - Additional classes
 */
export function MobileDataList({
  items = [],
  renderItem,
  onItemClick,
  emptyMessage = 'No items found',
  loading = false,
  className
}) {
  if (loading) {
    return (
      <div className={cn('space-y-3', className)}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-card p-4 shadow-card animate-pulse">
            <div className="h-4 bg-surface-tertiary rounded w-3/4 mb-3" />
            <div className="h-3 bg-surface-tertiary rounded w-1/2 mb-2" />
            <div className="h-3 bg-surface-tertiary rounded w-1/3" />
          </div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className={cn('bg-white rounded-card p-8 text-center shadow-card', className)}>
        <p className="text-text-tertiary">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {items.map((item, index) => (
        <div
          key={item.id || index}
          onClick={() => onItemClick?.(item)}
          className={cn(
            'bg-white rounded-card p-4 shadow-card',
            'transition-all duration-200',
            onItemClick && 'cursor-pointer active:scale-[0.98] hover:shadow-card-hover'
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {renderItem(item, index)}
            </div>
            {onItemClick && (
              <ChevronRight className="w-5 h-5 text-text-tertiary flex-shrink-0 mt-1" />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Mobile list item row - for consistent styling
 */
export function MobileListRow({ label, value, className }) {
  return (
    <div className={cn('flex items-center justify-between py-1', className)}>
      <span className="text-small text-text-tertiary">{label}</span>
      <span className="text-body-sm text-text-primary font-medium">{value}</span>
    </div>
  );
}

/**
 * Mobile list header - title and optional badge
 */
export function MobileListHeader({ title, subtitle, badge, icon: Icon }) {
  return (
    <div className="mb-3">
      <div className="flex items-center gap-2 mb-1">
        {Icon && <Icon className="w-4 h-4 text-text-tertiary" />}
        <h3 className="text-body font-semibold text-text-primary truncate">{title}</h3>
        {badge}
      </div>
      {subtitle && (
        <p className="text-small text-text-tertiary truncate">{subtitle}</p>
      )}
    </div>
  );
}

/**
 * Responsive table/list container
 * Shows table on desktop, mobile list on mobile
 */
export function ResponsiveDataView({
  children,
  mobileView,
  className
}) {
  return (
    <div className={className}>
      {/* Desktop Table View */}
      <div className="hidden lg:block">
        {children}
      </div>
      {/* Mobile Card View */}
      <div className="lg:hidden">
        {mobileView}
      </div>
    </div>
  );
}

export default MobileDataList;
