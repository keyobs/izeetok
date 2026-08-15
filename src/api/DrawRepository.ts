import type { Draw } from '../analysis/draw/Draw.ts';

export interface DrawRepository {
  getLatest(limit: number): Promise<Draw[]>;
  getAll(): Promise<Draw[]>;
  getByDate(date: string): Promise<Draw | null>;
}
