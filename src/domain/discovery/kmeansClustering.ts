import { kmeans } from 'ml-kmeans';
import { createSeededRandom } from '../random/seededRandom.ts';

const squaredEuclidean = (a: number[], b: number[]): number =>
  a.reduce((acc, value, index) => acc + (value - b[index]) ** 2, 0);

const euclidean = (a: number[], b: number[]): number => Math.sqrt(squaredEuclidean(a, b));

const mean = (values: number[]): number => values.reduce((acc, value) => acc + value, 0) / values.length;

/**
 * Average silhouette coefficient over all points: for each point, how much
 * closer it is (on average) to its own cluster than to the nearest other
 * cluster. Close to 1 = well-separated clusters, close to 0 or negative =
 * the clustering isn't finding real structure.
 */
export const computeSilhouetteScore = (rows: number[][], clusterIds: number[]): number => {
  const n = rows.length;
  const uniqueClusters = new Set(clusterIds);
  if (n < 2 || uniqueClusters.size < 2) return 0;

  let total = 0;
  for (let i = 0; i < n; i += 1) {
    const own = clusterIds[i];
    const distancesByCluster: Record<number, number[]> = {};
    for (let j = 0; j < n; j += 1) {
      if (i === j) continue;
      (distancesByCluster[clusterIds[j]] ??= []).push(euclidean(rows[i], rows[j]));
    }

    const withinClusterDistances = distancesByCluster[own] ?? [];
    const a = withinClusterDistances.length > 0 ? mean(withinClusterDistances) : 0;
    const otherClusterMeans = Object.entries(distancesByCluster)
      .filter(([clusterId]) => Number(clusterId) !== own)
      .map(([, distances]) => mean(distances));
    const b = otherClusterMeans.length > 0 ? Math.min(...otherClusterMeans) : 0;

    total += Math.max(a, b) === 0 ? 0 : (b - a) / Math.max(a, b);
  }

  return total / n;
};

export interface KMeansCandidateScore {
  k: number;
  silhouetteScore: number;
}

export interface KMeansFitResult {
  k: number;
  clusterIds: number[];
  centroids: number[][];
  silhouetteScore: number;
  candidateScores: KMeansCandidateScore[];
}

/** Tries every k in `kCandidates`, keeps the one with the best silhouette score. */
export const fitKMeansWithSilhouette = (rows: number[][], kCandidates: number[], seed: number): KMeansFitResult => {
  const candidates = kCandidates.map((k) => {
    const result = kmeans(rows, k, { seed, initialization: 'kmeans++' });
    return { k, silhouetteScore: computeSilhouetteScore(rows, result.clusters), result };
  });

  const best = candidates.reduce((a, b) => (b.silhouetteScore > a.silhouetteScore ? b : a));

  return {
    k: best.k,
    clusterIds: best.result.clusters,
    centroids: best.result.centroids,
    silhouetteScore: best.silhouetteScore,
    candidateScores: candidates.map(({ k, silhouetteScore }) => ({ k, silhouetteScore })),
  };
};

export interface ClusterStability {
  clusterId: number;
  stability: number;
}

const MAX_PAIRS_PER_CLUSTER = 200;

const samplePairs = (indices: number[], random: () => number): [number, number][] => {
  const maxPairs = Math.min(MAX_PAIRS_PER_CLUSTER, Math.floor((indices.length * (indices.length - 1)) / 2));
  const pairs: [number, number][] = [];
  const seen = new Set<string>();
  let attempts = 0;

  while (pairs.length < maxPairs && attempts < maxPairs * 20) {
    attempts += 1;
    const a = indices[Math.floor(random() * indices.length)];
    const b = indices[Math.floor(random() * indices.length)];
    if (a === b) continue;
    const key = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push(a < b ? [a, b] : [b, a]);
  }

  return pairs;
};

/**
 * Bootstrap stability: resample rows with replacement, refit K-Means on the
 * resample, then check whether pairs of points originally co-clustered
 * stay co-clustered under the resampled model. Averaged over
 * `bootstrapIterations`. A simplified co-clustering agreement rate rather
 * than a full Adjusted Rand Index - cheaper, and enough to flag "this
 * family doesn't hold up" per the spec's stability requirement.
 */
export const computeBootstrapStability = (
  rows: number[][],
  clusterIds: number[],
  k: number,
  bootstrapIterations: number,
  seed: number,
): ClusterStability[] => {
  const random = createSeededRandom(seed);
  const n = rows.length;

  const indicesByCluster: Record<number, number[]> = {};
  clusterIds.forEach((clusterId, index) => {
    (indicesByCluster[clusterId] ??= []).push(index);
  });

  const pairsByCluster: Record<number, [number, number][]> = {};
  for (const [clusterId, indices] of Object.entries(indicesByCluster)) {
    pairsByCluster[Number(clusterId)] = samplePairs(indices, random);
  }

  const agreementCounts: Record<number, number> = {};
  for (const clusterId of Object.keys(indicesByCluster)) agreementCounts[Number(clusterId)] = 0;

  for (let iteration = 0; iteration < bootstrapIterations; iteration += 1) {
    const resampledRows = Array.from({ length: n }, () => rows[Math.floor(random() * n)]);
    const bootstrapModel = kmeans(resampledRows, k, { seed: seed + iteration + 1, initialization: 'kmeans++' });
    const assignments = bootstrapModel.nearest(rows);

    for (const [clusterId, pairs] of Object.entries(pairsByCluster)) {
      for (const [a, b] of pairs) {
        if (assignments[a] === assignments[b]) agreementCounts[Number(clusterId)] += 1;
      }
    }
  }

  return Object.entries(indicesByCluster).map(([clusterId]) => {
    const id = Number(clusterId);
    const totalChecks = pairsByCluster[id].length * bootstrapIterations;
    return { clusterId: id, stability: totalChecks === 0 ? 1 : agreementCounts[id] / totalChecks };
  });
};
