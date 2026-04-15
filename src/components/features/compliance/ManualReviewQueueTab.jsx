/**
 * ManualReviewQueueTab (Phase 5)
 *
 * Lists pending manual-review evaluations for the org. Approve / Reject
 * inline with a required note. Each action persists a child evaluation
 * (parent_evaluation_id chain) — the original row is never mutated.
 *
 * Per UX/UI plan §10.2: default filter is Pending; show count in tab label.
 */

import { useEffect, useState } from 'react';
import { ClipboardList, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Spinner } from '../../ui/Spinner';
import { ReadinessTierBadge } from '../../readiness/ReadinessTierBadge';
import { LoadImpactTierBadge } from '../../readiness/LoadImpactTierBadge';
import { ReasonCodeList } from '../../readiness/ReasonCodeList';
import { useEvaluationsList, useEvaluationActions } from '../../../hooks/api/useReadinessApi';
import { useOrg } from '../../../contexts/OrgContext';

function formatDateTime(d) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: 'numeric', minute: '2-digit'
  });
}

export function ManualReviewQueueTab() {
  const { hasPermission } = useOrg();
  const canAct = hasPermission('dispatch:review_approve');
  const { evaluations, loading, error, fetchEvaluations } = useEvaluationsList();
  const { approve, reject, loading: acting, error: actError } = useEvaluationActions();
  const [expandedId, setExpandedId] = useState(null);
  const [note, setNote] = useState('');

  useEffect(() => {
    fetchEvaluations({ manual_review_status: 'pending', limit: 100 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refresh = () => fetchEvaluations({ manual_review_status: 'pending', limit: 100 });

  const handleApprove = async (id) => {
    await approve(id, note || null);
    setExpandedId(null);
    setNote('');
    await refresh();
  };

  const handleReject = async (id) => {
    await reject(id, note || null);
    setExpandedId(null);
    setNote('');
    await refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-accent" /> Manual Review Queue
          {evaluations.length > 0 && (
            <span className="text-[11px] font-normal text-text-secondary">
              ({evaluations.length} pending)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && <div className="flex justify-center py-8"><Spinner size="md" /></div>}

        {!loading && error && (
          <div className="bg-error/10 border border-error/20 rounded p-3 text-body-sm text-error">{error}</div>
        )}

        {!loading && !error && evaluations.length === 0 && (
          <div className="text-center py-10">
            <div className="w-12 h-12 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-3">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <h3 className="text-body font-medium text-text-primary">All clear — no pending reviews</h3>
            <p className="text-body-sm text-text-secondary mt-1">
              All assignments are passing or blocked.
            </p>
          </div>
        )}

        {!loading && evaluations.length > 0 && (
          <ul className="space-y-2">
            {evaluations.map(ev => {
              const isOpen = expandedId === ev.id;
              return (
                <li key={ev.id} className="border border-surface-tertiary rounded-lg">
                  <button
                    type="button"
                    onClick={() => { setExpandedId(isOpen ? null : ev.id); setNote(''); }}
                    className="w-full p-3 flex items-center gap-3 text-left hover:bg-surface-secondary/40"
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <ReadinessTierBadge tier={ev.driver_tier_at_eval} size="sm" />
                      <span className="text-[10px] text-text-secondary">vs</span>
                      <ReadinessTierBadge tier={ev.min_required_tier_at_eval} size="sm" />
                      <LoadImpactTierBadge tier={ev.load_tier_at_eval} size="sm" className="ml-1" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-body-sm text-text-primary">
                        Driver below required for {ev.load_tier_at_eval} load
                      </div>
                      <div className="text-[11px] text-text-secondary">
                        {formatDateTime(ev.evaluated_at)} • {(ev.reason_codes || []).filter(r => r.severity !== 'info').length} reason{(ev.reason_codes || []).filter(r => r.severity !== 'info').length !== 1 ? 's' : ''}
                      </div>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-surface-tertiary p-3 space-y-3">
                      <ReasonCodeList reasons={ev.reason_codes || []} compact max={10} />
                      {canAct ? (
                        <>
                          <textarea
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Optional review note (recorded against your user)"
                            rows={2}
                            className="w-full text-body-sm bg-white border border-surface-tertiary rounded px-2 py-1 focus:outline-none focus:border-accent"
                          />
                          {actError && (
                            <div className="bg-error/10 border border-error/20 rounded p-2 flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 text-error mt-0.5" />
                              <span className="text-body-sm text-error">{actError}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="outline"
                              onClick={() => handleReject(ev.id)}
                              disabled={acting}
                            >
                              <XCircle className="w-4 h-4 mr-1" /> Reject
                            </Button>
                            <Button
                              onClick={() => handleApprove(ev.id)}
                              disabled={acting}
                            >
                              {acting ? <><Spinner size="sm" className="mr-2" /> Saving…</> : <><CheckCircle className="w-4 h-4 mr-1" /> Approve</>}
                            </Button>
                          </div>
                          <p className="text-[11px] text-text-secondary">
                            Approval creates a child evaluation; the original row stays immutable.
                            The dispatcher can then re-attempt assign with the new evaluation ID.
                          </p>
                        </>
                      ) : (
                        <p className="text-body-sm text-text-secondary">
                          You don't have review-approval permission. Ask an admin or dispatcher with
                          <code className="font-mono mx-1">dispatch:review_approve</code>.
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default ManualReviewQueueTab;
