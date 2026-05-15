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
   * Best-effort FMCSA/SAFER prefill for the create-org form.
   * Never throws on a miss — returns { found: false } so the UI falls
   * back to manual entry. NOT verification (that happens later in Direct).
   */
  carrierLookup: async (dot) => {
    const response = await client.get('/v1/onboarding/carrier-lookup', {
      params: { dot }
    });
    return response.data?.data ?? response.data;
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
   * Request to join an existing org via its org_code. Creates an `invited`
   * membership; admin must approve before it activates.
   */
  joinByCode: async (code) => {
    const response = await client.post('/v1/organizations/join-request', { code });
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
