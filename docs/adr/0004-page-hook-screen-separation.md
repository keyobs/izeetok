# Separate each page's logic from its view, in anticipation of distinct mobile screens

The mobile experience needs real, distinct screens for at least some pages eventually — not just a
responsive reflow of the same markup — and those screens must share the exact same underlying logic
(state, data-fetching, computed values, handlers) as their desktop counterpart, with zero
duplication. That requires the logic to not live inside the view component at all. This extends,
up to page level, the same split already chosen for `GridInputForm` (component) /`useGridInput`
(hook) in ADR-0003's planning, applied uniformly to every page rather than as a one-off.

Each feature folder gets three files:

- `use<Page>Page.ts` — all state, queries, derived values, handlers. No JSX.
- `<Page>Screen.tsx` — pure view, receives the hook's return value as props. Only UI-local state
  allowed (e.g. a transient toggle a different screen wouldn't need to share).
- `<Page>Page.tsx` — thin composition root wired into the router: calls the hook once, renders the
  screen. The only file that changes when a mobile screen is actually built (picks Desktop vs Mobile
  by breakpoint) — the hook and the desktop screen don't move.

The hook is called once, at the `Page` level, not inside each `Screen` — this is what prevents
duplicated query/state instances and state loss if screens are ever swapped at runtime rather than
only at first mount.

No `MobileScreen` or breakpoint hook is created yet — only the shape that will receive one, per the
same "don't create it before a real need" principle as ADR-0003's deferred folders. `evaluation`,
`geometry`, `draws`, `laboratory`, and `discovery` are not equally entangled today (`draws` and
`discovery` are close to this shape already; `geometry` and `laboratory` require the most rework) —
tracked as a migration, not assumed to land in one commit.

**Status**: accepted, not yet executed.
