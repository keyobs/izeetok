import type { Draw } from '../draw/Draw.ts';
import { proposeBaselineGrid } from './baselines.ts';
import type { DateRange } from './runWalkForwardBacktest.ts';
import { runWalkForwardBacktest } from './runWalkForwardBacktest.ts';

export interface MonteCarloResult {
  sampleCount: number;
  distribution: number[];
  strategyPercentile: number;
}

/**
 * Runs `sampleCount` independent seeded uniform-random walk-forward
 * backtests and reports where the tested strategy's mean matched numbers
 * falls in that random distribution. "no advantage detected" (percentile
 * near 50) is a valid, expected conclusion for most strategies - every
 * valid Grid has the same theoretical draw probability.
 */
export const runMonteCarloComparison = (
  strategyMeanMatchedNumbers: number,
  draws: Draw[],
  dateRange: DateRange,
  sampleCount: number,
  baseSeed: number,
): MonteCarloResult => {
  const distribution: number[] = [];

  for (let i = 0; i < sampleCount; i += 1) {
    const seed = baseSeed + i + 1;
    const result = runWalkForwardBacktest(
      (history) => proposeBaselineGrid('uniform-random', history, seed),
      draws,
      dateRange,
    );
    distribution.push(result.metrics.meanMatchedNumbers);
  }

  const belowCount = distribution.filter((value) => value < strategyMeanMatchedNumbers).length;
  const strategyPercentile = sampleCount === 0 ? 50 : (belowCount / sampleCount) * 100;

  return { sampleCount, distribution, strategyPercentile };
};
