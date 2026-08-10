import type { FeatureVector } from '../features/FeatureExtractor.ts';
import { FEATURE_KEYS } from '../features/FeatureExtractor.ts';

export interface ExcludedFeature {
  key: string;
  reason: 'near-constant' | 'redundant';
  correlatedWith?: string;
}

export interface NormalizationModel {
  featureKeys: string[];
  excludedFeatures: ExcludedFeature[];
  means: Record<string, number>;
  stdDevs: Record<string, number>;
}

const NEAR_CONSTANT_STD_THRESHOLD = 1e-9;
const REDUNDANCY_CORRELATION_THRESHOLD = 0.95;

const mean = (values: number[]): number => values.reduce((acc, value) => acc + value, 0) / values.length;

const standardDeviation = (values: number[], average: number): number =>
  Math.sqrt(mean(values.map((value) => (value - average) ** 2)));

const pearsonCorrelation = (a: number[], b: number[]): number => {
  const meanA = mean(a);
  const meanB = mean(b);
  let numerator = 0;
  let denomA = 0;
  let denomB = 0;

  for (let i = 0; i < a.length; i += 1) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    numerator += da * db;
    denomA += da * da;
    denomB += db * db;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 0 : numerator / denom;
};

/**
 * Fit once on the reference dataset (means/stdDevs frozen here); never
 * refit when transforming new points later - that's what keeps a future
 * "evaluate one new grid against the discovered structure" consumer from
 * leaking that point's own value into its own normalization.
 */
export const fitNormalization = (trainVectors: FeatureVector[]): NormalizationModel => {
  const excludedFeatures: ExcludedFeature[] = [];
  const means: Record<string, number> = {};
  const stdDevs: Record<string, number> = {};
  const columnsByKey: Record<string, number[]> = {};

  for (const key of FEATURE_KEYS) {
    const column = trainVectors.map((vector) => vector.values[key]);
    const average = mean(column);
    means[key] = average;
    stdDevs[key] = standardDeviation(column, average);
    columnsByKey[key] = column;
  }

  const afterConstantCheck = FEATURE_KEYS.filter((key) => {
    if (stdDevs[key] < NEAR_CONSTANT_STD_THRESHOLD) {
      excludedFeatures.push({ key, reason: 'near-constant' });
      return false;
    }
    return true;
  });

  const survivors: string[] = [];
  for (const key of afterConstantCheck) {
    const redundantWith = survivors.find(
      (kept) => Math.abs(pearsonCorrelation(columnsByKey[key], columnsByKey[kept])) > REDUNDANCY_CORRELATION_THRESHOLD,
    );
    if (redundantWith) {
      excludedFeatures.push({ key, reason: 'redundant', correlatedWith: redundantWith });
    } else {
      survivors.push(key);
    }
  }

  return { featureKeys: survivors, excludedFeatures, means, stdDevs };
};

export const applyNormalization = (vectors: FeatureVector[], model: NormalizationModel): number[][] =>
  vectors.map((vector) =>
    model.featureKeys.map((key) => {
      const sd = model.stdDevs[key];
      return sd === 0 ? 0 : (vector.values[key] - model.means[key]) / sd;
    }),
  );
