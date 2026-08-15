import type { Grid } from '../analysis/grid/Grid.ts';

export interface EvaluatedGridRepository {
  getLast(): Grid | null;
  save(grid: Grid): void;
  clear(): void;
}
