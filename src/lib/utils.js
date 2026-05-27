import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes intelligently
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

const LAST_ORG_SLUG_KEY = 'tms_last_org_slug';

/**
 * Get organization slug from URL.
 *
 * Resolution order:
 *   1. Subdomain: {slug}.app.com
 *   2. Path: /o/{slug}/...
 *   3. Cached last-known slug from a previous successful resolution
 *      (saved to localStorage). Covers the brief navigation race where
 *      an API call fires before the path settles into /o/<slug>.
 *   4. Investor/driver portal stored slug.
 *
 * Whenever (1) or (2) succeeds, we update the cache so step 3 stays
 * fresh.
 */
export function getOrgSlug() {
  const host = window.location.host;
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'localhost:5173';

  // Check subdomain: {slug}.app.com
  if (host !== baseDomain && host.endsWith(`.${baseDomain}`)) {
    const slug = host.replace(`.${baseDomain}`, '');
    rememberOrgSlug(slug);
    return slug;
  }

  // Check path: /o/{slug}/...
  const match = window.location.pathname.match(/^\/o\/([a-z0-9-]+)/);
  if (match) {
    rememberOrgSlug(match[1]);
    return match[1];
  }

  // Fall back to the last-known slug so API calls fired during a
  // brief navigation gap still carry org context. We don't restrict
  // this to the org-routes prefix because the backend will reject
  // mismatches at the membership check anyway.
  try {
    const cached = localStorage.getItem(LAST_ORG_SLUG_KEY);
    if (cached) return cached;
  } catch {
    /* localStorage unavailable — ignore */
  }

  // For investor/driver portals — use stored org slug from their single org
  const storedSlug = localStorage.getItem('tms_portal_org_slug');
  if (storedSlug && (window.location.pathname.startsWith('/investor') || window.location.pathname.startsWith('/driver'))) {
    return storedSlug;
  }

  return null;
}

function rememberOrgSlug(slug) {
  try { localStorage.setItem(LAST_ORG_SLUG_KEY, slug); } catch { /* ignore */ }
}

/**
 * Build org-prefixed URL
 */
export function buildOrgUrl(path, orgSlug) {
  const baseDomain = import.meta.env.VITE_BASE_DOMAIN || 'localhost:5173';
  const currentHost = window.location.host;

  // If we're on a subdomain, use subdomain routing
  if (currentHost !== baseDomain && currentHost.endsWith(`.${baseDomain}`)) {
    return path;
  }

  // Otherwise use path-based routing
  return `/o/${orgSlug}${path}`;
}

/**
 * Format currency
 */
export function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency
  }).format(amount);
}

/**
 * Format date
 */
export function formatDate(date, options = {}) {
  if (!date) return '';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(new Date(date));
}

/**
 * Format relative time
 */
export function formatRelativeTime(date) {
  if (!date) return '';

  const now = new Date();
  const then = new Date(date);
  const diffMs = now - then;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return formatDate(date);
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Generate initials from name
 */
export function getInitials(name) {
  if (!name) return '';
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}
