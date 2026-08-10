import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { extractFeatures } from '../features/FeatureExtractor.ts';
import { applyNormalization, fitNormalization } from './normalizeFeatures.ts';
import { reduceDimensionsPca } from './reduceDimensions.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const vectors = draws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));
const normalizationModel = fitNormalization(vectors);
const normalizedRows = applyNormalization(vectors, normalizationModel);

describe('reduceDimensionsPca', () => {
  it('produces one 3D coordinate per input row', () => {
    const { coordinates } = reduceDimensionsPca(normalizedRows, normalizationModel.featureKeys);

    expect(coordinates).toHaveLength(vectors.length);
    for (const coordinate of coordinates) {
      expect(Number.isFinite(coordinate.x)).toBe(true);
      expect(Number.isFinite(coordinate.y)).toBe(true);
      expect(Number.isFinite(coordinate.z)).toBe(true);
    }
  });

  it('reports explained variance as decreasing proportions summing to <= 1', () => {
    const { explainedVariance } = reduceDimensionsPca(normalizedRows, normalizationModel.featureKeys);

    expect(explainedVariance).toHaveLength(3);
    expect(explainedVariance[0]).toBeGreaterThanOrEqual(explainedVariance[1]);
    expect(explainedVariance[1]).toBeGreaterThanOrEqual(explainedVariance[2]);
    expect(explainedVariance.reduce((acc, v) => acc + v, 0)).toBeLessThanOrEqual(1.0001);
  });

  it('reports one contribution (loading) entry per surviving feature', () => {
    const { featureContributions } = reduceDimensionsPca(normalizedRows, normalizationModel.featureKeys);

    expect(featureContributions).toHaveLength(normalizationModel.featureKeys.length);
    for (const contribution of featureContributions) {
      expect(normalizationModel.featureKeys).toContain(contribution.feature);
      expect(Number.isFinite(contribution.pc1)).toBe(true);
    }
  });
});
