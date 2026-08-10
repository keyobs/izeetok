import type { Draw } from '../draw/Draw.ts';
import type { Grid } from '../grid/Grid.ts';
import { proposeGrid } from '../strategy/proposeGrid.ts';
import type { Strategy } from '../strategy/Strategy.ts';
import { countMatches, prizeRank } from './prizeRank.ts';

export interface DateRange {
  start: string;
  end: string;
}

export interface BacktestStepResult {
  date: string;
  actualDraw: Draw;
  proposedGrid: Grid;
  matchedNumbers: number;
  matchedStars: number;
  prizeRank: number | null;
}

export interface BacktestMetrics {
  stepCount: number;
  meanMatchedNumbers: number;
  meanMatchedStars: number;
  bestPrizeRank: number | null;
  prizeRankCounts: Record<number, number>;
}

export interface BacktestResult {
  steps: BacktestStepResult[];
  metrics: BacktestMetrics;
}

const isWithinRange = (date: string, range: DateRange): boolean => date >= range.start && date <= range.end;

export const computeMetrics = (steps: BacktestStepResult[]): BacktestMetrics => {
  const stepCount = steps.length;
  const meanMatchedNumbers =
    stepCount === 0 ? 0 : steps.reduce((acc, step) => acc + step.matchedNumbers, 0) / stepCount;
  const meanMatchedStars =
    stepCount === 0 ? 0 : steps.reduce((acc, step) => acc + step.matchedStars, 0) / stepCount;

  const prizeRankCounts: Record<number, number> = {};
  let bestPrizeRank: number | null = null;
  for (const step of steps) {
    if (step.prizeRank !== null) {
      prizeRankCounts[step.prizeRank] = (prizeRankCounts[step.prizeRank] ?? 0) + 1;
      if (bestPrizeRank === null || step.prizeRank < bestPrizeRank) bestPrizeRank = step.prizeRank;
    }
  }

  return { stepCount, meanMatchedNumbers, meanMatchedStars, bestPrizeRank, prizeRankCounts };
};

/**
 * Walk-forward: for each date T in `dateRange`, the strategy only ever sees
 * draws strictly before T (sortedAscending.slice(0, index)) - draws at or
 * after T, including any beyond `dateRange` itself, can never influence the
 * proposal for T. See proposeGrid.test.ts's leakage test for the guarantee.
 */
export const runWalkForwardBacktest = (
  strategy: Strategy,
  draws: Draw[],
  dateRange: DateRange,
): BacktestResult => {
  const sortedAscending = [...draws].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const steps: BacktestStepResult[] = [];

  for (let index = 0; index < sortedAscending.length; index += 1) {
    const draw = sortedAscending[index];
    if (!isWithinRange(draw.date, dateRange)) continue;

    const historyBeforeDraw = sortedAscending.slice(0, index);
    const proposedGrid = proposeGrid(strategy, historyBeforeDraw);
    const matchedNumbers = countMatches(proposedGrid.numbers, draw.numbers);
    const matchedStars = countMatches(proposedGrid.stars, draw.stars);

    steps.push({
      date: draw.date,
      actualDraw: draw,
      proposedGrid,
      matchedNumbers,
      matchedStars,
      prizeRank: prizeRank(matchedNumbers, matchedStars),
    });
  }

  return { steps, metrics: computeMetrics(steps) };
};
