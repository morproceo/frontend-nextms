import { useState, useEffect, useRef } from 'react';
import { Wand2 } from 'lucide-react';

function InlineValue({ value, onSave, prefix = '$', className = '' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  useEffect(() => {
    setVal(value || '');
  }, [value]);

  const save = () => {
    onSave(val);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false); }}
        onBlur={save}
        className={`bg-white border border-blue-400 px-2 py-1 rounded-lg text-lg sm:text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-blue-400/50 w-full max-w-[140px] ${className}`}
      />
    );
  }

  return (
    <span
      onClick={() => onSave && setEditing(true)}
      className={`cursor-pointer hover:bg-white/60 px-1 -mx-1 rounded-lg transition-colors ${className}`}
      title={onSave ? 'Click to edit' : undefined}
    >
      {prefix}{value || '0'}
    </span>
  );
}

const fmt = (amount) => {
  if (!amount && amount !== 0) return '0';
  return new Intl.NumberFormat('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
};

/**
 * Render the human-readable formula a driver's pay was derived from.
 * Mirrors backend/src/services/driverPay.calc.js:payFormulaLabel so the
 * dispatcher sees exactly what the calc would do. Returns null if the
 * driver has no pay_type/rate yet — caller hides the label entirely.
 */
function payFormulaLabel({ payType, payRate, miles, revenue }) {
  const rate = parseFloat(payRate) || 0;
  if (!payType || !rate) return null;
  switch (payType) {
    case 'per_mile':
      return `$${rate.toFixed(2)}/mi × ${(parseInt(miles) || 0).toLocaleString()} mi`;
    case 'percentage':
      return `${rate}% of $${(parseFloat(revenue) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    case 'flat_rate':
      return `$${rate.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} flat`;
    case 'hourly':
      return `$${rate.toFixed(2)}/hr`;
    default:
      return null;
  }
}

export function FinancialStrip({
  revenue,
  driverPay,
  margin,
  rpm,
  miles,
  onUpdateField,
  // New: pay-automation context. When `driver` is present we render the
  // derived formula (when not overridden) or a "Manual override · Reset"
  // affordance (when overridden). Gracefully degrades when `driver` is null
  // — strip behaves exactly as before.
  driverPayOverridden = false,
  driver = null
}) {
  const formula = payFormulaLabel({
    payType: driver?.pay_type,
    payRate: driver?.pay_rate,
    miles,
    revenue
  });
  const showAutoLabel = !!driver && !driverPayOverridden && formula;
  const showOverrideLabel = !!driver && driverPayOverridden;

  const saveDriverPay = (v) => {
    const num = parseFloat(String(v).replace(/[^0-9.-]/g, ''));
    // Typing a value flips the override flag in the same request so the
    // backend won't auto-recompute over it on the next save.
    onUpdateField('driver_pay', num, { driver_pay_overridden: true });
  };

  const resetToAuto = () => {
    onUpdateField('driver_pay_overridden', false);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
        {/* Revenue */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Revenue</p>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">
            <InlineValue
              value={fmt(revenue)}
              onSave={(v) => onUpdateField('revenue', parseFloat(String(v).replace(/[^0-9.-]/g, '')))}
            />
          </div>
        </div>

        {/* Driver Pay */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
            Driver Pay
          </p>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">
            <InlineValue
              value={fmt(driverPay)}
              onSave={saveDriverPay}
            />
          </div>
          {showAutoLabel && (
            <p className="text-[11px] text-text-tertiary mt-0.5 inline-flex items-center gap-1">
              <Wand2 className="w-3 h-3" />
              <span>auto · {formula}</span>
            </p>
          )}
          {showOverrideLabel && (
            <p className="text-[11px] mt-0.5">
              <span className="text-amber-700">Manual override</span>
              {' · '}
              <button
                type="button"
                onClick={resetToAuto}
                className="text-accent hover:underline"
                title="Recompute from the driver's Pay & Classification"
              >
                Reset to auto
              </button>
            </p>
          )}
        </div>

        {/* Margin */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Margin</p>
          <p className={`text-lg sm:text-2xl font-bold ${margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${fmt(margin)}
          </p>
        </div>

        {/* $/Mile */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">$/Mile</p>
          {rpm === null || rpm === undefined ? (
            <p
              className="text-lg sm:text-2xl font-bold text-gray-400"
              title="Flat-fee load — excluded from rate-per-mile metrics"
            >
              —
            </p>
          ) : (
            <p className="text-lg sm:text-2xl font-bold text-gray-900">
              ${(rpm || 0).toFixed(2)}
            </p>
          )}
          {miles > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{miles.toLocaleString()} mi</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialStrip;
