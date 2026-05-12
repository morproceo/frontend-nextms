/**
 * Step ordering + progress mapping for the carrier verification wizard.
 *
 * The verification row's `status` field is the source of truth — UI maps it
 * to a visible step.
 */

export const STEP_KEYS = ['mc', 'otp', 'identity', 'profile', 'pending'];

export const STEP_META = {
  mc:       { num: 1, label: 'Your MC',      short: 'MC' },
  otp:      { num: 2, label: 'Verify email', short: 'Email' },
  identity: { num: 3, label: 'Verify ID',    short: 'ID' },
  profile:  { num: 4, label: 'Profile',      short: 'Profile' },
  pending:  { num: 5, label: 'Done',         short: 'Done' }
};

const STATUS_TO_STEP = {
  not_started: 'mc',
  mc_pending: 'mc',
  otp_pending: 'otp',
  identity_pending: 'identity',
  profile_pending: 'profile',
  submitted: 'pending',
  approved: 'pending',
  rejected: 'pending'
};

export function statusToStep(status) {
  return STATUS_TO_STEP[status] || 'mc';
}

export function isApproved(verification) {
  return verification?.status === 'approved';
}
