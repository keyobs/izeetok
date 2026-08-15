import type { Grid } from '../grid/Grid.ts';
import type { Draw } from './Draw.ts';

export const findExactMatch = (grid: Grid, draws: Draw[]): Draw | null =>
  draws.find(
    (draw) =>
      draw.numbers.every((number, index) => number === grid.numbers[index]) &&
      draw.stars.every((star, index) => star === grid.stars[index]),
  ) ?? null;

/** Draws sharing the same 5 numbers, regardless of which stars came out - a looser match than findExactMatch. */
export const findNumbersOnlyMatches = (grid: Grid, draws: Draw[]): Draw[] =>
  draws.filter((draw) => draw.numbers.every((number, index) => number === grid.numbers[index]));
