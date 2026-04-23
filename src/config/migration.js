const DRY_RUN_STORAGE_KEY = 'tms_migration_dryrun';
const VALID_DRY_RUNS = new Set(['freeze', 'migrate']);

// April 23, 2026 6:00 PM America/New_York
export const MIGRATION_FREEZE_AT_UTC = '2026-04-23T22:00:00Z';
// April 24, 2026 6:00 AM America/New_York
export const MIGRATION_REDIRECT_AT_UTC = '2026-04-24T10:00:00Z';
export const MIGRATION_TARGET_URL = 'https://app.morpronext.com/login';
export const MIGRATION_TIMEZONE = 'America/New_York';
export const MIGRATION_BLOCKED_EVENT = 'tms:migration-blocked';

const FRONTEND_ALLOWED_MUTATIONS = new Set([
  '/v1/auth/login',
  '/v1/auth/login/password',
  '/v1/auth/verify',
  '/v1/auth/refresh',
  '/v1/auth/logout',
  '/v1/auth/logout-all'
]);

function getStorage() {
  if (typeof window === 'undefined') return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function getMigrationDryRun(search = typeof window !== 'undefined' ? window.location.search : '') {
  const storage = getStorage();
  const params = new URLSearchParams(search || '');
  const requestedMode = params.get('dryrun');

  if (requestedMode === 'clear') {
    storage?.removeItem(DRY_RUN_STORAGE_KEY);
    return null;
  }

  if (VALID_DRY_RUNS.has(requestedMode)) {
    storage?.setItem(DRY_RUN_STORAGE_KEY, requestedMode);
    return requestedMode;
  }

  const persistedMode = storage?.getItem(DRY_RUN_STORAGE_KEY);
  return VALID_DRY_RUNS.has(persistedMode) ? persistedMode : null;
}

export function getMigrationState({ nowMs = Date.now(), search } = {}) {
  const freezeAtMs = Date.parse(MIGRATION_FREEZE_AT_UTC);
  const redirectAtMs = Date.parse(MIGRATION_REDIRECT_AT_UTC);
  const dryRun = getMigrationDryRun(search);

  let mode = 'normal';

  if (dryRun === 'migrate' || nowMs >= redirectAtMs) {
    mode = 'redirect';
  } else if (dryRun === 'freeze' || nowMs >= freezeAtMs) {
    mode = 'freeze';
  }

  return {
    mode,
    dryRun,
    isFrozen: mode === 'freeze' || mode === 'redirect',
    shouldRedirect: mode === 'redirect',
    freezeAtUtc: MIGRATION_FREEZE_AT_UTC,
    redirectAtUtc: MIGRATION_REDIRECT_AT_UTC,
    targetUrl: MIGRATION_TARGET_URL,
    timezone: MIGRATION_TIMEZONE,
    freezeLabel: 'April 23, 2026 at 6:00 PM ET',
    redirectLabel: 'April 24, 2026 at 6:00 AM ET'
  };
}

export function isMutationMethod(method = 'get') {
  return ['post', 'put', 'patch', 'delete'].includes(String(method).toLowerCase());
}

function normalizeRequestPath(url) {
  if (!url) return '';

  try {
    const parsedUrl = url.startsWith('http')
      ? new URL(url)
      : new URL(url, window.location.origin);

    return parsedUrl.pathname.replace(/^\/api/, '');
  } catch {
    return String(url).replace(/^https?:\/\/[^/]+/i, '').replace(/^\/api/, '');
  }
}

export function shouldAllowFrontendMutation(url, method) {
  if (!isMutationMethod(method)) return true;

  const path = normalizeRequestPath(url);
  return FRONTEND_ALLOWED_MUTATIONS.has(path);
}
