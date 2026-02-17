import { useState, useEffect, useRef } from 'react';
import { DollarSign } from 'lucide-react';

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

export function FinancialStrip({ revenue, driverPay, margin, rpm, miles, onUpdateField }) {
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
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Driver Pay</p>
          <div className="text-lg sm:text-2xl font-bold text-gray-900">
            <InlineValue
              value={fmt(driverPay)}
              onSave={(v) => onUpdateField('driver_pay', parseFloat(String(v).replace(/[^0-9.-]/g, '')))}
            />
          </div>
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
          <p className="text-lg sm:text-2xl font-bold text-gray-900">
            ${(rpm || 0).toFixed(2)}
          </p>
          {miles > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">{miles.toLocaleString()} mi</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default FinancialStrip;
