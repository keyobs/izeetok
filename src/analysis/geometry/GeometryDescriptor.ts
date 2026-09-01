import type { Grid } from '../grid/Grid.ts';
import type { FeatureVector } from '../features/FeatureExtractor.ts';
import { extractFeatures } from '../features/FeatureExtractor.ts';

export interface GeometryDescriptor {
  grid: Grid;
  features: FeatureVector;
  decadeBuckets: [number, number, number, number, number];
  gaps: [number, number, number, number];
  sum: number;
  range: number;
  oddCount: number;
  evenCount: number;
  clusterSizeMax: number;
}

export const buildGeometryDescriptor = (grid: Grid): GeometryDescriptor => {
  const features = extractFeatures(grid);
  const v = features.values;

  return {
    grid,
    features,
    decadeBuckets: [v.decade1, v.decade2, v.decade3, v.decade4, v.decade5],
    gaps: [v.gap1, v.gap2, v.gap3, v.gap4],
    sum: v.sum,
    range: v.range,
    oddCount: v.oddCount,
    evenCount: v.evenCount,
    clusterSizeMax: v.clusterSizeMax,
  };
};
