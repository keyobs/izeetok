# Feature-based folder structure, not generic architecture layers

The original layout (`domain/`, `application/`, `infrastructure/`, `pages/`, `shared/`, `app/`) grew
without every name earning its keep: traced file-by-file, `application/` in particular turned out to
have no unifying reason to exist — each of its 7 files belonged either to a single feature, to data
access, or to the pure scientific core, never to an "application" tier as such. We're reorganizing
`src/` around explicit roles and features instead, decided file-by-file against real import usage
(not by folder-name guessing) and recorded in full in `devdx/new-architecture.md` (a working doc,
not versioned — this ADR is the durable record).

**Target structure:**

```
src/
├── analysis/       # pure scientific core (ex-domain/, + generateVariations/variationLabels) — zero React
│   ├── backtest/ discovery/ draw/ features/ geometry/ grid/ random/ scoring/ strategy/
├── api/            # data access regardless of transport (CSV today, HTTP later) — drawRepository,
│                   # CsvDrawRepository, DrawRepository, parseFdjCsv
├── app/            # router, layout, config — unchanged
├── providers/      # transverse Context/Provider pairs (EvaluatedGridContext/Provider first)
├── components/     # generic, reusable, no business logic
├── hooks/          # transverse hooks — created only once a real cross-feature need exists
├── utils/          # pure functions, no React
├── features/       # one folder per feature, colocated — evaluation/ geometry/ draws/ laboratory/ discovery/
├── sandbox/
│   └── spike/      # ADR-0002's throwaway vertical-spike scaffold
└── testing/        # cross-cutting test tooling (ex-shared/): renderWithProviders, testCsvFixture, testSetup
```

`health/`, `middlewares/`, `routes/`, `types/` are deliberately not created yet — nothing in the repo
needs them today; they get created the day a real need appears, not before. Import aliases
(`@analysis`, `@api`, ...) are likewise added only once each folder actually exists, not anticipated.

**Status**: accepted, not yet executed as a migration.
