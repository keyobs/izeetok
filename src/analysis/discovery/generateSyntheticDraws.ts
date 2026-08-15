import type { Draw } from '../draw/Draw.ts';
import { parseGrid } from '../grid/Grid.ts';
import { createSeededRandom } from '../random/seededRandom.ts';

const pickDistinct = (count: number, min: number, max: number, random: () => number): number[] => {
  const pool = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const picked: number[] = [];

  for (let i = 0; i < count; i += 1) {
    const index = Math.floor(random() * pool.length);
    picked.push(pool[index]);
    pool.splice(index, 1);
  }

  return picked;
};

/**
 * Perfectly random, independent draws respecting EuroMillions rules (5
 * distinct numbers 1-50, 2 distinct stars 1-12) - the null hypothesis:
 * whatever clustering/density structure this produces is what pure chance
 * looks like, the baseline real history's structure gets compared against.
 */
export const generateSyntheticDraws = (count: number, seed: number, startDate: string): Draw[] => {
  const random = createSeededRandom(seed);
  const start = new Date(startDate);

  return Array.from({ length: count }, (_, index) => {
    const grid = parseGrid({
      numbers: pickDistinct(5, 1, 50, random),
      stars: pickDistinct(2, 1, 12, random),
    });
    const date = new Date(start);
    date.setDate(date.getDate() + index * 3);

    return {
      id: `synthetic-${index}`,
      date: date.toISOString().slice(0, 10),
      numbers: grid.numbers,
      stars: grid.stars,
      source: 'manual',
    } satisfies Draw;
  });
};
