import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import type { Strategy } from '../strategy/Strategy.ts';
import { runWalkForwardBacktest } from './runWalkForwardBacktest.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const sortedAscending = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

const strategyOf = (rules: Strategy['rules'], seed = 42): Strategy => ({
  id: 'test-strategy',
  name: 'Test',
  rules,
  seed,
});

describe('runWalkForwardBacktest', () => {
  it('produces one step per draw inside the date range', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }]);
    const range = { start: sortedAscending[100].date, end: sortedAscending[109].date };

    const result = runWalkForwardBacktest(strategy, history, range);

    expect(result.steps).toHaveLength(10);
    expect(result.metrics.stepCount).toBe(10);
  });

  it('never lets a proposal depend on draws that happen after it (no future leakage)', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }, { kind: 'recency' }]);
    const testRange = { start: sortedAscending[400].date, end: sortedAscending[499].date };
    const truncatedHistory = sortedAscending.slice(0, 500);

    const resultWithFullHistory = runWalkForwardBacktest(strategy, sortedAscending, testRange);
    const resultWithTruncatedHistory = runWalkForwardBacktest(strategy, truncatedHistory, testRange);

    expect(resultWithFullHistory.steps.map((step) => step.proposedGrid)).toEqual(
      resultWithTruncatedHistory.steps.map((step) => step.proposedGrid),
    );
  });

  it('is reproducible: the same seed gives the same steps', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }], 123);
    const range = { start: sortedAscending[200].date, end: sortedAscending[219].date };

    const resultA = runWalkForwardBacktest(strategy, history, range);
    const resultB = runWalkForwardBacktest(strategy, history, range);

    expect(resultA).toEqual(resultB);
  });

  it('handles an empty date range without throwing, reporting a valid "no signal" result', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }]);
    const range = { start: '1900-01-01', end: '1900-01-02' };

    const result = runWalkForwardBacktest(strategy, history, range);

    expect(result.steps).toHaveLength(0);
    expect(result.metrics.meanMatchedNumbers).toBe(0);
    expect(result.metrics.bestPrizeRank).toBeNull();
  });
});
