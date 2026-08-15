const euclidean = (a: number[], b: number[]): number =>
  Math.sqrt(a.reduce((acc, value, index) => acc + (value - b[index]) ** 2, 0));

const mean = (values: number[]): number => values.reduce((acc, value) => acc + value, 0) / values.length;

const standardDeviation = (values: number[], average: number): number =>
  Math.sqrt(mean(values.map((value) => (value - average) ** 2)));

export interface DensityEvaluation {
  densityPercentile: number;
  outlierScore: number;
  confidence: number;
  nearestNeighborIndices: number[];
  nearestNeighborDistances: number[];
}

/**
 * k-NN density: a point in a dense region has small distances to its k
 * nearest neighbors; an isolated point has large ones. densityPercentile
 * ranks each point against every other point's mean k-NN distance;
 * outlierScore is that same distance min-max normalized; confidence is the
 * inverse coefficient of variation of the k distances themselves (a tight
 * neighbor shell is a more trustworthy density read than a scattered one).
 */
export const computeDensityEvaluations = (rows: number[][], k: number): DensityEvaluation[] => {
  const n = rows.length;

  const neighborsOf = rows.map((row, index) =>
    rows
      .map((other, otherIndex) => ({ otherIndex, distance: euclidean(row, other) }))
      .filter((entry) => entry.otherIndex !== index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, k),
  );

  const meanDistances = neighborsOf.map((neighbors) => mean(neighbors.map((entry) => entry.distance)));
  const minDistance = Math.min(...meanDistances);
  const maxDistance = Math.max(...meanDistances);
  const distanceRange = maxDistance - minDistance || 1;

  return neighborsOf.map((neighbors, index) => {
    const meanDistance = meanDistances[index];
    const denserThanCount = meanDistances.filter((distance) => distance > meanDistance).length;
    const densityPercentile = n <= 1 ? 100 : (denserThanCount / (n - 1)) * 100;
    const outlierScore = (meanDistance - minDistance) / distanceRange;

    const neighborDistances = neighbors.map((entry) => entry.distance);
    const stdDev = standardDeviation(neighborDistances, meanDistance);
    const coefficientOfVariation = meanDistance === 0 ? 0 : stdDev / meanDistance;
    const confidence = Math.max(0, 1 - Math.min(coefficientOfVariation, 1));

    return {
      densityPercentile,
      outlierScore,
      confidence,
      nearestNeighborIndices: neighbors.map((entry) => entry.otherIndex),
      nearestNeighborDistances: neighborDistances,
    };
  });
};
