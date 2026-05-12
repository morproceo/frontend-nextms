import api from './client';

const root = '/v1/network/me/verification';

export async function getMyVerification() {
  const { data } = await api.get(root);
  return data?.data;
}

export async function submitMc({ mc_number, dot_number }) {
  const { data } = await api.post(`${root}/mc`, { mc_number, dot_number });
  return data?.data;
}

export async function sendOtp({ force = false } = {}) {
  const { data } = await api.post(`${root}/otp/send`, { force });
  return data?.data;
}

export async function verifyOtp(code) {
  const { data } = await api.post(`${root}/otp/verify`, { code });
  return data?.data;
}

export async function startIdentity() {
  const { data } = await api.post(`${root}/identity/start`);
  return data?.data;
}

export async function completeIdentity({ stub_name } = {}) {
  const { data } = await api.post(`${root}/identity/complete`, { stub_name });
  return data?.data;
}

export async function submitProfile(profile) {
  const { data } = await api.post(`${root}/profile`, { profile });
  return data?.data;
}

// Admin
export async function adminListVerifications(status = 'submitted') {
  const { data } = await api.get('/v1/network/admin/verifications', { params: { status } });
  return data?.data;
}

export async function adminGetVerification(orgId) {
  const { data } = await api.get(`/v1/network/admin/verifications/${orgId}`);
  return data?.data;
}

export async function adminApprove(orgId) {
  const { data } = await api.post(`/v1/network/admin/verifications/${orgId}/approve`);
  return data?.data;
}

export async function adminReject(orgId, reason) {
  const { data } = await api.post(`/v1/network/admin/verifications/${orgId}/reject`, { reason });
  return data?.data;
}

export async function adminOverrideNameMatch(orgId) {
  const { data } = await api.post(`/v1/network/admin/verifications/${orgId}/override-name-match`);
  return data?.data;
}

export default {
  getMyVerification,
  submitMc,
  sendOtp,
  verifyOtp,
  startIdentity,
  completeIdentity,
  submitProfile,
  adminListVerifications,
  adminGetVerification,
  adminApprove,
  adminReject,
  adminOverrideNameMatch
};
