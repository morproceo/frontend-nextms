/**
 * Motive OAuth client.
 *
 * One-shot helpers used by the org integrations page and the driver
 * My Truck page to kick off + tear down a Motive connection.
 */

import api from './client';

/**
 * Ask the backend for a Motive consent URL. The caller opens it in a
 * popup window. Backend signs `state` so the callback can recover
 * mode/orgId/userId without trusting the browser.
 *
 * @param {'org'|'user'} mode
 * @param {string} [returnTo] optional frontend path to land on after success
 * @returns {Promise<{ authUrl: string }>}
 */
export async function startConnect(mode = 'org', returnTo) {
  const r = await api.post('/v1/oauth/motive/start', {
    mode,
    return_to: returnTo || null
  });
  return r.data?.data || r.data;
}

/**
 * Disconnect the current Motive integration. Backend clears tokens /
 * API key and flips is_active=false.
 */
export async function disconnect(mode = 'org') {
  const r = await api.delete('/v1/oauth/motive', { params: { mode } });
  return r.data?.data || r.data;
}

/**
 * Open the Motive consent URL in a centered popup window. Returns the
 * popup window handle so the caller can listen for postMessage.
 */
export function openOAuthPopup(authUrl, name = 'motive_oauth') {
  const w = 600, h = 720;
  const left = window.screenX + Math.max(0, (window.outerWidth - w) / 2);
  const top = window.screenY + Math.max(0, (window.outerHeight - h) / 2);
  return window.open(
    authUrl,
    name,
    `width=${w},height=${h},left=${left},top=${top},menubar=no,toolbar=no,location=no,status=no`
  );
}

export default { startConnect, disconnect, openOAuthPopup };
