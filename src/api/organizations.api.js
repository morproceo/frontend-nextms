import client from './client';

/**
 * Organizations API
 */
export const organizationsApi = {
  /**
   * Get user's organizations
   */
  list: async (includeInvited = false) => {
    const response = await client.get('/v1/organizations', {
      params: { include_invited: includeInvited }
    });
    return response.data;
  },

  /**
   * Create organization
   */
  create: async (data) => {
    const response = await client.post('/v1/organizations', data);
    return response.data;
  },

  /**
   * Get organization by ID
   */
  get: async (orgId) => {
    const response = await client.get(`/v1/organizations/${orgId}`);
    return response.data;
  },

  /**
   * Resolve organization by slug
   */
  resolve: async (slug) => {
    const response = await client.get('/v1/organizations/resolve', {
      params: { slug }
    });
    return response.data;
  },

  /**
   * Check slug availability
   */
  checkSlug: async (slug) => {
    const response = await client.get('/v1/organizations/check-slug', {
      params: { slug }
    });
    return response.data;
  },

  /**
   * Update organization
   */
  update: async (orgId, data) => {
    const response = await client.patch(`/v1/organizations/${orgId}`, data);
    return response.data;
  },

  /**
   * Get organization members
   */
  getMembers: async (orgId) => {
    const response = await client.get(`/v1/organizations/${orgId}/members`);
    return response.data;
  },

  /**
   * Invite member
   */
  inviteMember: async (orgId, data) => {
    const response = await client.post(`/v1/organizations/${orgId}/invitations`, data);
    return response.data;
  },

  /**
   * Accept invitation
   */
  acceptInvitation: async (token) => {
    const response = await client.post(`/v1/organizations/invitations/${token}/accept`);
    return response.data;
  },

  /**
   * Update member
   */
  updateMember: async (orgId, memberId, data) => {
    const response = await client.patch(`/v1/organizations/${orgId}/members/${memberId}`, data);
    return response.data;
  },

  /**
   * Remove member
   */
  removeMember: async (orgId, memberId) => {
    const response = await client.delete(`/v1/organizations/${orgId}/members/${memberId}`);
    return response.data;
  }
};

export default organizationsApi;
