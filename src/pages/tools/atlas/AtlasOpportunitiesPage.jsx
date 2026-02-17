import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, ArrowLeft, ArrowRight, CheckCircle, XCircle,
  MapPin, Calendar, DollarSign, Truck, RefreshCw, Loader2, Mail
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAtlas } from '../../../hooks/domain/useAtlas';
import { useAtlasProcessingStatus } from '../../../hooks/api/useAtlasApi';

const STATUS_TABS = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'reviewed', label: 'Reviewed' },
  { key: 'accepted', label: 'Accepted' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'converted', label: 'Converted' }
];

function ConfidenceBadge({ value }) {
  if (value == null) return null;
  const pct = Math.round(value * 100);
  const color = pct >= 85 ? 'text-green-500 bg-green-500/10' :
                pct >= 60 ? 'text-yellow-500 bg-yellow-500/10' :
                'text-red-500 bg-red-500/10';
  return (
    <span className={`text-caption px-1.5 py-0.5 rounded ${color}`}>
      {pct}%
    </span>
  );
}

function StatusBadge({ status }) {
  const colors = {
    new: 'bg-blue-500/10 text-blue-500',
    reviewed: 'bg-purple-500/10 text-purple-500',
    accepted: 'bg-green-500/10 text-green-500',
    rejected: 'bg-red-500/10 text-red-500',
    converted: 'bg-accent/10 text-accent',
    expired: 'bg-surface-secondary text-text-secondary'
  };
  return (
    <span className={`text-caption px-2 py-0.5 rounded-full capitalize ${colors[status] || colors.expired}`}>
      {status}
    </span>
  );
}

