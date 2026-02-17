import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Inbox, Target, CheckCircle, ArrowRight, RefreshCw, Plus, Zap, Loader2 } from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAtlas } from '../../../hooks/domain/useAtlas';
import { useAtlasProcessingStatus } from '../../../hooks/api/useAtlasApi';

function StatCard({ title, value, icon: Icon, color = 'text-accent' }) {
  return (
    <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-caption text-text-secondary">{title}</p>
          <p className="text-display-sm text-text-primary mt-1">{value}</p>
        </div>
        <div className={`p-2 rounded-lg bg-surface-secondary ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ProcessingBanner({ status }) {
  if (!status || !status.in_progress) return null;

  const { total, processed, pending, processing, failed, percent_complete } = status;

  return (
    <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-2">
        <Loader2 className="w-5 h-5 text-accent animate-spin" />
        <div className="flex-1">
          <p className="text-body-sm font-medium text-text-primary">
            Processing Emails
          </p>
          <p className="text-caption text-text-secondary">
            ATLAS is analyzing {pending + processing} remaining email{pending + processing !== 1 ? 's' : ''} for freight opportunities
            {failed > 0 && <span className="text-red-400 ml-1">({failed} failed)</span>}
          </p>
        </div>
        <span className="text-body-sm font-medium text-accent">{percent_complete}%</span>
      </div>
      <div className="w-full bg-surface-secondary rounded-full h-2">
        <div
          className="bg-accent h-2 rounded-full transition-all duration-500"
          style={{ width: `${percent_complete}%` }}
        />
      </div>
      <p className="text-caption text-text-tertiary mt-1">
        {processed} of {total} emails processed
      </p>
    </div>
  );
}

export default function AtlasDashboardPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const { stats, recentOpportunities, loading, refetch } = useAtlas();
  const { status: processingStatus } = useAtlasProcessingStatus({ interval: 5000 });

  return (
    <div className="space-y-6">
      {/* Processing Progress Banner */}
      <ProcessingBanner status={processingStatus} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Zap className="w-6 h-6 text-accent" />
            <h1 className="text-title text-text-primary">ATLAS Intelligence</h1>
          </div>
          <p className="text-body-sm text-text-secondary mt-1">
            AI-powered freight email intelligence
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refetch}
            className="btn-secondary flex items-center gap-2"
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => navigate(orgUrl('/tools/atlas/connections'))}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Connect Inbox
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Emails Processed" value={stats.total_emails} icon={Mail} />
        <StatCard title="Freight Detected" value={stats.freight_emails} icon={Inbox} />
        <StatCard title="Pending Review" value={stats.pending_review} icon={Target} color="text-yellow-500" />
        <StatCard title="Converted to Loads" value={stats.converted} icon={CheckCircle} color="text-green-500" />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button
          onClick={() => navigate(orgUrl('/tools/atlas/connections'))}
          className="bg-surface-primary border border-border-primary rounded-lg p-4 text-left hover:border-accent transition-colors"
        >
          <Mail className="w-5 h-5 text-accent mb-2" />
          <h3 className="text-body-sm font-medium text-text-primary">Email Connections</h3>
          <p className="text-caption text-text-secondary mt-1">
            {stats.active_connections} active {stats.active_connections === 1 ? 'connection' : 'connections'}
          </p>
        </button>

        <button
          onClick={() => navigate(orgUrl('/tools/atlas/opportunities'))}
          className="bg-surface-primary border border-border-primary rounded-lg p-4 text-left hover:border-accent transition-colors"
        >
          <Target className="w-5 h-5 text-accent mb-2" />
          <h3 className="text-body-sm font-medium text-text-primary">Opportunities</h3>
          <p className="text-caption text-text-secondary mt-1">
            {stats.total_opportunities} total, {stats.pending_review} pending
          </p>
        </button>

        <button
          onClick={() => navigate(orgUrl('/tools/atlas/settings'))}
          className="bg-surface-primary border border-border-primary rounded-lg p-4 text-left hover:border-accent transition-colors"
        >
          <Zap className="w-5 h-5 text-accent mb-2" />
          <h3 className="text-body-sm font-medium text-text-primary">Settings</h3>
          <p className="text-caption text-text-secondary mt-1">
            Configure thresholds and preferences
          </p>
        </button>
      </div>

      {/* Recent Opportunities */}
      <div className="bg-surface-primary border border-border-primary rounded-lg">
        <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
          <h2 className="text-body font-medium text-text-primary">Recent Opportunities</h2>
          <button
            onClick={() => navigate(orgUrl('/tools/atlas/opportunities'))}
            className="text-caption text-accent hover:underline flex items-center gap-1"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentOpportunities.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-body-sm text-text-secondary">No opportunities yet</p>
            <p className="text-caption text-text-tertiary mt-1">
              Connect an inbox to start detecting freight opportunities
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {recentOpportunities.map(opp => (
              <button
                key={opp.id}
                onClick={() => navigate(orgUrl(`/tools/atlas/opportunities/${opp.id}`))}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-surface-secondary transition-colors text-left"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm font-medium text-text-primary truncate">
                      {opp.origin?.city}, {opp.origin?.state} → {opp.destination?.city}, {opp.destination?.state}
                    </span>
                    <span className={`text-caption px-2 py-0.5 rounded-full ${
                      opp.status === 'new' ? 'bg-blue-500/10 text-blue-500' :
                      opp.status === 'accepted' ? 'bg-green-500/10 text-green-500' :
                      opp.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                      opp.status === 'converted' ? 'bg-purple-500/10 text-purple-500' :
                      'bg-surface-secondary text-text-secondary'
                    }`}>
                      {opp.status}
                    </span>
                  </div>
                  <p className="text-caption text-text-secondary mt-0.5 truncate">
                    {opp.broker?.name || 'Unknown broker'} • {opp.equipment_type || 'N/A'} • {opp.rate ? `$${opp.rate}` : 'No rate'}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-text-tertiary flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
