import axios from 'axios';
import { getOrgSlug } from '../lib/utils';

// Default to a same-origin /api path — Vite's dev proxy forwards it to
// localhost:3001 internally. Works transparently for:
//   - localhost:5173 (dev on this laptop)
//   - <lan-ip>:5173 (phone on the same Wi-Fi)
//   - <random>.trycloudflare.com (HTTPS tunnel — required for phone mic)
// An explicit VITE_API_URL still wins (prod / test env overrides).
const API_URL = (() => {
  const explicit = import.meta.env.VITE_API_URL;
  if (explicit) return explicit;
  return '/api';
})();

/**
 * Create axios instance with defaults
 */
const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

/**
 * Token storage keys
 */
const ACCESS_TOKEN_KEY = 'tms_access_token';
const REFRESH_TOKEN_KEY = 'tms_refresh_token';

/**
 * Token management
 */
export const TokenManager = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  setTokens: (accessToken, refreshToken) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
};

/**
 * Request interceptor - add auth token and org slug
 */
client.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add organization slug header for tenant resolution
    const orgSlug = getOrgSlug();
    if (orgSlug) {
      config.headers['X-Organization-Slug'] = orgSlug;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/**
 * Response interceptor - handle token refresh
 */
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (cb) => {
  refreshSubscribers.push(cb);
};

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // 402 Payment Required — the backend's paywall middleware blocked
    // this call because the org's subscription is expired/cancelled.
    // Emit a global event so SubscriptionGate opens the paywall modal
    // even if its 30s poll hadn't yet noticed the status flip.
    if (
      error.response?.status === 402 &&
      error.response?.data?.error?.code === 'SUBSCRIPTION_REQUIRED'
    ) {
      try {
        window.dispatchEvent(new CustomEvent('paywall:show', {
          detail: error.response.data.error
        }));
      } catch { /* old browsers — ignore */ }
      return Promise.reject(error);
    }

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // Wait for token refresh
        return new Promise((resolve) => {
          addRefreshSubscriber((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            resolve(client(originalRequest));
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = TokenManager.getRefreshToken();

      if (!refreshToken) {
        // No refresh token - clear auth state
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Attempt token refresh
        const response = await axios.post(`${API_URL}/v1/auth/refresh`, {
          refresh_token: refreshToken
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;

        TokenManager.setTokens(accessToken, newRefreshToken);
        isRefreshing = false;
        onRefreshed(accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return client(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