export default function AtlasOpportunitiesPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const {
    opportunities,
    loading,
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    acceptOpportunity,
    rejectOpportunity,
    refetch,
    mutating,
    stats
  } = useAtlas();
  const { status: processingStatus } = useAtlasProcessingStatus({ interval: 5000 });

  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const handleAccept = async (e, id) => {
    e.stopPropagation();
    try {
      await acceptOpportunity(id);
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async (e, id) => {
    e.stopPropagation();
    if (rejectingId === id) {
      await rejectOpportunity(id, rejectReason);
      setRejectingId(null);
      setRejectReason('');
    } else {
      setRejectingId(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Processing Progress Banner */}
      {processingStatus?.in_progress && (
        <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div className="flex-1">
              <p className="text-body-sm font-medium text-text-primary">
                Processing Emails
              </p>
              <p className="text-caption text-text-secondary">
                ATLAS is analyzing {processingStatus.pending + processingStatus.processing} remaining email{processingStatus.pending + processingStatus.processing !== 1 ? 's' : ''} for freight opportunities
                {processingStatus.failed > 0 && <span className="text-red-400 ml-1">({processingStatus.failed} failed)</span>}
              </p>
            </div>
            <span className="text-body-sm font-medium text-accent">{processingStatus.percent_complete}%</span>
          </div>
          <div className="w-full bg-surface-secondary rounded-full h-2">
            <div
              className="bg-accent h-2 rounded-full transition-all duration-500"
              style={{ width: `${processingStatus.percent_complete}%` }}
            />
          </div>
          <p className="text-caption text-text-tertiary mt-1">
            {processingStatus.processed} of {processingStatus.total} emails processed
            {processingStatus.completed > 0 && ` · ${processingStatus.completed} freight detected`}
          </p>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(orgUrl('/tools/atlas'))} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-title text-text-primary">Opportunities</h1>
            <p className="text-caption text-text-secondary">
              {stats.total_emails} emails scanned · {stats.freight_emails} freight detected · {stats.total_opportunities} opportunities
            </p>
          </div>
        </div>
        <button onClick={refetch} className="btn-secondary flex items-center gap-2" disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" />
          <input
            type="text"
            placeholder="Search by broker, location, reference..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-9 w-full"
          />
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`px-3 py-1.5 rounded-lg text-caption font-medium whitespace-nowrap transition-colors ${
              statusFilter === tab.key
                ? 'bg-accent text-white'
                : 'text-text-secondary hover:bg-surface-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center">
          <RefreshCw className="w-6 h-6 text-text-tertiary mx-auto animate-spin" />
        </div>
      ) : opportunities.length === 0 ? (
        <div className="bg-surface-primary border border-border-primary rounded-lg p-12 text-center">
          {processingStatus?.in_progress ? (
            <>
              <Loader2 className="w-8 h-8 text-accent mx-auto mb-2 animate-spin" />
              <p className="text-body-sm text-text-primary font-medium">Scanning emails for freight opportunities...</p>
              <p className="text-caption text-text-secondary mt-1">
                {processingStatus.processed} of {processingStatus.total} emails analyzed. Opportunities will appear here as they're detected.
              </p>
            </>
          ) : stats.total_emails > 0 ? (
            <>
              <Mail className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-body-sm text-text-secondary">No freight opportunities detected</p>
              <p className="text-caption text-text-tertiary mt-1">
                {stats.total_emails} emails were scanned but none contained freight load offers
              </p>
            </>
          ) : (
            <>
              <Filter className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
              <p className="text-body-sm text-text-secondary">No opportunities yet</p>
              <p className="text-caption text-text-tertiary mt-1">
                Connect an inbox to start detecting freight opportunities
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="bg-surface-primary border border-border-primary rounded-lg overflow-hidden">
          {/* Desktop Table */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border-primary bg-surface-secondary">
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Route</th>
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Broker</th>
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Details</th>
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Rate</th>
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Confidence</th>
                  <th className="px-4 py-3 text-left text-caption font-medium text-text-secondary">Status</th>
                  <th className="px-4 py-3 text-right text-caption font-medium text-text-secondary">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary">
                {opportunities.map(opp => (
                  <tr
                    key={opp.id}
                    onClick={() => navigate(orgUrl(`/tools/atlas/opportunities/${opp.id}`))}
                    className="hover:bg-surface-secondary cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-body-sm text-text-primary">
                        <MapPin className="w-3.5 h-3.5 text-text-tertiary" />
                        {opp.origin?.city}, {opp.origin?.state}
                      </div>
                      <div className="flex items-center gap-1 text-caption text-text-secondary mt-0.5">
                        <ArrowRight className="w-3 h-3" />
                        {opp.destination?.city}, {opp.destination?.state}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-body-sm text-text-primary">{opp.broker?.name || '—'}</span>
                      {opp.reference_number && (
                        <p className="text-caption text-text-secondary">#{opp.reference_number}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 text-caption text-text-secondary">
                        {opp.equipment_type && (
                          <span className="flex items-center gap-1">
                            <Truck className="w-3 h-3" />
                            {opp.equipment_type.replace(/_/g, ' ')}
                          </span>
                        )}
                        {opp.pickup_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {opp.pickup_date}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {opp.rate ? (
                        <span className="text-body-sm font-medium text-text-primary">
                          ${parseFloat(opp.rate).toLocaleString()}
                          {opp.rate_type === 'per_mile' && '/mi'}
                        </span>
                      ) : (
                        <span className="text-caption text-text-tertiary">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <ConfidenceBadge value={opp.overall_confidence} />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      {opp.status === 'new' && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => handleAccept(e, opp.id)}
                            disabled={mutating}
                            className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                            title="Accept"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => handleReject(e, opp.id)}
                            disabled={mutating}
                            className="p-1.5 text-red-500 hover:bg-red-500/10 rounded"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-border-primary">
            {opportunities.map(opp => (
              <button
                key={opp.id}
                onClick={() => navigate(orgUrl(`/tools/atlas/opportunities/${opp.id}`))}
                className="w-full px-4 py-3 text-left hover:bg-surface-secondary"
              >
                <div className="flex items-center justify-between">
                  <span className="text-body-sm font-medium text-text-primary">
                    {opp.origin?.city}, {opp.origin?.state} → {opp.destination?.city}, {opp.destination?.state}
                  </span>
                  <StatusBadge status={opp.status} />
                </div>
                <div className="flex items-center gap-3 mt-1 text-caption text-text-secondary">
                  <span>{opp.broker?.name || 'Unknown'}</span>
                  {opp.rate && <span>${parseFloat(opp.rate).toLocaleString()}</span>}
                  <ConfidenceBadge value={opp.overall_confidence} />
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
