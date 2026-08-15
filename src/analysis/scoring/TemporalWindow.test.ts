import { describe, expect, it } from 'vitest';
import type { Draw } from '../draw/Draw.ts';
import { filterByWindow, latestDrawDate } from './TemporalWindow.ts';

const drawOn = (date: string): Draw => ({
  id: date,
  date,
  numbers: [1, 2, 3, 4, 5],
  stars: [1, 2],
  source: 'manual',
});

describe('filterByWindow', () => {
  const draws = [drawOn('2020-01-01'), drawOn('2023-01-01'), drawOn('2025-06-01'), drawOn('2026-01-01')];
  const referenceDate = latestDrawDate(draws);

  it('returns every draw for the "all" window', () => {
    expect(filterByWindow(draws, 'all', referenceDate)).toHaveLength(4);
  });

  it('keeps only draws within N years of the reference date', () => {
    const oneYear = filterByWindow(draws, 1, referenceDate);
    expect(oneYear.map((d) => d.date)).toEqual(['2025-06-01', '2026-01-01']);
  });

  it('has no privileged window - a 6-year window is just another cutoff', () => {
    const sixYears = filterByWindow(draws, 6, referenceDate);
    expect(sixYears).toHaveLength(4);
  });
});

describe('latestDrawDate', () => {
  it('finds the most recent draw date', () => {
    const draws = [drawOn('2020-01-01'), drawOn('2026-01-01'), drawOn('2023-01-01')];
    expect(latestDrawDate(draws).toISOString().slice(0, 10)).toBe('2026-01-01');
  });
});
