import { Network, ArrowRight } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';

/**
 * MorPro Direct — Phase 0 placeholder page.
 *
 * Shown when an org has the morproDirect feature flag enabled but the
 * product hasn't shipped yet. Replaced in Phase 1 by the network dashboard.
 */
export default function PlaceholderPage() {
  const { orgSlug } = useParams();

  return (
    <div className="min-h-full flex flex-col items-center justify-center px-6 py-16">
      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center mb-6">
        <Network className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-display-sm sm:text-display text-text-primary text-center max-w-xl">
        MorPro Direct
      </h1>
      <p className="text-body text-text-secondary text-center mt-3 max-w-xl">
        The brokerless freight network. Coming soon.
      </p>
      <p className="text-body-sm text-text-tertiary text-center mt-6 max-w-md">
        Phase 0 (foundation) is in place. Phase 1 ships carrier public profiles
        + the verified directory. We'll let you know when it's live.
      </p>
      <Link
        to={`/o/${orgSlug}/launcher`}
        className="mt-8 inline-flex items-center gap-2 px-4 py-2 rounded-button bg-accent text-white text-body-sm font-medium hover:bg-accent-hover transition-colors"
      >
        Back to launcher
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
