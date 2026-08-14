import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../infrastructure/csv/parseFdjCsv.ts';
import { compareBaselines } from './compareBaselines.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));
const sortedAscending = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

describe('compareBaselines', () => {
  it('reports mean matched numbers/stars for all five baselines', () => {
    const range = { start: sortedAscending[600].date, end: sortedAscending[679].date };

    const comparisons = compareBaselines(history, range, 42);

    expect(comparisons).toHaveLength(5);
    for (const comparison of comparisons) {
      expect(comparison.meanMatchedNumbers).toBeGreaterThanOrEqual(0);
      expect(comparison.meanMatchedNumbers).toBeLessThanOrEqual(5);
      expect(comparison.meanMatchedStars).toBeGreaterThanOrEqual(0);
      expect(comparison.meanMatchedStars).toBeLessThanOrEqual(2);
    }
  });
});
