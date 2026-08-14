# Changelog

All notable changes to this project are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project follows conventional commits (see `commitlint.config.mjs`) for
release-note generation.

## [Unreleased]

## [0.1.0] - 2026-08-14

First release: grid evaluation, historical draws, geometry, backtesting lab,
structure discovery, plus the versioned agent tooling and CI/CD.

### Added

- Core domain model: `Grid`, `Draw`, feature extraction, geometry descriptors
  and distance.
- Four evaluation scores (structure, originality, temporal, confidence) with
  a reading classification.
- Grid variation generator (structurally-common, balanced, anti-share).
- `/evaluation`: grid input, scores, variations, already-drawn flags,
  restores the last evaluated grid on reload.
- `/draws`: historical draws table with per-draw geometry and distance to the
  previous draw.
- `/geometry`: scatter charts, decade histogram, gap map, nearest neighbors,
  selectable reference grid.
- `/laboratory`: strategy builder, walk-forward backtester, baselines, Monte
  Carlo comparison.
- `/discovery`: feature normalization, PCA, K-Means clustering, density/outlier
  scoring.
- Sticky top navigation.
- CI (lint/type-check/test) gating `main` and `develop`; GitHub Pages
  deployment for `develop` alongside Vercel for `main`.
- Versioned agent tooling: architect, test-strategist, quality-reviewer,
  deploy-troubleshooter, release-manager, and a documented feature workflow.
- English README.

### Changed

- Reworked the UI with design tokens and a dark-first palette.

### Fixed

- Digit-entry inputs on `/evaluation` (auto-advance, live validity) instead
  of native number spinners.
- Duplicate numbers/stars flagged red past their first occurrence.
- `/geometry`: plain-language descriptions, persistent reference banner,
  highlighted reference point, readable gap map.
- CSV path now resolves under a sub-path deployment (was 404ing on GitHub
  Pages).
- `check` script and pre-commit hook now actually type-check the project.
