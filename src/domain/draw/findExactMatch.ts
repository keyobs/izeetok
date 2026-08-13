import type { Grid } from '../grid/Grid.ts';
import type { Draw } from './Draw.ts';

export const findExactMatch = (grid: Grid, draws: Draw[]): Draw | null =>
  draws.find(
    (draw) =>
      draw.numbers.every((number, index) => number === grid.numbers[index]) &&
      draw.stars.every((star, index) => star === grid.stars[index]),
  ) ?? null;
