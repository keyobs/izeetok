# Feature workflow

Entry test: if you can already name every file the change touches, and none of them are imported by more than the one feature you're changing, go straight to step 4. Otherwise — or if you're not sure — start at step 1. That's the same bar `CLAUDE.md` sets ("non trivial ou ambigu"), made checkable: naming the files is easy to fake from memory, so the test is really "did you grep to confirm it," not "does it feel obvious."

## 1. Plan

Hand the request to `architect`. It explores the real codebase before proposing anything, reaches for the `domain-modeling` skill itself when domain vocabulary is involved (see `CONTEXT.md`), and stops at a plan — no code. It states defaults for easily-reversible choices and only raises blocking questions for the ones that are hard to reverse or genuinely ambiguous.

## 2. Challenge

Run `grill-me` against the plan. Resolve every blocking question it raises before moving on.

## 3. Validate with the human

Per this repo's own process rule (`CLAUDE.md` → "Process avant tout travail de code non trivial ou ambigu"), get explicit confirmation of the plan — including the precise file list — before writing code. `architect` treats a decision as settled only once you've confirmed it in conversation, not by default; this step is where that confirmation actually happens.

## 4. Implement

Implement the approved plan incrementally. Read a file's current state before editing it — never assume session memory is up to date (`CLAUDE.md`).

## 5. Test strategy

Ask `test-strategist` for a prioritized list of what's actually worth testing for this diff — anchored on this repo's own conventions and named scientific invariants, not generic advice. Write the tests it identifies as valuable; skip the ones it explicitly says aren't.

## 6. Quality review

Run `quality-reviewer` against the final diff. It checks against `CLAUDE.md`'s documented conventions specifically (component style, naming, import order, domain purity, `data-testid` patterns) — it doesn't hunt bugs. Also run `/code-review` when the diff touches code shared across features, external I/O, or anything else hard to reverse; a single-feature change with no cross-cutting reach is already covered by `quality-reviewer` + `test-strategist` alone.

## 7. Validate

Run:
- `pnpm check`
- `pnpm lint`
- `pnpm test:run`
- `pnpm build`

## 8. Record the decision, if it earned one

If `architect` or `quality-reviewer` flagged the change as ADR-worthy (hard to reverse, surprising without context, a real trade-off), write the ADR now that it's actually settled — via the `domain-modeling` skill, following `ADR-FORMAT.md`. Don't write it earlier: an ADR records a decision, not the deliberation that led to it.
