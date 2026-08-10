import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { proposeGrid } from './proposeGrid.ts';
import type { Strategy } from './Strategy.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

const strategyOf = (rules: Strategy['rules'], seed = 42): Strategy => ({
  id: 'test-strategy',
  name: 'Test',
  rules,
  seed,
});

describe('proposeGrid', () => {
  it('is deterministic for the same seed, strategy, and history', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }]);

    expect(proposeGrid(strategy, history)).toEqual(proposeGrid(strategy, history));
  });

  it('produces a different grid for a different seed (almost always)', () => {
    const withoutRules = strategyOf([]);

    const gridA = proposeGrid({ ...withoutRules, seed: 1 }, history);
    const gridB = proposeGrid({ ...withoutRules, seed: 2 }, history);

    expect(gridA).not.toEqual(gridB);
  });

  it('always produces a valid Grid regardless of rule combination', () => {
    const strategy = strategyOf([
      { kind: 'number-frequency', weight: 1 },
      { kind: 'above-31', weight: 0.5 },
      { kind: 'decade-spread' },
      { kind: 'sum-range', params: { min: 100, max: 150 } },
      { kind: 'parity-target', params: { oddCount: 3 } },
      { kind: 'star-frequency' },
    ]);

    const grid = proposeGrid(strategy, history);

    expect(new Set(grid.numbers).size).toBe(5);
    expect(new Set(grid.stars).size).toBe(2);
  });

  it('above-31 rule with strong weight favors numbers greater than 31', () => {
    const strategy = strategyOf([{ kind: 'above-31', weight: 10 }]);

    const grid = proposeGrid(strategy, history);

    expect(grid.numbers.every((n) => n > 31)).toBe(true);
  });

  it('a negative weight flips the frequency preference toward rare numbers', () => {
    const frequent = strategyOf([{ kind: 'number-frequency', weight: 1 }]);
    const rare = strategyOf([{ kind: 'number-frequency', weight: -1 }]);

    expect(proposeGrid(frequent, history)).not.toEqual(proposeGrid(rare, history));
  });

  it('decade-spread produces one number per decade when feasible', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }, { kind: 'decade-spread' }]);

    const grid = proposeGrid(strategy, history);
    const buckets = new Set(grid.numbers.map((n) => Math.min(Math.floor((n - 1) / 10), 4)));

    expect(buckets.size).toBe(5);
  });

  it('sum-range constrains the total sum into the requested range', () => {
    const strategy = strategyOf([{ kind: 'sum-range', params: { min: 100, max: 120 } }]);

    const grid = proposeGrid(strategy, history);
    const sum = grid.numbers.reduce((acc, n) => acc + n, 0);

    expect(sum).toBeGreaterThanOrEqual(100);
    expect(sum).toBeLessThanOrEqual(120);
  });

  it('parity-target hits the exact requested odd count when feasible', () => {
    const strategy = strategyOf([{ kind: 'parity-target', params: { oddCount: 5 } }]);

    const grid = proposeGrid(strategy, history);

    expect(grid.numbers.every((n) => n % 2 !== 0)).toBe(true);
  });

  it('handles an empty history without throwing', () => {
    const strategy = strategyOf([{ kind: 'number-frequency' }, { kind: 'recency' }]);

    expect(() => proposeGrid(strategy, [])).not.toThrow();
  });
});
