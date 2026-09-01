import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../api/parseFdjCsv.ts';
import { discoverStructure } from './discoverStructure.ts';
import type { DiscoveryConfig } from './discoverStructure.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

const CONFIG: DiscoveryConfig = {
  kCandidates: [2, 3, 4, 5, 6],
  neighborCount: 10,
  bootstrapIterations: 15,
  seed: 42,
};

describe('discoverStructure', () => {
  it('produces one real SpatialEmbedding per draw, with actual (non-stubbed) density/outlierScore/clusterId', () => {
    const result = discoverStructure(draws, CONFIG);

    expect(result.embeddings).toHaveLength(draws.length);
    for (const embedding of result.embeddings) {
      expect(embedding.method).toBe('pca');
      expect(embedding.clusterId).toBeDefined();
      expect(embedding.nearestNeighbors).toHaveLength(CONFIG.neighborCount);
      expect(Number.isFinite(embedding.density)).toBe(true);
      expect(Number.isFinite(embedding.outlierScore)).toBe(true);
    }
    // Not every point can be the stubbed spike values (density=0, outlierScore=0 for all).
    expect(result.embeddings.some((e) => e.density !== 0)).toBe(true);
    expect(new Set(result.embeddings.map((e) => e.outlierScore)).size).toBeGreaterThan(1);
  });

  it('produces families covering every draw exactly once, each with a description', () => {
    const result = discoverStructure(draws, CONFIG);

    const totalMembers = result.families.reduce((acc, family) => acc + Math.round(family.frequency * draws.length), 0);
    expect(totalMembers).toBe(draws.length);
    for (const family of result.families) {
      expect(family.description.length).toBeGreaterThan(0);
      expect(family.stability).toBeGreaterThanOrEqual(0);
      expect(family.stability).toBeLessThanOrEqual(1);
    }
  });

  it('is reproducible for the same seed and config', () => {
    const a = discoverStructure(draws, CONFIG);
    const b = discoverStructure(draws, CONFIG);

    expect(a).toEqual(b);
  });

  it('compares real vs synthetic clustering structure and reports a boolean conclusion either way', () => {
    const result = discoverStructure(draws, CONFIG);

    expect(typeof result.nullHypothesisComparison.realShowsMoreStructure).toBe('boolean');
    expect(Number.isFinite(result.nullHypothesisComparison.syntheticSilhouetteScore)).toBe(true);
  });
});
