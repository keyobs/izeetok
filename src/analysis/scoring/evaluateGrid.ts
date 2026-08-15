import type { Draw } from '../draw/Draw.ts';
import type { Grid } from '../grid/Grid.ts';
import { extractFeatures } from '../features/FeatureExtractor.ts';
import { buildGeometryDescriptor } from '../geometry/GeometryDescriptor.ts';
import { computeGeometryDistance } from '../geometry/GeometryDistance.ts';
import { findNearestNeighbors } from '../geometry/nearestNeighbors.ts';
import { TEMPORAL_WINDOWS, filterByWindow, latestDrawDate } from './TemporalWindow.ts';

export interface ScoreFactor {
  label: string;
  value: number;
}

export interface Score {
  value: number;
  factors: ScoreFactor[];
}

export interface EvaluationScores {
  structure: Score;
  originality: Score;
  temporal: Score;
  confidence: Score;
}

const NEIGHBOR_SAMPLE_SIZE = 20;

const mean = (values: number[]): number =>
  values.length === 0 ? 0 : values.reduce((acc, value) => acc + value, 0) / values.length;

const standardDeviation = (values: number[]): number => {
  if (values.length === 0) return 0;
  const average = mean(values);
  return Math.sqrt(mean(values.map((value) => (value - average) ** 2)));
};

const percentileRank = (value: number, population: number[]): number =>
  population.length === 0
    ? 50
    : (population.filter((candidate) => candidate < value).length / population.length) * 100;

const toScoreValue = (ratio: number): number => Math.round(100 * Math.min(Math.max(ratio, 0), 1));

export const evaluateGrid = (grid: Grid, history: Draw[]): EvaluationScores => {
  const descriptor = buildGeometryDescriptor(grid);
  const historyEntries = history.map((draw) => ({
    item: draw,
    descriptor: buildGeometryDescriptor({ numbers: draw.numbers, stars: draw.stars }),
  }));

  const neighbors = findNearestNeighbors(descriptor, historyEntries, NEIGHBOR_SAMPLE_SIZE);
  const neighborDistances = neighbors.map((neighbor) => neighbor.distance);
  const meanNeighborDistance = mean(neighborDistances);

  const historySums = historyEntries.map(({ descriptor: entry }) => entry.sum);
  const historyRanges = historyEntries.map(({ descriptor: entry }) => entry.range);
  const sameDecadeSignatureCount = historyEntries.filter(({ descriptor: entry }) =>
    entry.decadeBuckets.every((count, index) => count === descriptor.decadeBuckets[index]),
  ).length;
  const sameParityCount = historyEntries.filter(
    ({ descriptor: entry }) => entry.oddCount === descriptor.oddCount,
  ).length;

  const structure: Score = {
    value: toScoreValue(1 - meanNeighborDistance),
    factors: [
      { label: 'meanNeighborDistance', value: meanNeighborDistance },
      { label: 'sumPercentile', value: percentileRank(descriptor.sum, historySums) },
      { label: 'amplitudePercentile', value: percentileRank(descriptor.range, historyRanges) },
      {
        label: 'decadeSignatureMatchRate',
        value: history.length === 0 ? 0 : (sameDecadeSignatureCount / history.length) * 100,
      },
      {
        label: 'parityMatchRate',
        value: history.length === 0 ? 0 : (sameParityCount / history.length) * 100,
      },
    ],
  };

  const features = extractFeatures(grid).values;
  const humanPatternRatio =
    0.25 * Math.min(features.consecutivePairsCount / 4, 1) +
    0.25 * Math.min(features.sameUnitsPairsCount / 10, 1) +
    0.25 * Math.min(features.multiplesOfFiveCount / 5, 1) +
    0.25 * Math.min((5 - features.aboveThirtyOneCount) / 5, 1);

  const originality: Score = {
    value: toScoreValue(1 - humanPatternRatio),
    factors: [
      { label: 'consecutivePairsCount', value: features.consecutivePairsCount },
      { label: 'sameUnitsPairsCount', value: features.sameUnitsPairsCount },
      { label: 'multiplesOfFiveCount', value: features.multiplesOfFiveCount },
      { label: 'aboveThirtyOneCount', value: features.aboveThirtyOneCount },
    ],
  };

  const referenceDate = latestDrawDate(history);
  const windowFactors = TEMPORAL_WINDOWS.map((window) => {
    const windowDraws = filterByWindow(history, window, referenceDate);
    const windowDistances = windowDraws.map(
      (draw) =>
        computeGeometryDistance(
          descriptor,
          buildGeometryDescriptor({ numbers: draw.numbers, stars: draw.stars }),
        ).total,
    );
    return { label: `window_${window}`, value: toScoreValue(1 - mean(windowDistances)) };
  });

  const temporal: Score = {
    value: Math.round(mean(windowFactors.map((factor) => factor.value))),
    factors: windowFactors,
  };

  const neighborDistanceStdDev = standardDeviation(neighborDistances);
  const coefficientOfVariation =
    meanNeighborDistance === 0 ? 0 : neighborDistanceStdDev / meanNeighborDistance;

  const confidence: Score = {
    value: toScoreValue(1 - coefficientOfVariation),
    factors: [
      { label: 'sampleSize', value: history.length },
      { label: 'neighborMeanDistance', value: meanNeighborDistance },
      { label: 'neighborDistanceStdDev', value: neighborDistanceStdDev },
    ],
  };

  return { structure, originality, temporal, confidence };
};

export type ReadingMatrixLabel = 'classique' | 'interessante' | 'atypique' | 'tres-atypique';

export const classifyReading = (scores: EvaluationScores): ReadingMatrixLabel => {
  const isCommonStructure = scores.structure.value >= 50;
  const isHighOriginality = scores.originality.value >= 50;

  if (isCommonStructure) return isHighOriginality ? 'interessante' : 'classique';
  return isHighOriginality ? 'tres-atypique' : 'atypique';
};
