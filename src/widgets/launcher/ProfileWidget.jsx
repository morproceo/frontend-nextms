import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useOrg } from '../../contexts/OrgContext';

/**
 * ProfileWidget — adapts to its own size via ResizeObserver.
 *
 * Four size profiles, picked from the widget's actual container
 * rect (NOT the viewport — widgets get resized independently in
 * the grid):
 *
 *   tiny       very small (<220×200) — just avatar + name on one line
 *   horizontal wide aspect (w/h > 1.6) — avatar left, info right
 *   compact    narrow-ish (<360 wide) — small vertical stack
 *   spacious   default — big avatar, hero name, org card
 *
 * Name always stays visible (truncate + min-w-0 + responsive font)
 * regardless of profile.
 */
export function ProfileWidget() {
  const { user } = useAuth();
  const { currentOrg, currentRole } = useOrg();
  const ref = useRef(null);
  const [size, setSize] = useState({ w: 360, h: 360 });

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const ro = new ResizeObserver((entries) => {
      const r = entries[0].contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(node);
    return () => ro.disconnect();
  }, []);

  const initials =
    `${(user?.first_name || '').charAt(0)}${(user?.last_name || '').charAt(0)}`
      .toUpperCase()
      || (user?.email || '?').charAt(0).toUpperCase();
  const displayName = user?.first_name
    ? `${user.first_name}${user.last_name ? ` ${user.last_name}` : ''}`
    : user?.email || 'Signed-in user';

  const profile = pickProfile(size.w, size.h);

  return (
    <div ref={ref} className="h-full w-full">
      {profile === 'tiny' && (
        <TinyLayout
          initials={initials}
          displayName={displayName}
          email={user?.email}
        />
      )}
      {profile === 'horizontal' && (
        <HorizontalLayout
          initials={initials}
          displayName={displayName}
          email={user?.email}
          org={currentOrg}
          role={currentRole}
        />
      )}
      {profile === 'compact' && (
        <CompactLayout
          initials={initials}
          displayName={displayName}
          email={user?.email}
          org={currentOrg}
          role={currentRole}
        />
      )}
      {profile === 'spacious' && (
        <SpaciousLayout
          initials={initials}
          displayName={displayName}
          email={user?.email}
          org={currentOrg}
          role={currentRole}
        />
      )}
    </div>
  );
}

function pickProfile(w, h) {
  // Thresholds tuned for the 12-col / 1080-container default layout
  // (col ≈ 68px). The Profile widget's default is 4×8 → ~332×412,
  // which should hit "spacious" — that's the iCloud-style hero with
  // the 112px avatar + big name.
  //
  //   tiny       very small chip       (<220 wide  OR <180 tall)
  //   horizontal wide aspect ratio     (≥320 wide AND w/h > 1.5)
  //   compact    narrow portrait       (<280 wide)
  //   spacious   default hero          (≥280 wide, near-square+)
  if (w < 220 || h < 180) return 'tiny';
  if (w >= 320 && w / Math.max(h, 1) > 1.5) return 'horizontal';
  if (w < 280) return 'compact';
  return 'spacious';
}

/* ─────────────────────────────── Avatar ─────────────────────────── */

function Avatar({ initials, size }) {
  const cls = {
    sm: 'w-10 h-10 text-base',
    md: 'w-14 h-14 text-xl',
    lg: 'w-20 h-20 text-2xl',
    xl: 'w-28 h-28 text-4xl'
  }[size];
  const ringInset = {
    sm: '-inset-1',
    md: '-inset-1',
    lg: '-inset-1.5',
    xl: '-inset-1.5'
  }[size];
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`absolute ${ringInset} rounded-full bg-gradient-to-br from-cyan-400 via-blue-500 to-cyan-300 opacity-90 blur-[0.5px]`}
      />
      <div
        className={`relative ${cls} rounded-full bg-slate-900 ring-2 ring-slate-950 flex items-center justify-center`}
      >
        <span className="font-semibold text-white tabular-nums">{initials}</span>
      </div>
    </div>
  );
}

/* ─────────────────────────────── Layouts ────────────────────────── */

