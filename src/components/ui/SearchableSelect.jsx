import { useState, useRef, useEffect } from 'react';
import { Search, Plus, Check, ChevronDown, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * SearchableSelect - A dropdown with search and "Add New" functionality
 *
 * @param {Object} props
 * @param {string} props.value - Selected value ID
 * @param {function} props.onChange - Called with selected item or null
 * @param {Array} props.options - Array of { id, label, sublabel? } objects
 * @param {string} props.placeholder - Placeholder text
 * @param {function} props.onAddNew - Called when "Add New" is clicked
 * @param {string} props.addNewLabel - Label for add new button
 * @param {boolean} props.loading - Show loading state
 * @param {boolean} props.disabled - Disable the select
 * @param {string} props.error - Error message
 * @param {function} props.onSearch - Called when search query changes (for server-side search)
 */
export function SearchableSelect({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  onAddNew,
  addNewLabel = 'Add New',
  loading = false,
  disabled = false,
  error,
  onSearch,
  className
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find selected option
  const selectedOption = options.find(opt => opt.id === value);

  // Filter options based on search
  const filteredOptions = searchQuery
    ? options.filter(opt =>
        opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : options;

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Call onSearch when query changes
  useEffect(() => {
    if (onSearch) {
      const timer = setTimeout(() => {
        onSearch(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, onSearch]);

  const handleSelect = (option) => {
    onChange(option);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  const handleAddNew = () => {
    setIsOpen(false);
    setSearchQuery('');
    onAddNew?.();
  };

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          'w-full flex items-center justify-between gap-2 px-3 py-2',
          'bg-surface-secondary rounded-lg text-body-sm text-left',
          'focus:outline-none focus:ring-2 focus:ring-accent/20',
          'transition-colors',
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
          error ? 'ring-2 ring-error/20' : ''
        )}
      >
        <span className={selectedOption ? 'text-text-primary' : 'text-text-tertiary'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <div className="flex items-center gap-1">
          {selectedOption && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-0.5 rounded hover:bg-surface-tertiary"
            >
              <X className="w-3.5 h-3.5 text-text-tertiary" />
            </button>
          )}
          <ChevronDown className={cn(
            'w-4 h-4 text-text-tertiary transition-transform',
            isOpen ? 'rotate-180' : ''
          )} />
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-elevated border border-surface-tertiary overflow-hidden">
          {/* Add New Button - NOW AT TOP for easy access */}
          {onAddNew && (
            <div className="p-2 border-b border-surface-tertiary bg-accent/5">
              <button
                type="button"
                onClick={handleAddNew}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium text-accent hover:bg-accent/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {addNewLabel}
              </button>
            </div>
          )}

          {/* Search Input */}
          <div className="p-2 border-b border-surface-tertiary">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
              <input
                ref={inputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-8 pr-3 py-1.5 bg-surface-secondary rounded text-body-sm placeholder:text-text-tertiary focus:outline-none"
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-48 overflow-y-auto">
            {loading ? (
              <div className="px-3 py-4 text-center text-body-sm text-text-tertiary">
                Loading...
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="px-3 py-4 text-center text-body-sm text-text-tertiary">
                {searchQuery ? 'No results found' : 'No options available'}
              </div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2 text-left',
                    'hover:bg-surface-secondary transition-colors',
                    option.id === value ? 'bg-accent/5' : ''
                  )}
                >
                  <div>
                    <p className="text-body-sm text-text-primary">{option.label}</p>
                    {option.sublabel && (
                      <p className="text-small text-text-tertiary">{option.sublabel}</p>
                    )}
                  </div>
                  {option.id === value && (
                    <Check className="w-4 h-4 text-accent flex-shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-small text-error">{error}</p>
      )}
    </div>
  );
}

export default SearchableSelect;
