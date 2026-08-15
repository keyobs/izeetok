import { PCA } from 'ml-pca';

export interface Coordinates3D {
  x: number;
  y: number;
  z: number;
}

export interface FeatureContribution {
  feature: string;
  pc1: number;
  pc2: number;
  pc3: number;
}

export interface DimensionalityReduction {
  coordinates: Coordinates3D[];
  explainedVariance: number[];
  featureContributions: FeatureContribution[];
}

/**
 * Expects already-normalized rows (see normalizeFeatures.ts) - scale: false
 * because those rows are already zero-mean/unit-variance; PCA only centers
 * (a no-op here, kept for robustness) rather than re-scaling.
 */
export const reduceDimensionsPca = (normalizedRows: number[][], featureKeys: string[]): DimensionalityReduction => {
  const pca = new PCA(normalizedRows, { center: true, scale: false });
  const projected = pca.predict(normalizedRows, { nComponents: 3 }).to2DArray();
  const coordinates = projected.map(([x, y, z]) => ({ x, y: y ?? 0, z: z ?? 0 }));

  // getExplainedVariance() already returns proportions of total variance (sum to 1).
  const explainedVariance = pca.getExplainedVariance().slice(0, 3);

  const loadings = pca.getLoadings().to2DArray();
  const [pc1Loadings, pc2Loadings, pc3Loadings] = loadings;
  const featureContributions = featureKeys.map((feature, index) => ({
    feature,
    pc1: pc1Loadings?.[index] ?? 0,
    pc2: pc2Loadings?.[index] ?? 0,
    pc3: pc3Loadings?.[index] ?? 0,
  }));

  return { coordinates, explainedVariance, featureContributions };
};
