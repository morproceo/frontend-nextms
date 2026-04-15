/**
 * EvaluationPanel
 *
 * Slot inside AssignDriverModal that fires `POST /v1/dispatch/evaluate`
 * each time the dispatcher selects a driver and renders the resulting
 * decision via EvaluationDecisionBanner.
 *
 * Phase 4: non-blocking. Assign button stays usable. Override / Request
 * Review controls land in Phase 5.
 */

import { useEffect, useRef, useState } from 'react';
import { Spinner } from '../../ui/Spinner';
import { EvaluationDecisionBanner } from '../../readiness/EvaluationDecisionBanner';
import { useAssignmentEvaluation } from '../../../hooks/api/useReadinessApi';

export function EvaluationPanel({ loadId, driverId, onEvaluated }) {
  const { evaluate, loading, error } = useAssignmentEvaluation();
  const [evaluation, setEvaluation] = useState(null);

  // Per-driver result cache so re-selecting a driver doesn't refire the call.
  const cacheRef = useRef(new Map());

  useEffect(() => {
    setEvaluation(null);
    if (!loadId || !driverId) return;

    const key = `${loadId}|${driverId}`;
    const cached = cacheRef.current.get(key);
    if (cached) {
      setEvaluation(cached);
      onEvaluated?.(cached);
      return;
    }

    let cancelled = false;
    evaluate(loadId, driverId)
      .then(result => {
        if (cancelled) return;
        cacheRef.current.set(key, result);
        setEvaluation(result);
        onEvaluated?.(result);
      })
      .catch(() => { /* error surfaced via `error` */ });

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loadId, driverId]);

  if (!driverId) return null;

  if (loading && !evaluation) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-secondary text-body-sm text-text-secondary">
        <Spinner size="sm" /> Checking driver readiness…
      </div>
    );
  }

  if (error && !evaluation) {
    return (
      <div className="px-3 py-2 rounded-lg bg-error/10 border border-error/20">
        <p className="text-body-sm text-error">
          Could not evaluate this driver/load pair: {error}
        </p>
      </div>
    );
  }

  if (!evaluation) return null;
  return <EvaluationDecisionBanner evaluation={evaluation} />;
}

export default EvaluationPanel;
