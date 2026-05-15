/**
 * NotificationsPage — placeholder.
 *
 * Email preferences aren't wired up yet; this page exists so the nav item
 * has a destination. Real implementation lands when the notifications
 * model gets per-user channel preferences.
 */

import { Bell, Mail } from 'lucide-react';

export default function NotificationsPage() {
  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-title text-text-primary flex items-center gap-2">
          <Bell className="w-6 h-6" />
          Notifications
        </h1>
        <p className="text-body-sm text-text-secondary mt-1">
          Choose what we email you about
        </p>
      </div>

      <div className="bg-surface-primary rounded-card border border-surface-tertiary p-8 text-center">
        <Mail className="w-12 h-12 text-text-tertiary mx-auto mb-3" />
        <h2 className="text-title-sm text-text-primary mb-1">Coming soon</h2>
        <p className="text-body-sm text-text-secondary max-w-md mx-auto">
          Per-channel email preferences (load updates, payment alerts, system notices) will land here. For now you'll receive all transactional emails by default.
        </p>
      </div>
    </div>
  );
}
