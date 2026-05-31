# Toast Notification System

> Living doc. Append a Changelog entry at the bottom when behavior or API
> changes. Don't rewrite history — leave the trail.

## What it is

A single global toast system, built on `@radix-ui/react-toast`, mounted at
the App root via `<ToastProvider>`. Every page calls the same `useToast()`
hook and fires `toast({ ... })`. Replaces the per-page `setStatusError`
banner pattern and gives the owner-op a consistent way to feel agent
activity *and* user-action feedback.

**Source of truth:** `src/contexts/ToastContext.jsx`.

---

## The API

```js
import { useToast } from '../../contexts/ToastContext';

const { toast } = useToast();

toast({
  title: 'Audited 12 loads · fixed 4 fields',     // headline, ~5 words
  description: 'Open the inbox for the full digest.', // ~12-15 words max
  variant: 'info',                                 // success | error | info | warning
  durationMs: 8000,                                // optional override
  agent: getAgent('alex'),                         // optional — see "Agent toasts"
  action: { label: 'Open in inbox', to: '/genie/inbox' } // optional CTA
});
```

### Field reference

| Field | Type | Purpose |
|---|---|---|
| `title` | string | The headline. Should be scannable in 1 second. |
| `description` | string | The detail line. **Cap ~12-15 words.** If you need more, the toast is the wrong tool — use inline UI. |
| `variant` | enum | `success` \| `error` \| `info` \| `warning`. Pin to these four — don't introduce new variants. |
| `durationMs` | number | How long before auto-dismiss. Default 5000 for regular toasts, 8000 for agent toasts (longer because actionable). |
| `agent` | object | Object from `config/genieTeam` (e.g. `getAgent('alex')`). When set, the toast renders the agent's avatar instead of the variant icon. Implies an actionable agent event. |
| `action` | object | `{ label, to }` for a React Router link OR `{ label, onClick }` for a callback. Renders below the description as `Label →`. |

---

## When to use a toast (and when NOT to)

### ✅ Use a toast for

- **User-action completion.** "Saved", "Sent", "Lead accepted · Load #ATL-0005 created"
- **Agent activity the user might miss.** Background scan finds a lead, Alex auto-applies a fix, Cece reviews an expense
- **Recoverable errors.** "Network error — try again", "Send failed: invalid email"
- **Cross-cutting status changes.** "Connection lost", "Reconnected"

### ❌ DON'T use a toast for

- **Form-field validation.** "Email is required" belongs **under the field**, not in a toast that vanishes.
- **Pure read failures.** A list fetch that 500s should render an empty state with a retry button, not a toast.
- **Every single tiny event.** Owner-op gets ~10 sessions/day. Stay under ~15 toasts/day total or they install mental adblock.
- **Sensitive info.** Anything that should require auth or that you wouldn't show on a screenshot.

### ⚖️ Use BOTH a toast AND an inline banner for

When the error is **action-triggered AND blocking** — i.e. the user clicked
something and it failed, but the resolution requires sustained attention
(upload a doc, fill required fields).

| Surface | Why |
|---|---|
| **Toast** at bottom-right | Fires near where the user's eye is when they click the action button. Catches the "did my click do anything?" moment instantly. |
| **Banner** at top of page | Stays visible while the user navigates to fix the blocker. Toast vanishes in 5s — the persistent reference matters when they're mid-task. |

Pattern (see `LoadDetailPage.updateStatus` for the canonical example):
```js
try {
  await hookUpdateStatus(newStatus);
  setStatusError(null);
  toast({ title: 'Status updated', variant: 'success', durationMs: 3000 });
} catch (err) {
  const msg = err?.response?.data?.error?.message || err.message;
  setStatusError(msg);                                  // banner for reference
  toast({                                                // toast for the moment
    title: 'Status change blocked',
    description: msg,
    variant: 'error'
  });
}
```

**The trap to avoid:** putting a blocking error in *only* a banner. If the
banner is above the fold from the action button (status card mid-page,
banner at top), the user clicks → nothing appears in their viewport →
they think the app is dead → eventually scroll up and find the error.
Always pair these with a toast.

---

## Agent toasts — the engagement loop

The whole point of agent toasts is to make Alex/Cece/Atlas visible
*outside* the Genie Inbox, then drive the user back into it.

### Pattern: doorway, not the room

The toast is a 1-line headline + CTA. The full message lives in the Inbox.
If you put the full email body in the toast, the user reads it there and
never opens the Inbox — which kills your conversion loop.

```js
// ✅ Right
toast({
  title: 'Lead accepted · Load #ATL-0005 created',
  description: 'Pathway Transportation is now in your Brokers tab.',
  variant: 'success',
  agent: getAgent('alex'),
  action: { label: 'Open the load', to: '/o/twinpeaks/loads/abc-123' }
});

// ❌ Wrong — pastes the full content into the toast
toast({
  title: 'Alex finished an audit',
  description: 'I reviewed 12 loads from the last 7 days. I fixed shipper_address ' +
               'and consignee_address on Load #3363968-1 from the rate confirmation. ' +
               '3 fields still need your eyes: Broker/Customer PO # ...'
  // ...
});
```

### Pattern: stamp the agent

