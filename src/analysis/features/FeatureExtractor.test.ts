import { describe, expect, it } from 'vitest';
import { parseGrid } from '../grid/Grid.ts';
import { FEATURE_KEYS, extractFeatures, featureVectorToArray } from './FeatureExtractor.ts';

describe('extractFeatures', () => {
  it('is deterministic for the same grid', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(extractFeatures(grid)).toEqual(extractFeatures(grid));
  });

  it('is invariant to the order numbers/stars were originally given in', () => {
    const a = parseGrid({ numbers: [42, 3, 19, 7, 31], stars: [9, 2] });
    const b = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(extractFeatures(a)).toEqual(extractFeatures(b));
  });

  it('computes sum, range and parity counts consistently', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const { values } = extractFeatures(grid);

    expect(values.sum).toBe(3 + 7 + 19 + 31 + 42);
    expect(values.min).toBe(3);
    expect(values.max).toBe(42);
    expect(values.range).toBe(39);
    expect(values.oddCount + values.evenCount).toBe(5);
    expect(values.decade1 + values.decade2 + values.decade3 + values.decade4 + values.decade5).toBe(5);
  });

  it('computes the four successive gaps from the sorted numbers', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const { values } = extractFeatures(grid);

    expect([values.gap1, values.gap2, values.gap3, values.gap4]).toEqual([4, 12, 12, 11]);
  });

  it('flags a number above 31 and a pair of consecutive numbers', () => {
    const grid = parseGrid({ numbers: [3, 4, 19, 31, 42], stars: [2, 9] });
    const { values } = extractFeatures(grid);

    expect(values.consecutivePairsCount).toBe(1);
    expect(values.aboveThirtyOneCount).toBe(1);
  });

  it('exposes one array entry per declared feature key, in a stable order', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const vector = extractFeatures(grid);

    const array = featureVectorToArray(vector);

    expect(array).toHaveLength(FEATURE_KEYS.length);
    expect(array.every((value) => Number.isFinite(value))).toBe(true);
  });
});
