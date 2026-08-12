import type { Grid } from '../../domain/grid/Grid.ts';

export interface EvaluatedGridRepository {
  getLast(): Grid | null;
  save(grid: Grid): void;
  clear(): void;
}
