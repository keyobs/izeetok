import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { extractFeatures } from '../features/FeatureExtractor.ts';
import { applyNormalization, fitNormalization } from './normalizeFeatures.ts';
import { reduceDimensionsPca } from './reduceDimensions.ts';
import { computeDensityEvaluations } from './densityEvaluation.ts';

describe('computeDensityEvaluations', () => {
  it('rates a point inside a tight cluster as denser than an isolated point', () => {
    const rows = [
      [0, 0, 0],
      [0.1, 0, 0],
      [0, 0.1, 0],
      [0.1, 0.1, 0],
      [50, 50, 50], // far away, alone
    ];

    const evaluations = computeDensityEvaluations(rows, 2);

    expect(evaluations[0].densityPercentile).toBeGreaterThan(evaluations[4].densityPercentile);
    expect(evaluations[4].outlierScore).toBeGreaterThan(evaluations[0].outlierScore);
  });

  it('keeps outlierScore and confidence within [0, 1] and reports k nearest neighbors', () => {
    const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
    const draws = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
    const vectors = draws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));
    const model = fitNormalization(vectors);
    const normalizedRows = applyNormalization(vectors, model);
    const pcaRows = reduceDimensionsPca(normalizedRows, model.featureKeys).coordinates.map((c) => [c.x, c.y, c.z]);

    const evaluations = computeDensityEvaluations(pcaRows, 10);

    expect(evaluations).toHaveLength(pcaRows.length);
    for (const evaluation of evaluations) {
      expect(evaluation.outlierScore).toBeGreaterThanOrEqual(0);
      expect(evaluation.outlierScore).toBeLessThanOrEqual(1);
      expect(evaluation.confidence).toBeGreaterThanOrEqual(0);
      expect(evaluation.confidence).toBeLessThanOrEqual(1);
      expect(evaluation.densityPercentile).toBeGreaterThanOrEqual(0);
      expect(evaluation.densityPercentile).toBeLessThanOrEqual(100);
      expect(evaluation.nearestNeighborIndices).toHaveLength(10);
      expect(evaluation.nearestNeighborDistances).toHaveLength(10);
    }
  });
});
