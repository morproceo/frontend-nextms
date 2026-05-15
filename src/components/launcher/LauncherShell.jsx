import { Outlet } from 'react-router-dom';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';
import { TrialBanner } from '../features/billing/TrialBanner';

export function LauncherShell() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          'radial-gradient(ellipse at top, #0a2645 0%, #050b18 50%, #000000 100%)'
      }}
    >
      <EcosystemHeader />
      {/* Trial / subscribe nudge — first thing seen after creating an org.
          "Subscribe now" → Organization → Billing. (Trial activation is
          triggered from clicking a locked module tile, not here.) */}
      <TrialBanner />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default LauncherShell;
