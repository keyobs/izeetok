import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { extractFeatures } from '../features/FeatureExtractor.ts';
import { applyNormalization, fitNormalization } from './normalizeFeatures.ts';
import { reduceDimensionsPca } from './reduceDimensions.ts';
import {
  computeBootstrapStability,
  computeSilhouetteScore,
  fitKMeansWithSilhouette,
} from './kmeansClustering.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const vectors = draws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));
const normalizationModel = fitNormalization(vectors);
const normalizedRows = applyNormalization(vectors, normalizationModel);
const pcaCoordinates = reduceDimensionsPca(normalizedRows, normalizationModel.featureKeys).coordinates;
const pcaRows = pcaCoordinates.map((c) => [c.x, c.y, c.z]);

describe('computeSilhouetteScore', () => {
  it('returns 0 for a single cluster (no separation to measure)', () => {
    expect(computeSilhouetteScore(pcaRows, pcaRows.map(() => 0))).toBe(0);
  });

  it('returns a score in [-1, 1] for a real clustering', () => {
    const { clusters } = { clusters: pcaRows.map((_, i) => i % 3) };
    const score = computeSilhouetteScore(pcaRows, clusters);
    expect(score).toBeGreaterThanOrEqual(-1);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe('fitKMeansWithSilhouette', () => {
  it('picks a k from the candidates and assigns every row to a cluster', () => {
    const result = fitKMeansWithSilhouette(pcaRows, [2, 3, 4, 5], 42);

    expect([2, 3, 4, 5]).toContain(result.k);
    expect(result.clusterIds).toHaveLength(pcaRows.length);
    expect(result.candidateScores).toHaveLength(4);
    expect(new Set(result.clusterIds).size).toBe(result.k);
  });

  it('is reproducible for the same seed', () => {
    const a = fitKMeansWithSilhouette(pcaRows, [3], 7);
    const b = fitKMeansWithSilhouette(pcaRows, [3], 7);

    expect(a).toEqual(b);
  });
});

describe('computeBootstrapStability', () => {
  it('reports a stability score in [0, 1] for every cluster', () => {
    const fit = fitKMeansWithSilhouette(pcaRows, [3], 42);

    const stabilities = computeBootstrapStability(pcaRows, fit.clusterIds, fit.k, 10, 1);

    expect(stabilities).toHaveLength(fit.k);
    for (const { stability } of stabilities) {
      expect(stability).toBeGreaterThanOrEqual(0);
      expect(stability).toBeLessThanOrEqual(1);
    }
  });

  it('rates a single well-separated group of identical points as fully stable', () => {
    const rows = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
      [10, 10, 10],
      [10, 10, 10],
      [10, 10, 10],
    ];
    const clusterIds = [0, 0, 0, 1, 1, 1];

    const stabilities = computeBootstrapStability(rows, clusterIds, 2, 10, 1);

    for (const { stability } of stabilities) {
      expect(stability).toBeCloseTo(1, 1);
    }
  });
});
