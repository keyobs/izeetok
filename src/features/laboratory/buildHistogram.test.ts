import { describe, expect, it } from 'vitest';
import { buildHistogram } from './buildHistogram.ts';

describe('buildHistogram', () => {
  it('returns an empty array for no values', () => {
    expect(buildHistogram([], 10)).toEqual([]);
  });

  it('distributes every value into exactly one of the requested bins', () => {
    const values = [0, 1, 2, 3, 4, 5];

    const bins = buildHistogram(values, 5);

    expect(bins).toHaveLength(5);
    expect(bins.reduce((acc, bin) => acc + bin.count, 0)).toBe(values.length);
  });

  it('puts identical values into the same bin', () => {
    const bins = buildHistogram([2, 2, 2, 2], 4);

    expect(bins.reduce((acc, bin) => acc + bin.count, 0)).toBe(4);
    expect(bins.filter((bin) => bin.count > 0)).toHaveLength(1);
  });
});
