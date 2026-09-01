import type { Draw } from '../../analysis/draw/Draw.ts';
import type { FeatureKey, FeatureVector } from '../../analysis/features/FeatureExtractor.ts';
import { FEATURE_KEYS, extractFeatures } from '../../analysis/features/FeatureExtractor.ts';
import type { NormalizationModel } from '../../analysis/discovery/normalizeFeatures.ts';
import { applyNormalization, fitNormalization } from '../../analysis/discovery/normalizeFeatures.ts';
import type { DimensionalityReduction } from '../../analysis/discovery/reduceDimensions.ts';
import { reduceDimensionsPca } from '../../analysis/discovery/reduceDimensions.ts';
import type { KMeansCandidateScore, KMeansFitResult } from '../../analysis/discovery/kmeansClustering.ts';
import { computeBootstrapStability, fitKMeansWithSilhouette } from '../../analysis/discovery/kmeansClustering.ts';
import { computeDensityEvaluations } from '../../analysis/discovery/densityEvaluation.ts';
import { generateSyntheticDraws } from '../../analysis/discovery/generateSyntheticDraws.ts';
import type { SpatialEmbedding } from '../../analysis/geometry/SpatialEmbedding.ts';

const STABILITY_THRESHOLD = 0.5;
const FAMILY_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

const FEATURE_DESCRIPTIONS: Partial<Record<FeatureKey, { high: string; low: string }>> = {
  sum: { high: 'Somme élevée', low: 'Somme faible' },
  range: { high: 'Amplitude large', low: 'Amplitude resserrée' },
  oddCount: { high: 'Majorité de numéros impairs', low: 'Majorité de numéros pairs' },
  aboveThirtyOneCount: { high: 'Plusieurs numéros supérieurs à 31', low: 'Peu de numéros supérieurs à 31' },
  consecutivePairsCount: { high: 'Plusieurs numéros consécutifs', low: "Peu de numéros consécutifs" },
  sameUnitsPairsCount: { high: "Plusieurs numéros de même unité", low: "Peu de répétition d'unité" },
  entropy: { high: 'Répartition étalée sur les dizaines', low: 'Répartition concentrée sur peu de dizaines' },
  clusterSizeMax: { high: 'Numéros concentrés dans une dizaine', low: 'Numéros bien répartis entre les dizaines' },
  starsSum: { high: 'Étoiles à valeur élevée', low: 'Étoiles à valeur faible' },
};

export interface Family {
  clusterId: number;
  label: string;
  description: string;
  frequency: number;
  stability: number;
  isStable: boolean;
}

export interface DiscoveryConfig {
  kCandidates: number[];
  neighborCount: number;
  bootstrapIterations: number;
  seed: number;
  syntheticSampleCount?: number;
}

export interface NullHypothesisComparison {
  realSilhouetteScore: number;
  syntheticSilhouetteScore: number;
  realShowsMoreStructure: boolean;
}

export interface DiscoveryResult {
  embeddings: SpatialEmbedding[];
  families: Family[];
  normalization: NormalizationModel;
  pca: Pick<DimensionalityReduction, 'explainedVariance' | 'featureContributions'>;
  clustering: { k: number; silhouetteScore: number; candidateScores: KMeansCandidateScore[] };
  nullHypothesisComparison: NullHypothesisComparison;
}

const mean = (values: number[]): number => values.reduce((acc, value) => acc + value, 0) / values.length;

const describeCluster = (
  clusterVectors: FeatureVector[],
  overallMeans: Record<string, number>,
  overallStdDevs: Record<string, number>,
): string[] =>
  FEATURE_KEYS.filter((key) => key in FEATURE_DESCRIPTIONS && overallStdDevs[key] > 0)
    .map((key) => ({
      key,
      zScore: (mean(clusterVectors.map((vector) => vector.values[key])) - overallMeans[key]) / overallStdDevs[key],
    }))
    .sort((a, b) => Math.abs(b.zScore) - Math.abs(a.zScore))
    .slice(0, 3)
    .map(({ key, zScore }) => (zScore >= 0 ? FEATURE_DESCRIPTIONS[key]!.high : FEATURE_DESCRIPTIONS[key]!.low));

