import { Wrench } from 'lucide-react';

/**
 * Generic stub for Wrench routes that aren't built out yet (Phase A only
 * ships shell + tile). Real implementations land in Phases B-F.
 */
export default function StubPage({ title, subtitle }) {
  return (
    <div className="px-6 py-10 max-w-3xl mx-auto">
      <header className="mb-6">
        <h1 className="text-title text-text-primary">{title}</h1>
        {subtitle && <p className="text-body-sm text-text-secondary mt-1">{subtitle}</p>}
      </header>
      <div className="rounded-card border border-border-subtle p-10 text-center">
        <Wrench className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
        <p className="text-body-sm text-text-secondary">Coming next.</p>
      </div>
    </div>
  );
}