function TinyLayout({ initials, displayName, email }) {
  const showEmail = email && email !== displayName;
  return (
    <div className="h-full w-full p-3 flex items-center gap-3">
      <Avatar initials={initials} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-body-sm font-semibold text-white truncate leading-tight">
          {displayName}
        </div>
        {showEmail && (
          <div className="text-[11px] text-white/45 truncate">{email}</div>
        )}
      </div>
    </div>
  );
}

function HorizontalLayout({ initials, displayName, email, org, role }) {
  const showEmail = email && email !== displayName;
  const nameIsEmail = displayName && displayName.includes('@');
  return (
    <div className="h-full w-full p-5 sm:p-6 flex items-center gap-5">
      <Avatar initials={initials} size="lg" />
      <div className="flex-1 min-w-0">
        <div
          className={`${nameIsEmail ? 'text-xl sm:text-2xl' : 'text-2xl sm:text-3xl'} font-semibold text-white truncate leading-tight`}
        >
          {displayName}
        </div>
        {showEmail && (
          <div className="text-body-sm text-white/55 truncate mt-0.5">{email}</div>
        )}
        {org && (
          <div className="flex items-baseline gap-2 mt-3 flex-wrap">
            <span className="text-[10px] uppercase tracking-[0.16em] text-white/40 font-semibold">
              Org
            </span>
            <span className="text-body-sm text-white font-medium truncate">
              {org.name}
            </span>
            {role && (
              <span className="text-small text-white/45 capitalize">· {role}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function CompactLayout({ initials, displayName, email, org, role }) {
  const showEmail = email && email !== displayName;
  const nameIsEmail = displayName && displayName.includes('@');
  // justify-center keeps the content at its natural size sitting in
  // the visual center of the widget, so resizing the tile doesn't
  // leave a giant empty bottom — extra space goes equally above
  // and below.
  return (
    <div className="h-full w-full p-4 sm:p-5 flex flex-col items-center justify-center text-center min-w-0">
      <div className="mb-3">
        <Avatar initials={initials} size="md" />
      </div>
      <div className="w-full min-w-0 text-center px-2">
        <div
          className={`${nameIsEmail ? 'text-body' : 'text-title-sm'} font-semibold text-white leading-tight truncate`}
          title={displayName}
        >
          {displayName}
        </div>
        {showEmail && (
          <div className="text-[11px] text-white/45 truncate mt-0.5">{email}</div>
        )}
      </div>
      {org && (
        <>
          <div className="w-full max-w-[80%] h-px bg-white/[0.08] my-3" />
          <div className="text-[10px] uppercase tracking-[0.14em] text-white/40 font-semibold">
            Current org
          </div>
          <div className="text-body-sm font-medium text-white mt-1 truncate w-full">
            {org.name}
          </div>
          {role && (
            <div className="text-[11px] text-white/45 capitalize mt-0.5">{role}</div>
          )}
        </>
      )}
    </div>
  );
}

function SpaciousLayout({ initials, displayName, email, org, role }) {
  // Hide the email line when display name already IS the email
  // (user with no first_name set). Otherwise it shows twice.
  const showEmail = email && email !== displayName;
  // For an email-style display name we render it slightly smaller
  // because it tends to be long (e.g. yamil@morpro.io). Real names
  // get the full hero treatment.
  const nameIsEmail = displayName && displayName.includes('@');
  const nameCls = nameIsEmail
    ? 'text-2xl sm:text-3xl'
    : 'text-3xl sm:text-4xl';

  return (
    <div className="h-full w-full p-6 sm:p-8 flex flex-col items-center justify-center text-center">
      <div className="mb-5 sm:mb-6">
        <Avatar initials={initials} size="xl" />
      </div>

      <div className="w-full min-w-0 px-2">
        <div
          className={`${nameCls} text-white font-semibold leading-tight truncate`}
          title={displayName}
        >
          {displayName}
        </div>
        {showEmail && (
          <div className="text-body-sm text-white/55 mt-1.5 truncate">{email}</div>
        )}
      </div>

      <div className="w-full max-w-[70%] h-px bg-white/[0.08] my-5 sm:my-6" />

      {org && (
        <div className="text-center w-full min-w-0 px-2">
          <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 font-semibold">
            Current organization
          </div>
          <div className="text-body sm:text-title-sm font-semibold text-white mt-1.5 truncate">
            {org.name}
          </div>
          {role && (
            <div className="text-small text-white/45 capitalize mt-0.5">{role}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProfileWidget;
