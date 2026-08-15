import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Draw } from '../../analysis/draw/Draw.ts';
import type { GridVariation } from '../../analysis/generateVariations.ts';
import { generateVariations } from '../../analysis/generateVariations.ts';
import { drawRepository } from '../../api/drawRepositoryInstance.ts';
import { evaluatedGridRepository } from '../../providers/evaluatedGridRepositoryInstance.ts';
import type { Grid } from '../../analysis/grid/Grid.ts';
import type { EvaluationScores, ReadingMatrixLabel } from '../../analysis/scoring/evaluateGrid.ts';
import { classifyReading, evaluateGrid } from '../../analysis/scoring/evaluateGrid.ts';
import { findExactMatch, findNumbersOnlyMatches } from '../../analysis/draw/findExactMatch.ts';

const EMPTY_HISTORY: Draw[] = [];

export interface EvaluationVariation extends GridVariation {
  scores: EvaluationScores;
}

export interface EvaluationPageViewModel {
  grid: Grid | null;
  onGridSubmit: (grid: Grid) => void;
  isHistoryLoading: boolean;
  scores: EvaluationScores | null;
  reading: ReadingMatrixLabel | null;
  exactMatch: Draw | null;
  numbersOnlyMatches: Draw[];
  earliestDrawDate: string | null;
  variations: EvaluationVariation[];
}

export const useEvaluationPage = (): EvaluationPageViewModel => {
  const [grid, setGrid] = useState<Grid | null>(() => evaluatedGridRepository.getLast());

  const historyQuery = useQuery({
    queryKey: ['draws', 'all'],
    queryFn: () => drawRepository.getAll(),
  });
  const history = historyQuery.data ?? EMPTY_HISTORY;

  const onGridSubmit = (submittedGrid: Grid) => {
    setGrid(submittedGrid);
    evaluatedGridRepository.save(submittedGrid);
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
    isHistoryLoading: historyQuery.isLoading,
    scores,
    reading,
    exactMatch,
    numbersOnlyMatches,
    earliestDrawDate,
    variations,
  };
};
