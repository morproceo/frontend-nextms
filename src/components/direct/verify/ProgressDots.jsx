import { Check } from 'lucide-react';
import { STEP_KEYS, STEP_META } from './Steps';

/**
 * Horizontal progress dots. Owner-op friendly: numbers + short labels under
 * each dot, current step bold, completed steps with a checkmark. Mobile-
 * first — wraps cleanly at 360px.
 */
export default function ProgressDots({ current }) {
  const currentNum = STEP_META[current]?.num ?? 0;
  // Skip the welcome step in the visible progress bar — it doesn't count
  // toward "real" progress; the carrier hasn't started anything yet.
  const visibleSteps = STEP_KEYS.filter((k) => k !== 'welcome' && k !== 'pending');
  return (
    <ol className="flex items-start justify-between gap-1 sm:gap-2 w-full max-w-xl mx-auto px-2">
      {visibleSteps.map((k, idx) => {
        const meta = STEP_META[k];
        const done = currentNum > meta.num;
        const active = current === k;
        const last = idx === visibleSteps.length - 1;
        return (
          <li key={k} className="flex-1 flex flex-col items-center min-w-0">
            <div className="flex items-center w-full">
              <div className="flex-1 h-px bg-transparent" />
              <span
                className={[
                  'w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold border-2 flex-shrink-0',
                  done ? 'bg-emerald-500 border-emerald-500 text-white' : '',
                  active ? 'bg-text-primary border-text-primary text-surface-primary' : '',
                  !done && !active ? 'bg-surface-primary border-border text-text-tertiary' : ''
                ].join(' ')}
              >
                {done ? <Check className="w-3.5 h-3.5" /> : meta.num}
              </span>
              <div className={`flex-1 h-px ${last ? 'bg-transparent' : done ? 'bg-emerald-500' : 'bg-border'}`} />
            </div>
            <span
              className={[
                'mt-1.5 text-[10px] uppercase tracking-wider whitespace-nowrap',
                active ? 'text-text-primary font-semibold' : 'text-text-tertiary'
              ].join(' ')}
            >
              {meta.short}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
