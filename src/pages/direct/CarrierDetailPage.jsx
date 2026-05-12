import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Loader2, Building2, BadgeCheck, Zap, Phone, Mail, Globe,
  MapPin, Truck, Hash, Send, X, Star
} from 'lucide-react';
import networkApi from '../../api/network.api';
import { useOrg } from '../../contexts/OrgContext';

export default function CarrierDetailPage() {
  const { orgSlug, carrierSlug } = useParams();
  const navigate = useNavigate();
  const { currentOrg } = useOrg();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requestModalOpen, setRequestModalOpen] = useState(false);

  const networkRoles = currentOrg?.network_roles || [];
  const isShipperSide =
    networkRoles.includes('shipper') ||
    networkRoles.includes('3pl') ||
    networkRoles.includes('manufacturer');

  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    let alive = true;
    networkApi.getCarrier(carrierSlug)
      .then(async (res) => {
        if (!alive) return;
        setData(res);
        if (res?.organization?.id) {
          const rs = await networkApi.listOrgReviews(res.organization.id, 'shipper_of_carrier').catch(() => []);
          if (alive) setReviews(rs || []);
        }
      })
      .catch((err) => { if (alive) setError(err.response?.data?.error?.message || err.message); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [carrierSlug]);

  if (loading) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-text-tertiary" />
      </div>
    );
  }
  if (error || !data) {
    return (
      <div className="px-6 py-10 max-w-3xl mx-auto">
        <Link to={`/o/${orgSlug}/direct/carriers`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
          <ArrowLeft className="w-3 h-3" /> Back to directory
        </Link>
        <p className="text-body-sm text-error">{error || 'Carrier not found.'}</p>
      </div>
    );
  }

  const { organization: o, profile: p } = data;

  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <Link to={`/o/${orgSlug}/direct/carriers`} className="inline-flex items-center gap-1 text-body-sm text-text-secondary hover:text-text-primary mb-4">
        <ArrowLeft className="w-3 h-3" /> Back to directory
      </Link>

      <header className="flex items-start gap-4 mb-6">
        {o.logo_url ? (
          <img src={o.logo_url} alt="" className="w-16 h-16 rounded-lg object-cover" />
        ) : (
          <div className="w-16 h-16 rounded-lg bg-surface-secondary flex items-center justify-center">
            <Building2 className="w-6 h-6 text-text-tertiary" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1 flex-wrap">
            <h1 className="text-title text-text-primary truncate">{o.name}</h1>
            {o.is_morpro_verified && (
              <BadgeCheck className="w-5 h-5 text-emerald-500" title="Verified by MorPro" />
            )}
            {p.instant_booking_enabled && (
              <Zap className="w-4 h-4 text-amber-500" title="Instant booking" />
            )}
          </div>
          <p className="text-body-sm text-text-secondary">
            {[o.city, o.state, o.country].filter(Boolean).join(', ')}
          </p>
        </div>
        {isShipperSide && (
          <button onClick={() => setRequestModalOpen(true)}
            className="flex-shrink-0 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover inline-flex items-center gap-2">
            <Send className="w-4 h-4" /> Request this carrier
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
        <Stat icon={Hash} label="MC" value={o.mc_number || '—'} />
        <Stat icon={Hash} label="DOT" value={o.dot_number || '—'} />
        <Stat icon={Truck} label="Available trucks" value={p.available_trucks ?? '—'} />
        <Stat icon={Truck} label="Fleet size" value={o.fleet_size ?? '—'} />
      </div>

      <Section title="Equipment & lanes">
        <KV label="Equipment" value={joinList(p.equipment_types)} />
        <KV label="Service regions" value={joinList(p.service_regions)} />
        <KV label="Preferred lanes" value={joinList(p.preferred_lanes)} />
      </Section>

      {p.public_notes && (
        <Section title="Notes">
          <p className="text-body-sm text-text-primary whitespace-pre-line">{p.public_notes}</p>
        </Section>
      )}

      <Section title="Contact">
        {!o.public_phone && !o.public_email && !o.website && (
          <p className="text-body-sm text-text-tertiary">This carrier has not published direct contact info. Booking & messaging unlock in Phase 2.</p>
        )}
        {o.public_phone && <KV label={<><Phone className="w-3 h-3 inline mr-1" />Phone</>} value={o.public_phone} />}
        {o.public_email && <KV label={<><Mail className="w-3 h-3 inline mr-1" />Email</>} value={o.public_email} />}
        {o.website && (
          <KV label={<><Globe className="w-3 h-3 inline mr-1" />Website</>} value={
            <a href={o.website} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">{o.website}</a>
          } />
        )}
      </Section>

      {/* Phase 6: grade + reviews block */}
      <Section title="Reputation">
        <GradeBadge score={Number(o.carrier_grade_score || 0)} reviewCount={reviews.length} />
        {reviews.length === 0 ? (
          <p className="text-small text-text-tertiary mt-2">No reviews yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {reviews.slice(0, 5).map((r) => (
              <li key={r.id} className="border-t border-border-subtle pt-3 first:border-0 first:pt-0">
                <div className="flex items-center gap-2 mb-1">
                  <Stars n={r.rating} />
                  <span className="text-small text-text-tertiary">
                    {r.reviewerOrganization?.name || 'Shipper'} · {new Date(r.created_at).toLocaleDateString()}
                  </span>
                </div>
                {r.comments && <p className="text-body-sm text-text-primary whitespace-pre-line">{r.comments}</p>}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {requestModalOpen && (
        <RequestCarrierModal
          carrierOrgId={o.id}
          carrierName={o.name}
          onClose={() => setRequestModalOpen(false)}
          onSuccess={(req) => {
            setRequestModalOpen(false);
            navigate(`/o/${orgSlug}/direct/requests/${req.id}`);
          }}
        />
      )}
    </div>
  );
}

function RequestCarrierModal({ carrierOrgId, carrierName, onClose, onSuccess }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    pickup_city: '', pickup_state: '',
    delivery_city: '', delivery_state: '',
    commodity: '', weight_lbs: '',
    equipment_types: 'dry_van',
    rate_offered: '',
    payment_terms: 'Net 30',
    message: ''
  });
  const submit = async (e) => {
    e.preventDefault();
    setSubmitting(true); setError(null);
    try {
      const req = await networkApi.sendDirectRequest(carrierOrgId, {
        pickup: { city: form.pickup_city, state: form.pickup_state },
        delivery: { city: form.delivery_city, state: form.delivery_state },
        commodity: form.commodity || undefined,
        weight_lbs: form.weight_lbs ? Number(form.weight_lbs) : undefined,
        equipment_requirements: {
          types: form.equipment_types
            ? form.equipment_types.split(',').map((s) => s.trim()).filter(Boolean)
            : []
        },
        rate_offered: form.rate_offered ? Number(form.rate_offered) : undefined,
        payment_terms: form.payment_terms || undefined,
        message: form.message || undefined
      });
      onSuccess(req);
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
      setSubmitting(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-surface-primary border border-border rounded-card p-5 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body font-medium">Request {carrierName}</h2>
          <button onClick={onClose} className="text-text-tertiary hover:text-text-primary"><X className="w-4 h-4" /></button>
        </div>
        {error && <p className="text-small text-error mb-3">{error}</p>}
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Pickup city"><Input required value={form.pickup_city} onChange={(e) => setForm({ ...form, pickup_city: e.target.value })} /></Field>
            <Field label="Pickup state"><Input required maxLength={2} value={form.pickup_state} onChange={(e) => setForm({ ...form, pickup_state: e.target.value })} /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Delivery city"><Input required value={form.delivery_city} onChange={(e) => setForm({ ...form, delivery_city: e.target.value })} /></Field>
            <Field label="Delivery state"><Input required maxLength={2} value={form.delivery_state} onChange={(e) => setForm({ ...form, delivery_state: e.target.value })} /></Field>
          </div>
          <Field label="Commodity"><Input value={form.commodity} onChange={(e) => setForm({ ...form, commodity: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Weight (lbs)"><Input type="number" value={form.weight_lbs} onChange={(e) => setForm({ ...form, weight_lbs: e.target.value })} /></Field>
            <Field label="Equipment"><Input value={form.equipment_types} onChange={(e) => setForm({ ...form, equipment_types: e.target.value })} placeholder="dry_van" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Offered rate ($)"><Input type="number" step="0.01" value={form.rate_offered} onChange={(e) => setForm({ ...form, rate_offered: e.target.value })} /></Field>
            <Field label="Payment terms"><Input value={form.payment_terms} onChange={(e) => setForm({ ...form, payment_terms: e.target.value })} /></Field>
          </div>
          <Field label="Message (optional)">
            <textarea rows={3} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />
          </Field>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={onClose} className="px-3 py-1.5 rounded-button text-body-sm text-text-secondary">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-3 py-1.5 rounded-button bg-accent text-white text-body-sm font-medium disabled:opacity-50 inline-flex items-center gap-2">
              <Send className="w-3 h-3" /> {submitting ? 'Sending…' : 'Send request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-small text-text-tertiary mb-1">{label}</span>
      {children}
    </label>
  );
}
function Input(props) {
  return <input {...props} className="w-full px-3 py-2 rounded-button border border-border bg-surface-primary text-body-sm" />;
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary p-3 flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-surface-secondary flex items-center justify-center">
        <Icon className="w-4 h-4 text-text-tertiary" />
      </div>
      <div>
        <p className="text-small text-text-tertiary">{label}</p>
        <p className="text-body-sm font-medium text-text-primary">{value}</p>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="rounded-card border border-border-subtle bg-surface-primary p-4 mb-3">
      <h2 className="text-body-sm font-medium text-text-primary mb-3">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function KV({ label, value }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      <p className="text-small text-text-tertiary">{label}</p>
      <p className="text-body-sm text-text-primary col-span-2">{value}</p>
    </div>
  );
}

function joinList(arr) {
  if (!Array.isArray(arr) || arr.length === 0) return '—';
  return arr.join(', ');
}

export function gradeFromScore(score) {
  if (!score && score !== 0) return null;
  const s = Number(score);
  if (s >= 90) return 'A+';
  if (s >= 75) return 'A';
  if (s >= 60) return 'B';
  if (s >= 40) return 'C';
  if (s > 0) return 'D';
  return null;
}

function GradeBadge({ score, reviewCount }) {
  const grade = gradeFromScore(score);
  if (!grade) {
    return <p className="text-body-sm text-text-tertiary">Unrated</p>;
  }
  const tone = grade.startsWith('A') ? 'bg-emerald-500/10 text-emerald-700'
    : grade === 'B' ? 'bg-blue-500/10 text-blue-700'
    : grade === 'C' ? 'bg-amber-500/10 text-amber-700'
    : 'bg-red-500/10 text-red-700';
  return (
    <div className="flex items-center gap-2">
      <span className={`px-2 py-1 rounded-button text-body font-bold ${tone}`}>{grade}</span>
      <span className="text-body-sm text-text-secondary">
        {Number(score).toFixed(0)} / 100 · {reviewCount} review{reviewCount === 1 ? '' : 's'}
      </span>
    </div>
  );
}

function Stars({ n }) {
  return (
    <span className="inline-flex">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} className={`w-3 h-3 ${i <= n ? 'fill-amber-400 text-amber-400' : 'text-text-tertiary'}`} />
      ))}
    </span>
  );
}
