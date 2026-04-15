/**
 * OverrideReasonModal
 *
 * Required-reason capture for a blocked-evaluation override (Phase 5).
 * Server validates min length and refuses unoverridable codes per the
 * scoring config's override_policy.
 */

import { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { ReasonCodeList } from '../../readiness/ReasonCodeList';

const DEFAULT_MIN = 20;

export function OverrideReasonModal({
  isOpen,
  onClose,
  evaluation,
  minReasonLength = DEFAULT_MIN,
  unoverridableCodes = [],
  saving,
  error,
  onSubmit
}) {
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (isOpen) setReason('');
  }, [isOpen]);

  if (!isOpen) return null;

  const blockingReasons = (evaluation?.reason_codes || []).filter(r => r.severity === 'block');
  const unoverridableHit = blockingReasons.find(r => {
    const suffix = (r.code || '').replace(/^HARD_GATE\./, '');
    return unoverridableCodes.includes(r.code) || unoverridableCodes.includes(suffix);
  });

  const tooShort = reason.trim().length < minReasonLength;
  const canSubmit = !saving && !tooShort && !unoverridableHit;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-surface-primary rounded-2xl shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-surface-tertiary">
          <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-error" /> Override Reason
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-text-tertiary hover:text-text-primary rounded-lg hover:bg-surface-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {blockingReasons.length > 0 && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <div className="text-body-sm font-medium text-error mb-2">
                You are overriding {blockingReasons.length} block-severity reason{blockingReasons.length !== 1 ? 's' : ''}:
              </div>
              <ReasonCodeList reasons={blockingReasons} compact max={5} />
            </div>
          )}

          {unoverridableHit && (
            <div className="bg-error/15 border border-error/30 rounded-lg p-3">
              <div className="text-body-sm font-semibold text-error">
                Override refused
              </div>
              <p className="text-body-sm text-error mt-1">
                The reason code <code className="font-mono text-[11px]">{unoverridableHit.code}</code> cannot
                be overridden by policy. Resolve the underlying issue.
              </p>
            </div>
          )}

          <div>
            <label className="block text-body-sm font-medium text-text-primary mb-1">
              Reason for override <span className="text-text-tertiary">(min {minReasonLength} characters)</span>
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={4}
              disabled={saving || !!unoverridableHit}
              placeholder="Describe why this override is justified — this is permanent in the audit log."
              className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-3 py-2 focus:outline-none focus:border-accent disabled:bg-surface-secondary"
            />
            <div className="flex justify-between items-center text-[11px] mt-1">
              <span className={tooShort ? 'text-error' : 'text-text-secondary'}>
                {reason.trim().length} / {minReasonLength}+ characters
              </span>
              <span className="text-text-secondary">Recorded against your user account</span>
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 rounded-lg p-3">
              <p className="text-body-sm text-error">{error}</p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-5 border-t border-surface-tertiary bg-surface-secondary/50">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button
            onClick={() => onSubmit?.(reason.trim())}
            disabled={!canSubmit}
            variant="danger"
          >
            {saving ? <><Spinner size="sm" className="mr-2" /> Submitting…</> : 'Confirm Override'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default OverrideReasonModal;
