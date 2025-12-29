import { Receipt, Download, CheckCircle, XCircle, Clock } from 'lucide-react';

const STATUS_CONFIG = {
  succeeded: {
    label: 'Paid',
    icon: CheckCircle,
    color: 'text-success'
  },
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'text-warning'
  },
  failed: {
    label: 'Failed',
    icon: XCircle,
    color: 'text-error'
  },
  refunded: {
    label: 'Refunded',
    icon: Receipt,
    color: 'text-text-secondary'
  }
};

export function PaymentHistory({ payments }) {
  if (!payments || payments.length === 0) {
    return null;
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatAmount = (amount, currency = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase()
    }).format(amount);
  };

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-lg overflow-hidden">
      <div className="px-5 py-4 border-b border-surface-tertiary">
        <div className="flex items-center gap-2">
          <Receipt className="w-5 h-5 text-accent" />
          <h3 className="text-subtitle text-text-primary">Payment History</h3>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-surface-tertiary bg-surface-secondary">
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">
                Amount
              </th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">
                Date
              </th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">
                Status
              </th>
              <th className="px-5 py-3 text-left text-body-xs font-medium text-text-secondary uppercase tracking-wider">
                Invoice
              </th>
              <th className="px-5 py-3 text-right text-body-xs font-medium text-text-secondary uppercase tracking-wider">
                Download
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-tertiary">
            {payments.map((payment) => {
              const statusConfig = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <tr key={payment.id} className="hover:bg-surface-secondary/50 transition-colors">
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-body-sm text-text-primary font-medium">
                      {formatAmount(payment.amount, payment.currency)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-body-sm text-text-secondary">
                      {formatDate(payment.paid_at || payment.created_at)}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 text-body-sm ${statusConfig.color}`}>
                      <StatusIcon className="w-4 h-4" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap">
                    <span className="text-body-sm text-text-secondary">
                      {payment.invoice_number || '-'}
                    </span>
                  </td>
                  <td className="px-5 py-4 whitespace-nowrap text-right">
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
                      <span className="text-body-sm text-text-tertiary">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentHistory;
