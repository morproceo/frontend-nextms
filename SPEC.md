# Migration Freeze Spec

## Purpose

Prepare the legacy MorPro TMS frontend for a controlled migration window without requiring a midnight manual deploy.

## Cutovers

- Freeze start: April 23, 2026 at 6:00 PM America/New_York (`2026-04-23T22:00:00Z`)
- Redirect start: April 24, 2026 at 6:00 AM America/New_York (`2026-04-24T10:00:00Z`)
- Redirect target: `https://app.morpronext.com/login`

## User Stories

- As an operator, I can merge the migration change set before the cutoff and trust the behavior to switch automatically at the correct Eastern time.
- As a user, I can still log in and review data after the freeze starts, but create and update actions are blocked with a clear message.
- As a stakeholder, I can test the freeze and redirect behavior before production cutover using query-string dry runs.

## Acceptance Criteria

- All frontend mutation requests are blocked centrally after the freeze window begins, except auth/session lifecycle requests needed to keep read-only access usable.
- A global banner communicates that the site is in temporary read-only mode.
- Blocked mutation attempts show a warning toast instead of failing silently.
- `/?dryrun=freeze` forces read-only preview mode for the current browser session.
- `/?dryrun=migrate` forces redirect mode for the current browser session.
- At redirect start, the SPA forwards users to `https://app.morpronext.com/login`.
- Time checks use absolute UTC instants derived from America/New_York, not host-local locale assumptions.

## Verification

- `npm run build`
- Visit a normal authenticated route with `?dryrun=freeze` and confirm banner plus blocked save/create behavior.
- Visit any route with `?dryrun=migrate` and confirm redirect to the MorPro Next login page.
