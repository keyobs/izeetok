import type { GeometryDescriptor } from './GeometryDescriptor.ts';

export interface GeometryDistance {
  total: number;
  components: Record<string, number>;
}

const jaccardDistance = (a: readonly number[], b: readonly number[]): number => {
  const setA = new Set(a);
  const setB = new Set(b);
  const union = new Set([...setA, ...setB]);
  const intersectionSize = [...setA].filter((value) => setB.has(value)).length;
  return 1 - intersectionSize / union.size;
};

const MAX_SUM_RANGE = 240 - 15; // (46+47+48+49+50) - (1+2+3+4+5)
const MAX_GAP = 49; // widest possible single gap (numbers 1 and 50)

export const computeGeometryDistance = (
  a: GeometryDescriptor,
  b: GeometryDescriptor,
): GeometryDistance => {
  const bucketsDistance =
    a.decadeBuckets.reduce((acc, count, index) => acc + Math.abs(count - b.decadeBuckets[index]), 0) /
    10;

  const sumDistance = Math.abs(a.sum - b.sum) / MAX_SUM_RANGE;

  const gapsDistance =
    a.gaps.reduce((acc, gap, index) => acc + Math.abs(gap - b.gaps[index]), 0) /
    a.gaps.length /
    MAX_GAP;

  const parityDistance = Math.abs(a.oddCount - b.oddCount) / a.grid.numbers.length;

  const components: Record<string, number> = {
    numbers: jaccardDistance(a.grid.numbers, b.grid.numbers),
    buckets: bucketsDistance,
    sum: sumDistance,
    gaps: gapsDistance,
    parity: parityDistance,
    stars: jaccardDistance(a.grid.stars, b.grid.stars),
  };

  const total =
    Object.values(components).reduce((acc, value) => acc + value, 0) / Object.keys(components).length;

  return { total, components };
};
