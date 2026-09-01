export type EmbeddingMethod = 'pca' | 'umap';

export interface SpatialEmbedding {
  drawId: string;
  coordinates: {
    x: number;
    y: number;
    z: number;
  };
  method: EmbeddingMethod;
  clusterId?: string;
  density: number;
  outlierScore: number;
  nearestNeighbors: {
    drawId: string;
    distance: number;
  }[];
}
