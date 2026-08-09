import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../infrastructure/csv/parseFdjCsv.ts';
import { parseGrid } from '../domain/grid/Grid.ts';
import { generateVariations } from './generateVariations.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

describe('generateVariations', () => {
  it('produces one valid grid per variation kind', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    const variations = generateVariations(grid, history);

    expect(variations.map((v) => v.kind).sort()).toEqual(
      ['anti-share', 'balanced', 'structurally-common'].sort(),
    );
    for (const variation of variations) {
      expect(new Set(variation.grid.numbers).size).toBe(5);
      expect(new Set(variation.grid.stars).size).toBe(2);
    }
  });

  it('spreads the balanced variation across the five decades', () => {
    const grid = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });

    const [, balanced] = generateVariations(grid, history);

    const buckets = balanced.grid.numbers.map((n) => Math.min(Math.floor((n - 1) / 10), 4));
    expect(new Set(buckets).size).toBe(5);
  });

  it('avoids <=31 and multiples-of-five numbers in the anti-share variation', () => {
    const grid = parseGrid({ numbers: [1, 5, 10, 15, 20], stars: [1, 2] });

    const [, , antiShare] = generateVariations(grid, history);

    for (const n of antiShare.grid.numbers) {
      expect(n).toBeGreaterThan(31);
      expect(n % 5).not.toBe(0);
    }
  });

  it('is deterministic for the same grid and history', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(generateVariations(grid, history)).toEqual(generateVariations(grid, history));
  });
});
