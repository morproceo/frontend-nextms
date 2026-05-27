import { Receipt, Download, CheckCircle, XCircle, Clock, Sparkles } from 'lucide-react';
import { getAgent } from '../../../config/genieTeam';

const STATUS_CONFIG = {
  succeeded: { label: 'Paid',     icon: CheckCircle, color: 'text-success' },
  pending:   { label: 'Pending',  icon: Clock,       color: 'text-warning' },
  failed:    { label: 'Failed',   icon: XCircle,     color: 'text-error' },
  refunded:  { label: 'Refunded', icon: Receipt,     color: 'text-text-secondary' }
};

const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const formatAmount = (amount, currency = 'usd') =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: currency.toUpperCase() }).format(amount);

/**
 * Classify a payment by reading its description. Stripe stamps the
 * line-item description (e.g. "Alex" or "Genie Suite") into the
 * Payment row when the invoice.paid webhook records it. Anything we
 * recognize as an agent slug or name gets the AI badge so the user
 * can tell TMS payments apart from agent-subscription payments.
 */
function classify(payment) {
  const desc = (payment.description || '').trim();
  if (!desc) return { type: 'tms', label: 'TMS subscription' };
  // Agent name match — Stripe line description is usually the price's
  // product name, which mirrors the agent name in our catalog.
  const lower = desc.toLowerCase();
  if (lower.includes('genie suite') || lower.includes('bundle')) {
    return { type: 'bundle', label: 'Genie Suite (bundle)', agent: null };
  }
  // Heuristic: see if any agent's first name appears at the start.
  for (const slug of ['alex', 'cece', 'ava', 'mia', 'sage', 'genie']) {
    const meta = getAgent(slug);
    if (!meta) continue;
    if (lower.startsWith(meta.name.toLowerCase()) || lower.includes(` ${meta.name.toLowerCase()}`)) {
      return { type: 'agent', label: `${meta.name} (${meta.role})`, agent: meta };
    }
  }
  if (lower.includes('agent')) return { type: 'agent', label: desc, agent: null };
  return { type: 'tms', label: desc };
}

function ItemPill({ classification }) {
  if (classification.type === 'agent' || classification.type === 'bundle') {
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-fuchsia-500/10 text-fuchsia-700">
        <Sparkles className="w-2.5 h-2.5" />
        AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-medium uppercase tracking-wider bg-surface-secondary text-text-tertiary">
      TMS
    </span>
  );
}

export function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) {
    return null;
  }

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-card overflow-hidden">
      <div className="px-5 py-3 sm:py-4 border-b border-surface-tertiary">
        <div className="flex items-center gap-2">
          <Receipt className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
          <h3 className="text-body sm:text-subtitle text-text-primary">Payment history</h3>
          <span className="text-[10px] uppercase tracking-wider text-text-tertiary">
            TMS &amp; AI agents
          </span>
        </div>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-tertiary bg-surface-secondary">
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">For</th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">Amount</th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">Invoice</th>
              <th className="px-5 py-3 text-right text-body-xs font-medium text-text-secondary uppercase tracking-wider">PDF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-tertiary">
            {payments.map((payment) => {
              const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;
              const c = classify(payment);
              return (
                <tr key={payment.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-5 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <ItemPill classification={c} />
                      <span className="text-body-sm text-text-primary truncate">{c.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-body-sm font-medium text-text-primary tabular-nums">
                    {formatAmount(payment.amount, payment.currency)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-body-sm text-text-secondary">
                    {formatDate(payment.paid_at || payment.created_at)}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-body-sm ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-body-sm text-text-secondary">
                    {payment.invoice_number || '—'}
                  </td>
                  <td className="px-5 py-3 whitespace-nowrap text-right">
                    {payment.invoice_pdf ? (
                      <a
                        href={payment.invoice_pdf}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-body-sm text-accent hover:text-accent/80"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </a>
                    ) : (
                      <span className="text-body-sm text-text-tertiary">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="md:hidden divide-y divide-surface-tertiary">
        {payments.map((payment) => {
          const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
          const StatusIcon = statusConfig.icon;
          const c = classify(payment);
          return (
            <div key={payment.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5 mb-1">
                    <ItemPill classification={c} />
                    <span className={`inline-flex items-center gap-1 text-[11px] ${statusConfig.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </div>
                  <div className="text-body-sm font-medium text-text-primary truncate">{c.label}</div>
                  <div className="text-[11px] text-text-tertiary mt-0.5">
                    {formatDate(payment.paid_at || payment.created_at)}
                    {payment.invoice_number && <> · {payment.invoice_number}</>}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-body-sm font-medium text-text-primary tabular-nums">
                    {formatAmount(payment.amount, payment.currency)}
                  </div>
                  {payment.invoice_pdf && (
                    <a
                      href={payment.invoice_pdf}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 mt-0.5 text-[11px] text-accent hover:text-accent/80"
                    >
                      <Download className="w-3 h-3" />
                      PDF
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PaymentHistory;
