import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { BASELINE_KINDS, proposeBaselineGrid } from './baselines.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

describe('proposeBaselineGrid', () => {
  it('produces a valid Grid for every baseline kind', () => {
    for (const kind of BASELINE_KINDS) {
      const grid = proposeBaselineGrid(kind, history, 1);
      expect(new Set(grid.numbers).size).toBe(5);
      expect(new Set(grid.stars).size).toBe(2);
    }
  });

  it('fixed-grid always returns the same grid regardless of history or seed', () => {
    const a = proposeBaselineGrid('fixed-grid', history, 1);
    const b = proposeBaselineGrid('fixed-grid', [], 999);

    expect(a).toEqual(b);
  });

  it('uniform-random ignores history entirely', () => {
    const withHistory = proposeBaselineGrid('uniform-random', history, 7);
    const withoutHistory = proposeBaselineGrid('uniform-random', [], 7);

    expect(withHistory).toEqual(withoutHistory);
  });

  it('frequent-numbers and rare-numbers disagree on a real history', () => {
    const frequent = proposeBaselineGrid('frequent-numbers', history, 1);
    const rare = proposeBaselineGrid('rare-numbers', history, 1);

    expect(frequent).not.toEqual(rare);
  });
});
