import { useMemo } from 'react';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { GridVariation } from '../../analysis/generateVariations.ts';
import { generateVariations } from '../../analysis/generateVariations.ts';
import { useDraws } from '../../hooks/useDraws.ts';
import { useEvaluatedGrid } from '../../providers/EvaluatedGridContext.tsx';
import type { Grid } from '../../analysis/grid/Grid.ts';
import type { EvaluationScores, ReadingMatrixLabel } from '../../analysis/scoring/evaluateGrid.ts';
import { classifyReading, evaluateGrid } from '../../analysis/scoring/evaluateGrid.ts';
import { findExactMatch, findNumbersOnlyMatches } from '../../analysis/draw/findExactMatch.ts';

export interface EvaluationVariation extends GridVariation {
  scores: EvaluationScores;
}

export interface EvaluationPageViewModel {
  grid: Grid | null;
  onGridSubmit: (grid: Grid) => void;
  isHistoryLoading: boolean;
  isDrawsError: boolean;
  onRetryDraws: () => void;
  scores: EvaluationScores | null;
  reading: ReadingMatrixLabel | null;
  exactMatch: Draw | null;
  numbersOnlyMatches: Draw[];
  earliestDrawDate: string | null;
  variations: EvaluationVariation[];
}

export const useEvaluationPage = (): EvaluationPageViewModel => {
  const { evaluatedGrid: grid, setEvaluatedGrid } = useEvaluatedGrid();

  const { draws: history, isLoading: isHistoryLoading, isError: isDrawsError, refetch: onRetryDraws } = useDraws();

  const onGridSubmit = (submittedGrid: Grid) => {
    setEvaluatedGrid(submittedGrid);
  };

  const scores = useMemo<EvaluationScores | null>(
    () => (grid && history.length > 0 ? evaluateGrid(grid, history) : null),
    [grid, history],
  );
  const variations = useMemo<EvaluationVariation[]>(
    () =>
      grid && history.length > 0
        ? generateVariations(grid, history).map((variation) => ({
            ...variation,
            scores: evaluateGrid(variation.grid, history),
          }))
        : [],
    [grid, history],
  );
  const reading = scores ? classifyReading(scores) : null;

  const exactMatch = useMemo(
    () => (grid && history.length > 0 ? findExactMatch(grid, history) : null),
    [grid, history],
  );
  const numbersOnlyMatches = useMemo(
    () => (grid && history.length > 0 && !exactMatch ? findNumbersOnlyMatches(grid, history) : []),
    [grid, history, exactMatch],
  );
  const earliestDrawDate = useMemo(
    () =>
      history.length === 0
        ? null
        : history.reduce((earliest, draw) => (draw.date < earliest ? draw.date : earliest), history[0].date),
    [history],
  );

  return {
    grid,
    onGridSubmit,
    isHistoryLoading,
    isDrawsError,
    onRetryDraws,
    scores,
    reading,
    exactMatch,
    numbersOnlyMatches,
    earliestDrawDate,
    variations,
  };
};
