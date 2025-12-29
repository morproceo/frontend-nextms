/**
 * Membership Status
 */

export const MembershipStatus = Object.freeze({
  INVITED: 'invited',
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  LEFT: 'left'
});

export const MembershipStatusLabels = Object.freeze({
  [MembershipStatus.INVITED]: 'Invited',
  [MembershipStatus.ACTIVE]: 'Active',
  [MembershipStatus.SUSPENDED]: 'Suspended',
  [MembershipStatus.LEFT]: 'Left'
});

export const MembershipStatusTransitions = Object.freeze({
  [MembershipStatus.INVITED]: [MembershipStatus.ACTIVE, MembershipStatus.LEFT],
  [MembershipStatus.ACTIVE]: [MembershipStatus.SUSPENDED, MembershipStatus.LEFT],
  [MembershipStatus.SUSPENDED]: [MembershipStatus.ACTIVE, MembershipStatus.LEFT],
  [MembershipStatus.LEFT]: []
});

export const canTransitionTo = (currentStatus, newStatus) => {
  const allowed = MembershipStatusTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
};
