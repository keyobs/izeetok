import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { parseFdjCsv } from '../../api/parseFdjCsv.ts';
import { extractFeatures, FEATURE_KEYS } from '../features/FeatureExtractor.ts';
import { applyNormalization, fitNormalization } from './normalizeFeatures.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const realVectors = draws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));

const vectorOf = (overrides: Record<string, number>) => ({
  values: Object.fromEntries(FEATURE_KEYS.map((key) => [key, overrides[key] ?? 0])),
});

describe('fitNormalization', () => {
  it('excludes a feature that never varies (near-constant)', () => {
    const vectors = [
      vectorOf({ sum: 10 }),
      vectorOf({ sum: 20 }),
      vectorOf({ sum: 30 }),
      // clusterSizeMax constant across all rows here (default 0)
    ];

    const model = fitNormalization(vectors);

    expect(model.featureKeys).not.toContain('clusterSizeMax');
    expect(model.excludedFeatures).toContainEqual({ key: 'clusterSizeMax', reason: 'near-constant' });
  });

  it('excludes a feature that is perfectly redundant with an earlier one', () => {
    const vectors = [1, 2, 3, 4, 5].map((n) => vectorOf({ sum: n, range: n * 2 }));

    const model = fitNormalization(vectors);

    expect(model.featureKeys).toContain('sum');
    expect(model.featureKeys).not.toContain('range');
    expect(model.excludedFeatures).toContainEqual({ key: 'range', reason: 'redundant', correlatedWith: 'sum' });
  });

  it('produces a model whose stats reflect the real historical dataset', () => {
    const model = fitNormalization(realVectors);

    expect(model.featureKeys.length).toBeGreaterThan(0);
    expect(model.featureKeys.length).toBeLessThanOrEqual(FEATURE_KEYS.length);
    for (const key of model.featureKeys) {
      expect(Number.isFinite(model.means[key])).toBe(true);
      expect(model.stdDevs[key]).toBeGreaterThan(0);
    }
  });
});

describe('applyNormalization', () => {
  it('transforms a new, unseen point using the fitted (frozen) stats, not the new point\'s own', () => {
    const model = fitNormalization(realVectors);
    const unseenPoint = vectorOf({ sum: 999 }); // wildly different from training data

    const [normalized] = applyNormalization([unseenPoint], model);
    const sumIndex = model.featureKeys.indexOf('sum');

    // Standardized against the training mean/stddev, so a far-off raw value
    // produces a large z-score - not a value near 0, which is what it would
    // be if normalization were (wrongly) refit on this single new point.
    expect(Math.abs(normalized[sumIndex])).toBeGreaterThan(3);
  });

  it('produces one row per input vector, with one column per surviving feature', () => {
    const model = fitNormalization(realVectors);

    const normalized = applyNormalization(realVectors.slice(0, 5), model);

    expect(normalized).toHaveLength(5);
    for (const row of normalized) {
      expect(row).toHaveLength(model.featureKeys.length);
      expect(row.every((value) => Number.isFinite(value))).toBe(true);
    }
  });
});
