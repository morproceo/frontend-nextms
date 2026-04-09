import { LogOut, User, Lock } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import { useAuth } from '../../contexts/AuthContext';

export function InvestorSettingsPage() {
  const { user, logout } = useAuth();

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Page Header */}
      <div>
        <h1 className="text-title text-text-primary">Settings</h1>
        <p className="text-body-sm text-text-secondary mt-1">Manage your account</p>
      </div>

      {/* Profile Card */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
              <User className="w-5 h-5 text-accent" />
            </div>
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-small text-text-tertiary block mb-1">Email</label>
              <div className="text-body-sm text-text-primary">{user?.email || '-'}</div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-small text-text-tertiary block mb-1">First Name</label>
                <div className="text-body-sm text-text-primary">{user?.first_name || '-'}</div>
              </div>
              <div>
                <label className="text-small text-text-tertiary block mb-1">Last Name</label>
                <div className="text-body-sm text-text-primary">{user?.last_name || '-'}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center">
              <Lock className="w-5 h-5 text-amber-500" />
            </div>
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-secondary">
            To change your password, please contact your organization admin.
          </p>
        </CardContent>
      </Card>

      {/* Logout */}
      <Card variant="elevated" padding="default">
        <CardHeader>
          <CardTitle>Session</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-body-sm text-text-secondary mb-4">
            Sign out of your investor account on this device.
          </p>
          <button
            onClick={logout}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-button bg-red-500 text-white text-body-sm font-medium hover:bg-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </CardContent>
      </Card>
    </div>
  );
}

export default InvestorSettingsPage;
