import type { Grid } from '../analysis/grid/Grid.ts';
import { gridSchema } from '../analysis/grid/Grid.ts';
import type { EvaluatedGridRepository } from './EvaluatedGridRepository.ts';

const STORAGE_KEY = 'izeetok:evaluated-grid';

export const createLocalStorageEvaluatedGridRepository = (): EvaluatedGridRepository => ({
  getLast: () => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      return gridSchema.parse(JSON.parse(raw));
    } catch {
      return null;
    }
  },
  save: (grid: Grid) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(grid));
  },
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },
});
