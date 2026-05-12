import { useEffect, useState } from 'react';
import { CreditCard, CheckCircle2, Loader2, Shield } from 'lucide-react';
import networkApi from '../../../api/network.api';

/**
 * Shipper payment method setup — Phase 5 stub-mode version.
 *
 * In real mode this is where Stripe Elements would render a card form. For
 * stub mode we just call the backend with no payment_method_id — it
 * synthesizes a fake pm_stub_xxx so the rest of the flow proceeds.
 */
export default function PaymentsSetupPage() {
  const [pm, setPm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    networkApi.getPaymentMethod()
      .then(setPm)
      .catch((err) => setError(err.response?.data?.error?.message || err.message))
      .finally(() => setLoading(false));
  }, []);

  const onSave = async () => {
    setSaving(true); setError(null);
    try {
      // Real mode: Stripe Elements would produce a pm_xxx id and we'd pass it.
      // Stub mode: backend synthesizes one when null.
      const r = await networkApi.setPaymentMethod(null);
      setPm({ has_payment_method: true, stripe_payment_method_id: r.stripe_payment_method_id, card: r.card });
    } catch (err) {
      setError(err.response?.data?.error?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="px-6 py-10 max-w-2xl mx-auto"><Loader2 className="w-5 h-5 animate-spin" /></div>;

  return (
    <div className="px-6 py-10 max-w-2xl mx-auto">
      <header className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-title text-text-primary">Payment method</h1>
          <p className="text-body-sm text-text-secondary">Card on file used for MorPro Direct loads.</p>
        </div>
      </header>

      {error && (
        <div className="rounded-card border border-error/30 bg-error-muted text-error p-3 mb-4">
          <p className="text-body-sm">{error}</p>
        </div>
      )}

      {pm?.has_payment_method ? (
        <div className="rounded-card border border-emerald-500/30 bg-emerald-500/5 p-4 mb-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
          <div>
            <p className="text-body-sm font-medium text-text-primary">Card on file</p>
            <p className="text-small text-text-secondary mt-0.5">
              {pm.card?.brand
                ? `${pm.card.brand.toUpperCase()} •••• ${pm.card.last4}`
                : `pm_id: ${pm.stripe_payment_method_id}`}
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-card border border-border-subtle bg-surface-primary p-5 mb-4">
          <p className="text-body font-medium text-text-primary mb-2">No card on file</p>
          <p className="text-small text-text-secondary mb-4">
            We hold authorization at booking and only capture funds after delivery + POD approval.
            Stub mode uses a synthetic card; real Stripe Elements integration ships when STRIPE_SECRET_KEY is set.
          </p>
          <button onClick={onSave} disabled={saving}
            className="px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover disabled:opacity-50 inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4" /> {saving ? 'Saving…' : 'Save card'}
          </button>
        </div>
      )}

      <div className="text-small text-text-tertiary inline-flex items-center gap-2">
        <Shield className="w-3 h-3" />
        Card data never touches our servers — Stripe holds it.
      </div>
    </div>
  );
}
