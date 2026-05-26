import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Compact page-number pager. Shows up to 7 buttons centered on the current
 * page, with ellipses on either side when totalPages is larger. Prev/Next
 * arrows on the ends. Scrolls to top on change so the user sees the new
 * rows immediately.
 *
 * Shared across list pages (expenses, fuel transactions, loads, etc).
 * Props:
 *  - page: 1-indexed current page
 *  - totalPages: max page
 *  - loading: disables all controls while a fetch is in-flight
 *  - onChange(n): called with the target page when the user clicks
 *  - scroll: set to false to suppress the auto-scroll-to-top behavior
 */
export function Pager({ page, totalPages, loading = false, onChange, scroll = true }) {
  if (!totalPages || totalPages <= 1) return null;

  const go = (n) => {
    if (loading || n === page || n < 1 || n > totalPages) return;
    onChange(n);
    if (scroll && typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Build visible page list: always 1 and totalPages, then a window around
  // current page. Insert ellipsis sentinels for gaps.
  const items = [];
  const push = (n) => { if (!items.includes(n)) items.push(n); };
  push(1);
  for (let n = page - 2; n <= page + 2; n++) {
    if (n >= 1 && n <= totalPages) push(n);
  }
  push(totalPages);
  items.sort((a, b) => a - b);
  const withEllipses = [];
  items.forEach((n, i) => {
    if (i > 0 && n - items[i - 1] > 1) withEllipses.push('…');
    withEllipses.push(n);
  });

  const btn = 'min-w-[36px] h-9 px-2 rounded-md text-body-sm font-medium border transition-colors';
  const idle = 'bg-surface-primary border-surface-tertiary text-text-secondary hover:bg-surface-secondary';
  const active = 'bg-text-primary border-text-primary text-white';
  const disabled = 'opacity-40 cursor-not-allowed';

  return (
    <div className="flex items-center justify-center gap-1.5 pt-2">
      <button
        type="button"
        onClick={() => go(page - 1)}
        disabled={loading || page === 1}
        className={`${btn} ${idle} ${page === 1 ? disabled : ''} flex items-center justify-center`}
        aria-label="Previous page"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      {withEllipses.map((item, idx) =>
        item === '…' ? (
          <span key={`e${idx}`} className="px-1 text-text-tertiary">…</span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => go(item)}
            disabled={loading}
            className={`${btn} ${item === page ? active : idle}`}
            aria-current={item === page ? 'page' : undefined}
          >
            {item}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => go(page + 1)}
        disabled={loading || page === totalPages}
        className={`${btn} ${idle} ${page === totalPages ? disabled : ''} flex items-center justify-center`}
        aria-label="Next page"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Pager;
