import { useEffect } from 'react';
import { MIGRATION_BLOCKED_EVENT } from '../../config/migration';
import { useToast } from '../../contexts/ToastContext';

export function MigrationToastBridge() {
  const { toast } = useToast();

  useEffect(() => {
    const handleBlockedMutation = (event) => {
      const detail = event.detail || {};

      toast({
        title: detail.title || 'Updates are temporarily unavailable',
        description: detail.description || 'This site is in migration read-only mode.',
        variant: 'warning',
        durationMs: 6000
      });
    };

    window.addEventListener(MIGRATION_BLOCKED_EVENT, handleBlockedMutation);
    return () => window.removeEventListener(MIGRATION_BLOCKED_EVENT, handleBlockedMutation);
  }, [toast]);

  return null;
}

export default MigrationToastBridge;
