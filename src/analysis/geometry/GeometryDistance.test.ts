import { describe, expect, it } from 'vitest';
import { parseGrid } from '../grid/Grid.ts';
import { buildGeometryDescriptor } from './GeometryDescriptor.ts';
import { computeGeometryDistance } from './GeometryDistance.ts';

const descriptorOf = (numbers: number[], stars: number[]) =>
  buildGeometryDescriptor(parseGrid({ numbers, stars }));

describe('computeGeometryDistance', () => {
  it('is zero for a grid compared to itself', () => {
    const descriptor = descriptorOf([3, 7, 19, 31, 42], [2, 9]);

    const distance = computeGeometryDistance(descriptor, descriptor);

    expect(distance.total).toBe(0);
    for (const value of Object.values(distance.components)) {
      expect(value).toBe(0);
    }
  });

  it('is symmetric', () => {
    const a = descriptorOf([3, 7, 19, 31, 42], [2, 9]);
    const b = descriptorOf([1, 2, 3, 4, 5], [1, 2]);

    expect(computeGeometryDistance(a, b)).toEqual(computeGeometryDistance(b, a));
  });

  it('always exposes its components alongside the total', () => {
    const a = descriptorOf([3, 7, 19, 31, 42], [2, 9]);
    const b = descriptorOf([1, 2, 3, 4, 5], [1, 2]);

    const distance = computeGeometryDistance(a, b);

    expect(Object.keys(distance.components).sort()).toEqual(
      ['buckets', 'gaps', 'numbers', 'parity', 'stars', 'sum'].sort(),
    );
  });

  it('rates a near-identical grid as closer than a wildly different one', () => {
    const reference = descriptorOf([3, 7, 19, 31, 42], [2, 9]);
    const almostSame = descriptorOf([3, 7, 19, 31, 43], [2, 9]);
    const veryDifferent = descriptorOf([1, 2, 3, 4, 5], [1, 2]);

    const closeDistance = computeGeometryDistance(reference, almostSame);
    const farDistance = computeGeometryDistance(reference, veryDifferent);

    expect(closeDistance.total).toBeLessThan(farDistance.total);
  });
});