const buildFamilies = (
  vectors: FeatureVector[],
  clusteringFit: KMeansFitResult,
  stabilityByCluster: Map<number, number>,
  normalization: NormalizationModel,
): Family[] => {
  const overallMeans: Record<string, number> = {};
  for (const key of FEATURE_KEYS) overallMeans[key] = mean(vectors.map((vector) => vector.values[key]));

  const clusterIds = [...new Set(clusteringFit.clusterIds)].sort((a, b) => a - b);

  return clusterIds.map((clusterId, index) => {
    const memberVectors = clusteringFit.clusterIds
      .map((id, memberIndex) => (id === clusterId ? memberIndex : -1))
      .filter((memberIndex) => memberIndex !== -1)
      .map((memberIndex) => vectors[memberIndex]);

    const stability = stabilityByCluster.get(clusterId) ?? 0;

    return {
      clusterId,
      label: `Famille ${FAMILY_LABELS[index] ?? index}`,
      description: describeCluster(memberVectors, overallMeans, normalization.stdDevs).join(', '),
      frequency: memberVectors.length / vectors.length,
      stability,
      isStable: stability >= STABILITY_THRESHOLD,
    };
  });
};

/**
 * The real DiscoveryModel: normalize -> PCA -> K-Means (+ bootstrap
 * stability) -> k-NN density, producing actual SpatialEmbedding[] with
 * real density/outlierScore/clusterId/nearestNeighbors - replacing the
 * ADR-0002 spike's stubbed 0/0/undefined/[] placeholders. Also runs the
 * same pipeline on a synthetic null-hypothesis dataset for comparison.
 */
export const discoverStructure = (draws: Draw[], config: DiscoveryConfig): DiscoveryResult => {
  const vectors = draws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));
  const normalization = fitNormalization(vectors);
  const normalizedRows = applyNormalization(vectors, normalization);
  const pca = reduceDimensionsPca(normalizedRows, normalization.featureKeys);
  const pcaRows = pca.coordinates.map((c) => [c.x, c.y, c.z]);

  const clusteringFit = fitKMeansWithSilhouette(pcaRows, config.kCandidates, config.seed);
  const stabilities = computeBootstrapStability(
    pcaRows,
    clusteringFit.clusterIds,
    clusteringFit.k,
    config.bootstrapIterations,
    config.seed,
  );
  const stabilityByCluster = new Map(stabilities.map((entry) => [entry.clusterId, entry.stability]));

  const densityEvaluations = computeDensityEvaluations(pcaRows, config.neighborCount);

  const embeddings: SpatialEmbedding[] = draws.map((draw, index) => ({
    drawId: draw.id,
    coordinates: pca.coordinates[index],
    method: 'pca',
    clusterId: String(clusteringFit.clusterIds[index]),
    density: densityEvaluations[index].densityPercentile,
    outlierScore: densityEvaluations[index].outlierScore,
    nearestNeighbors: densityEvaluations[index].nearestNeighborIndices.map((neighborIndex, neighborRank) => ({
      drawId: draws[neighborIndex].id,
      distance: densityEvaluations[index].nearestNeighborDistances[neighborRank],
    })),
  }));

  const families = buildFamilies(vectors, clusteringFit, stabilityByCluster, normalization);

  const syntheticDraws = generateSyntheticDraws(
    config.syntheticSampleCount ?? draws.length,
    config.seed + 1000,
    draws[0]?.date ?? '2000-01-01',
  );
  const syntheticVectors = syntheticDraws.map((draw) => extractFeatures({ numbers: draw.numbers, stars: draw.stars }));
  const syntheticNormalization = fitNormalization(syntheticVectors);
  const syntheticRows = applyNormalization(syntheticVectors, syntheticNormalization);
  const syntheticPcaRows = reduceDimensionsPca(syntheticRows, syntheticNormalization.featureKeys).coordinates.map(
    (c) => [c.x, c.y, c.z],
  );
  const syntheticClusteringFit = fitKMeansWithSilhouette(syntheticPcaRows, config.kCandidates, config.seed);

  return {
    embeddings,
    families,
    normalization,
    pca: { explainedVariance: pca.explainedVariance, featureContributions: pca.featureContributions },
    clustering: {
      k: clusteringFit.k,
      silhouetteScore: clusteringFit.silhouetteScore,
      candidateScores: clusteringFit.candidateScores,
    },
    nullHypothesisComparison: {
      realSilhouetteScore: clusteringFit.silhouetteScore,
      syntheticSilhouetteScore: syntheticClusteringFit.silhouetteScore,
      realShowsMoreStructure: clusteringFit.silhouetteScore > syntheticClusteringFit.silhouetteScore,
    },
  };
};
