import type { Draw } from './draw/Draw.ts';
import { parseGrid } from './grid/Grid.ts';
import type { Grid } from './grid/Grid.ts';

export type VariationKind = 'structurally-common' | 'balanced' | 'anti-share';

export interface GridVariation {
  kind: VariationKind;
  grid: Grid;
}

const NUMBER_MIN = 1;
const NUMBER_MAX = 50;
const STAR_MIN = 1;
const STAR_MAX = 12;

const decadeBucketOf = (n: number): number => Math.min(Math.floor((n - 1) / 10), 4);

const countFrequencies = (values: number[], min: number, max: number): Record<number, number> => {
  const frequencies: Record<number, number> = {};
  for (let value = min; value <= max; value += 1) frequencies[value] = 0;
  for (const value of values) frequencies[value] += 1;
  return frequencies;
};

const pickDistinct = (candidatesByPreference: number[], taken: Set<number>): number => {
  const choice = candidatesByPreference.find((candidate) => !taken.has(candidate));
  if (choice === undefined) throw new Error('No distinct candidate available for this variation');
  return choice;
};

const range = (min: number, max: number): number[] =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

const buildStructurallyCommonVariation = (grid: Grid, history: Draw[]): Grid => {
  const numberFrequencies = countFrequencies(history.flatMap((draw) => draw.numbers), NUMBER_MIN, NUMBER_MAX);
  const starFrequencies = countFrequencies(history.flatMap((draw) => draw.stars), STAR_MIN, STAR_MAX);

  const taken = new Set<number>();
  const numbers = grid.numbers.map((original) => {
    const bucket = decadeBucketOf(original);
    const bucketMin = bucket * 10 + 1;
    const bucketMax = Math.min(bucket * 10 + 10, NUMBER_MAX);
    const candidates = range(bucketMin, bucketMax).sort(
      (a, b) => numberFrequencies[b] - numberFrequencies[a] || Math.abs(a - original) - Math.abs(b - original),
    );
    const chosen = pickDistinct(candidates, taken);
    taken.add(chosen);
    return chosen;
  });

  const starCandidates = range(STAR_MIN, STAR_MAX).sort(
    (a, b) => starFrequencies[b] - starFrequencies[a] || Math.abs(a - grid.stars[0]) - Math.abs(b - grid.stars[0]),
  );
  const stars = starCandidates.slice(0, 2);

  return parseGrid({ numbers, stars });
};

const buildBalancedVariation = (grid: Grid): Grid => {
  const taken = new Set<number>();
  const numbers = grid.numbers.map((original, index) => {
    const bucketMin = index * 10 + 1;
    const bucketMax = Math.min(index * 10 + 10, NUMBER_MAX);
    const clamped = Math.min(Math.max(original, bucketMin), bucketMax);
    const candidates = range(bucketMin, bucketMax).sort((a, b) => Math.abs(a - clamped) - Math.abs(b - clamped));
    const chosen = pickDistinct(candidates, taken);
    taken.add(chosen);
    return chosen;
  });

  const [firstStar, secondStar] = grid.stars;
  const oddCandidates = [1, 3, 5, 7, 9, 11].sort((a, b) => Math.abs(a - firstStar) - Math.abs(b - firstStar));
  const evenCandidates = [2, 4, 6, 8, 10, 12].sort((a, b) => Math.abs(a - secondStar) - Math.abs(b - secondStar));
  const stars = [oddCandidates[0], evenCandidates[0]];

  return parseGrid({ numbers, stars });
};

const isShareableNumber = (n: number): boolean => n <= 31 || n % 5 === 0;

const buildAntiShareVariation = (grid: Grid): Grid => {
  const taken = new Set<number>(grid.numbers);
  const numbers = grid.numbers.map((original) => {
    if (!isShareableNumber(original)) return original;
    taken.delete(original);
    const candidates = range(NUMBER_MIN, NUMBER_MAX)
      .filter((n) => !isShareableNumber(n))
      .sort((a, b) => Math.abs(a - original) - Math.abs(b - original));
    const chosen = pickDistinct(candidates, taken);
    taken.add(chosen);
    return chosen;
  });

  return parseGrid({ numbers, stars: grid.stars });
};

/**
 * Descriptive variations only - none is presented as more likely to be drawn.
 * Every valid Grid has the same theoretical probability of being drawn.
 */
export const generateVariations = (grid: Grid, history: Draw[]): GridVariation[] => [
  { kind: 'structurally-common', grid: buildStructurallyCommonVariation(grid, history) },
  { kind: 'balanced', grid: buildBalancedVariation(grid) },
  { kind: 'anti-share', grid: buildAntiShareVariation(grid) },
];
