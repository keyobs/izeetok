import { describe, expect, it } from 'vitest';
import { parseGrid } from './Grid.ts';

describe('parseGrid', () => {
  it('normalizes numbers and stars in ascending order', () => {
    const grid = parseGrid({ numbers: [42, 3, 19, 7, 31], stars: [9, 2] });

    expect(grid.numbers).toEqual([3, 7, 19, 31, 42]);
    expect(grid.stars).toEqual([2, 9]);
  });

  it('is invariant to input order', () => {
    const a = parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 2] });
    const b = parseGrid({ numbers: [5, 4, 3, 2, 1], stars: [2, 1] });

    expect(a).toEqual(b);
  });

  it('rejects duplicate numbers', () => {
    expect(() => parseGrid({ numbers: [1, 1, 3, 4, 5], stars: [1, 2] })).toThrow();
  });

  it('rejects duplicate stars', () => {
    expect(() => parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 1] })).toThrow();
  });

  it('rejects numbers out of the 1..50 range', () => {
    expect(() => parseGrid({ numbers: [0, 2, 3, 4, 5], stars: [1, 2] })).toThrow();
    expect(() => parseGrid({ numbers: [1, 2, 3, 4, 51], stars: [1, 2] })).toThrow();
  });

  it('rejects stars out of the 1..12 range', () => {
    expect(() => parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [0, 2] })).toThrow();
    expect(() => parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1, 13] })).toThrow();
  });

  it('rejects the wrong count of numbers or stars', () => {
    expect(() => parseGrid({ numbers: [1, 2, 3, 4], stars: [1, 2] })).toThrow();
    expect(() => parseGrid({ numbers: [1, 2, 3, 4, 5], stars: [1] })).toThrow();
  });
});
