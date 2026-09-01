import { describe, expect, it } from 'vitest';
import { parseGrid } from '../grid/Grid.ts';
import { buildGeometryDescriptor } from './GeometryDescriptor.ts';

describe('buildGeometryDescriptor', () => {
  it('mirrors the underlying FeatureVector values in the V1-spec shape', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });
    const descriptor = buildGeometryDescriptor(grid);
    const { values } = descriptor.features;

    expect(descriptor.grid).toEqual(grid);
    expect(descriptor.sum).toBe(values.sum);
    expect(descriptor.range).toBe(values.range);
    expect(descriptor.oddCount).toBe(values.oddCount);
    expect(descriptor.evenCount).toBe(values.evenCount);
    expect(descriptor.clusterSizeMax).toBe(values.clusterSizeMax);
    expect(descriptor.decadeBuckets).toEqual([
      values.decade1,
      values.decade2,
      values.decade3,
      values.decade4,
      values.decade5,
    ]);
    expect(descriptor.gaps).toEqual([values.gap1, values.gap2, values.gap3, values.gap4]);
  });

  it('is a pure, deterministic function of the grid', () => {
    const grid = parseGrid({ numbers: [3, 7, 19, 31, 42], stars: [2, 9] });

    expect(buildGeometryDescriptor(grid)).toEqual(buildGeometryDescriptor(grid));
  });
});
