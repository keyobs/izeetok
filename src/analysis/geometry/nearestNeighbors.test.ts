import { describe, expect, it } from 'vitest';
import { parseGrid } from '../grid/Grid.ts';
import { buildGeometryDescriptor } from './GeometryDescriptor.ts';
import { findNearestNeighbors } from './nearestNeighbors.ts';

const descriptorOf = (numbers: number[], stars: number[]) =>
  buildGeometryDescriptor(parseGrid({ numbers, stars }));

describe('findNearestNeighbors', () => {
  it('returns the k closest candidates ordered by ascending distance', () => {
    const target = descriptorOf([3, 7, 19, 31, 42], [2, 9]);
    const candidates = [
      { item: 'almost-same', descriptor: descriptorOf([3, 7, 19, 31, 43], [2, 9]) },
      { item: 'very-different', descriptor: descriptorOf([1, 2, 3, 4, 5], [1, 2]) },
      { item: 'somewhat-different', descriptor: descriptorOf([3, 7, 19, 30, 42], [2, 9]) },
    ];

    const neighbors = findNearestNeighbors(target, candidates, 2);

    expect(neighbors).toHaveLength(2);
    expect(neighbors[0].item).toBe('almost-same');
    expect(neighbors[0].distance).toBeLessThanOrEqual(neighbors[1].distance);
  });
});
