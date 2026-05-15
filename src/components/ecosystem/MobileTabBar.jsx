import { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { MoreHorizontal, X } from 'lucide-react';
import { cn } from '../../lib/utils';

/**
 * MobileTabBar
 *
 * Bottom tab navigation for micro-app shells (Parking, Load Network, Fleet
 * Health, Genie) on mobile (`lg:hidden`). The ecosystem top bar stays; this
 * replaces each app's redundant mobile hamburger sub-bar + slide-out drawer.
 *
 * Up to 4 primary tabs are shown inline. Everything else (overflow nav
 * items + `moreLinks` like "Back to launcher") collapses into a "More"
 * tab that opens a bottom sheet. The "More" tab is always present so every
 * app has a consistent escape hatch back to the ecosystem.
 *
 * Props:
 *   items     — [{ label, to, icon, end }]  the app's own nav
 *   moreLinks — [{ label, to, href, icon, external }]  footer/ecosystem links
 */
/**
 * Optional `gridItems` renders a tappable avatar grid at the top of the
 * "More" sheet (used by Genie Suite for its agent roster):
 *   [{ key, label, to, node }]  — `node` is the avatar element to show.
 * `gridTitle` is an optional small section label above the grid.
 */
export function MobileTabBar({
  items = [],
  moreLinks = [],
  gridItems = [],
  gridTitle
}) {
  const location = useLocation();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Close the sheet on navigation.
  useEffect(() => {
    setSheetOpen(false);
  }, [location.pathname]);

  const primary = items.slice(0, 4);
  const overflow = items.slice(4);
  const sheetItems = [...overflow];
  const hasGrid = gridItems.length > 0;

  return (
    <>
      {/* Bottom sheet */}
      {sheetOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSheetOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-[#0e1422] border-t border-white/[0.08] rounded-t-2xl shadow-elevated safe-bottom animate-fade-in">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.08]">
              <span className="text-body font-semibold text-white">More</span>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1.5 rounded-chip hover:bg-white/[0.06]"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>
            <div className="p-3 max-h-[60vh] overflow-y-auto">
              {hasGrid && (
                <>
                  {gridTitle && (
                    <div className="px-2 pt-1 pb-3 text-[11px] uppercase tracking-wider text-white/40">
                      {gridTitle}
                    </div>
                  )}
                  <div className="grid grid-cols-3 gap-2 pb-1">
                    {gridItems.map(({ key, label, sublabel, to, node }) => (
                      <NavLink
                        key={key}
                        to={to}
                        className={({ isActive }) =>
                          cn(
                            'flex flex-col items-center gap-2 py-4 px-2 rounded-2xl transition-all',
                            'active:scale-95',
                            isActive
                              ? 'bg-white/[0.10] ring-1 ring-[#34CCFF]/40'
                              : 'bg-white/[0.04] hover:bg-white/[0.07]'
                          )
                        }
                      >
                        <div className="w-12 h-12 flex items-center justify-center">
                          {node}
                        </div>
                        <div className="text-center max-w-full">
                          <div className="text-[12px] font-medium text-white/85 truncate">
                            {label}
                          </div>
                          {sublabel && (
                            <div className="text-[10px] text-white/45 truncate mt-0.5">
                              {sublabel}
                            </div>
                          )}
                        </div>
                      </NavLink>
                    ))}
                  </div>
                  {(sheetItems.length > 0 || moreLinks.length > 0) && (
                    <div className="my-3 h-px bg-white/[0.08]" />
                  )}
                </>
              )}
              {sheetItems.map(({ label, to, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'flex items-center gap-3 px-4 py-3 rounded-button text-body-sm transition-colors',
                      isActive
                        ? 'bg-white/[0.08] text-[#34CCFF]'
                        : 'text-white/70 hover:bg-white/[0.05] hover:text-white'
                    )
                  }
                >
                  {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                  <span>{label}</span>
                </NavLink>
              ))}

              {sheetItems.length > 0 && moreLinks.length > 0 && (
                <div className="my-2 h-px bg-white/[0.08]" />
              )}

              {moreLinks.map(({ label, to, href, icon: Icon, external }) => {
                const cls =
                  'flex items-center gap-3 px-4 py-3 rounded-button text-body-sm text-white/70 hover:bg-white/[0.05] hover:text-white transition-colors';
                if (external && href) {
                  return (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cls}
                    >
                      {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                      <span>{label}</span>
                    </a>
                  );
                }
                return (
                  <Link key={label} to={to} className={cls}>
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}
                    <span>{label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        </>
      )}

      {/* Bottom tab bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[#05080f] border-t border-white/[0.06] lg:hidden z-40 safe-bottom">
        <div className="flex items-center justify-around h-16">
          {primary.map(({ label, to, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center flex-1 h-full transition-colors',
                  isActive ? 'text-[#34CCFF]' : 'text-white/45 hover:text-white/70'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {Icon && (
                    <Icon className={cn('w-5 h-5 mb-1', isActive && 'stroke-[2.5px]')} />
                  )}
                  <span className="text-[10px] font-medium">{label}</span>
                </>
              )}
            </NavLink>
          ))}

          <button
            onClick={() => setSheetOpen(true)}
            className="flex flex-col items-center justify-center flex-1 h-full text-white/45 hover:text-white/70 transition-colors"
          >
            <MoreHorizontal className="w-5 h-5 mb-1" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>
    </>
  );
}

export default MobileTabBar;
