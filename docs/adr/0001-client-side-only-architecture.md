# Client-side-only architecture, no backend

The app targets the author, friends, and recruiters viewing a portfolio piece — not a large public audience — with a dataset of roughly 2,000 historical draws. We decided against any backend: the app is a static SPA (deployed on Vercel) where all compute (CSV parsing, feature extraction, PCA/UMAP, clustering, backtesting) runs client-side, the draw dataset is a manually-refreshed CSV committed to the repo rather than fetched from a live API, and any per-user state (saved grids) lives in `localStorage` only, with no accounts.

This keeps hosting and ops at zero, avoids redistributing FDJ's draw data through a public API of our own (its licensing terms are ambiguous), and doubles as a stronger portfolio signal than a conventional CRUD backend would.

**Revisit if**: in-browser PCA/UMAP/clustering performance can't hit V4's "fluid on a standard laptop" target, or a genuinely compelling shared/multi-user feature emerges that justifies the added complexity.
