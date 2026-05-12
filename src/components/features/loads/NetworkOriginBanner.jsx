import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Network, ArrowRight, Building2 } from 'lucide-react';
import networkApi from '../../../api/network.api';

/**
 * Phase 3 — when a NextMS load originated from MorPro Direct (a network load
 * was booked and bridged into this carrier's tenant), surface that context.
 *
 * Renders nothing if the load has no network linkage.
 *
 * Best-effort: a 404 / network error just means "no linkage", and we hide
 * silently. Don't block the existing load detail UX.
 */
export default function NetworkOriginBanner({ loadId, loadStatus }) {
  const { orgSlug } = useParams();
  const [linkage, setLinkage] = useState(null);

  useEffect(() => {
    if (!loadId) return;
    let alive = true;
    networkApi.getNetworkLinkageByInternalLoadId(loadId)
      .then((data) => { if (alive) setLinkage(data); })
      .catch(() => { if (alive) setLinkage(null); });
    return () => { alive = false; };
  }, [loadId]);

  if (!linkage) return null;
  const shipper = linkage.postingOrganization || {};
  const isDraft = loadStatus === 'draft';

  return (
    <div className="rounded-card border border-violet-500/30 bg-gradient-to-r from-violet-500/5 to-fuchsia-500/5 p-4 mb-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center flex-shrink-0">
        <Network className="w-5 h-5 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-body-sm font-medium text-text-primary">
          From MorPro Direct
        </p>
        <p className="text-small text-text-secondary mt-1">
          Booked from <span className="font-medium text-text-primary">{shipper.name || 'a network shipper'}</span>
          {linkage.accepted_rate ? ` at $${Number(linkage.accepted_rate).toFixed(2)}` : ''}.
          {isDraft && (
            <> <span className="font-medium">Confirm into dispatch:</span> assign driver/truck and advance status to <code className="text-xs">new</code> or <code className="text-xs">booked</code> to start the trip.</>
          )}
        </p>
        <div className="mt-2 flex items-center gap-1">
          <Link
            to={`/o/${orgSlug}/direct/loads/${linkage.id}/view`}
            className="text-small text-accent hover:underline inline-flex items-center gap-1"
          >
            Open in MorPro Direct <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
