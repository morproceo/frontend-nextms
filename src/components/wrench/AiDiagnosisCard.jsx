import {
  Sparkles, Wrench, Clock, DollarSign, AlertTriangle, CheckCircle2,
  ListChecks, Info
} from 'lucide-react';

/**
 * Renders the structured AI mechanic response from
 * `aiMechanic.analyzeDTC`. Defensive against missing fields — old or
 * fallback analyses may not have the full schema.
 */
export default function AiDiagnosisCard({ analysis, code }) {
  if (!analysis) return null;

  const {
    name, explanation, severity, system, possibleCauses, recommendedFixes,
    estimatedCost, urgency, canDrive, driveWarning, partsNeeded,
    additionalNotes, analyzed_at
  } = analysis;

  return (
    <div className="rounded-card border border-border-subtle bg-surface-primary overflow-hidden">
      <div className="px-4 py-3 border-b border-border-subtle flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
          <p className="text-body font-semibold text-text-primary truncate">
            {code} {name ? `— ${name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {severity && <SeverityPill s={severity} />}
          {urgency && <UrgencyPill u={urgency} />}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {explanation && (
          <p className="text-body-sm text-text-primary leading-relaxed">{explanation}</p>
        )}

        <div className="flex items-center gap-3 flex-wrap">
          <DriveStatus canDrive={canDrive} warning={driveWarning} />
          {system && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-button bg-surface-secondary text-body-sm text-text-secondary">
              <Wrench className="w-3.5 h-3.5" /> {system}
            </span>
          )}
          {estimatedCost && (
            <span className="inline-flex items-center gap-1 px-2 py-1 rounded-button bg-surface-secondary text-body-sm text-text-secondary">
              <DollarSign className="w-3.5 h-3.5" />
              {fmtCost(estimatedCost)}
            </span>
          )}
        </div>

        {Array.isArray(possibleCauses) && possibleCauses.length > 0 && (
          <Section title="Possible causes" icon={Info}>
            <ul className="text-body-sm text-text-primary space-y-1">
              {possibleCauses.map((c, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-text-tertiary text-[10px] mt-1.5">●</span>
                  <span>{c}</span>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {Array.isArray(recommendedFixes) && recommendedFixes.length > 0 && (
          <Section title="Recommended next steps" icon={ListChecks}>
            <ol className="text-body-sm text-text-primary space-y-2">
              {recommendedFixes.map((f, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center text-[10px] font-semibold flex-shrink-0 mt-0.5">
                    {f.step ?? i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p>{f.action || f}</p>
                    {(f.difficulty || f.estimatedTime) && (
                      <p className="text-small text-text-tertiary mt-0.5">
                        {[f.difficulty, f.estimatedTime].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </Section>
        )}

        {Array.isArray(partsNeeded) && partsNeeded.length > 0 && (
          <Section title="Parts that may be involved" icon={Wrench}>
            <ul className="text-body-sm text-text-primary space-y-1">
              {partsNeeded.map((p, i) => (
                <li key={i} className="flex items-center justify-between gap-2 px-2 py-1 bg-surface-secondary/50 rounded">
                  <span className="truncate">
                    {p.name || p}
                    {p.partNumber && <span className="text-text-tertiary text-small ml-2">({p.partNumber})</span>}
                  </span>
                  {p.estimatedPrice != null && (
                    <span className="text-small text-text-tertiary flex-shrink-0">${p.estimatedPrice}</span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        {additionalNotes && (
          <Section title="Notes" icon={Info}>
            <p className="text-body-sm text-text-secondary leading-relaxed">{additionalNotes}</p>
          </Section>
        )}

        <div className="pt-3 border-t border-border-subtle flex items-center justify-between gap-2">
          <p className="text-small text-text-tertiary">
            <Clock className="w-3 h-3 inline mr-1 -mt-0.5" />
            {analyzed_at ? new Date(analyzed_at).toLocaleString() : 'Just now'}
          </p>
          <p className="text-[10px] uppercase tracking-wider text-text-tertiary">
            AI-generated · verify with a qualified mechanic
          </p>
        </div>
      </div>
    </div>
  );
}

function fmtCost(c) {
  if (typeof c === 'number') return `$${c.toLocaleString()}`;
  if (c && typeof c === 'object' && c.min != null && c.max != null) {
    return `$${c.min.toLocaleString()}–$${c.max.toLocaleString()}`;
  }
  return '—';
}

function Section({ title, icon: Icon, children }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wider text-text-tertiary mb-1.5 flex items-center gap-1">
        <Icon className="w-3 h-3" /> {title}
      </p>
      {children}
    </div>
  );
}

function DriveStatus({ canDrive, warning }) {
  if (canDrive == null) return null;
  const cls = canDrive
    ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
    : 'bg-red-500/15 text-red-700 dark:text-red-400';
  const Icon = canDrive ? CheckCircle2 : AlertTriangle;
  const label = canDrive
    ? (warning ? 'Drive with caution' : 'Safe to drive')
    : 'Do not drive';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-button text-body-sm font-medium ${cls}`}
      title={warning || ''}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

function SeverityPill({ s }) {
  const cfg = ({
    critical: 'bg-red-500/15 text-red-700 dark:text-red-400',
    warning: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    info: 'bg-blue-500/15 text-blue-700 dark:text-blue-400'
  })[s] || 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>{s}</span>;
}

function UrgencyPill({ u }) {
  const cfg = ({
    immediate: 'bg-red-500/15 text-red-700 dark:text-red-400',
    soon: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
    routine: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400'
  })[u] || 'bg-gray-500/15 text-gray-600';
  return <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider font-medium ${cfg}`}>{u}</span>;
}
