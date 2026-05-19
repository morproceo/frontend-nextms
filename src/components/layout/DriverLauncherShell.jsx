import { Outlet } from 'react-router-dom';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';

/**
 * DriverLauncherShell — the driver portal's launcher chrome.
 *
 * Same dark ecosystem experience as the org launcher (LauncherShell),
 * but driver-scoped: the EcosystemHeader runs in `variant="driver"` so
 * the org switcher / org app-grid / Genie are hidden (no org context),
 * and there's no TrialBanner (billing is org-only).
 */
export function DriverLauncherShell() {
  return (
    <div
      className="min-h-screen text-white"
      style={{
        background:
          'radial-gradient(ellipse at top, #0a2645 0%, #050b18 50%, #000000 100%)'
      }}
    >
      <EcosystemHeader variant="driver" />
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default DriverLauncherShell;
