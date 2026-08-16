import { createContext, useContext } from 'react';
import type { Grid } from '../analysis/grid/Grid.ts';

export interface EvaluatedGridContextValue {
  evaluatedGrid: Grid | null;
  setEvaluatedGrid: (grid: Grid) => void;
}

export const EvaluatedGridContext = createContext<EvaluatedGridContextValue | null>(null);

export const useEvaluatedGrid = (): EvaluatedGridContextValue => {
  const context = useContext(EvaluatedGridContext);
  if (!context) {
    throw new Error('useEvaluatedGrid must be used within an EvaluatedGridProvider');
  }
  return context;
};
