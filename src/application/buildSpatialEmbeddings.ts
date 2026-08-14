import { PCA } from 'ml-pca';
import type { Draw } from '../domain/draw/Draw.ts';
import { extractFeatures, featureVectorToArray } from '../domain/features/FeatureExtractor.ts';
import type { SpatialEmbedding } from '../domain/geometry/SpatialEmbedding.ts';

export const buildSpatialEmbeddings = (draws: Draw[]): SpatialEmbedding[] => {
  const matrix = draws.map((draw) =>
    featureVectorToArray(extractFeatures({ numbers: draw.numbers, stars: draw.stars })),
  );

  const pca = new PCA(matrix, { center: true, scale: true });
  const projected = pca.predict(matrix, { nComponents: 3 }).to2DArray();

  return draws.map((draw, index): SpatialEmbedding => {
    const [x, y, z] = projected[index];
    return {
      drawId: draw.id,
      coordinates: { x, y, z },
      method: 'pca',
      density: 0,
      outlierScore: 0,
      nearestNeighbors: [],
    };
  });
};
