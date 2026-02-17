import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, MapPin, Calendar, DollarSign,
  Truck, Mail, User, Phone, Hash, Save, Loader2
} from 'lucide-react';
import { useOrg } from '../../../contexts/OrgContext';
import { useAtlasOpportunityDetail, useAtlasMutations } from '../../../hooks/api/useAtlasApi';

function FieldRow({ label, value, icon: Icon, editable, field, editData, setEditData }) {
  if (editable) {
    return (
      <div className="flex items-start gap-3 py-2">
        {Icon && <Icon className="w-4 h-4 text-text-tertiary mt-1 flex-shrink-0" />}
        <div className="flex-1">
          <label className="text-caption text-text-secondary">{label}</label>
          <input
            type="text"
            value={editData[field] ?? value ?? ''}
            onChange={(e) => setEditData(prev => ({ ...prev, [field]: e.target.value }))}
            className="input mt-1 w-full"
          />
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-start gap-3 py-2">
      {Icon && <Icon className="w-4 h-4 text-text-tertiary mt-0.5 flex-shrink-0" />}
      <div>
        <p className="text-caption text-text-secondary">{label}</p>
        <p className="text-body-sm text-text-primary">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function AtlasOpportunityDetailPage() {
  const { opportunityId } = useParams();
  const navigate = useNavigate();
  const { orgUrl } = useOrg();
  const { opportunity, loading, fetch } = useAtlasOpportunityDetail(opportunityId);
  const { acceptOpportunity, rejectOpportunity, updateOpportunity, loading: mutating } = useAtlasMutations();

  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);

  useEffect(() => {
    fetch();
  }, [opportunityId]);

  const handleAccept = async () => {
    try {
      await acceptOpportunity(opportunityId);
      navigate(orgUrl('/tools/atlas/opportunities'));
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const handleReject = async () => {
    try {
      await rejectOpportunity(opportunityId, rejectReason);
      navigate(orgUrl('/tools/atlas/opportunities'));
    } catch (err) {
      console.error('Failed to reject:', err);
    }
  };

  const handleSave = async () => {
    try {
      await updateOpportunity(opportunityId, editData);
      setEditing(false);
      setEditData({});
      await fetch();
    } catch (err) {
      console.error('Failed to update:', err);
    }
  };

  if (loading || !opportunity) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 text-accent animate-spin" />
      </div>
    );
  }

  const opp = opportunity;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(orgUrl('/tools/atlas/opportunities'))} className="text-text-secondary hover:text-text-primary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-title text-text-primary">
              {opp.origin?.city}, {opp.origin?.state} → {opp.destination?.city}, {opp.destination?.state}
            </h1>
            <p className="text-body-sm text-text-secondary mt-0.5">
              {opp.broker?.name || 'Unknown broker'} {opp.reference_number && `• #${opp.reference_number}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {editing ? (
            <>
              <button onClick={() => { setEditing(false); setEditData({}); }} className="btn-secondary">Cancel</button>
              <button onClick={handleSave} disabled={mutating} className="btn-primary flex items-center gap-2">
                <Save className="w-4 h-4" /> Save
              </button>
            </>
          ) : (
            <>
              {opp.status === 'new' && (
                <>
                  <button onClick={() => setEditing(true)} className="btn-secondary">Edit</button>
                  <button onClick={() => setShowReject(true)} className="btn-secondary text-red-500 border-red-500/20 hover:bg-red-500/10 flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Reject
                  </button>
                  <button onClick={handleAccept} disabled={mutating} className="btn-primary flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Convert to Load
                  </button>
                </>
              )}
            </>
          )}
        </div>
      </div>

      {/* Reject dialog */}
      {showReject && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
          <p className="text-body-sm text-text-primary mb-2">Reason for rejection (optional):</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="input w-full h-20"
            placeholder="Why are you rejecting this opportunity?"
          />
          <div className="flex gap-2 mt-3">
            <button onClick={() => setShowReject(false)} className="btn-secondary">Cancel</button>
            <button onClick={handleReject} disabled={mutating} className="btn-primary bg-red-500 hover:bg-red-600">
              Confirm Reject
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Extracted Data */}
        <div className="space-y-4">
          {/* Route */}
          <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
            <h3 className="text-body font-medium text-text-primary mb-3">Route</h3>
            <FieldRow label="Origin" value={`${opp.origin?.city || ''}, ${opp.origin?.state || ''} ${opp.origin?.zip || ''}`} icon={MapPin}
              editable={editing} field="origin_city" editData={editData} setEditData={setEditData} />
            <FieldRow label="Destination" value={`${opp.destination?.city || ''}, ${opp.destination?.state || ''} ${opp.destination?.zip || ''}`} icon={MapPin}
              editable={editing} field="destination_city" editData={editData} setEditData={setEditData} />
            <FieldRow label="Pickup Date" value={opp.pickup_date} icon={Calendar}
              editable={editing} field="pickup_date" editData={editData} setEditData={setEditData} />
            <FieldRow label="Delivery Date" value={opp.delivery_date} icon={Calendar}
              editable={editing} field="delivery_date" editData={editData} setEditData={setEditData} />
          </div>

          {/* Shipment */}
          <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
            <h3 className="text-body font-medium text-text-primary mb-3">Shipment Details</h3>
            <FieldRow label="Equipment" value={opp.equipment_type?.replace(/_/g, ' ')} icon={Truck}
              editable={editing} field="equipment_type" editData={editData} setEditData={setEditData} />
            <FieldRow label="Rate" value={opp.rate ? `$${parseFloat(opp.rate).toLocaleString()} ${opp.rate_type === 'per_mile' ? '/mi' : 'flat'}` : null} icon={DollarSign}
              editable={editing} field="rate" editData={editData} setEditData={setEditData} />
            <FieldRow label="Miles" value={opp.miles} icon={MapPin} />
            <FieldRow label="Commodity" value={opp.commodity}
              editable={editing} field="commodity" editData={editData} setEditData={setEditData} />
            <FieldRow label="Weight" value={opp.weight_lbs ? `${opp.weight_lbs.toLocaleString()} lbs` : null} />
            <FieldRow label="Reference #" value={opp.reference_number} icon={Hash}
              editable={editing} field="reference_number" editData={editData} setEditData={setEditData} />
          </div>

          {/* Broker */}
          <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
            <h3 className="text-body font-medium text-text-primary mb-3">Broker</h3>
            <FieldRow label="Company" value={opp.broker?.name} icon={User}
              editable={editing} field="broker_name" editData={editData} setEditData={setEditData} />
            <FieldRow label="Email" value={opp.broker?.email} icon={Mail} />
            <FieldRow label="Phone" value={opp.broker?.phone} icon={Phone} />
            <FieldRow label="MC#" value={opp.broker?.mc_number} icon={Hash} />
            {opp.matchedBroker && (
              <div className="mt-2 p-2 bg-green-500/5 border border-green-500/20 rounded text-caption text-green-500">
                Matched to existing broker: {opp.matchedBroker.name}
              </div>
            )}
          </div>

          {/* Confidence */}
          <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
            <h3 className="text-body font-medium text-text-primary mb-3">AI Confidence</h3>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-caption text-text-secondary">Overall:</span>
              <div className="flex-1 bg-surface-secondary rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    (opp.overall_confidence || 0) >= 0.85 ? 'bg-green-500' :
                    (opp.overall_confidence || 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(opp.overall_confidence || 0) * 100}%` }}
                />
              </div>
              <span className="text-body-sm font-medium text-text-primary">
                {Math.round((opp.overall_confidence || 0) * 100)}%
              </span>
            </div>
            {opp.extraction_notes && (
              <p className="text-caption text-text-secondary italic">{opp.extraction_notes}</p>
            )}
          </div>
        </div>

        {/* Right: Original Email */}
        <div className="space-y-4">
          <div className="bg-surface-primary border border-border-primary rounded-lg">
            <div className="px-4 py-3 border-b border-border-primary">
              <h3 className="text-body font-medium text-text-primary">Original Email</h3>
            </div>
            {opp.email ? (
              <div className="p-4">
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-text-secondary w-12">From:</span>
                    <span className="text-body-sm text-text-primary">
                      {opp.email.from_name} &lt;{opp.email.from_address}&gt;
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-text-secondary w-12">Subject:</span>
                    <span className="text-body-sm font-medium text-text-primary">{opp.email.subject}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-caption text-text-secondary w-12">Date:</span>
                    <span className="text-body-sm text-text-primary">
                      {opp.email.received_at ? new Date(opp.email.received_at).toLocaleString() : '—'}
                    </span>
                  </div>
                </div>
                <div className="border-t border-border-primary pt-4">
                  <pre className="text-body-sm text-text-primary whitespace-pre-wrap font-sans max-h-[500px] overflow-y-auto">
                    {opp.email.body_text || '(no text content)'}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <Mail className="w-8 h-8 text-text-tertiary mx-auto mb-2" />
                <p className="text-body-sm text-text-secondary">Email not available</p>
              </div>
            )}
          </div>

          {/* Summary */}
          {opp.message_summary && (
            <div className="bg-surface-primary border border-border-primary rounded-lg p-4">
              <h3 className="text-body font-medium text-text-primary mb-2">AI Summary</h3>
              <p className="text-body-sm text-text-secondary">{opp.message_summary}</p>
            </div>
          )}

          {/* Conversion info */}
          {opp.converted_load_id && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4">
              <h3 className="text-body font-medium text-green-500 mb-1">Converted to Load</h3>
              <p className="text-body-sm text-text-secondary">
                Load created on {opp.converted_at ? new Date(opp.converted_at).toLocaleString() : 'unknown date'}
              </p>
              <button
                onClick={() => navigate(orgUrl(`/loads/${opp.converted_load_id}`))}
                className="text-caption text-accent hover:underline mt-2 inline-block"
              >
                View Load →
              </button>
            </div>
          )}

          {/* Rejection info */}
          {opp.status === 'rejected' && (
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-4">
              <h3 className="text-body font-medium text-red-500 mb-1">Rejected</h3>
              {opp.rejection_reason && (
                <p className="text-body-sm text-text-secondary">{opp.rejection_reason}</p>
              )}
              <p className="text-caption text-text-tertiary mt-1">
                {opp.reviewed_at ? new Date(opp.reviewed_at).toLocaleString() : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
