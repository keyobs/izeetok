import { describe, expect, it } from 'vitest';
import { parseGrid } from '../grid/Grid.ts';
import type { Draw } from './Draw.ts';
import { findExactMatch, findNumbersOnlyMatches } from './findExactMatch.ts';

const buildDraw = (overrides: Partial<Draw> = {}): Draw => ({
  id: '1',
  date: '2024-01-05',
  numbers: [3, 7, 19, 31, 42],
  stars: [2, 9],
  source: 'fdj-csv',
  ...overrides,
});

describe('findExactMatch', () => {
  it('finds the draw matching the same numbers and stars', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const draw = buildDraw();

    expect(findExactMatch(grid, [draw])).toEqual(draw);
  });

  it('is invariant to input order, since Grid is always sorted', () => {
    const grid = parseGrid({ numbers: [42, 31, 19, 7, 3], stars: [9, 2] });
    const draw = buildDraw();

    expect(findExactMatch(grid, [draw])).toEqual(draw);
  });

  it('returns null when no draw matches', () => {
    const grid = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
    const draw = buildDraw();

    expect(findExactMatch(grid, [draw])).toBeNull();
  });

  it('does not match when only the numbers are the same and the stars differ', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [1, 5] });
    const draw = buildDraw();

    expect(findExactMatch(grid, [draw])).toBeNull();
  });

  it('returns null for an empty history', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(findExactMatch(grid, [])).toBeNull();
  });
});

describe('findNumbersOnlyMatches', () => {
  it('matches a draw with the same numbers but different stars', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [1, 5] });
    const draw = buildDraw();

    expect(findNumbersOnlyMatches(grid, [draw])).toEqual([draw]);
  });

  it('also matches a draw with the same numbers and the same stars', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const draw = buildDraw();

    expect(findNumbersOnlyMatches(grid, [draw])).toEqual([draw]);
  });

  it('returns every matching draw, not just the first', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [1, 5] });
    const first = buildDraw({ id: '1', date: '2021-03-01', stars: [4, 8] });
    const second = buildDraw({ id: '2', date: '2023-06-10', stars: [1, 5] });

    expect(findNumbersOnlyMatches(grid, [first, second])).toEqual([first, second]);
  });

  it('returns an empty array when no draw shares the same numbers', () => {
    const grid = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
    const draw = buildDraw();

    expect(findNumbersOnlyMatches(grid, [draw])).toEqual([]);
  });
});
