import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Grid } from '../analysis/grid/Grid.ts';
import { gridSchema } from '../analysis/grid/Grid.ts';
import { readJSON, writeJSON } from '../utils/localStorage.ts';
import { EvaluatedGridContext } from './EvaluatedGridContext.tsx';

const STORAGE_KEY = 'izeetok:evaluated-grid';

const readStoredGrid = (): Grid | null => {
  const raw = readJSON<unknown>(STORAGE_KEY);
  if (raw === null) return null;
  try {
    return gridSchema.parse(raw);
  } catch {
    return null;
  }
};

interface EvaluatedGridProviderProps {
  children: ReactNode;
}

const EvaluatedGridProvider = ({ children }: EvaluatedGridProviderProps) => {
  const [evaluatedGrid, setEvaluatedGridState] = useState<Grid | null>(() => readStoredGrid());

  const setEvaluatedGrid = (grid: Grid) => {
    setEvaluatedGridState(grid);
    writeJSON(STORAGE_KEY, grid);
  };

  const value = useMemo(() => ({ evaluatedGrid, setEvaluatedGrid }), [evaluatedGrid]);

  return <EvaluatedGridContext.Provider value={value}>{children}</EvaluatedGridContext.Provider>;
};

export default EvaluatedGridProvider;
