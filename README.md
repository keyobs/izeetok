# EuroMillions Geometry Lab

Why predict when you could analyze?

All combinations have the same theoretical probability: this app lets you analyze a combination against historical structures — it predicts nothing.

Since every grid has the same odds of being drawn, this app instead lets you look at them through the lens of mathematical objects (features, geometry, PCA/UMAP, clustering, backtesting) — never suggesting any predictive power.


## Stack

React 19  
TypeScript  
Vite  
react-router, TanStack Query, Zod  
recharts, three.js/@react-three  
pnpm.  

No backend — CSV dataset committed to the repo, user state in localStorage.

## Getting started

```
pnpm install
pnpm dev
```

## Commands

| Command | Role |
|---|---|
| `pnpm dev` | Dev server |
| `pnpm build` | Production build |
| `pnpm check` | Type-check (`tsc -b`) |
| `pnpm lint` / `pnpm lint:fix` | Lint (oxlint) |
| `pnpm test` / `pnpm test:run` | Unit tests (Vitest) |
| `pnpm test:e2e` | E2E tests (Playwright) |
| `pnpm release:patch/minor/major` | Version bump (dx-flow) |

## Deployment

`main` → Vercel (production, native Git integration).
`develop` → GitHub Pages: [keyobs.github.io/izeetok](https://keyobs.github.io/izeetok)

## Architecture

React SPA.
The mathematical domain stays pure TypeScript, decoupled from React:

```
src/
  app/            router, layout, config (queryClient...)
  domain/         pure scientific logic — Grid, Draw, features, geometry, scoring, backtest...
  application/    orchestration — repositories, variation generation, embeddings...
  infrastructure/ data access — CSV, concrete repository implementations
  pages/          one page per route (/evaluation, /geometry, /draws, /laboratory, /discovery)
  components/     generic reusable components, no business logic
  shared/         cross-cutting test tooling
```


## Claude Code & agents

The agentic tooling is versioned, not just used locally:

- `.claude/CLAUDE.md` — conventions and working process for Claude Code on this repo.
- `.claude/agents/` — specialized subagents:
  - `architect` — explores and plans a feature/change, doesn't write code
  - `test-strategist` — identifies which tests are worth writing
  - `quality-reviewer` — checks a diff against this repo's conventions
  - `deploy-troubleshooter` — diagnoses a broken CI/deploy run
  - `release-manager` — drafts the changelog and recommends the version bump
- `.agents/skills/` — shared skills (`domain-modeling`, `grilling`, `grill-me`, `grill-with-docs`).
- `.agents/workflows/feature.md` — chains plan → challenge → human validation →
  implementation → tests → review → validation, for any non-trivial feature.
