import type { Grid } from '../grid/Grid.ts';

export interface FeatureVector {
  values: Record<string, number>;
}

export const FEATURE_KEYS = [
  'sum',
  'mean',
  'median',
  'min',
  'max',
  'range',
  'variance',
  'stdDev',
  'decade1',
  'decade2',
  'decade3',
  'decade4',
  'decade5',
  'occupiedBucketCount',
  'clusterSizeMax',
  'entropy',
  'oddCount',
  'evenCount',
  'parityAlternations',
  'gap1',
  'gap2',
  'gap3',
  'gap4',
  'gapMean',
  'gapStdDev',
  'consecutivePairsCount',
  'sameUnitsPairsCount',
  'multiplesOfFiveCount',
  'aboveThirtyOneCount',
  'starsSum',
  'starsDiff',
  'starsOddCount',
] as const;

export type FeatureKey = (typeof FEATURE_KEYS)[number];

export const extractFeatures = (grid: Grid): FeatureVector => {
  const { numbers, stars } = grid;

  const sum = numbers.reduce((acc, n) => acc + n, 0);
  const mean = sum / numbers.length;
  const median = numbers[2];
  const min = numbers[0];
  const max = numbers[4];
  const range = max - min;
  const variance = numbers.reduce((acc, n) => acc + (n - mean) ** 2, 0) / numbers.length;
  const stdDev = Math.sqrt(variance);

  const decadeBuckets = [0, 0, 0, 0, 0];
  for (const n of numbers) {
    decadeBuckets[Math.min(Math.floor((n - 1) / 10), 4)] += 1;
  }
  const occupiedBucketCount = decadeBuckets.filter((count) => count > 0).length;
  const clusterSizeMax = Math.max(...decadeBuckets);
  const entropy = decadeBuckets
    .filter((count) => count > 0)
    .reduce((acc, count) => {
      const p = count / numbers.length;
      return acc - p * Math.log2(p);
    }, 0);

  const oddCount = numbers.filter((n) => n % 2 !== 0).length;
  const evenCount = numbers.length - oddCount;
  let parityAlternations = 0;
  for (let i = 0; i < numbers.length - 1; i += 1) {
    if (numbers[i] % 2 !== numbers[i + 1] % 2) parityAlternations += 1;
  }

  const gaps: [number, number, number, number] = [
    numbers[1] - numbers[0],
    numbers[2] - numbers[1],
    numbers[3] - numbers[2],
    numbers[4] - numbers[3],
  ];
  const gapMean = gaps.reduce((acc, g) => acc + g, 0) / gaps.length;
  const gapVariance = gaps.reduce((acc, g) => acc + (g - gapMean) ** 2, 0) / gaps.length;
  const gapStdDev = Math.sqrt(gapVariance);
  const consecutivePairsCount = gaps.filter((gap) => gap === 1).length;

  let sameUnitsPairsCount = 0;
  for (let i = 0; i < numbers.length; i += 1) {
    for (let j = i + 1; j < numbers.length; j += 1) {
      if (numbers[i] % 10 === numbers[j] % 10) sameUnitsPairsCount += 1;
    }
  }

  const multiplesOfFiveCount = numbers.filter((n) => n % 5 === 0).length;
  const aboveThirtyOneCount = numbers.filter((n) => n > 31).length;

  const starsSum = stars[0] + stars[1];
  const starsDiff = Math.abs(stars[1] - stars[0]);
  const starsOddCount = stars.filter((s) => s % 2 !== 0).length;

  const values: Record<FeatureKey, number> = {
    sum,
    mean,
    median,
    min,
    max,
    range,
    variance,
    stdDev,
    decade1: decadeBuckets[0],
    decade2: decadeBuckets[1],
    decade3: decadeBuckets[2],
    decade4: decadeBuckets[3],
    decade5: decadeBuckets[4],
    occupiedBucketCount,
    clusterSizeMax,
    entropy,
    oddCount,
    evenCount,
    parityAlternations,
    gap1: gaps[0],
    gap2: gaps[1],
    gap3: gaps[2],
    gap4: gaps[3],
    gapMean,
    gapStdDev,
    consecutivePairsCount,
    sameUnitsPairsCount,
    multiplesOfFiveCount,
    aboveThirtyOneCount,
    starsSum,
    starsDiff,
    starsOddCount,
  };

  return { values };
};

export const featureVectorToArray = (vector: FeatureVector): number[] =>
  FEATURE_KEYS.map((key) => vector.values[key]);
