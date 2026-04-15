/**
 * DriverReadinessHistoryDrawer
 *
 * Slide-over showing the most recent readiness snapshots for a driver.
 * Custom overlay matching the existing modal pattern (no Radix Dialog
 * primitive in this repo — see UX/UI plan §1.1).
 */

import { useEffect } from 'react';
import { X, History as HistoryIcon } from 'lucide-react';
import { Spinner } from '../../ui/Spinner';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { useDriverReadinessHistoryDomain } from '../../../hooks/domain/useReadiness';

function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export function DriverReadinessHistoryDrawer({ driverId, open, onClose }) {
  const { history, loading, error } = useDriverReadinessHistoryDomain(driverId, {
    autoFetch: open,
    limit: 20
  });

  // Lock body scroll when open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end" aria-modal="true" role="dialog">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md h-full shadow-xl flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-tertiary">
          <h3 className="text-title-sm flex items-center gap-2">
            <HistoryIcon className="w-5 h-5 text-accent" /> Readiness History
          </h3>
          <button
            onClick={onClose}
            className="text-text-secondary hover:text-text-primary"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {loading && (
            <div className="flex items-center justify-center py-10">
              <Spinner size="md" />
            </div>
          )}

          {error && !loading && (
            <div className="bg-error/10 border border-error/20 rounded p-3 text-body-sm text-error">
              {error}
            </div>
          )}

          {!loading && !error && history.length === 0 && (
            <div className="text-center py-10">
              <p className="text-body-sm text-text-secondary">
                No history yet. Recompute to create the first snapshot.
              </p>
            </div>
          )}

          {!loading && history.length > 0 && (
            <ul className="space-y-3">
              {history.map(snap => (
                <li
                  key={snap.id}
                  className="border border-surface-tertiary rounded p-3 hover:bg-surface-secondary/40 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <ReadinessTierBadge tier={snap.readiness_tier} showLabel />
                    <span className="text-[11px] text-text-secondary tabular-nums">
                      Score {Number(snap.readiness_score).toFixed(0)}
                    </span>
                  </div>
                  <div className="text-body-sm text-text-primary">
                    {formatDateTime(snap.computed_at)}
                  </div>
                  <div className="text-[11px] text-text-secondary mt-0.5">
                    {snap.computed_by} • config {snap.scoring_config_version}
                    {snap.high_impact_eligible && ' • HI eligible'}
                    {snap.dedicated_eligible && ' • Dedicated eligible'}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

export default DriverReadinessHistoryDrawer;
