import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { parseFdjCsv } from '../../api/parseFdjCsv.ts';
import { splitDateRanges } from './splitDateRanges.ts';

const REAL_CSV_PATH = resolve(process.cwd(), 'public/results/euromillions_202002.csv');
const history = parseFdjCsv(readFileSync(REAL_CSV_PATH, 'utf8'));

const countInRange = (draws: typeof history, range: { start: string; end: string }): number =>
  draws.filter((draw) => draw.date >= range.start && draw.date <= range.end).length;

describe('splitDateRanges', () => {
  it('produces chronologically ordered, non-overlapping ranges', () => {
    const { train, validation, test } = splitDateRanges(history, 0.7, 0.15);

    expect(train.start <= train.end).toBe(true);
    expect(train.end < validation.start).toBe(true);
    expect(validation.end < test.start).toBe(true);
    expect(test.start <= test.end).toBe(true);
  });

  it('covers every draw exactly once across the three ranges', () => {
    const { train, validation, test } = splitDateRanges(history, 0.7, 0.15);

    const total = countInRange(history, train) + countInRange(history, validation) + countInRange(history, test);

    expect(total).toBe(history.length);
  });

  it('respects the requested proportions approximately', () => {
    const { train, validation } = splitDateRanges(history, 0.7, 0.15);

    const trainCount = countInRange(history, train);
    expect(trainCount).toBeGreaterThan(history.length * 0.65);
    expect(trainCount).toBeLessThan(history.length * 0.75);

    const validationCount = countInRange(history, validation);
    expect(validationCount).toBeGreaterThan(history.length * 0.1);
    expect(validationCount).toBeLessThan(history.length * 0.2);
  });
});
