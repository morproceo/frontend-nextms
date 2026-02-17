import { useEffect, useState } from 'react';
import { Mail, Plus, RefreshCw, Trash2, Pause, Play, ArrowLeft, CheckCircle, AlertCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useOrg } from '../../../contexts/OrgContext';
import { useAtlasConnections } from '../../../hooks/api/useAtlasApi';

const STATUS_ICONS = {
  active: CheckCircle,
  paused: Pause,
  error: AlertCircle,
  disconnected: XCircle
};

const STATUS_COLORS = {
  active: 'text-green-500',
  paused: 'text-yellow-500',
  error: 'text-red-500',
  disconnected: 'text-text-tertiary'
};

export default function AtlasConnectionsPage() {
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const {
    connections,
    loading,
    fetch,
    connectGmail,
    connectOutlook,
    updateConnection,
    deleteConnection,
    syncConnection,
    mutating
  } = useAtlasConnections();

  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  const handleConnect = async (provider) => {
    setConnecting(true);
    try {
      const result = await (provider === 'gmail' ? connectGmail() : connectOutlook());
      if (result?.url) {
        window.open(result.url, '_blank', 'width=600,height=700');
      }
    } catch (err) {
      console.error('Failed to get OAuth URL:', err);
    } finally {
      setConnecting(false);
    }
  };

  const handleTogglePause = async (connection) => {
    const newStatus = connection.status === 'active' ? 'paused' : 'active';
    await updateConnection(connection.id, { status: newStatus });
  };

  const handleDelete = async (connection) => {
    if (window.confirm(`Disconnect ${connection.email_address}?`)) {
      await deleteConnection(connection.id);
    }
  };

  const handleSync = async (connection) => {
    await syncConnection(connection.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(orgUrl('/tools/atlas'))} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-title text-text-primary">Email Connections</h1>
            <p className="text-body-sm text-text-secondary mt-0.5">
              Connect inboxes for automatic freight email detection
            </p>
          </div>
        </div>
      </div>

      {/* Connect Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => handleConnect('gmail')}
          disabled={connecting}
          className="bg-surface-primary border border-border-primary rounded-lg p-6 text-left hover:border-accent transition-colors flex items-center gap-4"
        >
          <div className="p-3 bg-red-500/10 rounded-lg">
            <Mail className="w-6 h-6 text-red-500" />
          </div>
          <div>
            <h3 className="text-body font-medium text-text-primary">Connect Gmail</h3>
            <p className="text-caption text-text-secondary mt-0.5">
              Sign in with Google to connect your Gmail inbox
            </p>
          </div>
        </button>

        <button
          onClick={() => handleConnect('outlook')}
          disabled={connecting}
          className="bg-surface-primary border border-border-primary rounded-lg p-6 text-left hover:border-accent transition-colors flex items-center gap-4"
        >
          <div className="p-3 bg-blue-500/10 rounded-lg">
            <Mail className="w-6 h-6 text-blue-500" />
          </div>
          <div>
            <h3 className="text-body font-medium text-text-primary">Connect Outlook</h3>
            <p className="text-caption text-text-secondary mt-0.5">
              Sign in with Microsoft to connect your Outlook inbox
            </p>
          </div>
        </button>
      </div>

      {/* Connections List */}
      <div className="bg-surface-primary border border-border-primary rounded-lg">
        <div className="px-4 py-3 border-b border-border-primary">
          <h2 className="text-body font-medium text-text-primary">Connected Inboxes</h2>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <RefreshCw className="w-6 h-6 text-text-tertiary mx-auto animate-spin" />
          </div>
        ) : connections.length === 0 ? (
          <div className="p-8 text-center">
            <Mail className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
            <p className="text-body-sm text-text-secondary">No inboxes connected</p>
            <p className="text-caption text-text-tertiary mt-1">
              Connect a Gmail or Outlook account to start processing emails
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {connections.map(conn => {
              const StatusIcon = STATUS_ICONS[conn.status] || AlertCircle;
              const statusColor = STATUS_COLORS[conn.status] || 'text-text-tertiary';

              return (
                <div key={conn.id} className="px-4 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <StatusIcon className={`w-5 h-5 ${statusColor}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-body-sm font-medium text-text-primary">
                          {conn.email_address}
                        </span>
                        <span className="text-caption text-text-tertiary">
                          {conn.connection_type === 'gmail_oauth' ? 'Gmail' : 'Outlook'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-caption text-text-secondary">
                          {conn.messages_processed} emails processed
                        </span>
                        {conn.last_sync_at && (
                          <span className="text-caption text-text-tertiary">
                            Last sync: {new Date(conn.last_sync_at).toLocaleString()}
                          </span>
                        )}
                        {!conn.backfill_complete && (
                          <span className="text-caption text-yellow-500">Backfill in progress...</span>
                        )}
                        {conn.sync_error && (
                          <span className="text-caption text-red-500" title={conn.sync_error}>
                            Sync error
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {conn.status === 'active' && (
                      <button
                        onClick={() => handleSync(conn)}
                        disabled={mutating}
                        className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-secondary"
                        title="Sync now"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => handleTogglePause(conn)}
                      disabled={mutating}
                      className="p-2 text-text-secondary hover:text-text-primary rounded-lg hover:bg-surface-secondary"
                      title={conn.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {conn.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(conn)}
                      disabled={mutating}
                      className="p-2 text-red-500 hover:text-red-400 rounded-lg hover:bg-surface-secondary"
                      title="Disconnect"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
