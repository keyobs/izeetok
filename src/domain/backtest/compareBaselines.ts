import type { Draw } from '../draw/Draw.ts';
import { BASELINE_KINDS, BASELINE_LABELS, proposeBaselineGrid } from './baselines.ts';
import type { DateRange } from './runWalkForwardBacktest.ts';
import { runWalkForwardBacktest } from './runWalkForwardBacktest.ts';

export interface BaselineComparison {
  baselineName: string;
  meanMatchedNumbers: number;
  meanMatchedStars: number;
}

export const compareBaselines = (draws: Draw[], dateRange: DateRange, seed: number): BaselineComparison[] =>
  BASELINE_KINDS.map((kind) => {
    const result = runWalkForwardBacktest((history) => proposeBaselineGrid(kind, history, seed), draws, dateRange);
    return {
      baselineName: BASELINE_LABELS[kind],
      meanMatchedNumbers: result.metrics.meanMatchedNumbers,
      meanMatchedStars: result.metrics.meanMatchedStars,
    };
  });
