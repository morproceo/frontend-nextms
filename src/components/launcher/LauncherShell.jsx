import { Outlet } from 'react-router-dom';
import { EcosystemHeader } from '../ecosystem/EcosystemHeader';

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
      <main className="max-w-[1400px] mx-auto px-6 py-10">
        <Outlet />
      </main>
    </div>
  );
}

export default LauncherShell;
