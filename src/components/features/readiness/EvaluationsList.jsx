/**
 * EvaluationsList (Phase 6)
 *
 * Shared list used by both the driver-scoped and load-scoped Evaluations
 * tabs. Pre-filters via the `filter` prop (driver_id, load_id) and shows
 * the latest 50.
 *
 * Per UX/UI plan §12: simple rolling list in V1; pagination + search V2.
 */

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Clock } from 'lucide-react';
import { Card, CardContent } from '../../ui/Card';
import { Spinner } from '../../ui/Spinner';
import { Badge } from '../../ui/Badge';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { LoadImpactTierBadge } from '../../readiness/LoadImpactTierBadge';
import { ReasonCodeList } from '../../readiness/ReasonCodeList';
import { EvaluationDecisionConfig } from '../../../config/status';
import { useEvaluationsList } from '../../../hooks/api/useReadinessApi';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export function EvaluationsList({ filter = {}, emptyHint = 'No evaluations yet.' }) {
  const { evaluations, loading, error, fetchEvaluations } = useEvaluationsList();
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    fetchEvaluations({ ...filter, limit: 50 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter.driver_id, filter.load_id]);

  if (loading && evaluations.length === 0) {
    return <div className="flex justify-center py-8"><Spinner size="md" /></div>;
  }

  if (error) {
    return (
      <Card padding="sm" className="bg-error/5 border border-error/20">
        <CardContent>
          <p className="text-body-sm text-error">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (evaluations.length === 0) {
    return (
      <Card padding="sm">
        <CardContent>
          <p className="text-body-sm text-text-secondary text-center py-6">{emptyHint}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <ul className="space-y-2">
      {evaluations.map(ev => {
        const isOpen = openId === ev.id;
        const decisionCfg = EvaluationDecisionConfig[ev.decision] || {};
        return (
          <li key={ev.id} className="border border-surface-tertiary rounded-lg bg-white">
            <button
              type="button"
              onClick={() => setOpenId(isOpen ? null : ev.id)}
              className="w-full p-3 grid grid-cols-[auto_1fr_auto_16px] items-center gap-3 text-left hover:bg-surface-secondary/40"
            >
              <Badge variant={decisionCfg.variant || 'gray'}>{decisionCfg.label || ev.decision}</Badge>
              <div className="min-w-0">
                <div className="text-body-sm text-text-primary">
                  {ev.override_used && 'Override • '}
                  {ev.manual_review_status === 'approved' && 'Review approved • '}
                  {ev.manual_review_status === 'rejected' && 'Review rejected • '}
                  Driver tier {ev.driver_tier_at_eval} vs required {ev.min_required_tier_at_eval}
                </div>
                <div className="text-[11px] text-text-secondary flex items-center gap-1.5 mt-0.5">
                  <Clock className="w-3 h-3" /> {formatDateTime(ev.evaluated_at)}
                  {ev.parent_evaluation_id && <span>• child eval</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <ReadinessTierBadge tier={ev.driver_tier_at_eval} size="sm" />
                <LoadImpactTierBadge tier={ev.load_tier_at_eval} size="sm" />
              </div>
              {isOpen ? <ChevronDown className="w-4 h-4 text-text-tertiary" /> : <ChevronRight className="w-4 h-4 text-text-tertiary" />}
            </button>

            {isOpen && (
              <div className="border-t border-surface-tertiary p-3 space-y-3">
                <ReasonCodeList reasons={ev.reason_codes || []} compact max={20} />
                <div className="text-[11px] text-text-secondary grid grid-cols-2 gap-x-4 gap-y-1">
                  <span>Config version</span><span className="font-mono">{ev.scoring_config_id?.slice(0, 8) || '—'}</span>
                  <span>Hard gate passed</span><span>{ev.hard_gate_passed ? 'Yes' : 'No'}</span>
                  {ev.override_user_id && <><span>Overridden by</span><span className="font-mono">{ev.override_user_id.slice(0, 8)}</span></>}
                  {ev.override_reason && <><span>Override reason</span><span>{ev.override_reason}</span></>}
                  {ev.manual_review_user_id && <><span>Reviewed by</span><span className="font-mono">{ev.manual_review_user_id.slice(0, 8)}</span></>}
                  {ev.manual_review_note && <><span>Review note</span><span>{ev.manual_review_note}</span></>}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default EvaluationsList;
