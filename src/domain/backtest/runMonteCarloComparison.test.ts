import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { runMonteCarloComparison } from './runMonteCarloComparison.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const sortedAscending = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
const range = { start: sortedAscending[600].date, end: sortedAscending[679].date };

describe('runMonteCarloComparison', () => {
  it('reports a percentile within [0, 100] and a distribution of the requested size', () => {
    const result = runMonteCarloComparison(1.5, history, range, 30, 1);

    expect(result.sampleCount).toBe(30);
    expect(result.distribution).toHaveLength(30);
    expect(result.strategyPercentile).toBeGreaterThanOrEqual(0);
    expect(result.strategyPercentile).toBeLessThanOrEqual(100);
  });

  it('is reproducible: the same base seed gives the same distribution', () => {
    const a = runMonteCarloComparison(1.5, history, range, 20, 5);
    const b = runMonteCarloComparison(1.5, history, range, 20, 5);

    expect(a).toEqual(b);
  });

  it('rates an unrealistically high strategy score near the top percentile', () => {
    const result = runMonteCarloComparison(5, history, range, 30, 1);

    expect(result.strategyPercentile).toBeGreaterThan(90);
  });

  it('rates an unrealistically low strategy score near the bottom percentile', () => {
    const result = runMonteCarloComparison(0, history, range, 30, 1);

    expect(result.strategyPercentile).toBeLessThan(10);
  });
});
