# EuroMillions Geometry Lab

A data-visualization app that treats EuroMillions draws and user-chosen number grids as mathematical objects, analyzing their historical structure without claiming predictive power.

## Language

### Core objects

**Grid**:
Five distinct numbers (1–50) plus two distinct stars (1–12) — either a historical draw's outcome or a user's proposed selection.
_Avoid_: Combination, ticket, selection

**Draw**:
A `Grid` that actually occurred on a specific date, sourced from official results (CSV/API/manual entry).
_Avoid_: Result, tirage

**FeatureVector**:
The numeric measurements computed from a `Grid` (sum, amplitude, decade distribution, gaps, parity, etc.) — the raw input to every downstream model.
_Avoid_: Stats, metrics

**GeometryDescriptor**:
The geometric shape derived from a `Grid`'s `FeatureVector` — decade buckets, gaps, sum, range, odd/even counts, cluster size — independent of any particular rendering.
_Avoid_: Shape

### Analysis pipeline

**SpatialEmbedding**:
The single source of spatial truth for a `Draw`: its 3D coordinates (from PCA or UMAP), cluster membership, local density, outlier score, and nearest neighbors. Computed once by the `DiscoveryModel`; consumers such as EuroSpace never recalculate it.
_Avoid_: Projection, position

**DiscoveryModel**:
The model that fits clusters, density, and stability measures across the full draw history to produce `SpatialEmbedding`s.
_Avoid_: Clustering engine

**Family**:
A named, described group of structurally similar draws discovered by the `DiscoveryModel`, always paired with a stability rating — an unstable family is still described, but weighted lightly by scores.
_Avoid_: Cluster (used interchangeably in places, but "Family" is the user-facing term), group

### Strategy & experimentation

**Strategy**:
A configurable, seeded, reproducible rule set that proposes a `Grid` given a subset of history — the unit under test in a backtest.
_Avoid_: Model, algorithm

**Experiment**:
One walk-forward backtest run of a `Strategy` against a dataset/model version, seed, and set of `TemporalWindow`s, producing an `ExperimentResult`.
_Avoid_: Backtest run, test

**TemporalWindow**:
A historical lookback period (1/3/6/12/25/50/"all" years) used to evaluate temporal proximity or scope a `Strategy` run. None of these windows — including "6" — has privileged scientific status; they're just available lenses.
_Avoid_: Timeframe, period

### Scores

**Structure Score / Originality Score / Temporal Signal Score / Confidence Score**:
The four independent axes an evaluated `Grid` is scored on: historical structural proximity, likely-human-choice risk, validated temporal effects, and diagnostic stability. Always shown together as separate axes — never collapsed into one opaque verdict.
_Avoid_: Score (alone — ambiguous which axis)
