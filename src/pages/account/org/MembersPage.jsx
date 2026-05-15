/**
 * MembersPage — team management for the current organization.
 *
 * Split out of the old SettingsPage. Same invite/role/remove logic.
 */

import { useState } from 'react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAuth } from '../../../contexts/AuthContext';
import organizationsApi from '../../../api/organizations.api';
import {
  Users,
  Mail,
  Shield,
  Trash2,
  UserPlus,
  Loader2,
  X,
  AlertCircle
} from 'lucide-react';

const ROLES = [
  { value: 'owner', label: 'Owner', description: 'Full access to all features and billing' },
  { value: 'admin', label: 'Administrator', description: 'Full access except billing management' },
  { value: 'dispatcher', label: 'Dispatcher', description: 'Manage loads, drivers, and dispatch' },
  { value: 'driver', label: 'Driver', description: 'View assigned loads and upload documents' },
  { value: 'accountant', label: 'Accountant', description: 'Access to invoicing and financial reports' },
  { value: 'investor', label: 'Investor', description: 'Read-only access to financials, loads, and fleet' },
  { value: 'viewer', label: 'Viewer', description: 'Read-only access to operational data' }
];

export default function MembersPage() {
  const { organization, members, refreshMembers, inviteMember } = useOrg();
  const { user } = useAuth();

  const [inviteForm, setInviteForm] = useState({ email: '', role: 'dispatcher' });
  const [inviting, setInviting] = useState(false);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [error, setError] = useState(null);

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviting(true);
    setError(null);
    try {
      await inviteMember(inviteForm);
      setInviteForm({ email: '', role: 'dispatcher' });
      setShowInviteForm(false);
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to send invitation');
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (memberId) => {
    if (!confirm('Are you sure you want to remove this member?')) return;
    try {
      await organizationsApi.removeMember(organization.id, memberId);
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to remove member');
    }
  };

  const handleUpdateRole = async (memberId, newRole) => {
    try {
      await organizationsApi.updateMember(organization.id, memberId, { role: newRole });
      await refreshMembers();
    } catch (err) {
      setError(err.message || 'Failed to update role');
    }
  };

  if (!organization) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-title text-text-primary flex items-center gap-2">
            <Users className="w-6 h-6 flex-shrink-0" />
            Members
          </h1>
          <p className="text-body-sm text-text-secondary mt-1">
            {members.length} member{members.length !== 1 ? 's' : ''} in {organization.name}
          </p>
        </div>
        <button
          onClick={() => setShowInviteForm(true)}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-accent hover:bg-accent-hover text-white rounded-button text-body-sm font-medium transition-colors flex-shrink-0 w-full sm:w-auto"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-error/10 border border-error/20 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <p className="text-body-sm text-error">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4 text-error" />
          </button>
        </div>
      )}

      {showInviteForm && (
        <div className="bg-surface-primary rounded-card border border-surface-tertiary p-6 mb-6">
          <h3 className="text-body font-medium text-text-primary mb-4">Invite New Member</h3>
          <form onSubmit={handleInvite} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="email"
                placeholder="Email address"
                value={inviteForm.email}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, email: e.target.value }))}
                required
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              />
            </div>
            <div>
              <select
                value={inviteForm.role}
                onChange={(e) => setInviteForm((prev) => ({ ...prev, role: e.target.value }))}
                className="w-full px-4 py-3 bg-surface-secondary border border-surface-tertiary rounded-input text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
              >
                {ROLES.filter((r) => r.value !== 'owner').map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={inviting}
                className="px-4 py-3 bg-accent hover:bg-accent-hover text-white rounded-button font-medium transition-colors disabled:opacity-50"
              >
                {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send Invite'}
              </button>
              <button
                type="button"
                onClick={() => setShowInviteForm(false)}
                className="px-4 py-3 bg-surface-secondary hover:bg-surface-tertiary text-text-primary rounded-button transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-surface-primary rounded-card border border-surface-tertiary overflow-hidden">
        <div className="divide-y divide-surface-tertiary">
          {members.map((member) => (
            <div
              key={member.id}
              className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-surface-secondary/50"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-accent font-medium text-body-sm">
                    {(member.first_name?.[0] || member.email[0]).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-body-sm font-medium text-text-primary truncate">
                    {member.first_name && member.last_name
                      ? `${member.first_name} ${member.last_name}`
                      : member.email}
                    {member.user_id === user?.id && (
                      <span className="ml-2 text-xs text-text-tertiary">(You)</span>
                    )}
                  </div>
                  <div className="text-small text-text-tertiary flex items-center gap-2 min-w-0">
                    <Mail className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{member.email}</span>
                    {member.status === 'invited' && (
                      <span className="px-2 py-0.5 bg-warning/10 text-warning text-xs rounded-full flex-shrink-0">
                        Pending
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto pl-[52px] sm:pl-0">
                {member.role === 'owner' ? (
                  <span className="flex items-center gap-1 px-3 py-1.5 bg-accent/10 text-accent text-body-sm rounded-chip">
                    <Shield className="w-4 h-4" />
                    Owner
                  </span>
                ) : member.user_id !== user?.id ? (
                  <>
                    <select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.id, e.target.value)}
                      className="flex-1 sm:flex-none px-3 py-1.5 bg-surface-secondary border border-surface-tertiary rounded-chip text-body-sm text-text-primary"
                    >
                      {ROLES.filter((r) => r.value !== 'owner').map((role) => (
                        <option key={role.value} value={role.value}>
                          {role.label}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id)}
                      aria-label="Remove member"
                      className="p-2 text-text-tertiary hover:text-error hover:bg-error/10 rounded-chip transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <span className="px-3 py-1.5 bg-surface-secondary text-text-secondary text-body-sm rounded-chip capitalize">
                    {member.role}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
