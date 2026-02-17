import client, { TokenManager } from './client';

/**
 * Auth API
 */
export const authApi = {
  /**
   * Request OTP for login
   */
  login: async (email) => {
    const response = await client.post('/v1/auth/login', { email });
    return response.data;
  },

  /**
   * Login with email and password
   */
  loginWithPassword: async (email, password) => {
    const response = await client.post('/v1/auth/login/password', { email, password });

    if (response.data.success) {
      const { accessToken, refreshToken } = response.data.data.tokens;
      TokenManager.setTokens(accessToken, refreshToken);
    }

    return response.data;
  },

  /**
   * Request OTP for signup
   */
  signup: async (email) => {
    const response = await client.post('/v1/auth/signup', { email });
    return response.data;
  },

  /**
   * Verify OTP and get tokens
   */
  verify: async (email, code) => {
    const response = await client.post('/v1/auth/verify', { email, code });

    if (response.data.success) {
      const { accessToken, refreshToken } = response.data.data.tokens;
      TokenManager.setTokens(accessToken, refreshToken);
    }

    return response.data;
  },

  /**
   * Refresh access token
   */
  refresh: async () => {
    const refreshToken = TokenManager.getRefreshToken();
    const response = await client.post('/v1/auth/refresh', {
      refresh_token: refreshToken
    });

    if (response.data.success) {
      const { accessToken, refreshToken: newRefreshToken } = response.data.data.tokens;
      TokenManager.setTokens(accessToken, newRefreshToken);
    }

    return response.data;
  },

  /**
   * Logout
   */
  logout: async () => {
    try {
      const refreshToken = TokenManager.getRefreshToken();
      await client.post('/v1/auth/logout', { refresh_token: refreshToken });
    } finally {
      TokenManager.clearTokens();
    }
  },

  /**
   * Get current user
   */
  getMe: async () => {
    const response = await client.get('/v1/auth/me');
    return response.data;
  },

  /**
   * Driver self-registration
   */
  driverSignup: async (data) => {
    const response = await client.post('/v1/auth/driver-signup', data);
    return response.data;
  },

  /**
   * Update profile
   */
  updateProfile: async (data) => {
    const response = await client.patch('/v1/auth/me', data);
    return response.data;
  }
};

export default authApi;
