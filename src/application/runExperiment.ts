import type { Draw } from '../domain/draw/Draw.ts';
import type { Grid } from '../domain/grid/Grid.ts';
import type { FeatureVector } from '../domain/features/FeatureExtractor.ts';
import { extractFeatures } from '../domain/features/FeatureExtractor.ts';
import type { GeometryDescriptor } from '../domain/geometry/GeometryDescriptor.ts';
import { buildGeometryDescriptor } from '../domain/geometry/GeometryDescriptor.ts';
import type { Strategy } from '../domain/strategy/Strategy.ts';
import { proposeGrid } from '../domain/strategy/proposeGrid.ts';
import { filterByWindow, latestDrawDate } from '../domain/scoring/TemporalWindow.ts';
import type { TemporalWindow } from '../domain/scoring/TemporalWindow.ts';
import type { BaselineComparison } from '../domain/backtest/compareBaselines.ts';
import { compareBaselines } from '../domain/backtest/compareBaselines.ts';
import type { OverfittingSignal } from '../domain/backtest/detectOverfitting.ts';
import { detectOverfitting } from '../domain/backtest/detectOverfitting.ts';
import type { MonteCarloResult } from '../domain/backtest/runMonteCarloComparison.ts';
import { runMonteCarloComparison } from '../domain/backtest/runMonteCarloComparison.ts';
import type { BacktestMetrics, DateRange } from '../domain/backtest/runWalkForwardBacktest.ts';
import { runWalkForwardBacktest } from '../domain/backtest/runWalkForwardBacktest.ts';
import type { TrainValidationTestRanges } from '../domain/backtest/splitDateRanges.ts';
import { splitDateRanges } from '../domain/backtest/splitDateRanges.ts';

const DATASET_VERSION = 'fdj-euromillions-2020-2026';
const MODEL_VERSION = 'izeetok-v2-strategy-1';

export interface EvaluatedGrid {
  grid: Grid;
  date: string;
  features: FeatureVector;
  geometry: GeometryDescriptor;
  score?: number;
}

export interface ExperimentResult {
  generatedGrids: EvaluatedGrid[];
  metrics: BacktestMetrics;
  baselineComparisons: BaselineComparison[];
}

export interface WindowComparison {
  window: TemporalWindow;
  metrics: BacktestMetrics;
}

export interface Experiment {
  id: string;
  createdAt: string;
  datasetVersion: string;
  modelVersion: string;
  seed: number;
  trainRange: DateRange;
  validationRange: DateRange;
  testRange: DateRange;
  windows: TemporalWindow[];
  strategy: Strategy;
  results: ExperimentResult;
  overfitting: OverfittingSignal;
  monteCarlo: MonteCarloResult;
  windowComparisons: WindowComparison[];
}

export interface RunExperimentConfig {
  strategy: Strategy;
  draws: Draw[];
  trainRatio: number;
  validationRatio: number;
  windows: TemporalWindow[];
  monteCarloSampleCount: number;
}

const rangesFor = (
  window: TemporalWindow,
  draws: Draw[],
  referenceDate: Date,
): DateRange => {
  const windowDraws = filterByWindow(draws, window, referenceDate).sort((a, b) => a.date.localeCompare(b.date));
  const fallback = referenceDate.toISOString().slice(0, 10);

  return windowDraws.length > 0
    ? { start: windowDraws[0].date, end: windowDraws[windowDraws.length - 1].date }
    : { start: fallback, end: fallback };
};

export const runExperiment = (config: RunExperimentConfig): Experiment => {
  const { strategy, draws, trainRatio, validationRatio, windows, monteCarloSampleCount } = config;
  const { train, validation, test }: TrainValidationTestRanges = splitDateRanges(draws, trainRatio, validationRatio);
  const propose = (history: Draw[]): Grid => proposeGrid(strategy, history);

  const trainResult = runWalkForwardBacktest(propose, draws, train);
  const validationResult = runWalkForwardBacktest(propose, draws, validation);
  const testResult = runWalkForwardBacktest(propose, draws, test);

  const overfitting = detectOverfitting(trainResult.metrics, validationResult.metrics, testResult.metrics);
  const baselineComparisons = compareBaselines(draws, test, strategy.seed);
  const monteCarlo = runMonteCarloComparison(
    testResult.metrics.meanMatchedNumbers,
    draws,
    test,
    monteCarloSampleCount,
    strategy.seed,
  );

  const generatedGrids: EvaluatedGrid[] = testResult.steps.map((step) => ({
    grid: step.proposedGrid,
    date: step.date,
    features: extractFeatures(step.proposedGrid),
    geometry: buildGeometryDescriptor(step.proposedGrid),
    score: step.matchedNumbers,
  }));

  const referenceDate = latestDrawDate(draws);
  const windowComparisons: WindowComparison[] = windows.map((window) => ({
    window,
    metrics: runWalkForwardBacktest(propose, draws, rangesFor(window, draws, referenceDate)).metrics,
  }));

  return {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    datasetVersion: DATASET_VERSION,
    modelVersion: MODEL_VERSION,
    seed: strategy.seed,
    trainRange: train,
    validationRange: validation,
    testRange: test,
    windows,
    strategy,
    results: { generatedGrids, metrics: testResult.metrics, baselineComparisons },
    overfitting,
    monteCarlo,
    windowComparisons,
  };
};