When the action was driven by an agent (or as a follow-up to one), pass
`agent: getAgent('<slug>')`. This swaps the variant icon for the agent's
avatar — instantly signals which agent acted. Users start to trust the
team is varied, not a monolithic "AI did something."

```js
const jobAgent = job?.agent_slug ? getAgent(job.agent_slug) : null;

toast({
  title: 'Broker email sent',
  description: 'I delivered the draft you approved.',
  variant: 'success',
  agent: jobAgent       // Alex's avatar
});
```

### Pattern: link to the inbox or the affected entity

If the toast has a follow-up surface (the load, the lead, the agent
inbox message), wire `action: { label, to }` so one click takes the user
there. If there's no obvious destination, skip the action — don't invent
one just to have a CTA.

---

## Variants — exactly four

```
success    completed action          ("Saved", "Sent", "Accepted")
error      retry-worthy failure      ("Network error — try again")
info       informational / agent     ("Alex is composing the broker email")
warning    non-blocking degraded     ("Alex couldn't reach Motive — using cached data")
```

**Do not** introduce `'danger'`, `'success-soft'`, `'error-critical'`, etc.
If four feels limiting, the answer is usually: *that thing shouldn't be a
toast.*

---

## Phase plan

### Phase 1 — User-triggered toasts (THIS PHASE)

When the user clicks a button that runs an agent task or mutates data,
toast the result with a link back to the inbox or the affected entity.

**Status: shipped.** Wired into:
- Inbox `Approve & send` → "Broker email sent" + Alex avatar
- Inbox `Discard` draft → "Draft discarded"
- Inbox `Rerun` → "I queued the task" + Open-in-inbox link
- Inbox `Accept lead` → "Lead accepted · Load #X created" + Open-the-load link
- Inbox `Reject lead` → "Lead rejected"
- Leads tab `Accept` → same as inbox accept
- Leads tab `Reject` → same as inbox reject
- Leads tab `Save` → "Lead updated"
- Load detail `Mark delayed` → "Alex is composing the broker notification" + Watch-the-inbox link

### Phase 2 — Realtime push for background agent activity (planned)

When an `agent_jobs` row flips to `completed` server-side, push a payload
through the existing realtime channel; frontend subscribes once at the
App shell and fires a toast.

Pattern:
```js
// at app root
useAgentJobStream(({ job }) => {
  toast({
    title: subjectForJob(job),
    description: getJobNarrative(job)?.slice(0, 80) + '…',
    variant: 'info',
    agent: getAgent(job.agent_slug),
    action: { label: 'Open in inbox', to: `/o/${orgSlug}/genie/inbox` }
  });
});
```

Requires:
- Server-side `agent_jobs.afterUpdate` hook publishing to the org channel
- Bundling (3 events within 5s collapse to one "+3 more" toast)
- De-dup (same toast within 2s gets swallowed)

### Phase 3 — De-dup, bundle, mute per-agent (later)

- Per-agent toggle in Settings ("Alex: notify · Cece: silent")
- Bundled toast: `+5 more` collapse rule
- Suppress duplicates by hashing `(variant + title + description)`

---

## What to avoid

- **Double-toast.** When the page catches an error AND wires the API
  client to interceptor-toast, the user sees two. Until the interceptor
  ships (Phase 2 of error handling), only the page fires the toast.
- **Toasting on every read.** A list-fetch failure is a page state, not a
  toast. Render an empty state with a retry.
- **More than 3 stacked toasts.** Radix queues them; users see a wall.
  When Phase 2 ships, the bundler caps active count at 3.
- **Free-form variants.** Stick to the four.

---

## Telemetry hook (Phase 2 prep)

Every `variant: 'error'` toast should eventually pipe to your error
tracker (Sentry). Easy to add at the toast call site once the SDK is
wired — for now, the surfaces that catch errors already `console.error`
them, so dev visibility is fine.

---

## Files

```
src/contexts/ToastContext.jsx         ← the provider + hook
src/components/genie/AgentAvatar.jsx  ← rendered when toast.agent is set
src/config/genieTeam.js               ← agent metadata (avatar gradient, name)
src/App.jsx                           ← <ToastProvider> mount point
```

Call sites using the system today:

```
src/pages/genie/InboxPage.jsx                       ← Approve, Discard, Rerun, Accept/Reject lead
src/components/features/customers/LeadsTab.jsx      ← Accept, Reject, Save lead
src/pages/loads/LoadDetailPage.jsx                  ← Dispatch, Mark delayed
```

---

## Changelog

- **2026-05-31** — Added the "BOTH toast AND banner" pattern after a real
  bug: on Load Detail, picking Completed without a BOL set the inline
  banner at the top of the page but the user was looking at the status
  dropdown mid-page — click looked dead. Now action-triggered blocking
  errors fire a toast *and* the banner. The toast is the moment, the
  banner is the reference. Wired into `LoadDetailPage.updateStatus`.
- **2026-05-31** — Phase 1 shipped. ToastContext extended with `agent`
  (renders AgentAvatar instead of variant icon) and `action: { label, to
  } | { label, onClick }`. Wired into 9 user-action surfaces across
  Inbox, Leads tab, and Load detail. Default duration bumped to 8s for
  agent toasts (vs 5s for regular). Doc created.
